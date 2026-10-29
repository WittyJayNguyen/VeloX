"""
VeloX AI Gateway — Subscription Lifecycle & Expiration Service
==============================================================
Manages 30-day recurring subscription cycles:
- Automatic enforcement: when a subscription expires, downgrades tier to FREE and revokes remaining credits down to 100 free credits.
- Extension / Renewal: when renewing before expiration, adds 30 days onto current expiry date to protect customer value.
"""
import uuid
import logging
from datetime import datetime, timezone, timedelta
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.modules.users.models import User, CreditAuditLog

logger = logging.getLogger("velox.subscription")


async def enforce_user_subscription(user: User, db: AsyncSession) -> bool:
    """
    Checks if a user's subscription has expired.
    If expired:
    1. Downgrades tier to 'FREE'
    2. Revokes remaining credits down to 100 FREE starter allowance
    3. Logs to credit_audit_logs
    4. Clears subscription_expires_at
    5. Commits DB transaction
    Returns True if an expiration action was taken, False otherwise.
    """
    if not user or not getattr(user, "subscription_expires_at", None):
        return False

    now_utc = datetime.now(timezone.utc)
    expiry = user.subscription_expires_at

    # Normalize to timezone-aware UTC
    if isinstance(expiry, str):
        try:
            expiry = datetime.fromisoformat(expiry)
        except Exception:
            return False

    if expiry.tzinfo is None:
        expiry = expiry.replace(tzinfo=timezone.utc)

    if now_utc <= expiry:
        return False

    # ── Subscription Expired ──
    old_tier = user.tier or "FREE"
    old_balance = user.credit_balance or 0
    free_allowance = 100

    user.tier = "FREE"
    user.subscription_expires_at = None

    if old_balance > free_allowance:
        revoked_credits = old_balance - free_allowance
        user.credit_balance = free_allowance

        audit = CreditAuditLog(
            id=str(uuid.uuid4()),
            user_id=user.id,
            actor_id=None,
            actor_email="SYSTEM_AUTO_EXPIRE",
            delta=-revoked_credits,
            balance_before=old_balance,
            balance_after=free_allowance,
            reason=f"Hết hạn chu kỳ thuê bao 30 ngày (Gói {old_tier}) — Thu hồi {revoked_credits:,} credits tồn dư, hoàn về gói FREE (100 credits)",
        )
        db.add(audit)

    if hasattr(user, "wallet") and user.wallet:
        user.wallet.balance_credits = user.credit_balance

    try:
        await db.commit()
        logger.info(
            f"[SUBSCRIPTION EXPIRED] User {user.email}: Downgraded from {old_tier} to FREE. "
            f"Credits adjusted: {old_balance:,} -> {user.credit_balance:,}"
        )
        return True
    except Exception as e:
        logger.error(f"[SUBSCRIPTION EXPIRED ERROR] Failed to commit expiration for {user.email}: {e}")
        await db.rollback()
        return False


def extend_subscription(
    user: User,
    duration_days: int = 30,
    new_tier: Optional[str] = None
) -> datetime:
    """
    Calculates and sets the new subscription expiration datetime:
    - If user already has an active subscription in the future, adds duration_days to existing expiry.
    - If no subscription or already expired, sets expiry to now + duration_days.
    - Updates tier if provided.
    """
    now_utc = datetime.now(timezone.utc)
    curr_expiry = getattr(user, "subscription_expires_at", None)

    if curr_expiry:
        if isinstance(curr_expiry, str):
            try:
                curr_expiry = datetime.fromisoformat(curr_expiry)
            except Exception:
                curr_expiry = None

        if curr_expiry and curr_expiry.tzinfo is None:
            curr_expiry = curr_expiry.replace(tzinfo=timezone.utc)

    if curr_expiry and curr_expiry > now_utc:
        new_expiry = curr_expiry + timedelta(days=duration_days)
    else:
        new_expiry = now_utc + timedelta(days=duration_days)

    user.subscription_expires_at = new_expiry

    if new_tier and new_tier.upper() not in ("FREE", "TOPUP"):
        user.tier = new_tier.upper()

    return new_expiry


async def batch_enforce_all_expired_subscriptions(db: AsyncSession) -> int:
    """Scans and enforces expiration on all accounts with expired subscriptions."""
    now_utc = datetime.now(timezone.utc)
    stmt = select(User).where(
        User.subscription_expires_at.is_not(None),
        User.subscription_expires_at < now_utc
    )
    res = await db.execute(stmt)
    expired_users = res.scalars().all()

    count = 0
    for u in expired_users:
        if await enforce_user_subscription(u, db):
            count += 1

    return count

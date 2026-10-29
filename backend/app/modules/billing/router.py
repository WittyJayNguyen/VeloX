"""
VeloX AI Gateway — Billing & Credit Top-Up Router
=================================================
Allows public/authenticated users to view packages and top-up credit balances,
and provides Admin RBAC endpoints to create, update, and manage credit packages in database.
"""
import json
import uuid
import logging
from datetime import datetime, timedelta
from typing import Optional, List
import httpx
from fastapi import APIRouter, Depends, HTTPException, Request, status

logger = logging.getLogger(__name__)
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc, or_

from app.core.database import get_db
from app.core.security import get_current_user, require_super_admin, require_permission
from app.common.responses import ok
from app.modules.users.models import User, CreditAuditLog
from app.modules.billing.models import CreditPackage, PaymentTransaction, BankAccount
from app.modules.users.router import get_client_ip

router = APIRouter(prefix="/billing", tags=["Billing & Top-Up"])


# ── Schemas ──
class TopupRequest(BaseModel):
    package_id: Optional[str] = None
    amount_vnd: Optional[int] = Field(default=None, description="Số tiền thanh toán VNĐ")
    credits: Optional[int] = Field(default=None, description="Số credit tương ứng")
    payment_method: str = Field(default="VietQR Banking", description="Phương thức thanh toán")


class CreditPackageCreateRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=128)
    category: str = Field(default="PRO", description="STARTER, PRO, ENTERPRISE, DEV, TOPUP")
    description: Optional[str] = ""
    price_vnd: int = Field(..., ge=0)
    original_price_vnd: Optional[int] = 0
    credits_given: int = Field(..., gt=0)
    bonus_percentage: Optional[int] = 0
    features: Optional[List[str]] = Field(default_factory=list)
    tag_badge: Optional[str] = ""
    is_popular: Optional[bool] = False
    is_active: Optional[bool] = True
    sort_order: Optional[int] = 0


class CreditPackageUpdateRequest(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    description: Optional[str] = None
    price_vnd: Optional[int] = None
    original_price_vnd: Optional[int] = None
    credits_given: Optional[int] = None
    bonus_percentage: Optional[int] = None
    features: Optional[List[str]] = None
    tag_badge: Optional[str] = None
    is_popular: Optional[bool] = None
    is_active: Optional[bool] = None
    sort_order: Optional[int] = None


def serialize_package(p: CreditPackage) -> dict:
    parsed_features = []
    if p.features:
        try:
            parsed_features = json.loads(p.features)
        except Exception:
            parsed_features = [f.strip() for f in p.features.split(",") if f.strip()]

    return {
        "id": p.id,
        "name": p.name,
        "category": p.category or "PRO",
        "description": p.description or "",
        "price_vnd": float(p.price_vnd),
        "original_price_vnd": float(p.original_price_vnd) if p.original_price_vnd else None,
        "credits_given": float(p.credits_given),
        "bonus_percentage": p.bonus_percentage or 0,
        "is_popular": p.is_popular,
        "is_active": p.is_active,
        "tag_badge": p.tag_badge or "",
        "sort_order": p.sort_order or 0,
        "features": parsed_features,
        "created_at": p.created_at.isoformat() if p.created_at else None,
        "updated_at": p.updated_at.isoformat() if p.updated_at else None,
    }


class BankAccountCreateRequest(BaseModel):
    bank_name: str = Field(..., min_length=2, max_length=128)
    bank_code: str = Field(..., min_length=2, max_length=32)
    account_number: str = Field(..., min_length=2, max_length=64)
    account_holder: str = Field(..., min_length=2, max_length=128)
    branch: Optional[str] = ""
    is_default: Optional[bool] = False
    qr_enabled: Optional[bool] = True
    is_active: Optional[bool] = True


class BankAccountUpdateRequest(BaseModel):
    bank_name: Optional[str] = None
    bank_code: Optional[str] = None
    account_number: Optional[str] = None
    account_holder: Optional[str] = None
    branch: Optional[str] = None
    is_default: Optional[bool] = None
    qr_enabled: Optional[bool] = None
    is_active: Optional[bool] = None


class SePaySyncRequest(BaseModel):
    sepay_token: str = Field(..., min_length=5, description="User API Token từ my.sepay.vn")


def serialize_bank(b: BankAccount) -> dict:
    return {
        "id": b.id,
        "bank_name": b.bank_name,
        "bank_code": b.bank_code,
        "account_number": b.account_number,
        "account_holder": b.account_holder,
        "branch": b.branch or "",
        "is_default": b.is_default,
        "qr_enabled": b.qr_enabled,
        "is_active": b.is_active,
        "created_at": b.created_at.isoformat() if b.created_at else None,
        "updated_at": b.updated_at.isoformat() if b.updated_at else None,
    }


# ── Public Endpoints ──
@router.get("/packages")
async def list_packages(
    category: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    """List available credit packages for client/pricing pages."""
    stmt = select(CreditPackage).where(CreditPackage.is_active == True)
    if category and category.upper() != "ALL":
        stmt = stmt.where(CreditPackage.category == category.upper())
    stmt = stmt.order_by(CreditPackage.sort_order.asc(), CreditPackage.price_vnd.asc())
    res = await db.execute(stmt)
    packages = res.scalars().all()
    return ok(data=[serialize_package(p) for p in packages])


@router.get("/my-orders")
async def get_my_orders(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List real payment transactions / top-up orders for the currently authenticated user."""
    stmt = (
        select(PaymentTransaction, CreditPackage.name.label("package_name"), CreditPackage.tag_badge)
        .outerjoin(
            CreditPackage,
            or_(
                PaymentTransaction.package_id == CreditPackage.id,
                PaymentTransaction.amount_vnd == CreditPackage.price_vnd,
            ),
        )
        .where(PaymentTransaction.user_id == current_user.id)
        .order_by(desc(PaymentTransaction.created_at))
        .limit(100)
    )
    res = await db.execute(stmt)
    records = res.all()

    orders = []
    for tx, pkg_name, tag_badge in records:
        credits_num = int(tx.credits_credited or 0)
        display_name = pkg_name or f"Nạp {credits_num:,} Credit"
        if tag_badge:
            display_name = f"{tag_badge} - {display_name}"

        orders.append({
            "id": tx.transaction_code or tx.id,
            "packageName": display_name,
            "amount": int(tx.amount_vnd or 0),
            "credits": credits_num,
            "status": tx.status or "COMPLETED",
            "createdAt": tx.created_at.strftime("%Y-%m-%d %H:%M") if tx.created_at else "",
            "paymentMethod": tx.payment_gateway or "VietQR Banking (SePay)",
        })

    return ok(data=orders)


@router.get("/check-payment-status")
async def check_payment_status(
    since: Optional[str] = None,
    expected_amount: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Check if a successful payment transaction has arrived for the current user.
    Used by the frontend to automatically detect bank transfer completion via SePay Webhook.
    """
    # 1. Refresh current user to get latest credit balance
    user_stmt = select(User).where(User.id == current_user.id)
    user_res = await db.execute(user_stmt)
    latest_user = user_res.scalar_one_or_none() or current_user

    # Determine cutoff time (default: last 15 minutes)
    cutoff = datetime.utcnow() - timedelta(minutes=15)
    if since:
        try:
            clean_since = since.replace("Z", "+00:00")
            parsed_dt = datetime.fromisoformat(clean_since)
            if parsed_dt.tzinfo is not None:
                parsed_dt = parsed_dt.replace(tzinfo=None)
            cutoff = max(cutoff, parsed_dt - timedelta(seconds=5))
        except Exception:
            pass

    # 2. Query recent successful transactions for this user
    query = (
        select(PaymentTransaction)
        .where(
            PaymentTransaction.user_id == current_user.id,
            PaymentTransaction.status.in_(["SUCCESS", "COMPLETED"]),
        )
        .order_by(desc(PaymentTransaction.created_at))
        .limit(10)
    )

    if expected_amount and expected_amount > 0:
        query = query.where(PaymentTransaction.amount_vnd == expected_amount)

    res = await db.execute(query)
    candidates = res.scalars().all()

    tx = None
    for cand in candidates:
        cand_dt = cand.created_at
        if isinstance(cand_dt, str):
            clean_str = cand_dt.replace("T", " ")
            try:
                cand_dt = datetime.fromisoformat(clean_str)
            except Exception:
                continue
        if cand_dt >= cutoff:
            tx = cand
            break

    if tx:
        return ok(
            data={
                "paid": True,
                "transaction_code": tx.transaction_code,
                "amount_vnd": int(tx.amount_vnd),
                "credits_credited": int(tx.credits_credited),
                "created_at": tx.created_at.isoformat() if tx.created_at else None,
                "credit_balance": latest_user.credit_balance,
                "tier": latest_user.tier,
            },
            message="Giao dịch thanh toán thành công!"
        )

    return ok(
        data={
            "paid": False,
            "credit_balance": latest_user.credit_balance,
            "tier": latest_user.tier,
        },
        message="Đang chờ giao dịch..."
    )


@router.post("/topup")
async def process_topup(
    body: TopupRequest,
    request: Request,
    current_user: User = Depends(require_permission("billing.manage")),
    db: AsyncSession = Depends(get_db),
):
    """
    Process top-up for authenticated user:
    1. Detects package from database by package_id or price_vnd (authoritative).
    2. Credits user balance according to package specification.
    3. Automatically upgrades user membership tier (STARTER, PRO, ENTERPRISE).
    4. Records immutable audit log and payment transaction.
    """
    # 1. Lock and retrieve user to prevent race conditions
    stmt = select(User).where(User.id == current_user.id).with_for_update()
    res = await db.execute(stmt)
    user_obj = res.scalar_one_or_none()

    if not user_obj:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy tài khoản người dùng.")

    # 2. Package Detection & Verification
    pkg = None
    if body.package_id:
        pkg_stmt = select(CreditPackage).where(
            or_(CreditPackage.id == body.package_id, CreditPackage.name == body.package_id)
        )
        pkg_res = await db.execute(pkg_stmt)
        pkg = pkg_res.scalar_one_or_none()

    # If package not found by id but amount_vnd provided, match by price_vnd
    if not pkg and body.amount_vnd:
        pkg_stmt = select(CreditPackage).where(CreditPackage.price_vnd == body.amount_vnd)
        pkg_res = await db.execute(pkg_stmt)
        pkg = pkg_res.scalar_one_or_none()

    # Determine credits and amount from DB package (authoritative) or fallback
    if pkg:
        added_credits = int(pkg.credits_given)
        amount_vnd = int(pkg.price_vnd)
        pkg_name = pkg.name
        pkg_category = pkg.category
    else:
        added_credits = int(body.credits or 0)
        amount_vnd = int(body.amount_vnd or 0)
        pkg_name = "Nạp Credit VietQR"
        pkg_category = "TOPUP"

    if added_credits <= 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Số Credit nạp không hợp lệ.")

    # 3. Dynamic Tier / Rank Upgrade Logic
    old_tier = (user_obj.tier or "FREE").upper()
    new_tier = old_tier

    if pkg_category == "STARTER":
        if old_tier == "FREE":
            new_tier = "STARTER"
    elif pkg_category == "PRO":
        new_tier = "PRO"
    elif pkg_category == "ENTERPRISE":
        new_tier = "ENTERPRISE"
    elif pkg_category == "TOPUP":
        if amount_vnd >= 1000000:
            new_tier = "ENTERPRISE"
        elif amount_vnd >= 200000 and old_tier in ("FREE", "STARTER"):
            new_tier = "PRO"
        elif amount_vnd >= 50000 and old_tier == "FREE":
            new_tier = "STARTER"

    user_obj.tier = new_tier

    balance_before = user_obj.credit_balance or 0
    new_balance = balance_before + added_credits
    user_obj.credit_balance = new_balance

    client_ip = get_client_ip(request)

    # 4. Immutable Credit Transaction Audit Log
    tx_code = f"TX-{uuid.uuid4().hex[:10].upper()}"

    audit = CreditAuditLog(
        user_id=user_obj.id,
        actor_id=user_obj.id,
        actor_email=user_obj.email,
        delta=added_credits,
        balance_before=balance_before,
        balance_after=new_balance,
        reason=f"Nạp gói '{pkg_name}' (+{added_credits:,} Credits, {amount_vnd:,} VNĐ qua {body.payment_method}). Nâng hạng: [{new_tier}]",
        ip_address=client_ip,
    )
    db.add(audit)

    # 5. Create Payment Transaction Record
    tx = PaymentTransaction(
        transaction_code=tx_code,
        user_id=user_obj.id,
        package_id=pkg.id if pkg else body.package_id,
        amount_vnd=amount_vnd,
        credits_credited=added_credits,
        payment_gateway=body.payment_method,
        status="COMPLETED",
    )
    db.add(tx)

    await db.commit()

    return ok(
        data={
            "transaction_code": tx_code,
            "credit_balance": user_obj.credit_balance,
            "tier": user_obj.tier,
            "package_name": pkg_name,
            "package_category": pkg_category,
            "added_credits": added_credits,
            "balance_before": balance_before,
            "status": "COMPLETED",
        },
        message=f"Nạp thành công gói '{pkg_name}'! Bạn nhận được +{added_credits:,} Credits và hạng tài khoản là [{user_obj.tier}]."
    )


async def process_single_sepay_transaction(
    payload: dict,
    db: AsyncSession,
    client_ip: str = "127.0.0.1",
) -> dict:
    """
    Core business logic to process a SePay banking transaction:
    - Parses transfer amount, content, gateway, and reference ID.
    - Idempotency check to prevent double crediting.
    - Matches user by transfer memo: VL <user_code>, email, or UUID.
    - Matches credit package, upgrades tier, creates audit logs and transaction record.
    """
    import re
    transfer_type = str(payload.get("transferType") or payload.get("transfer_type") or "in").lower()
    transfer_amount = int(payload.get("transferAmount") or payload.get("amount") or payload.get("transfer_amount") or 0)
    content = str(payload.get("content") or payload.get("description") or payload.get("transaction_content") or "").strip()
    gateway = str(payload.get("gateway") or payload.get("bank_brand_name") or payload.get("bank") or "SePay Banking")
    tx_code = str(payload.get("code") or payload.get("referenceCode") or payload.get("id") or payload.get("transaction_id") or "")
    sepay_tx_id = f"SEPAY-{tx_code}" if tx_code else f"SEPAY-{uuid.uuid4().hex[:8].upper()}"

    # Only process incoming money (Tiền vào)
    if transfer_type != "in" or transfer_amount <= 0:
        return {"success": True, "message": "Ignored non-incoming transaction", "status": "IGNORED"}

    # Idempotency check: don't process duplicate transaction
    existing_tx_stmt = select(PaymentTransaction).where(
        or_(
            PaymentTransaction.transaction_code == sepay_tx_id,
            PaymentTransaction.transaction_code == tx_code,
        )
    )
    existing_tx_res = await db.execute(existing_tx_stmt)
    if existing_tx_res.scalar_one_or_none():
        logger.info(f"[SEPAY] Transaction {sepay_tx_id} already processed. Skipping.")
        return {"success": True, "message": "Transaction already processed", "status": "DUPLICATE"}

    # Extract user identifier from content (Supports "SEVQR TKPVL 10004", "SEVQR TKPVL DH10004", "SEVQR VL 10004", "TKPVL 10004", "VL 10004", "VELOX 10004", "10004")
    user_match = re.search(r"(?:SEVQR\s*)?(?:TKPVL|VELOX|VL|V)\s*(?:DH)?([A-Za-z0-9\-_]+)", content, re.IGNORECASE)
    user_code = user_match.group(1).strip() if user_match else ""

    # Also fallback: look for pure 5-6 digit sequence (e.g. 10004)
    if not user_code:
        digit_match = re.search(r"\b(1\d{4,5})\b", content)
        if digit_match:
            user_code = digit_match.group(1).strip()

    user_obj = None
    if user_code:
        # 1. Match exact user_code first (e.g. "10001", "10004")
        uc_stmt = select(User).where(User.user_code == user_code)
        uc_res = await db.execute(uc_stmt)
        user_obj = uc_res.scalar_one_or_none()

        # 2. Fallback: match by ID suffix or exact UUID
        if not user_obj:
            user_stmt = select(User).where(
                or_(
                    User.id == user_code,
                    User.id.ilike(f"%{user_code}%")
                )
            )
            user_res = await db.execute(user_stmt)
            user_candidates = user_res.scalars().all()
            if user_candidates:
                for cand in user_candidates:
                    if cand.id.lower().endswith(user_code.lower()) or cand.id.replace("-", "").lower().endswith(user_code.lower()):
                        user_obj = cand
                        break
                if not user_obj:
                    user_obj = user_candidates[0]

    # If still not found, search if user email is present in content
    if not user_obj:
        email_match = re.search(r"[\w\.-]+@[\w\.-]+", content)
        if email_match:
            email_stmt = select(User).where(User.email.ilike(email_match.group(0)))
            email_res = await db.execute(email_stmt)
            user_obj = email_res.scalar_one_or_none()

    if not user_obj:
        # Fallback: record as UNASSIGNED so admin can easily review and assign manually
        admin_res = await db.execute(select(User).order_by(User.created_at.asc()).limit(1))
        fallback_admin = admin_res.scalar_one_or_none()
        try:
            unassigned_tx = PaymentTransaction(
                transaction_code=sepay_tx_id,
                user_id=fallback_admin.id if fallback_admin else None,
                amount_vnd=transfer_amount,
                credits_credited=0,
                payment_gateway=gateway,
                status="UNASSIGNED",
            )
            db.add(unassigned_tx)
            await db.commit()
            logger.warning(f"[SEPAY] Unassigned transaction {sepay_tx_id} recorded for amount {transfer_amount:,} VND. Content: '{content}'")
        except Exception as err:
            await db.rollback()
            logger.warning(f"[SEPAY] Could not record unassigned transaction {sepay_tx_id}: {err}")

        return {
            "success": True,
            "message": f"Transaction recorded as UNASSIGNED (no matching user found in memo '{content}').",
            "status": "UNASSIGNED",
        }

    # Match credit package by exact price
    pkg_stmt = select(CreditPackage).where(CreditPackage.price_vnd == transfer_amount)
    pkg_res = await db.execute(pkg_stmt)
    pkg = pkg_res.scalar_one_or_none()

    if pkg:
        added_credits = int(pkg.credits_given)
        pkg_category = pkg.category
        pkg_name = pkg.name
    else:
        # Proportional rate: 100 VND = 1 Credit
        added_credits = max(1, transfer_amount // 100)
        pkg_category = "TOPUP"
        pkg_name = f"Nạp {transfer_amount:,} VNĐ"

    # Dynamic tier upgrade
    old_tier = (user_obj.tier or "FREE").upper()
    new_tier = old_tier
    if pkg_category == "STARTER":
        if old_tier == "FREE":
            new_tier = "STARTER"
    elif pkg_category == "PRO":
        new_tier = "PRO"
    elif pkg_category == "ENTERPRISE":
        new_tier = "ENTERPRISE"
    elif pkg_category == "TOPUP":
        if transfer_amount >= 1000000:
            new_tier = "ENTERPRISE"
        elif transfer_amount >= 200000 and old_tier in ("FREE", "STARTER"):
            new_tier = "PRO"
        elif transfer_amount >= 50000 and old_tier == "FREE":
            new_tier = "STARTER"

    user_obj.tier = new_tier
    balance_before = user_obj.credit_balance or 0
    new_balance = balance_before + added_credits
    user_obj.credit_balance = new_balance

    audit = CreditAuditLog(
        user_id=user_obj.id,
        actor_id=user_obj.id,
        actor_email=user_obj.email,
        delta=added_credits,
        balance_before=balance_before,
        balance_after=new_balance,
        reason=f"SePay Auto Webhook: +{added_credits:,} Credits ({transfer_amount:,} VNĐ qua {gateway}). Nâng hạng: [{new_tier}]",
        ip_address=client_ip,
    )
    db.add(audit)

    tx = PaymentTransaction(
        transaction_code=sepay_tx_id,
        user_id=user_obj.id,
        package_id=pkg.id if pkg else None,
        amount_vnd=transfer_amount,
        credits_credited=added_credits,
        payment_gateway=gateway,
        status="COMPLETED",
    )
    db.add(tx)

    await db.commit()
    logger.info(f"[SEPAY SUCCESS] Credited {added_credits:,} credits to user {user_obj.email} (Balance: {new_balance:,}, Tier: {new_tier}) from transaction {sepay_tx_id}")

    return {
        "success": True,
        "message": f"Successfully credited {added_credits:,} credits to user {user_obj.email}",
        "user_email": user_obj.email,
        "new_balance": new_balance,
        "tier": new_tier,
        "status": "COMPLETED",
    }


# ── SePay Automated Banking Webhook ──
@router.post("/webhook/sepay")
async def sepay_webhook(
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """
    Automated SePay Banking Webhook Handler.
    Receives bank transaction notification, verifies payment, credits user, and upgrades tier.
    URL: https://velox.nexoratech.com.vn/api/v1/billing/webhook/sepay
    """
    import secrets
    from app.core.config import get_settings

    settings = get_settings()
    configured_key = getattr(settings, "SEPAY_API_KEY", "") or ""

    auth_header = request.headers.get("Authorization", "") or request.headers.get("authorization", "")
    api_key_header = request.headers.get("X-API-KEY", "") or request.headers.get("x-api-key", "") or request.headers.get("X-Api-Key", "")

    token = ""
    if auth_header:
        parts = auth_header.strip().split()
        token = parts[-1] if parts else ""
    elif api_key_header:
        token = api_key_header.strip()

    # Enforce API key ONLY if a custom non-default secret is configured AND a mismatched token was sent
    if token and configured_key and configured_key not in ("velox_sepay_live_secret_key_8899", ""):
        if not secrets.compare_digest(token, configured_key):
            logger.warning(f"[SEPAY WEBHOOK] Rejected webhook: token mismatch with custom SEPAY_API_KEY")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Xác thực SePay Webhook thất bại: API Key không hợp lệ."
            )

    try:
        body_bytes = await request.body()
        payload = json.loads(body_bytes.decode("utf-8")) if body_bytes else {}
    except Exception as e:
        logger.error(f"[SEPAY WEBHOOK] Failed to parse JSON body: {e}")
        raise HTTPException(status_code=400, detail=f"Invalid JSON payload: {e}")

    logger.info(f"[SEPAY WEBHOOK] Incoming payload: {payload}")
    client_ip = get_client_ip(request)
    return await process_single_sepay_transaction(payload, db, client_ip)


# ── Admin CRUD Endpoints ──
@router.get("/admin/packages")
async def admin_list_packages(
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_super_admin()),
):
    """Retrieve all packages (active & inactive) for Admin Management."""
    stmt = select(CreditPackage).order_by(CreditPackage.sort_order.asc(), CreditPackage.price_vnd.asc())
    res = await db.execute(stmt)
    packages = res.scalars().all()
    return ok(data=[serialize_package(p) for p in packages])


@router.post("/admin/packages")
async def admin_create_package(
    body: CreditPackageCreateRequest,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_super_admin()),
):
    """Create a new credit package / membership plan."""
    features_str = json.dumps(body.features) if body.features else "[]"
    pkg = CreditPackage(
        name=body.name.strip(),
        category=body.category.upper(),
        description=body.description or "",
        price_vnd=body.price_vnd,
        original_price_vnd=body.original_price_vnd or 0,
        credits_given=body.credits_given,
        bonus_percentage=body.bonus_percentage or 0,
        features=features_str,
        tag_badge=body.tag_badge or "",
        is_popular=bool(body.is_popular),
        is_active=bool(body.is_active),
        sort_order=body.sort_order or 0,
    )
    db.add(pkg)
    await db.commit()
    await db.refresh(pkg)
    return ok(data=serialize_package(pkg), message="Tạo gói thành công!")


@router.put("/admin/packages/{package_id}")
async def admin_update_package(
    package_id: str,
    body: CreditPackageUpdateRequest,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_super_admin()),
):
    """Update an existing credit package."""
    stmt = select(CreditPackage).where(CreditPackage.id == package_id)
    res = await db.execute(stmt)
    pkg = res.scalar_one_or_none()

    if not pkg:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy gói này.")

    if body.name is not None:
        pkg.name = body.name.strip()
    if body.category is not None:
        pkg.category = body.category.upper()
    if body.description is not None:
        pkg.description = body.description
    if body.price_vnd is not None:
        pkg.price_vnd = body.price_vnd
    if body.original_price_vnd is not None:
        pkg.original_price_vnd = body.original_price_vnd
    if body.credits_given is not None:
        pkg.credits_given = body.credits_given
    if body.bonus_percentage is not None:
        pkg.bonus_percentage = body.bonus_percentage
    if body.features is not None:
        pkg.features = json.dumps(body.features)
    if body.tag_badge is not None:
        pkg.tag_badge = body.tag_badge
    if body.is_popular is not None:
        pkg.is_popular = body.is_popular
    if body.is_active is not None:
        pkg.is_active = body.is_active
    if body.sort_order is not None:
        pkg.sort_order = body.sort_order

    await db.commit()
    await db.refresh(pkg)
    return ok(data=serialize_package(pkg), message="Cập nhật gói thành công!")


@router.delete("/admin/packages/{package_id}")
async def admin_delete_package(
    package_id: str,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_super_admin()),
):
    """Delete a credit package."""
    stmt = select(CreditPackage).where(CreditPackage.id == package_id)
    res = await db.execute(stmt)
    pkg = res.scalar_one_or_none()

    if not pkg:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy gói này.")

    await db.delete(pkg)
    await db.commit()
    return ok(message="Đã xóa gói thành công!")


# ── Bank Accounts & QR Endpoints ──
@router.get("/banks")
async def list_banks(
    db: AsyncSession = Depends(get_db),
):
    """List active bank accounts for payments & VietQR generation."""
    stmt = select(BankAccount).where(BankAccount.is_active == True).order_by(BankAccount.is_default.desc(), BankAccount.created_at.asc())
    res = await db.execute(stmt)
    banks = res.scalars().all()
    return ok(data=[serialize_bank(b) for b in banks])


@router.post("/banks")
async def create_bank(
    body: BankAccountCreateRequest,
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(require_permission("banking.manage")),
):
    """Create a new bank account."""
    if body.is_default:
        all_banks_res = await db.execute(select(BankAccount))
        for b in all_banks_res.scalars().all():
            b.is_default = False

    bank = BankAccount(
        bank_name=body.bank_name.strip(),
        bank_code=body.bank_code.strip().upper(),
        account_number=body.account_number.strip(),
        account_holder=body.account_holder.strip().upper(),
        branch=body.branch.strip() if body.branch else "",
        is_default=body.is_default or False,
        qr_enabled=body.qr_enabled if body.qr_enabled is not None else True,
        is_active=body.is_active if body.is_active is not None else True,
    )
    db.add(bank)
    await db.commit()
    await db.refresh(bank)
    return ok(data=serialize_bank(bank), message="Thêm tài khoản ngân hàng thành công!")


@router.put("/banks/{bank_id}")
async def update_bank(
    bank_id: str,
    body: BankAccountUpdateRequest,
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(require_permission("banking.manage")),
):
    """Update bank account details."""
    stmt = select(BankAccount).where(BankAccount.id == bank_id)
    res = await db.execute(stmt)
    bank = res.scalar_one_or_none()
    if not bank:
        raise HTTPException(status_code=404, detail="Không tìm thấy tài khoản ngân hàng này.")

    if body.is_default:
        all_banks_res = await db.execute(select(BankAccount))
        for b in all_banks_res.scalars().all():
            if b.id != bank.id:
                b.is_default = False

    if body.bank_name is not None:
        bank.bank_name = body.bank_name.strip()
    if body.bank_code is not None:
        bank.bank_code = body.bank_code.strip().upper()
    if body.account_number is not None:
        bank.account_number = body.account_number.strip()
    if body.account_holder is not None:
        bank.account_holder = body.account_holder.strip().upper()
    if body.branch is not None:
        bank.branch = body.branch.strip()
    if body.is_default is not None:
        bank.is_default = body.is_default
    if body.qr_enabled is not None:
        bank.qr_enabled = body.qr_enabled
    if body.is_active is not None:
        bank.is_active = body.is_active

    await db.commit()
    await db.refresh(bank)
    return ok(data=serialize_bank(bank), message="Cập nhật tài khoản ngân hàng thành công!")


@router.delete("/banks/{bank_id}")
async def delete_bank(
    bank_id: str,
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(require_permission("banking.manage")),
):
    """Delete a bank account."""
    stmt = select(BankAccount).where(BankAccount.id == bank_id)
    res = await db.execute(stmt)
    bank = res.scalar_one_or_none()
    if not bank:
        raise HTTPException(status_code=404, detail="Không tìm thấy tài khoản ngân hàng.")

    await db.delete(bank)
    await db.commit()
    return ok(message="Đã xóa tài khoản ngân hàng thành công!")


@router.post("/banks/sync-sepay")
async def sync_sepay_banks(
    body: SePaySyncRequest,
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(require_permission("banking.manage")),
):
    """
    Sync bank accounts directly from SePay User API.
    Calls https://my.sepay.vn/userapi/bankaccounts/list using SePay Token.
    """
    token = body.sepay_token.strip()
    if not token:
        raise HTTPException(status_code=400, detail="Vui lòng cung cấp SePay API Token.")

    candidate_endpoints = [
        ("https://userapi.sepay.vn/v2/bank-accounts", f"Bearer {token}"),
        ("https://userapi.sepay.vn/v2/bank-accounts", f"Apikey {token}"),
        ("https://my.sepay.vn/userapi/bankaccounts/list", f"Bearer {token}"),
        ("https://my.sepay.vn/userapi/bankaccounts/list", f"Apikey {token}"),
    ]

    data = None
    last_status = 400

    async with httpx.AsyncClient(timeout=15.0) as client:
        for url, auth_str in candidate_endpoints:
            headers = {
                "Authorization": auth_str,
                "Content-Type": "application/json",
                "User-Agent": "VeloX-SePay-Client/1.0",
            }
            try:
                resp = await client.get(url, headers=headers)
                last_status = resp.status_code
                if resp.status_code == 200:
                    try:
                        data = resp.json()
                        break
                    except Exception:
                        pass
            except Exception:
                continue

    if not data:
        raise HTTPException(
            status_code=400,
            detail=f"Kết nối SePay thất bại ({last_status}): Vui lòng kiểm tra lại API Token SePay (lấy tại my.sepay.vn -> Cấu hình Công ty -> API Access)."
        )

    sepay_accounts = data.get("bankaccounts", [])
    if not sepay_accounts and isinstance(data.get("data"), list):
        sepay_accounts = data.get("data", [])
    if not sepay_accounts and isinstance(data.get("items"), list):
        sepay_accounts = data.get("items", [])

    if not sepay_accounts:
        return ok(data=[], message="Đã kết nối SePay nhưng chưa tìm thấy tài khoản ngân hàng nào trong tài khoản SePay của bạn.")

    synced_banks = []
    existing_res = await db.execute(select(BankAccount))
    existing_banks = {b.account_number: b for b in existing_res.scalars().all()}
    is_first = len(existing_banks) == 0

    for idx, item in enumerate(sepay_accounts):
        acc_num = str(item.get("account_number") or item.get("accountNumber") or "").strip()
        if not acc_num:
            continue

        acc_holder = (
            item.get("account_holder_name") or
            item.get("accountHolderName") or
            item.get("account_holder") or
            item.get("label") or
            "CHỦ TÀI KHOẢN"
        ).strip().upper()

        b_name = (
            item.get("bank_full_name") or
            item.get("bank_short_name") or
            item.get("bank_name") or
            item.get("bank_code") or
            "Ngân hàng"
        ).strip()

        b_code = (
            item.get("bank_code") or
            item.get("bank_short_name") or
            item.get("bankShortName") or
            "MB"
        ).strip().upper()

        b_branch = str(item.get("branch", "") or "")

        if acc_num in existing_banks:
            b_obj = existing_banks[acc_num]
            b_obj.bank_name = b_name
            b_obj.bank_code = b_code
            b_obj.account_holder = acc_holder
            b_obj.qr_enabled = True
            b_obj.is_active = True
        else:
            b_obj = BankAccount(
                bank_name=b_name,
                bank_code=b_code,
                account_number=acc_num,
                account_holder=acc_holder,
                branch=b_branch,
                is_default=(is_first and idx == 0),
                qr_enabled=True,
                is_active=True,
            )
            db.add(b_obj)
            existing_banks[acc_num] = b_obj

        synced_banks.append(b_obj)

    await db.commit()
    for b in synced_banks:
        await db.refresh(b)

    return ok(
        data=[serialize_bank(b) for b in synced_banks],
        message=f"Đồng bộ thành công {len(synced_banks)} tài khoản ngân hàng từ SePay!"
    )


@router.post("/transactions/sync-sepay")
async def sync_sepay_transactions(
    body: SePaySyncRequest,
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(require_permission("banking.manage")),
):
    """
    Sync and auto-match recent bank transactions directly from SePay User API.
    Calls https://my.sepay.vn/userapi/transactions/list using SePay Token.
    """
    token = body.sepay_token.strip()
    if not token:
        raise HTTPException(status_code=400, detail="Vui lòng cung cấp SePay API Token.")

    candidate_endpoints = [
        ("https://userapi.sepay.vn/v2/transactions", f"Bearer {token}"),
        ("https://userapi.sepay.vn/v2/transactions", f"Apikey {token}"),
        ("https://my.sepay.vn/userapi/transactions/list", f"Bearer {token}"),
        ("https://my.sepay.vn/userapi/transactions/list", f"Apikey {token}"),
    ]

    data = None
    last_status = 400

    async with httpx.AsyncClient(timeout=15.0) as client:
        for url, auth_str in candidate_endpoints:
            headers = {
                "Authorization": auth_str,
                "Content-Type": "application/json",
                "User-Agent": "VeloX-SePay-Client/1.0",
            }
            try:
                resp = await client.get(url, headers=headers)
                last_status = resp.status_code
                if resp.status_code == 200:
                    try:
                        data = resp.json()
                        break
                    except Exception:
                        pass
            except Exception:
                continue

    if not data:
        raise HTTPException(
            status_code=400,
            detail=f"Kết nối SePay thất bại ({last_status}): Vui lòng kiểm tra lại API Token SePay."
        )

    transactions = data.get("transactions", [])
    if not transactions and isinstance(data.get("data"), list):
        transactions = data.get("data", [])
    if not transactions and isinstance(data.get("items"), list):
        transactions = data.get("items", [])
    if not transactions and isinstance(data.get("messages"), list):
        transactions = data.get("messages", [])

    credited_count = 0
    duplicate_count = 0
    unassigned_count = 0

    for item in transactions:
        res = await process_single_sepay_transaction(item, db, client_ip="SEPAY-SYNC-API")
        st = res.get("status")
        if st == "COMPLETED":
            credited_count += 1
        elif st == "DUPLICATE":
            duplicate_count += 1
        elif st == "UNASSIGNED":
            unassigned_count += 1

    return ok(
        data={
            "scanned": len(transactions),
            "credited": credited_count,
            "duplicate": duplicate_count,
            "unassigned": unassigned_count,
        },
        message=f"Đã quét {len(transactions)} giao dịch SePay: Khớp & cộng tiền {credited_count} giao dịch mới!"
    )



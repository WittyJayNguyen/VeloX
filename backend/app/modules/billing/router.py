"""
VeloX AI Gateway — Billing & Credit Top-Up Router
=================================================
Allows public/authenticated users to view packages and top-up credit balances,
and provides Admin RBAC endpoints to create, update, and manage credit packages in database.
"""
import json
import uuid
import logging
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Request, status

logger = logging.getLogger(__name__)
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc, or_

from app.core.database import get_db
from app.core.security import get_current_user, require_super_admin
from app.common.responses import ok
from app.modules.users.models import User, CreditAuditLog
from app.modules.billing.models import CreditPackage, PaymentTransaction
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


@router.post("/topup")
async def process_topup(
    body: TopupRequest,
    request: Request,
    current_user: User = Depends(get_current_user),
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
    import re
    import secrets
    from app.core.config import get_settings

    # 1. API Key Authentication Check
    settings = get_settings()
    configured_key = getattr(settings, "SEPAY_API_KEY", "") or "velox_sepay_live_secret_key_8899"

    if configured_key:
        auth_header = request.headers.get("Authorization", "") or request.headers.get("authorization", "")
        api_key_header = request.headers.get("X-API-KEY", "") or request.headers.get("x-api-key", "") or request.headers.get("X-Api-Key", "")

        token = ""
        if auth_header:
            parts = auth_header.strip().split()
            token = parts[-1] if parts else ""
        elif api_key_header:
            token = api_key_header.strip()

        if not token or not secrets.compare_digest(token, configured_key):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Xác thực SePay Webhook thất bại: API Key không hợp lệ. Vui lòng kiểm tra lại cấu hình API Key trên SePay."
            )

    try:
        body_bytes = await request.body()
        payload = json.loads(body_bytes.decode("utf-8")) if body_bytes else {}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid JSON payload: {e}")

    # Extract fields from SePay format
    transfer_type = str(payload.get("transferType", "in")).lower()
    transfer_amount = int(payload.get("transferAmount", 0) or 0)
    content = str(payload.get("content", "") or "")
    gateway = str(payload.get("gateway", "SePay Banking") or "SePay Banking")
    tx_code = str(payload.get("code") or payload.get("referenceCode") or payload.get("id") or "")
    sepay_tx_id = f"SEPAY-{tx_code}" if tx_code else f"SEPAY-{uuid.uuid4().hex[:8].upper()}"

    # Only process incoming money (Tiền vào)
    if transfer_type != "in" or transfer_amount <= 0:
        return {"success": True, "message": "Ignored non-incoming transaction"}

    # Idempotency check: don't process duplicate transaction
    existing_tx_stmt = select(PaymentTransaction).where(
        or_(
            PaymentTransaction.transaction_code == sepay_tx_id,
            PaymentTransaction.transaction_code == tx_code,
        )
    )
    existing_tx_res = await db.execute(existing_tx_stmt)
    if existing_tx_res.scalar_one_or_none():
        return {"success": True, "message": "Transaction already processed"}

    # Extract user identifier from content (e.g. "VELOX 3B57B1" or "VELOX3B57B1")
    user_match = re.search(r"VELOX\s*([A-Za-z0-9\-_]+)", content, re.IGNORECASE)
    user_code = user_match.group(1).strip() if user_match else ""

    user_obj = None
    if user_code:
        # 1. Try finding by ID suffix or exact ID
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
        # Check if we can find fallback user (e.g. admin) or record safely without failing
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
        except Exception as err:
            await db.rollback()
            logger.warning(f"Could not record unassigned transaction {sepay_tx_id}: {err}")

        return {
            "success": True,
            "message": f"Webhook received successfully. Transaction recorded as UNASSIGNED (no matching user in '{content}')."
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

    client_ip = get_client_ip(request)

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

    return {
        "success": True,
        "message": f"Successfully credited {added_credits:,} credits to user {user_obj.email}",
        "user_email": user_obj.email,
        "new_balance": new_balance,
        "tier": new_tier,
    }


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

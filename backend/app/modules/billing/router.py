"""
VeloX AI Gateway — Billing & Credit Top-Up Router
=================================================
Allows public/authenticated users to view packages and top-up credit balances,
and provides Admin RBAC endpoints to create, update, and manage credit packages in database.
"""
import json
import uuid
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc

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
    amount_vnd: int = Field(..., gt=0, description="Số tiền thanh toán VNĐ")
    credits: int = Field(..., gt=0, description="Số credit tương ứng")
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
    Adds credits directly to user's database balance and records CreditAuditLog & PaymentTransaction.
    """
    # 1. Lock and retrieve user to prevent race conditions
    stmt = select(User).where(User.id == current_user.id).with_for_update()
    res = await db.execute(stmt)
    user_obj = res.scalar_one_or_none()

    if not user_obj:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy tài khoản người dùng.")

    balance_before = user_obj.credit_balance or 0
    added_credits = int(body.credits)
    new_balance = balance_before + added_credits
    user_obj.credit_balance = new_balance

    client_ip = get_client_ip(request)

    # 2. Immutable Credit Transaction Audit Log
    tx_code = f"TX-{uuid.uuid4().hex[:10].upper()}"

    audit = CreditAuditLog(
        user_id=user_obj.id,
        actor_id=user_obj.id,
        actor_email=user_obj.email,
        delta=added_credits,
        balance_before=balance_before,
        balance_after=new_balance,
        reason=f"Nạp tiền thành công: +{added_credits:,} Credits ({body.amount_vnd:,} VNĐ qua {body.payment_method})",
        ip_address=client_ip,
    )
    db.add(audit)

    # 3. Create Payment Transaction Record
    tx = PaymentTransaction(
        transaction_code=tx_code,
        user_id=user_obj.id,
        package_id=body.package_id,
        amount_vnd=body.amount_vnd,
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
            "added_credits": added_credits,
            "balance_before": balance_before,
            "status": "COMPLETED",
        },
        message=f"Nạp thành công {added_credits:,} Credits vào tài khoản! Số dư mới: {new_balance:,} Credits."
    )


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

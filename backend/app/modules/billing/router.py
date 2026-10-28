"""
VeloX AI Gateway — Billing & Credit Top-Up Router
=================================================
Allows authenticated users to view packages and top-up credit balances.
"""
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.core.security import get_current_user
from app.common.responses import ok
from app.modules.users.models import User, CreditAuditLog
from app.modules.billing.models import CreditPackage, PaymentTransaction
from app.modules.users.router import get_client_ip

router = APIRouter(prefix="/billing", tags=["Billing & Top-Up"])


class TopupRequest(BaseModel):
    package_id: Optional[str] = None
    amount_vnd: int = Field(..., gt=0, description="Số tiền thanh toán VNĐ")
    credits: int = Field(..., gt=0, description="Số credit tương ứng")
    payment_method: str = Field(default="VietQR Banking", description="Phương thức thanh toán")


@router.get("/packages")
async def list_packages(db: AsyncSession = Depends(get_db)):
    """List available credit packages."""
    stmt = select(CreditPackage).where(CreditPackage.is_active == True).order_by(CreditPackage.price_vnd.asc())
    res = await db.execute(stmt)
    packages = res.scalars().all()
    return ok(data=[
        {
            "id": p.id,
            "name": p.name,
            "price_vnd": float(p.price_vnd),
            "credits_given": float(p.credits_given),
            "bonus_percentage": p.bonus_percentage,
            "is_popular": p.is_popular,
        }
        for p in packages
    ])


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
    import uuid
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

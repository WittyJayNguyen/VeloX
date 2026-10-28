"""
VeloX AI Gateway — Studio Generation & Job Management Router
============================================================
Handles authenticated Studio job creations, verifies user credit balances,
and automatically deducts credits with full immutable transaction audit logging.
"""
from typing import Optional, Dict, Any
import uuid
from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.core.security import get_current_user
from app.common.responses import ok
from app.modules.users.models import User, CreditAuditLog
from app.modules.models_catalog.models import AIModel
from app.modules.users.router import get_client_ip

router = APIRouter(prefix="/studio", tags=["Studio Workspace & Jobs"])

DEFAULT_CREDIT_COSTS = {
    "CHAT": 15,
    "IMAGE": 35,
    "VIDEO": 80,
    "AUDIO": 15,
}


class StudioJobCreateRequest(BaseModel):
    type: str = Field(..., description="Loại job: 'chat' | 'image' | 'video' | 'audio'")
    model_code: str = Field(..., description="Mã model (vd: seedance-2.5, gpt-4o, flux-1-dev)")
    prompt: str = Field(..., min_length=1, description="Prompt yêu cầu")
    options: Optional[Dict[str, Any]] = Field(default_factory=dict, description="Các tham số studio (resolution, duration, ratio, voice, etc.)")


@router.post("/jobs")
async def create_studio_job(
    body: StudioJobCreateRequest,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Creates and authorizes a generation job from Studio:
    1. Looks up model price from AIModel table.
    2. Validates user has sufficient credits. If insufficient or zero, blocks job creation with HTTP 402.
    3. Atomically deducts required credits from the user's account and records immutable audit log.
    """
    job_type = body.type.strip().lower()
    cat_lookup = job_type.upper()

    # 1. Lookup model selling credit price from catalog
    stmt = select(AIModel).where(AIModel.model_code == body.model_code)
    res = await db.execute(stmt)
    model_obj = res.scalar_one_or_none()

    if model_obj and model_obj.selling_credit_price and model_obj.selling_credit_price > 0:
        cost = model_obj.selling_credit_price
        model_name = model_obj.name
    else:
        cost = DEFAULT_CREDIT_COSTS.get(cat_lookup, 30)
        model_name = body.model_code

    # 2. Lock user record to prevent concurrent double-spending
    user_stmt = select(User).where(User.id == current_user.id).with_for_update()
    user_res = await db.execute(user_stmt)
    user_obj = user_res.scalar_one_or_none()

    if not user_obj:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Không tìm thấy thông tin tài khoản."
        )

    current_balance = user_obj.credit_balance or 0

    if current_balance < cost or current_balance <= 0:
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail={
                "message": f"Số dư không đủ. Cần {cost:,} Credits cho model '{model_name}', nhưng số dư tài khoản của bạn chỉ còn {current_balance:,} Credits.",
                "code": "insufficient_credits",
                "cost": cost,
                "current_balance": current_balance,
            }
        )

    # 3. Deduct credits
    balance_before = current_balance
    new_balance = balance_before - cost
    user_obj.credit_balance = new_balance

    client_ip = get_client_ip(request)
    job_id = f"job-{uuid.uuid4().hex[:12]}"

    audit = CreditAuditLog(
        user_id=user_obj.id,
        actor_id=user_obj.id,
        actor_email=user_obj.email,
        delta=-cost,
        balance_before=balance_before,
        balance_after=new_balance,
        reason=f"Studio {cat_lookup} Job [{job_id}]: {model_name} (-{cost:,} cr)",
        ip_address=client_ip,
    )
    db.add(audit)
    await db.commit()

    return ok(
        data={
            "job_id": job_id,
            "type": job_type,
            "model_code": body.model_code,
            "model_name": model_name,
            "cost": cost,
            "credit_balance": user_obj.credit_balance,
            "balance_before": balance_before,
            "status": "QUEUED",
        },
        message=f"Tạo job thành công (-{cost:,} Credits). Số dư còn lại: {new_balance:,} Credits."
    )

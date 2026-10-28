"""
VeloX AI Gateway — Proxy Router (OpenAI Compatible)
===================================================
Top-level `/v1` endpoints for external Developers and third-party integrations.
Accepts `Authorization: Bearer sk-velox-...`.
"""
from typing import Dict, Any, List, Optional
from fastapi import APIRouter, Depends, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.modules.proxy.dependencies import get_developer_auth
from app.modules.developers.models import UserApiKey
from app.modules.users.models import User
from app.modules.models_catalog.models import AIModel
from app.modules.proxy.schemas import (
    ImageGenerationRequest, ImageGenerationResponse,
    VideoGenerationRequest, VideoGenerationResponse,
    ChatCompletionRequest, ChatCompletionResponse
)
from app.modules.proxy.services import (
    proxy_generate_image, proxy_generate_video, proxy_chat_completion
)

# OpenRouter / OpenAI compatible root prefix: /v1
router = APIRouter(prefix="/v1", tags=["OpenAI Compatible Gateway Proxy"])


@router.get("/models")
async def list_available_models(
    db: AsyncSession = Depends(get_db),
    auth_data: tuple[UserApiKey, User] = Depends(get_developer_auth),
):
    """
    List all available models on VeloX Gateway in OpenAI format.
    """
    stmt = select(AIModel).where(AIModel.is_available == True)
    res = await db.execute(stmt)
    models = res.scalars().all()

    return {
        "object": "list",
        "data": [
            {
                "id": m.model_code,
                "object": "model",
                "created": 1700000000,
                "owned_by": m.provider.lower(),
                "category": m.category,
                "permission": [],
                "root": m.model_code,
                "parent": None,
            }
            for m in models
        ]
    }


@router.post("/images/generations", response_model=ImageGenerationResponse)
async def api_proxy_generate_image(
    payload: ImageGenerationRequest,
    db: AsyncSession = Depends(get_db),
    auth_data: tuple[UserApiKey, User] = Depends(get_developer_auth),
):
    """
    OpenAI-compatible Image Generation Endpoint.
    Routes to Meta Imagine via internal Pool.
    """
    api_key, user = auth_data
    return await proxy_generate_image(payload=payload, api_key=api_key, user=user, db=db)


@router.post("/videos/generations", response_model=VideoGenerationResponse)
async def api_proxy_generate_video(
    payload: VideoGenerationRequest,
    db: AsyncSession = Depends(get_db),
    auth_data: tuple[UserApiKey, User] = Depends(get_developer_auth),
):
    """
    Video Generation Endpoint.
    Routes to Meta Video Gen / Imagine Animate via internal Pool.
    """
    api_key, user = auth_data
    return await proxy_generate_video(payload=payload, api_key=api_key, user=user, db=db)


@router.post("/chat/completions", response_model=ChatCompletionResponse)
async def api_proxy_chat_completions(
    payload: ChatCompletionRequest,
    db: AsyncSession = Depends(get_db),
    auth_data: tuple[UserApiKey, User] = Depends(get_developer_auth),
):
    """
    OpenAI-compatible Chat Completions Endpoint.
    """
    api_key, user = auth_data
    return await proxy_chat_completion(payload=payload, api_key=api_key, user=user, db=db)


@router.get("/pricing")
async def get_model_pricing(
    model: Optional[str] = Query(None, description="Mã model cụ thể cần tra giá (ví dụ: codex, deepseek-v4.1-flash-1017)"),
    category: Optional[str] = Query(None, description="Lọc theo danh mục: DEV_REQ, CHAT, IMAGE, VIDEO, AUDIO"),
    currency: Optional[str] = Query("VND", description="Đơn vị tiền tệ (mặc định: VND)"),
    db: AsyncSession = Depends(get_db),
):
    """
    Public Pricing Endpoint for Developers, Integrations & Resellers.
    Returns real-time model pricing in both VND and VeloX Credits.
    OpenAI / Tuansu Compatible Format.
    """
    from datetime import datetime, timezone
    from sqlalchemy import or_

    stmt = select(AIModel).where(AIModel.is_available == True)
    if model:
        m_strip = model.strip()
        stmt = stmt.where(or_(AIModel.model_code == m_strip, AIModel.model_code.ilike(f"%{m_strip}%")))
    if category:
        stmt = stmt.where(AIModel.category == category.strip().upper())

    stmt = stmt.order_by(AIModel.category.asc(), AIModel.model_code.asc())
    res = await db.execute(stmt)
    models = res.scalars().all()

    # Tỷ giá chuẩn: 1 Credit = 100 VND
    CREDIT_VND_RATE = 100

    catalog_data = []
    for m in models:
        is_token = m.category in ["CHAT", "DEV_REQ"] and (
            (m.input_credit_price and m.input_credit_price > 0) or
            (m.output_credit_price and m.output_credit_price > 0)
        )

        if is_token:
            in_cr = m.input_credit_price or 75
            out_cr = m.output_credit_price or 300
            cache_cr = m.cache_read_credit_price or int(in_cr * 0.5)

            in_vnd = round(float(m.input_cost_per_1m or in_cr), 2)
            out_vnd = round(float(m.output_cost_per_1m or out_cr), 2)
            cache_vnd = round(float(m.cache_read_cost_per_1m or cache_cr), 2)

            catalog_data.append({
                "id": m.model_code,
                "name": m.name,
                "category": m.category,
                "provider": m.provider,
                "currency": "VND",
                "billing_type": "token",
                "unit": "1M_tokens",
                "minimum_per_request": max(1, m.selling_credit_price or 1),
                "minimum_credits": max(1, m.selling_credit_price or 1),
                "prices": {
                    "input_per_1m": in_vnd,
                    "output_per_1m": out_vnd,
                    "cache_read_per_1m": cache_vnd,
                    "cache_write_per_1m": None,
                    "cache_write_1h_per_1m": None,
                },
                "credits": {
                    "input_per_1m": in_cr,
                    "output_per_1m": out_cr,
                    "cache_read_per_1m": cache_cr,
                    "rate_exchange": "1 Credit = 100 VND",
                }
            })
        else:
            sell_cr = max(1, m.selling_credit_price or 1)
            cost_vnd = m.cost_per_req_or_1k_tok or (sell_cr * CREDIT_VND_RATE)
            sell_vnd = sell_cr * CREDIT_VND_RATE

            catalog_data.append({
                "id": m.model_code,
                "name": m.name,
                "category": m.category,
                "provider": m.provider,
                "currency": "VND",
                "billing_type": "request",
                "unit": "request",
                "minimum_per_request": sell_vnd,
                "minimum_credits": sell_cr,
                "price_per_request": sell_vnd,
                "credits_per_request": sell_cr,
                "credits": {
                    "credits_per_request": sell_cr,
                    "rate_exchange": "1 Credit = 100 VND",
                }
            })

    return {
        "object": "list",
        "scope": "public_catalog",
        "personalized": False,
        "catalog": "velox",
        "currency": "VND",
        "version": "1.0",
        "source_updated_at": datetime.now(timezone.utc).isoformat(),
        "count": len(catalog_data),
        "data": catalog_data,
    }

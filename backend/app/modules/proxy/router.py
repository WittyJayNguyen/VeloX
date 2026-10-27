"""
VeloX AI Gateway — Proxy Router (OpenAI Compatible)
===================================================
Top-level `/v1` endpoints for external Developers and third-party integrations.
Accepts `Authorization: Bearer sk-velox-...`.
"""
from typing import Dict, Any, List
from fastapi import APIRouter, Depends, status
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

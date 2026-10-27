"""
VeloX AI Gateway — Playground API Endpoints
===========================================
Admin test routes for prompting models, testing credentials, and debugging gateway latency.
"""
from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.core.security import get_current_user_payload
from app.modules.pools.models import ProviderCredential, ServicePool
from app.modules.playground.schemas import (
    PlaygroundRequest, PlaygroundResponse,
    ConnectionTestRequest, ConnectionTestResponse
)
from app.modules.playground.services import (
    execute_playground_request, test_credential_connection
)

router = APIRouter(tags=["Gateway — Admin Playground"])


@router.post("/playground/chat", response_model=PlaygroundResponse)
async def playground_chat(
    payload: PlaygroundRequest,
    db: AsyncSession = Depends(get_db),
    _user: dict = Depends(get_current_user_payload),
):
    """
    Execute a test prompt across any model catalog item or specific provider key.
    Returns generated content, latency, token usage, and live debug telemetry.
    """
    try:
        user_id = _user.get("sub")
        return await execute_playground_request(payload, db, user_id=user_id)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Playground execution failed: {str(e)}"
        )


@router.post("/playground/test-connection", response_model=ConnectionTestResponse)
async def playground_test_connection(
    payload: ConnectionTestRequest,
    db: AsyncSession = Depends(get_db),
    _user: dict = Depends(get_current_user_payload),
):
    """
    Test real-time connectivity of an API Key or Web Session (e.g. Meta AI Muse).
    """
    return await test_credential_connection(payload.key_id, db)


@router.get("/playground/keys")
async def list_playground_keys(
    db: AsyncSession = Depends(get_db),
    _user: dict = Depends(get_current_user_payload),
):
    """
    Get all active credentials and session tokens available for testing.
    """
    stmt = (
        select(
            ProviderCredential.id,
            ProviderCredential.name,
            ProviderCredential.auth_type,
            ProviderCredential.status,
            ProviderCredential.detected_models,
            ServicePool.provider,
            ServicePool.name.label("pool_name"),
            ProviderCredential.quota_daily,
            ProviderCredential.quota_daily_used,
            ProviderCredential.quota_monthly,
            ProviderCredential.quota_monthly_used,
            ProviderCredential.requests_count,
        )
        .join(ServicePool, ProviderCredential.pool_id == ServicePool.id, isouter=True)
        .order_by(ProviderCredential.name)
    )
    res = await db.execute(stmt)
    rows = res.all()
    
    keys = []
    for r in rows:
        keys.append({
            "id": r[0],
            "name": r[1],
            "auth_type": r[2],
            "status": r[3],
            "detected_models": r[4],
            "provider": r[5] or "General",
            "pool_name": r[6] or "Default Pool",
            "quota_daily": r[7] or 10000,
            "quota_daily_used": r[8] or 0,
            "quota_monthly": r[9] or 250000,
            "quota_monthly_used": r[10] or 0,
            "requests_count": r[11] or 0,
        })
    return keys

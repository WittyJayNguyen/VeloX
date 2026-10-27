"""
VeloX AI Gateway — Developer API Keys HTTP Router
=================================================
REST endpoints for developers to create, list, toggle, and revoke personal API keys.
"""
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import get_current_user_payload
from app.modules.developers.schemas import (
    ApiKeyCreateRequest, ApiKeyCreatedResponse, ApiKeyResponse
)
from app.modules.developers.services import (
    create_developer_key, list_developer_keys, revoke_developer_key, toggle_developer_key
)

router = APIRouter(prefix="/developer/keys", tags=["Developer — API Keys Management"])


@router.post("", response_model=ApiKeyCreatedResponse, status_code=status.HTTP_201_CREATED)
async def api_create_developer_key(
    payload: ApiKeyCreateRequest,
    db: AsyncSession = Depends(get_db),
    user_payload: dict = Depends(get_current_user_payload),
):
    """
    Create a new Developer API Key (sk-velox-...).
    WARNING: The `secret_key` is only returned ONCE in this response.
    """
    user_id = user_payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token payload")

    return await create_developer_key(user_id=user_id, payload=payload, db=db)


@router.get("", response_model=List[ApiKeyResponse])
async def api_list_developer_keys(
    db: AsyncSession = Depends(get_db),
    user_payload: dict = Depends(get_current_user_payload),
):
    """
    List all active and inactive API keys owned by the authenticated developer.
    """
    user_id = user_payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token payload")

    return await list_developer_keys(user_id=user_id, db=db)


@router.delete("/{key_id}", status_code=status.HTTP_200_OK)
async def api_revoke_developer_key(
    key_id: str,
    db: AsyncSession = Depends(get_db),
    user_payload: dict = Depends(get_current_user_payload),
):
    """
    Revoke (delete) a developer API key immediately.
    """
    user_id = user_payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token payload")

    success = await revoke_developer_key(key_id=key_id, user_id=user_id, db=db)
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="API Key not found or unauthorized")

    return {"status": "success", "message": "API Key revoked successfully"}


@router.patch("/{key_id}/toggle", response_model=ApiKeyResponse)
async def api_toggle_developer_key(
    key_id: str,
    is_active: bool,
    db: AsyncSession = Depends(get_db),
    user_payload: dict = Depends(get_current_user_payload),
):
    """
    Enable or disable a developer API key.
    """
    user_id = user_payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token payload")

    result = await toggle_developer_key(key_id=key_id, user_id=user_id, is_active=is_active, db=db)
    if not result:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="API Key not found or unauthorized")

    return result

"""
VeloX AI Gateway — Developer API Keys Business Logic & Security
===============================================================
Handles secure token generation (CSPRNG), SHA-256 key hashing,
and key verification for Proxy Gateway middleware.
"""
import secrets
import hashlib
from datetime import datetime, timezone
from typing import List, Optional, Tuple
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc

from app.modules.developers.models import UserApiKey
from app.modules.developers.schemas import ApiKeyCreateRequest, ApiKeyCreatedResponse, ApiKeyResponse
from app.modules.users.models import User


def generate_secret_key() -> Tuple[str, str, str]:
    """
    Generates a secure API key:
    Returns (raw_secret_key, key_prefix, sha256_hash)
    Format: sk-velox-<32 hex characters>
    """
    random_part = secrets.token_hex(24)
    raw_key = f"sk-velox-{random_part}"
    key_prefix = f"sk-velox-{random_part[:6]}..."
    key_hash = hashlib.sha256(raw_key.encode("utf-8")).hexdigest()
    return raw_key, key_prefix, key_hash


async def create_developer_key(
    user_id: str,
    payload: ApiKeyCreateRequest,
    db: AsyncSession
) -> ApiKeyCreatedResponse:
    """Creates a new API key for the developer and returns the full secret once."""
    raw_key, prefix, key_hash = generate_secret_key()

    api_key_record = UserApiKey(
        user_id=user_id,
        name=payload.name,
        key_prefix=prefix,
        key_hash=key_hash,
        is_active=True,
        rate_limit_per_min=payload.rate_limit_per_min or 60,
    )
    db.add(api_key_record)
    await db.commit()
    await db.refresh(api_key_record)

    return ApiKeyCreatedResponse(
        id=str(api_key_record.id),
        user_id=api_key_record.user_id,
        name=api_key_record.name,
        key_prefix=api_key_record.key_prefix,
        is_active=api_key_record.is_active,
        rate_limit_per_min=api_key_record.rate_limit_per_min,
        total_requests=api_key_record.total_requests,
        last_used_at=api_key_record.last_used_at.isoformat() if api_key_record.last_used_at else None,
        created_at=api_key_record.created_at.isoformat() if api_key_record.created_at else None,
        secret_key=raw_key,
    )


async def list_developer_keys(
    user_id: str,
    db: AsyncSession
) -> List[ApiKeyResponse]:
    """Returns all API keys belonging to the developer (secret_key is NEVER returned)."""
    stmt = (
        select(UserApiKey)
        .where(UserApiKey.user_id == user_id)
        .order_by(desc(UserApiKey.created_at))
    )
    res = await db.execute(stmt)
    records = list(res.scalars().all())

    # If user has no API keys yet, automatically provision 1 default key
    if not records:
        try:
            raw_key, prefix, key_hash = generate_secret_key()
            default_key = UserApiKey(
                user_id=user_id,
                name="Default API Key",
                key_prefix=prefix,
                key_hash=key_hash,
                is_active=True,
                rate_limit_per_min=60,
            )
            db.add(default_key)
            await db.commit()
            await db.refresh(default_key)
            records = [default_key]
        except Exception as ex:
            print(f"[List Keys Auto-Provision Error]: {ex}")

    return [
        ApiKeyResponse(
            id=str(r.id),
            user_id=r.user_id,
            name=r.name,
            key_prefix=r.key_prefix,
            is_active=r.is_active,
            rate_limit_per_min=r.rate_limit_per_min,
            total_requests=r.total_requests,
            last_used_at=r.last_used_at.isoformat() if r.last_used_at else None,
            created_at=r.created_at.isoformat() if r.created_at else None,
        )
        for r in records
    ]


async def revoke_developer_key(
    key_id: str,
    user_id: str,
    db: AsyncSession
) -> bool:
    """Deletes/Revokes an API key owned by the user."""
    stmt = select(UserApiKey).where(UserApiKey.id == key_id, UserApiKey.user_id == user_id)
    res = await db.execute(stmt)
    key_record = res.scalar_one_or_none()
    if not key_record:
        return False
    await db.delete(key_record)
    await db.commit()
    return True


async def toggle_developer_key(
    key_id: str,
    user_id: str,
    is_active: bool,
    db: AsyncSession
) -> Optional[ApiKeyResponse]:
    """Activates or pauses an API key."""
    stmt = select(UserApiKey).where(UserApiKey.id == key_id, UserApiKey.user_id == user_id)
    res = await db.execute(stmt)
    key_record = res.scalar_one_or_none()
    if not key_record:
        return None
    key_record.is_active = is_active
    await db.commit()
    await db.refresh(key_record)
    return ApiKeyResponse(
        id=str(key_record.id),
        user_id=key_record.user_id,
        name=key_record.name,
        key_prefix=key_record.key_prefix,
        is_active=key_record.is_active,
        rate_limit_per_min=key_record.rate_limit_per_min,
        total_requests=key_record.total_requests,
        last_used_at=key_record.last_used_at.isoformat() if key_record.last_used_at else None,
        created_at=key_record.created_at.isoformat() if key_record.created_at else None,
    )


async def authenticate_developer_key(
    raw_key: str,
    db: AsyncSession
) -> Optional[Tuple[UserApiKey, User]]:
    """
    Verifies raw API key against SHA-256 hash and checks User status.
    Returns (UserApiKey, User) tuple or None if invalid/inactive.
    """
    if not raw_key or not raw_key.startswith("sk-velox-"):
        return None

    hashed = hashlib.sha256(raw_key.encode("utf-8")).hexdigest()
    stmt = (
        select(UserApiKey)
        .where(UserApiKey.key_hash == hashed, UserApiKey.is_active == True)
    )
    res = await db.execute(stmt)
    key_record = res.scalar_one_or_none()
    if not key_record:
        return None

    # Retrieve user
    u_stmt = select(User).where(User.id == key_record.user_id, User.is_active == True)
    u_res = await db.execute(u_stmt)
    user = u_res.scalar_one_or_none()
    if not user:
        return None

    # Bump last_used_at and total_requests
    key_record.last_used_at = datetime.now(timezone.utc)
    key_record.total_requests = (key_record.total_requests or 0) + 1
    await db.commit()

    return key_record, user

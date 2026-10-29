"""
VeloX AI Gateway — Proxy Authentication Dependency
===================================================
Authenticates developers via the standard Bearer sk-velox-... header.
"""
from typing import Tuple
from fastapi import Header, HTTPException, status, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.modules.developers.models import UserApiKey
from app.modules.developers.services import authenticate_developer_key
from app.modules.users.models import User


async def get_developer_auth(
    authorization: str = Header(..., description="Bearer sk-velox-..."),
    db: AsyncSession = Depends(get_db),
) -> Tuple[UserApiKey, User]:
    """
    Validates Developer API Key header: Authorization: Bearer sk-velox-...
    Returns (UserApiKey, User) tuple or raises 401/403.
    """
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "error": {
                    "message": "Missing or malformed Authorization header. Expected 'Bearer sk-velox-...'",
                    "type": "invalid_request_error",
                    "code": "invalid_api_key",
                }
            }
        )

    raw_key = authorization.split("Bearer ", 1)[1].strip()
    result = await authenticate_developer_key(raw_key, db)

    if not result:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "error": {
                    "message": "Incorrect API key provided or key has been revoked.",
                    "type": "authentication_error",
                    "code": "invalid_api_key",
                }
            }
        )

    api_key_record, user = result

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "error": {
                    "message": "User account has been suspended or deactivated.",
                    "type": "account_deactivated",
                    "code": "user_inactive",
                }
            }
        )

    # Enforce 30-day subscription expiration for API keys
    try:
        from app.modules.billing.subscription_service import enforce_user_subscription
        await enforce_user_subscription(user, db)
    except Exception:
        pass

    return api_key_record, user

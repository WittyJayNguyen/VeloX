"""VeloX AI Gateway — User & Auth Schemas (Pydantic)"""
from typing import Optional, List
from pydantic import BaseModel, EmailStr, Field


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=1)


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8)
    full_name: str = Field(..., min_length=2, max_length=128)
    website_hp: Optional[str] = None  # Anti-bot honeypot trap field (must be empty)


class ChangePasswordRequest(BaseModel):
    old_password: str = Field(..., min_length=1)
    new_password: str = Field(..., min_length=8)


class GoogleAuthRequest(BaseModel):
    credential: Optional[str] = None      # Google ID Token (GIS JWT)
    access_token: Optional[str] = None    # Google OAuth access token
    code: Optional[str] = None            # OAuth auth code
    redirect_uri: Optional[str] = None
    email: Optional[str] = None
    google_id: Optional[str] = None
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None


class TelegramAuthRequest(BaseModel):
    id: str | int
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    username: Optional[str] = None
    photo_url: Optional[str] = None
    auth_date: Optional[int] = None
    hash: Optional[str] = None


class UserRead(BaseModel):
    id: str
    email: str
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None
    credit_balance: Optional[int] = 0
    tier: Optional[str] = "FREE"
    is_active: bool
    roles: List[str] = []
    permissions: List[str] = []
    created_at: str
    last_login_at: Optional[str] = None


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserRead


class IPBanRequest(BaseModel):
    ip_address: str = Field(..., min_length=3, max_length=64)
    reason: str = Field(..., min_length=3, max_length=512)
    action_type: Optional[str] = "BLOCK_ALL"  # 'BLOCK_ALL', 'BLOCK_REGISTER', 'REVOKE_FREE'
    banned_until: Optional[str] = None       # ISO timestamp or None for permanent


class IPUnbanRequest(BaseModel):
    ip_address: str = Field(..., min_length=3, max_length=64)


class IPBatchActionRequest(BaseModel):
    ip_address: str = Field(..., min_length=3, max_length=64)
    reason: str = Field(..., min_length=3, max_length=512)


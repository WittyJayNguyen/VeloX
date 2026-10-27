"""VeloX AI Gateway — JWT Token, Password Security & Granular RBAC Guard (Production Grade & Hardened)"""
import hashlib
import secrets
import string
import time
from collections import defaultdict
from datetime import datetime, timedelta, timezone
from typing import Optional, List
from jose import jwt, JWTError
from fastapi import Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.config import get_settings
from app.core.database import get_db

settings = get_settings()
bearer_scheme = HTTPBearer(auto_error=False)

# ── Anti-Spam & Rate Limiting Engine ──
_rate_limits = defaultdict(list)
_idempotency_cache = {}


class AntiSpamResult:
    def __init__(self, allowed: bool, remaining: int, retry_after: int, limit: int):
        self.allowed = allowed
        self.remaining = remaining
        self.retry_after = retry_after
        self.limit = limit


def check_anti_spam(key: str, max_requests: int = 10, window_seconds: int = 60) -> AntiSpamResult:
    """
    Sliding-window anti-spam check.
    Returns AntiSpamResult with remaining quota and retry_after in seconds.
    """
    now = time.time()
    records = _rate_limits[key]
    valid_records = [t for t in records if now - t < window_seconds]
    _rate_limits[key] = valid_records

    if len(valid_records) >= max_requests:
        oldest = valid_records[0]
        retry_after = max(1, int(window_seconds - (now - oldest)))
        return AntiSpamResult(allowed=False, remaining=0, retry_after=retry_after, limit=max_requests)

    valid_records.append(now)
    _rate_limits[key] = valid_records
    remaining = max_requests - len(valid_records)
    return AntiSpamResult(allowed=True, remaining=remaining, retry_after=0, limit=max_requests)


def enforce_anti_spam(
    key: str,
    max_requests: int = 10,
    window_seconds: int = 60,
    action_name: str = "thao tác",
):
    """
    Raises HTTP 429 Too Many Requests if rate limit is exceeded.
    Attaches RFC-compliant Retry-After, X-RateLimit headers.
    """
    res = check_anti_spam(key, max_requests, window_seconds)
    if not res.allowed:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Phát hiện tần suất gửi yêu cầu quá nhanh ({action_name}). Vui lòng chờ {res.retry_after} giây trước khi thử lại.",
            headers={
                "Retry-After": str(res.retry_after),
                "X-RateLimit-Limit": str(res.limit),
                "X-RateLimit-Remaining": "0",
            },
        )


def check_duplicate_request(key: str, cooldown_seconds: float = 3.0):
    """
    Anti-double-click / idempotency guard:
    Rejects duplicate identical requests fired within cooldown_seconds.
    """
    now = time.time()
    last_time = _idempotency_cache.get(key)
    if last_time and (now - last_time < cooldown_seconds):
        remaining = round(cooldown_seconds - (now - last_time), 1)
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Yêu cầu tương tự đang được xử lý hoặc được bấm quá nhanh. Vui lòng chờ {remaining}s.",
        )
    _idempotency_cache[key] = now


def check_rate_limit(key: str, max_requests: int = 15, window_seconds: int = 60) -> bool:
    """Backwards compatibility helper."""
    res = check_anti_spam(key, max_requests, window_seconds)
    return res.allowed


def hash_password(password: str) -> str:
    """Secure salted SHA-256 hash (anti-timing attack, Python 3.12+ safe)."""
    salt = secrets.token_hex(16)
    hashed = hashlib.sha256((salt + password).encode("utf-8")).hexdigest()
    return f"{salt}${hashed}"


def verify_password(plain: str, hashed: str) -> bool:
    """Verify password against salted hash with constant-time compare."""
    try:
        salt, expected = hashed.split("$", 1)
        calc = hashlib.sha256((salt + plain).encode("utf-8")).hexdigest()
        return secrets.compare_digest(calc, expected)
    except Exception:
        return False


def validate_password_strength(password: str) -> bool:
    """
    Production Password Policy:
    Minimum 8 characters, at least 1 uppercase, 1 lowercase, 1 digit, 1 special character.
    """
    if len(password) < 8:
        return False
    has_upper = any(c.isupper() for c in password)
    has_lower = any(c.islower() for c in password)
    has_digit = any(c.isdigit() for c in password)
    has_special = any(c in "!@#$%^&*()_+-=[]{}|;:,.<>/?`~" for c in password)
    return has_upper and has_lower and has_digit and has_special


def generate_secure_password(length: int = 14) -> str:
    """Generate high-entropy random password with mixed cases, numbers & symbols."""
    alphabet = string.ascii_letters + string.digits + "!@#$%^&*()_+"
    while True:
        pwd = "".join(secrets.choice(alphabet) for _ in range(length))
        if validate_password_strength(pwd):
            return pwd


def create_access_token(data: dict) -> str:
    """Create signed JWT token with expiration and session version claim."""
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.JWT_EXPIRATION_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def decode_token(token: str) -> dict:
    """Validate JWT signature and claims."""
    try:
        payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
        return payload
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token xác thực không hợp lệ hoặc đã hết hạn",
            headers={"WWW-Authenticate": "Bearer"},
        )


async def get_current_user_payload(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme),
) -> dict:
    """
    Strict Authenticator:
    Requires valid Bearer token. No demo backdoor, no unauthenticated pass-through.
    """
    if not credentials or not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Yêu cầu xác thực. Vui lòng đăng nhập với Bearer Token hợp lệ.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = credentials.credentials
    return decode_token(token)


async def get_current_user_id(
    payload: dict = Depends(get_current_user_payload),
) -> str:
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token payload thiếu thông tin định danh người dùng"
        )
    return user_id


async def get_current_user(
    payload: dict = Depends(get_current_user_payload),
    db: AsyncSession = Depends(get_db),
):
    """
    Production User Authenticator:
    - Loads user from DB by ID in JWT payload
    - Checks active status
    - Checks temporary lockout window
    - Verifies token version (invalidates stolen/stale tokens after password reset or session revocation)
    """
    from app.modules.users.models import User

    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token không hợp lệ")

    res = await db.execute(select(User).where(User.id == user_id))
    user = res.scalar_one_or_none()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Tài khoản không tồn tại trên hệ thống hoặc đã bị gỡ bỏ"
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Tài khoản của bạn đã bị tạm khóa hoặc vô hiệu hóa bởi Ban Quản Trị"
        )

    # Check lockout window
    if user.locked_until:
        try:
            lock_dt = datetime.fromisoformat(user.locked_until)
            if datetime.now(timezone.utc) < lock_dt:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Tài khoản đang bị tạm khóa bảo mật đến {user.locked_until} do đăng nhập thất bại nhiều lần."
                )
        except (ValueError, TypeError):
            pass

    # Check token version revocation
    token_ver = payload.get("ver")
    user_ver = getattr(user, "token_version", 1)
    if token_ver is not None and token_ver != user_ver:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Phiên đăng nhập đã bị hủy do đổi mật khẩu hoặc đăng xuất từ thiết bị khác. Vui lòng đăng nhập lại.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return user


def require_permission(perm: str):
    """
    Granular RBAC Guard:
    Checks if current authenticated user has the specified permission or is Super Admin.
    """
    async def permission_checker(current_user=Depends(get_current_user)):
        user_roles = current_user.roles or []
        for r in user_roles:
            if r.id == "ROLE_SUPER_ADMIN":
                return current_user
            perms = [p.strip() for p in (r.permissions or "").split(",") if p.strip()]
            if "ALL" in perms or perm in perms:
                return current_user

        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Bảo mật RBAC: Bạn không có quyền thực hiện thao tác này (Yêu cầu quyền: {perm})"
        )
    return permission_checker


def require_super_admin():
    """Restricts operation strictly to ROLE_SUPER_ADMIN."""
    async def super_admin_checker(current_user=Depends(get_current_user)):
        user_roles = current_user.roles or []
        if any(r.id == "ROLE_SUPER_ADMIN" for r in user_roles):
            return current_user
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Bảo mật cấp cao: Thao tác này chỉ dành riêng cho Quản trị viên Tối cao (Super Admin)"
        )
    return super_admin_checker


def get_client_ip(request: Request) -> str:
    """Extract real client IP handling forward headers."""
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "127.0.0.1"

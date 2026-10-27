"""VeloX AI Gateway — Auth Router (Production Grade & Hardened)"""
from fastapi import APIRouter, Depends, Request, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.security import (
    get_current_user,
    get_client_ip,
    enforce_anti_spam,
    verify_password,
    hash_password,
    validate_password_strength,
)
from app.modules.users.models import User, UserAuditLog
from app.modules.users.schemas import (
    LoginRequest,
    RegisterRequest,
    ChangePasswordRequest,
)
from app.modules.auth.services import register_user, authenticate_user, build_token_response
from app.common.responses import ok

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=dict)
async def register(
    body: RegisterRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """Self-registration for new users with honeypot trap and IP rate-limiting anti-spam."""
    # 1. Anti-Bot Honeypot Trap: Humans never fill hidden honeypot field
    if body.website_hp and body.website_hp.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Yêu cầu bị từ chối do vi phạm quy tắc phòng chống bot tự động."
        )

    # 2. IP Anti-Spam: Max 5 registration attempts per 3 minutes
    client_ip = get_client_ip(request)
    enforce_anti_spam(f"reg_ip_{client_ip}", max_requests=5, window_seconds=180, action_name="đăng ký tài khoản")

    user = await register_user(db, body.email, body.password, body.full_name, client_ip)
    return ok(data=build_token_response(user), message="Đăng ký tài khoản thành công")


@router.post("/login", response_model=dict)
async def login(
    body: LoginRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """
    User authentication with Dual-Layer Anti-Spam:
    - Layer 1: Max 10 requests / 60s per IP (stops IP flooding)
    - Layer 2: Max 5 requests / 60s per target Email (stops distributed botnet credential stuffing)
    """
    client_ip = get_client_ip(request)
    clean_email = body.email.strip().lower()

    enforce_anti_spam(f"login_ip_{client_ip}", max_requests=10, window_seconds=60, action_name="đăng nhập")
    enforce_anti_spam(f"login_acc_{clean_email}", max_requests=5, window_seconds=60, action_name="đăng nhập tài khoản này")

    user = await authenticate_user(db, body.email, body.password, client_ip)
    return ok(data=build_token_response(user), message="Đăng nhập thành công")


@router.get("/me", response_model=dict)
async def get_me(current_user: User = Depends(get_current_user)):
    """Retrieve currently authenticated user profile and permissions."""
    return ok(data=build_token_response(current_user)["user"])


@router.post("/change-password", response_model=dict)
async def change_password(
    body: ChangePasswordRequest,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Self password change with anti-spam rate limiting and session revocation."""
    client_ip = get_client_ip(request)
    enforce_anti_spam(f"pwd_chg_{current_user.id}", max_requests=3, window_seconds=180, action_name="đổi mật khẩu")

    if not verify_password(body.old_password, current_user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Mật khẩu hiện tại không chính xác"
        )

    if not validate_password_strength(body.new_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Mật khẩu mới phải có tối thiểu 8 ký tự, gồm ít nhất 1 chữ hoa, 1 chữ thường, 1 số và 1 ký tự đặc biệt"
        )

    if verify_password(body.new_password, current_user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Mật khẩu mới không được trùng với mật khẩu hiện tại"
        )

    current_user.password_hash = hash_password(body.new_password)
    current_user.token_version = (getattr(current_user, "token_version", 1) or 1) + 1
    current_user.failed_login_attempts = 0
    current_user.locked_until = None

    audit_log = UserAuditLog(
        target_user_id=current_user.id,
        actor_id=current_user.id,
        actor_email=current_user.email,
        action="PASSWORD_CHANGE",
        details="Người dùng tự đổi mật khẩu qua cổng xác thực. Mọi phiên đăng nhập cũ bị vô hiệu hóa.",
        reason="Người dùng tự đổi mật khẩu",
        ip_address=client_ip,
    )
    db.add(audit_log)
    await db.commit()

    return ok(
        data=build_token_response(current_user),
        message="Đổi mật khẩu thành công. Tất cả phiên đăng nhập cũ trên các thiết bị khác đã được đăng xuất an toàn."
    )


@router.post("/logout", response_model=dict)
async def logout(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Invalidate current user session token on backend by incrementing token version."""
    current_user.token_version = (getattr(current_user, "token_version", 1) or 1) + 1
    await db.commit()
    return ok(message="Đăng xuất an toàn thành công")

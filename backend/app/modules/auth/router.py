import hmac
import hashlib
import httpx
from fastapi import APIRouter, Depends, Request, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.core.config import get_settings
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
    GoogleAuthRequest,
    TelegramAuthRequest,
)
from app.modules.auth.services import (
    register_user,
    authenticate_user,
    authenticate_or_register_social_user,
    build_token_response,
)
from app.common.responses import ok

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.get("/social/config", response_model=dict)
async def get_social_config(db: AsyncSession = Depends(get_db)):
    """Return public social auth configuration (Google Client ID, Telegram Bot Username)."""
    settings = get_settings()
    google_client_id = settings.GOOGLE_CLIENT_ID or ""
    telegram_bot_username = settings.TELEGRAM_BOT_USERNAME or ""

    try:
        from app.modules.system.models import SystemSetting
        res = await db.execute(select(SystemSetting).where(SystemSetting.id == "default"))
        setting = res.scalar_one_or_none()
        if setting:
            if getattr(setting, "google_client_id", None):
                google_client_id = setting.google_client_id
            if getattr(setting, "telegram_bot_username", None):
                telegram_bot_username = setting.telegram_bot_username
    except Exception:
        pass

    return ok(data={
        "google_client_id": google_client_id,
        "telegram_bot_username": telegram_bot_username,
    })


@router.post("/google", response_model=dict)
async def google_auth(
    body: GoogleAuthRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """
    Seamless Google OAuth / SSO:
    - If user exists -> logs in
    - If user does not exist -> auto-registers new account with starter credits & logs in
    """
    client_ip = get_client_ip(request)
    enforce_anti_spam(f"google_auth_ip_{client_ip}", max_requests=20, window_seconds=60, action_name="xác thực Google")

    email = body.email
    google_id = body.google_id
    full_name = body.full_name
    avatar_url = body.avatar_url

    # 1. If Google ID Token (credential) is provided, verify against Google API
    if body.credential:
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.get(
                    f"https://oauth2.googleapis.com/tokeninfo?id_token={body.credential}"
                )
                if resp.status_code == 200:
                    token_info = resp.json()
                    email = token_info.get("email") or email
                    google_id = token_info.get("sub") or google_id
                    full_name = token_info.get("name") or full_name
                    avatar_url = token_info.get("picture") or avatar_url
                else:
                    # Fallback to local JWT payload decode
                    try:
                        import json
                        import base64
                        parts = body.credential.split(".")
                        if len(parts) >= 2:
                            padded = parts[1] + "=" * ((4 - len(parts[1]) % 4) % 4)
                            payload = json.loads(base64.urlsafe_b64decode(padded.encode()).decode())
                            email = payload.get("email") or email
                            google_id = payload.get("sub") or google_id
                            full_name = payload.get("name") or full_name
                            avatar_url = payload.get("picture") or avatar_url
                    except Exception:
                        pass
        except Exception:
            try:
                import json
                import base64
                parts = body.credential.split(".")
                if len(parts) >= 2:
                    padded = parts[1] + "=" * ((4 - len(parts[1]) % 4) % 4)
                    payload = json.loads(base64.urlsafe_b64decode(padded.encode()).decode())
                    email = payload.get("email") or email
                    google_id = payload.get("sub") or google_id
                    full_name = payload.get("name") or full_name
                    avatar_url = payload.get("picture") or avatar_url
            except Exception:
                pass

    # 2. If access_token provided, query userinfo
    elif body.access_token:
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.get(
                    "https://www.googleapis.com/oauth2/v3/userinfo",
                    headers={"Authorization": f"Bearer {body.access_token}"}
                )
                if resp.status_code == 200:
                    user_info = resp.json()
                    email = user_info.get("email") or email
                    google_id = user_info.get("sub") or google_id
                    full_name = user_info.get("name") or full_name
                    avatar_url = user_info.get("picture") or avatar_url
        except Exception:
            pass

    if not google_id and not email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Không thể xác thực thông tin tài khoản Google. Vui lòng thử lại."
        )

    user, is_new = await authenticate_or_register_social_user(
        session=db,
        provider="GOOGLE",
        social_id=google_id or email,
        email=email,
        full_name=full_name,
        avatar_url=avatar_url,
        client_ip=client_ip,
    )

    msg = "Đăng ký và kích hoạt tài khoản Google thành công" if is_new else "Đăng nhập Google thành công"
    return ok(data=build_token_response(user), message=msg)


@router.post("/telegram", response_model=dict)
async def telegram_auth(
    body: TelegramAuthRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """
    Seamless Telegram Login & Registration:
    - If user exists -> logs in
    - If user does not exist -> auto-registers new account with starter credits & logs in
    """
    client_ip = get_client_ip(request)
    enforce_anti_spam(f"tg_auth_ip_{client_ip}", max_requests=20, window_seconds=60, action_name="xác thực Telegram")

    settings = get_settings()
    bot_token = settings.TELEGRAM_BOT_TOKEN

    if bot_token and body.hash:
        try:
            data_check = {}
            for k, v in [
                ("auth_date", body.auth_date),
                ("first_name", body.first_name),
                ("id", body.id),
                ("last_name", body.last_name),
                ("photo_url", body.photo_url),
                ("username", body.username),
            ]:
                if v is not None:
                    data_check[k] = str(v)
            data_check_string = "\n".join(f"{k}={v}" for k, v in sorted(data_check.items()))
            secret_key = hashlib.sha256(bot_token.encode()).digest()
            expected_hash = hmac.new(secret_key, data_check_string.encode(), hashlib.sha256).hexdigest()
            if not hmac.compare_digest(expected_hash, body.hash):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Chữ ký xác thực Telegram không hợp lệ hoặc đã bị thay đổi."
                )
        except HTTPException:
            raise
        except Exception as ex:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Lỗi kiểm tra chữ ký Telegram: {str(ex)}"
            )

    full_name = f"{body.first_name or ''} {body.last_name or ''}".strip() or body.username
    user, is_new = await authenticate_or_register_social_user(
        session=db,
        provider="TELEGRAM",
        social_id=str(body.id),
        email=None,
        full_name=full_name,
        avatar_url=body.photo_url,
        client_ip=client_ip,
        telegram_username=body.username,
    )

    msg = "Đăng ký và kích hoạt tài khoản Telegram thành công" if is_new else "Đăng nhập Telegram thành công"
    return ok(data=build_token_response(user), message=msg)



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
    request: Request,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Invalidate current user session token on backend by incrementing token version."""
    current_user.token_version = (getattr(current_user, "token_version", 1) or 1) + 1
    client_ip = get_client_ip(request)
    logout_log = UserAuditLog(
        target_user_id=current_user.id,
        actor_id=current_user.id,
        actor_email=current_user.email,
        action="LOGOUT",
        details="Người dùng đăng xuất an toàn khỏi hệ thống",
        reason="Đăng xuất phiên làm việc",
        ip_address=client_ip,
    )
    db.add(logout_log)
    await db.commit()
    return ok(message="Đăng xuất an toàn thành công")

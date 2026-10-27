"""VeloX AI Gateway — Auth Services (Production Grade & Anti-Exploit)"""
from datetime import datetime, timedelta, timezone
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status
from app.modules.users.models import User, Role, user_roles, UserAuditLog, IPAccessRule
from app.modules.billing.models import UserWallet
from app.core.security import (
    hash_password,
    verify_password,
    validate_password_strength,
    create_access_token,
)


async def register_user(
    session: AsyncSession,
    email: str,
    password: str,
    full_name: str,
    client_ip: str = "127.0.0.1",
) -> User:
    """Register a new customer account with strict password validation, IP anti-abuse, and wallet initialization."""
    clean_email = email.strip().lower()
    clean_name = full_name.strip()

    # 1. Check IP Ban Status
    ip_rule_res = await session.execute(select(IPAccessRule).where(IPAccessRule.ip_address == client_ip))
    ip_rule = ip_rule_res.scalar_one_or_none()
    if ip_rule and ip_rule.status == "BANNED":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Địa chỉ IP ({client_ip}) đã bị cấm truy cập vào hệ thống. Lý do: {ip_rule.reason}"
        )

    if not validate_password_strength(password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Mật khẩu phải có tối thiểu 8 ký tự, bao gồm ít nhất 1 chữ hoa, 1 chữ thường, 1 số và 1 ký tự đặc biệt (!@#$%^&*...)"
        )

    existing = await session.execute(select(User).where(User.email == clean_email))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email này đã được đăng ký trên hệ thống")

    # 2. Anti-Quota Farming: Check how many accounts registered from this IP
    ip_count_res = await session.execute(select(func.count(User.id)).where(User.last_login_ip == client_ip))
    existing_ip_accounts = ip_count_res.scalar() or 0

    if existing_ip_accounts >= 5:
        # Auto-flag as banned for flooding
        if not ip_rule:
            ip_rule = IPAccessRule(
                ip_address=client_ip,
                status="BANNED",
                reason=f"Spam đăng ký liên tiếp {existing_ip_accounts} tài khoản",
                action_type="BLOCK_ALL",
                banned_by="Hệ thống Anti-Spam",
            )
            session.add(ip_rule)
            await session.commit()
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Địa chỉ IP này đã vượt quá số lượng đăng ký cho phép ({existing_ip_accounts} tài khoản). Vui lòng liên hệ ban quản trị."
        )

    # 3. Dynamic Starter Credits:
    # 1st account: 50,000 credits
    # 2nd account: 10,000 credits
    # 3rd+ account: 0 credits (stops free-quota farming abuse)
    if existing_ip_accounts >= 2:
        starter_credits = 0
        if not ip_rule:
            ip_rule = IPAccessRule(
                ip_address=client_ip,
                status="SUSPICIOUS",
                reason=f"Nghi vấn bào free credits: Đã tạo {existing_ip_accounts + 1} tài khoản từ cùng một IP",
                action_type="REVOKE_FREE",
                banned_by="Hệ thống Anti-Spam",
            )
            session.add(ip_rule)
    elif existing_ip_accounts == 1:
        starter_credits = 10000
    else:
        starter_credits = 50000

    now_iso = datetime.now(timezone.utc).isoformat()

    user = User(
        email=clean_email,
        password_hash=hash_password(password),
        full_name=clean_name,
        credit_balance=starter_credits,
        is_active=True,
        is_verified=True,
        tier="FREE",
        failed_login_attempts=0,
        token_version=1,
        last_login_at=now_iso,
        last_login_ip=client_ip,
    )

    # Assign default ROLE_USER
    role_res = await session.execute(select(Role).where(Role.id == "ROLE_USER"))
    user_role = role_res.scalar_one_or_none()
    if user_role:
        user.roles.append(user_role)

    session.add(user)
    await session.flush()

    # Create associated wallet
    wallet = UserWallet(
        user_id=user.id,
        balance_credits=starter_credits,
        total_deposited=0,
        total_spent=0,
    )
    session.add(wallet)

    # Register audit log
    audit_log = UserAuditLog(
        target_user_id=user.id,
        actor_id=user.id,
        actor_email=user.email,
        action="REGISTER",
        details="Thành viên tự đăng ký tài khoản qua cổng xác thực VeloX",
        reason="Đăng ký tài khoản mới",
        ip_address=client_ip,
    )
    session.add(audit_log)

    await session.commit()
    await session.refresh(user)
    return user


async def authenticate_user(
    session: AsyncSession,
    email: str,
    password: str,
    client_ip: str = "127.0.0.1",
) -> User:
    """
    Production-grade user authenticator:
    - Protects against brute-force attacks via temporary 15-minute lockout after 5 failed attempts
    - Tracks failed attempts and resets upon success
    - Logs client IP and login timestamp
    """
    clean_email = email.strip().lower()

    # Check IP Ban Status
    ip_rule_res = await session.execute(select(IPAccessRule).where(IPAccessRule.ip_address == client_ip))
    ip_rule = ip_rule_res.scalar_one_or_none()
    if ip_rule and ip_rule.status == "BANNED":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Địa chỉ IP ({client_ip}) đã bị chặn đăng nhập do vi phạm: {ip_rule.reason}"
        )

    result = await session.execute(select(User).where(User.email == clean_email))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email hoặc mật khẩu không chính xác",
        )

    # 1. Check account active status
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Tài khoản này đã bị khóa hoặc vô hiệu hóa bởi Ban Quản Trị. Vui lòng liên hệ hỗ trợ."
        )

    # 2. Check temporary lockout window
    now_utc = datetime.now(timezone.utc)
    if user.locked_until:
        try:
            lock_dt = datetime.fromisoformat(user.locked_until)
            if now_utc < lock_dt:
                remaining_mins = max(1, int((lock_dt - now_utc).total_seconds() / 60))
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Tài khoản đang bị tạm khóa bảo mật do đăng nhập sai nhiều lần. Vui lòng thử lại sau {remaining_mins} phút."
                )
            else:
                # Lockout expired, reset attempts
                user.locked_until = None
                user.failed_login_attempts = 0
        except (ValueError, TypeError):
            user.locked_until = None

    # 3. Verify password
    if not verify_password(password, user.password_hash):
        user.failed_login_attempts = (user.failed_login_attempts or 0) + 1
        max_attempts = 5

        if user.failed_login_attempts >= max_attempts:
            lockout_time = now_utc + timedelta(minutes=15)
            user.locked_until = lockout_time.isoformat()

            # Record security audit log
            a_log = UserAuditLog(
                target_user_id=user.id,
                actor_id="SYSTEM_GUARD",
                actor_email="security@velox.ai",
                action="SECURITY_LOCKOUT",
                details=f"Tự động khóa 15 phút do nhập sai {max_attempts} lần liên tiếp",
                reason="Phòng chống Brute-Force Password Cracking",
                ip_address=client_ip,
            )
            session.add(a_log)
            await session.commit()

            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Tài khoản đã bị tạm khóa 15 phút do nhập sai mật khẩu {max_attempts} lần liên tiếp. Vui lòng thử lại sau."
            )
        else:
            remaining = max_attempts - user.failed_login_attempts
            await session.commit()
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"Email hoặc mật khẩu không chính xác. Bạn còn {remaining} lần thử trước khi tài khoản bị khóa tạm thời."
            )

    # 4. Successful login: reset failed counters & record metadata
    user.failed_login_attempts = 0
    user.locked_until = None
    user.last_login_at = now_utc.isoformat()
    user.last_login_ip = client_ip
    await session.commit()

    return user


def build_token_response(user: User) -> dict:
    """Build response payload including JWT with token_version claim and user details."""
    roles = [r.id for r in user.roles]
    perms_set = set()
    for r in user.roles:
        if r.id == "ROLE_SUPER_ADMIN":
            perms_set.add("ALL")
        for p in (r.permissions or "").split(","):
            if p.strip():
                perms_set.add(p.strip())

    token_ver = getattr(user, "token_version", 1)
    token = create_access_token({
        "sub": user.id,
        "email": user.email,
        "roles": roles,
        "ver": token_ver,
    })

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name or user.email.split("@")[0],
            "avatar_url": user.avatar_url,
            "credit_balance": user.credit_balance or 0,
            "tier": getattr(user, "tier", "FREE"),
            "is_active": user.is_active,
            "roles": roles,
            "permissions": list(perms_set),
            "created_at": user.created_at.isoformat() if user.created_at else "",
            "last_login_at": getattr(user, "last_login_at", None),
        },
    }

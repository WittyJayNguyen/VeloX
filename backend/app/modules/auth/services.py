"""VeloX AI Gateway — Auth Service"""
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status
from app.modules.users.models import User, Role, user_roles
from app.core.security import hash_password, verify_password, create_access_token


async def register_user(session: AsyncSession, email: str, password: str, full_name: str) -> User:
    existing = await session.execute(select(User).where(User.email == email))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email already registered")

    user = User(
        email=email,
        password_hash=hash_password(password),
        full_name=full_name,
    )
    # Always assign ROLE_USER to self-registered users
    role = await session.execute(select(Role).where(Role.id == "ROLE_USER"))
    user_role = role.scalar_one_or_none()
    if user_role:
        user.roles.append(user_role)

    session.add(user)
    await session.flush()
    return user


async def authenticate_user(session: AsyncSession, email: str, password: str) -> User:
    result = await session.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()
    if not user or not verify_password(password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account is deactivated")
    return user


def build_token_response(user: User) -> dict:
    roles = [r.id for r in user.roles]
    token = create_access_token({"sub": user.id, "roles": roles})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "avatar_url": user.avatar_url,
            "is_active": user.is_active,
            "roles": roles,
            "created_at": user.created_at.isoformat() if user.created_at else "",
        },
    }

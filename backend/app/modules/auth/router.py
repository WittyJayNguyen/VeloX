"""VeloX AI Gateway — Auth Router"""
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.security import get_current_user_id
from app.modules.users.schemas import LoginRequest, RegisterRequest, TokenResponse
from app.modules.auth.services import register_user, authenticate_user, build_token_response
from app.common.responses import ok

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=dict)
async def register(body: RegisterRequest, db: AsyncSession = Depends(get_db)):
    user = await register_user(db, body.email, body.password, body.full_name)
    return ok(data=build_token_response(user), message="Registration successful")


@router.post("/login", response_model=dict)
async def login(body: LoginRequest, db: AsyncSession = Depends(get_db)):
    user = await authenticate_user(db, body.email, body.password)
    return ok(data=build_token_response(user), message="Login successful")


@router.get("/me", response_model=dict)
async def get_me(user_id: str = Depends(get_current_user_id)):
    return ok(data={"user_id": user_id})

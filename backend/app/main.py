"""
VeloX AI Gateway — Main Application Entry Point
=================================================
FastAPI App Factory with CORS, Router Registration and Lifespan Events.
"""
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import get_settings
from app.modules.auth.router import router as auth_router
from app.modules.users.router import router as users_router
from app.core.database import engine
from app.common.base_model import Base
import app.modules.users.models  # noqa
import app.modules.billing.models  # noqa

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Auto initialize DB tables
    print(f"[START] {settings.APP_NAME} v{settings.APP_VERSION} starting...")
    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        print("[DB] Database tables initialized successfully")
    except Exception as e:
        print(f"[WARN] Database initialization warning: {e}")
    yield
    # Shutdown: close connections, flush logs
    print(f"[STOP] {settings.APP_NAME} shutting down...")


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="AI Reverse Proxy & Aggregator Gateway",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register Module Routers
app.include_router(auth_router, prefix="/api/v1")
app.include_router(users_router, prefix="/api/v1")


@app.get("/api/v1/health")
async def health_check():
    return {"status": "healthy", "app": settings.APP_NAME, "version": settings.APP_VERSION}

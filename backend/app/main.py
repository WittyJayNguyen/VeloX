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

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: could initialize DB tables, seed data, start cron jobs
    print(f"🚀 {settings.APP_NAME} v{settings.APP_VERSION} starting...")
    yield
    # Shutdown: close connections, flush logs
    print(f"🛑 {settings.APP_NAME} shutting down...")


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


@app.get("/api/v1/health")
async def health_check():
    return {"status": "healthy", "app": settings.APP_NAME, "version": settings.APP_VERSION}

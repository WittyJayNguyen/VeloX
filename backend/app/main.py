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
import app.modules.pools.models  # noqa
import app.modules.models_catalog.models  # noqa
import app.modules.logs.models  # noqa
import app.modules.developers.models  # noqa
import app.modules.accounting.models  # noqa
from app.modules.pools.router import router as pools_router
from app.modules.models_catalog.router import router as models_router
from app.modules.playground.router import router as playground_router
from app.modules.developers.router import router as developers_router
from app.modules.logs.router import router as logs_router
from app.modules.proxy.router import router as proxy_router
from app.modules.accounting.router import router as accounting_router
from app.modules.pools.seed import seed_gateway_data

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Auto initialize DB tables
    print(f"[START] {settings.APP_NAME} v{settings.APP_VERSION} starting...")
    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
            def ensure_config_column(sync_conn):
                from sqlalchemy import inspect, text
                inspector = inspect(sync_conn)
                if "ai_models" in inspector.get_table_names():
                    cols = [c["name"] for c in inspector.get_columns("ai_models")]
                    if "config" not in cols:
                        sync_conn.execute(text("ALTER TABLE ai_models ADD COLUMN config TEXT DEFAULT '{}'"))
                        print("[DB] Added 'config' column to ai_models")
            await conn.run_sync(ensure_config_column)
        print("[DB] Database tables initialized successfully")
        
        # Auto-migrate columns and seed default roles / super admin / gateway defaults
        from app.core.database import async_session
        from app.modules.users.router import seed_defaults
        from app.modules.models_catalog.seed import seed_default_models
        async with async_session() as db:
            await seed_defaults(db)
            await seed_gateway_data(db)
            await seed_default_models(db)
        print("[DB] Default roles, Super Admin, Gateway data, and Models Catalog verified")
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
app.include_router(pools_router, prefix="/api/v1")
app.include_router(models_router, prefix="/api/v1")
app.include_router(playground_router, prefix="/api/v1")
app.include_router(developers_router, prefix="/api/v1")
app.include_router(logs_router, prefix="/api/v1")
app.include_router(accounting_router, prefix="/api/v1")
app.include_router(proxy_router)


@app.get("/api/v1/health")
async def health_check():
    return {"status": "healthy", "app": settings.APP_NAME, "version": settings.APP_VERSION}

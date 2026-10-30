"""
VeloX AI Gateway — Main Application Entry Point
=================================================
FastAPI App Factory with CORS, Router Registration and Lifespan Events.
"""
from typing import Optional
from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.config import get_settings
from app.core.database import engine, get_db
from app.common.base_model import Base
from app.modules.auth.router import router as auth_router
from app.modules.users.router import router as users_router
import app.modules.users.models  # noqa
import app.modules.billing.models  # noqa
import app.modules.pools.models  # noqa
import app.modules.models_catalog.models  # noqa
import app.modules.logs.models  # noqa
import app.modules.developers.models  # noqa
import app.modules.accounting.models  # noqa
import app.modules.system.models  # noqa
from app.modules.pools.router import router as pools_router
from app.modules.models_catalog.router import router as models_router
from app.modules.playground.router import router as playground_router
from app.modules.developers.router import router as developers_router
from app.modules.logs.router import router as logs_router
from app.modules.proxy.router import router as proxy_router
from app.modules.accounting.router import router as accounting_router
from app.modules.billing.router import router as billing_router
from app.modules.studio.router import router as studio_router
from app.modules.system.router import router as system_router, get_or_create_system_setting
from app.modules.pools.seed import seed_gateway_data

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Auto initialize DB tables
    print(f"[START] {settings.APP_NAME} v{settings.APP_VERSION} starting...")
    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
            def ensure_table_columns(sync_conn):
                from sqlalchemy import inspect, text
                inspector = inspect(sync_conn)
                tables = inspector.get_table_names()
                if "ai_models" in tables:
                    cols = [c["name"] for c in inspector.get_columns("ai_models")]
                    if "config" not in cols:
                        sync_conn.execute(text("ALTER TABLE ai_models ADD COLUMN config TEXT DEFAULT '{}'"))
                        print("[DB] Added 'config' column to ai_models")
                if "credit_packages" in tables:
                    cols = [c["name"] for c in inspector.get_columns("credit_packages")]
                    for col_name, col_type, col_def in [
                        ("category", "VARCHAR(32)", "'PRO'"),
                        ("description", "VARCHAR(255)", "''"),
                        ("original_price_vnd", "NUMERIC(12, 0)", "0"),
                        ("features", "VARCHAR(2000)", "'[]'"),
                        ("tag_badge", "VARCHAR(64)", "''"),
                        ("sort_order", "INTEGER", "0"),
                    ]:
                        if col_name not in cols:
                            sync_conn.execute(text(f"ALTER TABLE credit_packages ADD COLUMN {col_name} {col_type} DEFAULT {col_def}"))
                            print(f"[DB] Added '{col_name}' column to credit_packages")
                if "users" in tables:
                    cols = [c["name"] for c in inspector.get_columns("users")]
                    if "user_code" not in cols:
                        sync_conn.execute(text("ALTER TABLE users ADD COLUMN user_code VARCHAR(32)"))
                        print("[DB] Added 'user_code' column to users")
                    for col_name, col_type, col_def in [
                        ("auth_provider", "VARCHAR(32)", "'LOCAL'"),
                        ("google_id", "VARCHAR(128)", "NULL"),
                        ("telegram_id", "VARCHAR(128)", "NULL"),
                        ("telegram_username", "VARCHAR(128)", "NULL"),
                    ]:
                        if col_name not in cols:
                            sync_conn.execute(text(f"ALTER TABLE users ADD COLUMN {col_name} {col_type} DEFAULT {col_def}"))
                            print(f"[DB] Added '{col_name}' column to users")
                    rows = sync_conn.execute(text("SELECT id, user_code FROM users ORDER BY created_at ASC")).fetchall()
                    current_num = 10001
                    for r in rows:
                        uid, ucode = r[0], r[1]
                        if not ucode:
                            sync_conn.execute(text(f"UPDATE users SET user_code = '{current_num}' WHERE id = '{uid}'"))
                            current_num += 1
                        else:
                            try:
                                n = int(ucode)
                                if n >= current_num:
                                    current_num = n + 1
                            except ValueError:
                                pass
                if "system_settings" in tables:
                    cols = [c["name"] for c in inspector.get_columns("system_settings")]
                    for col_name, col_type in [
                        ("google_client_id", "VARCHAR(255)"),
                        ("google_client_secret", "VARCHAR(255)"),
                        ("telegram_bot_username", "VARCHAR(128)"),
                        ("telegram_bot_token", "VARCHAR(255)"),
                    ]:
                        if col_name not in cols:
                            sync_conn.execute(text(f"ALTER TABLE system_settings ADD COLUMN {col_name} {col_type} DEFAULT NULL"))
                            print(f"[DB] Added '{col_name}' column to system_settings")
            await conn.run_sync(ensure_table_columns)
        print("[DB] Database tables initialized successfully")
        
        # Auto-migrate columns and seed default roles / super admin / gateway defaults / packages
        from app.core.database import async_session
        from app.modules.users.router import seed_defaults
        from app.modules.models_catalog.seed import seed_default_models
        from app.modules.billing.seed import seed_default_packages
        from app.modules.system.router import seed_default_translations, seed_default_landing_sections
        async with async_session() as db:
            await seed_defaults(db)
            await seed_gateway_data(db)
            await seed_default_models(db)
            await seed_default_packages(db)
            await get_or_create_system_setting(db)
            await seed_default_translations(db)
            await seed_default_landing_sections(db)
        print("[DB] Default roles, Super Admin, Gateway data, Models Catalog, Credit Packages, System Settings, Multilingual Translations and Landing Sections verified")
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
app.include_router(billing_router, prefix="/api/v1")
app.include_router(studio_router, prefix="/api/v1")
app.include_router(system_router, prefix="/api/v1")
app.include_router(proxy_router)


@app.get("/api/v1/health")
async def health_check():
    return {"status": "healthy", "app": settings.APP_NAME, "version": settings.APP_VERSION}


@app.get("/pricing")
@app.get("/v1/pricing")
@app.get("/api/v1/pricing")
async def api_pricing_alias(
    model: Optional[str] = None,
    category: Optional[str] = None,
    currency: Optional[str] = "VND",
    db: AsyncSession = Depends(get_db),
):
    from app.modules.proxy.router import get_model_pricing
    return await get_model_pricing(model=model, category=category, currency=currency, db=db)


@app.post("/webhook/sepay")
@app.post("/api/webhook/sepay")
@app.post("/api/v1/webhook/sepay")
async def sepay_webhook_root_alias(request: Request, db: AsyncSession = Depends(get_db)):
    """Allow multiple SePay webhook URL patterns without requiring strict subpath."""
    from app.modules.billing.router import sepay_webhook
    return await sepay_webhook(request, db)


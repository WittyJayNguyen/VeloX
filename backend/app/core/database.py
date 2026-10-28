"""VeloX AI Gateway — Async Database Engine (SQLAlchemy 2.0)"""
from sqlalchemy import event
from sqlalchemy.ext.asyncio import (
    create_async_engine,
    AsyncSession,
    async_sessionmaker,
)
from app.core.config import get_settings

settings = get_settings()

engine_kwargs = {"echo": settings.DEBUG}
if settings.DATABASE_URL.startswith("sqlite"):
    engine_kwargs.update({
        "connect_args": {"timeout": 60.0},
    })
else:
    engine_kwargs.update({"pool_size": 20, "max_overflow": 10})

engine = create_async_engine(
    settings.DATABASE_URL,
    **engine_kwargs
)

# Enable SQLite WAL mode and 60s busy timeout on every connection
if "sqlite" in settings.DATABASE_URL:
    @event.listens_for(engine.sync_engine, "connect")
    def set_sqlite_pragma(dbapi_connection, connection_record):
        try:
            cursor = dbapi_connection.cursor()
            cursor.execute("PRAGMA journal_mode=WAL")
            cursor.execute("PRAGMA synchronous=NORMAL")
            cursor.execute("PRAGMA busy_timeout=60000")
            cursor.close()
        except Exception:
            pass

async_session = async_sessionmaker(
    engine, class_=AsyncSession, expire_on_commit=False
)


async def get_db():
    """Dependency: yields an async DB session, auto-closes after request."""
    async with async_session() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise

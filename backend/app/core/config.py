"""VeloX AI Gateway — Core Configuration (Pydantic Settings)"""
from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # App
    APP_NAME: str = "VeloX AI Gateway"
    APP_VERSION: str = "0.1.0"
    DEBUG: bool = True

    # Database: SQLite fallback for local development or PostgreSQL in production
    DATABASE_URL: str = "sqlite+aiosqlite:///./velox.db"

    # JWT Auth
    JWT_SECRET_KEY: str = "velox-super-secret-key-change-in-production"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRATION_MINUTES: int = 1440  # 24 hours

    # CORS
    CORS_ORIGINS: list[str] = ["http://localhost:5173", "http://localhost:3000", "*"]

    # CDN & Zero-Disk Storage Settings
    CDN_PROVIDER: str = "auto"
    CDN_API_KEY: str = ""
    # SePay Banking Webhook Security
    SEPAY_API_KEY: str = "OLKS3CIEFSEC5YAGJF2ZLAOYKNYDCJOGJXR95TVMAX46T9RTUIQL2BKEQS4FCOVU"
    USER_JOB_RETENTION_LIMIT: int = 50  # Cap maximum job history records per user to preserve server disk

    # Social Auth & SSO (Google & Telegram)
    GOOGLE_CLIENT_ID: str = ""
    GOOGLE_CLIENT_SECRET: str = ""
    TELEGRAM_BOT_TOKEN: str = ""
    TELEGRAM_BOT_USERNAME: str = ""

    class Config:
        env_file = ".env"
        case_sensitive = True


@lru_cache()
def get_settings() -> Settings:
    return Settings()

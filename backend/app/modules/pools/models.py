"""VeloX AI Gateway — Pool, Credential & Recaptcha Models"""
import uuid
from sqlalchemy import Column, String, Boolean, Integer, Float, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.common.base_model import Base, TimestampMixin


def generate_uuid() -> str:
    return str(uuid.uuid4())


class ServicePool(Base, TimestampMixin):
    __tablename__ = "service_pools"

    id = Column(String(64), primary_key=True, default=generate_uuid)
    name = Column(String(128), nullable=False)
    provider = Column(String(64), nullable=False)       # OpenAI, Anthropic, Google, DeepSeek, Midjourney, Runway, etc.
    base_url = Column(String(255), nullable=False)
    auth_type = Column(String(32), default="HYBRID")     # API_KEY | TOKEN_ACCOUNT | HYBRID
    routing_strategy = Column(String(32), default="LEAST_USED")  # ROUND_ROBIN | PRIORITY | LEAST_USED | WEIGHTED
    is_active = Column(Boolean, default=True)
    rate_limit_per_min = Column(Integer, default=1000)
    max_tokens_per_min = Column(Integer, nullable=True)
    timeout_ms = Column(Integer, default=30000)
    description = Column(Text, nullable=True)

    credentials = relationship(
        "ProviderCredential",
        back_populates="pool",
        cascade="all, delete-orphan",
        lazy="selectin"
    )


class ProviderCredential(Base, TimestampMixin):
    __tablename__ = "provider_credentials"

    id = Column(String(64), primary_key=True, default=generate_uuid)
    pool_id = Column(String(64), ForeignKey("service_pools.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(128), nullable=False)
    auth_type = Column(String(32), default="API_KEY")    # API_KEY | SESSION_TOKEN
    key_val = Column(Text, nullable=False)
    recap_token = Column(Text, nullable=True)
    cookies = Column(Text, nullable=True)
    metadata_json = Column(Text, nullable=True)
    quota_daily = Column(Integer, default=10000)
    quota_daily_used = Column(Integer, default=0)
    quota_monthly = Column(Integer, default=250000)
    quota_monthly_used = Column(Integer, default=0)
    points = Column(Integer, default=0)
    priority = Column(Integer, default=8)                # 1 - 10
    plan_badge = Column(String(32), default="Pro")       # Free | Plus | Pro | Team | Enterprise
    status = Column(String(32), default="ACTIVE")        # ACTIVE | PAUSED | QUOTA_EXCEEDED | ERROR
    requests_count = Column(Integer, default=0)
    detected_models = Column(Text, default="[]")         # JSON list: ["gpt-4o", "gpt-4o-mini"]
    last_checked_at = Column(DateTime(timezone=True), nullable=True)
    quota_remaining_usd = Column(Float, nullable=True)
    notes = Column(Text, nullable=True)

    pool = relationship("ServicePool", back_populates="credentials")

    def record_usage(self, units: int = 1) -> None:
        """Atomically updates daily/monthly quota usage, request count, and status on this provider credential."""
        from datetime import datetime, timezone
        now = datetime.now(timezone.utc)
        if self.last_checked_at:
            try:
                last_dt = self.last_checked_at
                if isinstance(last_dt, str):
                    last_dt = datetime.fromisoformat(last_dt)
                if last_dt.date() < now.date():
                    self.quota_daily_used = 0
                if last_dt.year < now.year or last_dt.month < now.month:
                    self.quota_monthly_used = 0
            except Exception:
                pass
        self.quota_daily_used = (self.quota_daily_used or 0) + units
        self.quota_monthly_used = (self.quota_monthly_used or 0) + units
        self.requests_count = (self.requests_count or 0) + 1
        self.last_checked_at = now

        if self.quota_daily and self.quota_daily_used >= self.quota_daily:
            self.status = "QUOTA_EXCEEDED"
        elif self.quota_monthly and self.quota_monthly_used >= self.quota_monthly:
            self.status = "QUOTA_EXCEEDED"


class RecaptchaSolver(Base, TimestampMixin):
    __tablename__ = "recaptcha_solvers"

    id = Column(String(64), primary_key=True, default=generate_uuid)
    name = Column(String(128), nullable=False)
    provider = Column(String(64), nullable=False)        # 2Captcha | CapSolver | Anti-Captcha | EzCaptcha | CustomNode
    api_key = Column(String(255), nullable=False)
    supported_types = Column(Text, default="[]")         # JSON list: ["Recaptcha v2", "Turnstile"]
    balance_usd = Column(Float, default=0.0)
    avg_solve_time_sec = Column(Float, default=3.0)
    solved_count = Column(Integer, default=0)
    success_rate_pct = Column(Float, default=99.0)
    timeout_sec = Column(Integer, default=30)
    assigned_accounts_count = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)

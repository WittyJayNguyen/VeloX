"""VeloX AI Gateway — Audit Logs Models"""
from sqlalchemy import Column, String, Integer, Numeric, Text, ForeignKey
from app.common.base_model import Base, UUIDMixin, TimestampMixin


class ApiCallLog(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "api_call_logs"
    user_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"))
    model_id = Column(String(64), ForeignKey("ai_models.id", ondelete="SET NULL"))
    credential_id = Column(String(36), ForeignKey("provider_credentials.id", ondelete="SET NULL"))
    prompt_tokens = Column(Integer, default=0)
    completion_tokens = Column(Integer, default=0)
    total_credits_charged = Column(Numeric(12, 4), nullable=False)
    duration_ms = Column(Integer, nullable=False)
    status_code = Column(Integer, nullable=False)
    ip_address = Column(String(45))


class MediaGenerationLog(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "media_generation_logs"
    user_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"))
    model_id = Column(String(64), ForeignKey("ai_models.id", ondelete="SET NULL"))
    media_type = Column(String(16), nullable=False)     # IMAGE, VIDEO
    prompt = Column(Text, nullable=False)
    output_url = Column(Text)
    credits_charged = Column(Numeric(12, 4), nullable=False)
    render_seconds = Column(Numeric(8, 2))

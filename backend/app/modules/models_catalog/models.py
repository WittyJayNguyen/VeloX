"""VeloX AI Gateway — AI Model Catalog"""
from sqlalchemy import Column, String, Boolean, Numeric, ForeignKey
from sqlalchemy.orm import relationship
from app.common.base_model import Base, UUIDMixin, TimestampMixin


class AIModel(Base, TimestampMixin):
    __tablename__ = "ai_models"
    id = Column(String(64), primary_key=True)           # 'gpt-4o', 'flux-pro'
    provider_id = Column(String(64), ForeignKey("providers.id", ondelete="RESTRICT"), nullable=False)
    display_name = Column(String(128), nullable=False)
    category = Column(String(32), nullable=False)       # CHAT, IMAGE, VIDEO
    unit_type = Column(String(32), nullable=False)      # PER_1K_TOKENS, PER_IMAGE, PER_SECOND
    cost_price_usd = Column(Numeric(10, 6), nullable=False)
    selling_price_credits = Column(Numeric(12, 4), nullable=False)
    profit_margin_percent = Column(Numeric(6, 2), nullable=False)
    is_available = Column(Boolean, default=True)


class ModelCredentialMapping(Base, UUIDMixin):
    __tablename__ = "model_credential_mappings"
    model_id = Column(String(64), ForeignKey("ai_models.id", ondelete="CASCADE"), nullable=False)
    credential_id = Column(String(36), ForeignKey("provider_credentials.id", ondelete="CASCADE"), nullable=False)
    account_cost_price = Column(Numeric(10, 6))
    is_active = Column(Boolean, default=True)

"""VeloX AI Gateway — Pool & Credential Models"""
from sqlalchemy import Column, String, Boolean, Integer, Numeric, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.common.base_model import Base, UUIDMixin, TimestampMixin


class Provider(Base):
    __tablename__ = "providers"
    id = Column(String(64), primary_key=True)           # 'openai', 'anthropic'
    name = Column(String(128), nullable=False)
    website = Column(String(255))
    is_active = Column(Boolean, default=True)
    credentials = relationship("ProviderCredential", back_populates="provider")


class ServicePool(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "service_pools"
    name = Column(String(128), nullable=False)
    category = Column(String(32), nullable=False)       # CHAT, IMAGE, VIDEO, DEV_REQ
    min_active_keys = Column(Integer, default=2)
    routing_strategy = Column(String(32), default="LEAST_USED")
    is_active = Column(Boolean, default=True)
    credentials = relationship("ProviderCredential", back_populates="pool")


class ProviderCredential(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "provider_credentials"
    pool_id = Column(String(36), ForeignKey("service_pools.id", ondelete="SET NULL"))
    provider_id = Column(String(64), ForeignKey("providers.id", ondelete="CASCADE"), nullable=False)
    auth_type = Column(String(32), nullable=False)      # API_KEY | TOKEN_ACCOUNT
    credential_identifier = Column(String(128))
    secret_value = Column(String(2048), nullable=False)
    balance_limit = Column(Numeric(14, 4))
    balance_remaining = Column(Numeric(14, 4))
    error_count = Column(Integer, default=0)
    is_healthy = Column(Boolean, default=True)
    last_checked_at = Column(DateTime(timezone=True))
    pool = relationship("ServicePool", back_populates="credentials")
    provider = relationship("Provider", back_populates="credentials")

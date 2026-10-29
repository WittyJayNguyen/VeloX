"""
VeloX AI Gateway — Developer API Keys Model (Production Enterprise)
===================================================================
Enables developers to issue personal API keys to consume VeloX Gateway models.
Keys are hashed with SHA-256 (never stored in plain text).
"""
from sqlalchemy import Column, String, Boolean, Integer, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.common.base_model import Base, UUIDMixin, TimestampMixin


class UserApiKey(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "user_api_keys"

    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(100), nullable=False)
    key_prefix = Column(String(16), nullable=False)                 # e.g. "sk-velox-9f8a..."
    key_hash = Column(String(64), unique=True, nullable=False, index=True)  # SHA-256 hex digest
    is_active = Column(Boolean, default=True, nullable=False)
    rate_limit_per_min = Column(Integer, default=60, nullable=False)
    total_requests = Column(Integer, default=0, nullable=False)
    last_used_at = Column(DateTime(timezone=True), nullable=True)

    # Relationship back to User
    user = relationship("User", back_populates="api_keys", lazy="selectin")

    def record_usage(self) -> None:
        """Updates total requests count and last used timestamp."""
        from datetime import datetime, timezone
        self.total_requests = (self.total_requests or 0) + 1
        self.last_used_at = datetime.now(timezone.utc)

"""VeloX AI Gateway — Common Base Model (Reusable for all modules)"""
import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, DateTime, String
from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    """All SQLAlchemy models inherit from this base."""
    pass


class TimestampMixin:
    """Mixin: auto-populates created_at and updated_at."""
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc),
                        onupdate=lambda: datetime.now(timezone.utc), nullable=False)


class UUIDMixin:
    """Mixin: UUID v4 primary key."""
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))

"""
System Settings & Notifications Models
"""
import uuid
from datetime import datetime
from sqlalchemy import Column, String, Text, Boolean, DateTime
from app.common.base_model import Base


class SystemSetting(Base):
    __tablename__ = "system_settings"

    id = Column(String(64), primary_key=True, default="default")
    site_name = Column(String(128), default="VeloX AI Gateway", nullable=False)
    site_title = Column(String(255), default="VeloX — AI Studio & Gateway", nullable=False)
    brand_logo_url = Column(Text, nullable=True)
    favicon_url = Column(Text, nullable=True)
    site_desc = Column(Text, default="Nền tảng trung gian AI Gateway thế hệ mới", nullable=False)
    default_lang = Column(String(16), default="vi", nullable=False)
    maintenance_mode = Column(Boolean, default=False, nullable=False)
    maintenance_message = Column(
        Text,
        default="Hệ thống đang trong thời gian bảo trì nâng cấp. Mọi tiến trình AI và API tạm dừng. Vui lòng quay lại sau!",
        nullable=False,
    )
    auto_backup = Column(Boolean, default=True, nullable=False)
    email_notif = Column(Boolean, default=True, nullable=False)
    webhook_url = Column(String(512), nullable=True)
    google_client_id = Column(String(255), nullable=True)
    google_client_secret = Column(String(255), nullable=True)
    telegram_bot_username = Column(String(128), nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class SystemNotification(Base):
    __tablename__ = "system_notifications"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    type = Column(String(32), default="info", nullable=False)  # info, warning, danger, success
    is_broadcast = Column(Boolean, default=True, nullable=False)
    user_id = Column(String(36), nullable=True)  # None = broadcast all
    is_read = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

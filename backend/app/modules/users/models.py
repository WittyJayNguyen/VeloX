"""VeloX AI Gateway — User, Role & Audit Models (Production Grade)"""
from sqlalchemy import Column, String, Boolean, Integer, ForeignKey, Table, Text
from sqlalchemy.orm import relationship
from app.common.base_model import Base, UUIDMixin, TimestampMixin
import app.modules.billing.models  # ensure UserWallet mapper is registered

# Many-to-Many: User <-> Role
user_roles = Table(
    "user_roles", Base.metadata,
    Column("user_id", String(36), ForeignKey("users.id", ondelete="CASCADE"), primary_key=True),
    Column("role_id", String(32), ForeignKey("roles.id", ondelete="RESTRICT"), primary_key=True),
)


class Role(Base):
    __tablename__ = "roles"
    id = Column(String(32), primary_key=True)          # 'ROLE_SUPER_ADMIN', 'ROLE_ADMIN', 'ROLE_OPERATOR', 'ROLE_USER'
    name = Column(String(64), nullable=False)
    description = Column(String(255))
    permissions = Column(String(2048), default="")     # Comma-separated list of permissions
    users = relationship("User", secondary=user_roles, back_populates="roles")


class User(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "users"
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    full_name = Column(String(128))
    avatar_url = Column(String(512))
    credit_balance = Column(Integer, default=100, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    is_verified = Column(Boolean, default=False, nullable=False)

    # Production Security & Ops Fields
    tier = Column(String(32), default="FREE", nullable=False)          # 'FREE', 'PRO', 'ENTERPRISE'
    failed_login_attempts = Column(Integer, default=0, nullable=False)
    locked_until = Column(String(64), nullable=True)                  # ISO timestamp if temporarily locked
    last_login_at = Column(String(64), nullable=True)
    last_login_ip = Column(String(64), nullable=True)
    token_version = Column(Integer, default=1, nullable=False)

    roles = relationship("Role", secondary=user_roles, back_populates="users", lazy="selectin")
    wallet = relationship("UserWallet", uselist=False, back_populates="user", cascade="all, delete-orphan", lazy="selectin")
    credit_logs = relationship("CreditAuditLog", back_populates="user", cascade="all, delete-orphan", lazy="selectin")
    audit_logs = relationship("UserAuditLog", back_populates="target_user", cascade="all, delete-orphan", lazy="selectin")


class CreditAuditLog(Base, UUIDMixin, TimestampMixin):
    """Immutable ledger of all credit balance changes (audit trail)."""
    __tablename__ = "credit_audit_logs"

    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    actor_id = Column(String(36), nullable=True)                      # Admin who executed change
    actor_email = Column(String(255), nullable=True)
    delta = Column(Integer, nullable=False)                           # e.g. +50000 or -20000
    balance_before = Column(Integer, nullable=False)
    balance_after = Column(Integer, nullable=False)
    reason = Column(String(512), nullable=False)
    ip_address = Column(String(64), nullable=True)

    user = relationship("User", back_populates="credit_logs")


class UserAuditLog(Base, UUIDMixin, TimestampMixin):
    """Security audit log for tracking all sensitive admin operations on users."""
    __tablename__ = "user_audit_logs"

    target_user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    actor_id = Column(String(36), nullable=True)
    actor_email = Column(String(255), nullable=True)
    action = Column(String(64), nullable=False)                      # CREATE, UPDATE, ROLE_CHANGE, CREDIT_ADJUST, STATUS_CHANGE, PASSWORD_RESET, DELETE
    details = Column(Text, nullable=True)                             # JSON diff / summary
    reason = Column(String(512), nullable=True)
    ip_address = Column(String(64), nullable=True)

    target_user = relationship("User", back_populates="audit_logs")


class IPAccessRule(Base, UUIDMixin, TimestampMixin):
    """
    IP Threat, Guest & Free Quota Abuse Control:
    Tracks client IP addresses, detects guest free-quota farming, and enforces bans.
    """
    __tablename__ = "ip_access_rules"

    ip_address = Column(String(64), unique=True, nullable=False, index=True)
    status = Column(String(32), default="BANNED", nullable=False)          # 'BANNED', 'SUSPICIOUS', 'WHITELISTED'
    reason = Column(String(512), nullable=False)                           # e.g. "Spam tạo tài khoản để bào free credits"
    action_type = Column(String(32), default="BLOCK_ALL", nullable=False)  # 'BLOCK_ALL', 'BLOCK_REGISTER', 'REVOKE_FREE'
    banned_by = Column(String(255), default="Hệ thống", nullable=False)
    banned_until = Column(String(64), nullable=True)                       # ISO timestamp or null for permanent
    notes = Column(Text, nullable=True)


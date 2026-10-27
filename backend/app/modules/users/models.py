"""VeloX AI Gateway — User & Role Models"""
from sqlalchemy import Column, String, Boolean, Integer, ForeignKey, Table
from sqlalchemy.orm import relationship
from app.common.base_model import Base, UUIDMixin, TimestampMixin

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
    credit_balance = Column(Integer, default=50000, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    is_verified = Column(Boolean, default=False, nullable=False)
    roles = relationship("Role", secondary=user_roles, back_populates="users", lazy="selectin")
    wallet = relationship("UserWallet", uselist=False, back_populates="user", lazy="selectin")

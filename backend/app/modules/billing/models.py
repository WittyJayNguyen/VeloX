"""VeloX AI Gateway — Billing Models (Wallet, Packages, Transactions)"""
from sqlalchemy import Column, String, Boolean, Integer, Numeric, ForeignKey
from sqlalchemy.orm import relationship
from app.common.base_model import Base, UUIDMixin, TimestampMixin


class UserWallet(Base, TimestampMixin):
    __tablename__ = "user_wallets"
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    balance_credits = Column(Numeric(14, 4), default=0, nullable=False)
    total_deposited = Column(Numeric(14, 4), default=0, nullable=False)
    total_spent = Column(Numeric(14, 4), default=0, nullable=False)
    user = relationship("User", back_populates="wallet")


class CreditPackage(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "credit_packages"
    name = Column(String(128), nullable=False)
    category = Column(String(32), default="PRO", nullable=True)  # STARTER, PRO, ENTERPRISE, DEV, TOPUP
    description = Column(String(255), nullable=True)
    price_vnd = Column(Numeric(12, 0), nullable=False)
    original_price_vnd = Column(Numeric(12, 0), nullable=True)
    credits_given = Column(Numeric(14, 4), nullable=False)
    bonus_percentage = Column(Integer, default=0)
    features = Column(String(2000), nullable=True)  # JSON-encoded array of feature strings
    tag_badge = Column(String(64), nullable=True)
    is_popular = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    sort_order = Column(Integer, default=0)


class PaymentTransaction(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "payment_transactions"
    transaction_code = Column(String(64), unique=True, nullable=False)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=True)
    package_id = Column(String(36), ForeignKey("credit_packages.id", ondelete="SET NULL"))
    amount_vnd = Column(Numeric(12, 0), nullable=False)
    credits_credited = Column(Numeric(14, 4), nullable=False)
    payment_gateway = Column(String(32), nullable=False)   # BANK_TRANSFER, MOMO, STRIPE
    status = Column(String(32), default="PENDING", nullable=False)


class BankAccount(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "bank_accounts"
    bank_name = Column(String(128), nullable=False)        # VD: MBBank, Vietcombank, Techcombank
    bank_code = Column(String(32), nullable=False)         # VD: MB, VCB, TCB
    account_number = Column(String(64), nullable=False)    # Số tài khoản
    account_holder = Column(String(128), nullable=False)   # Tên chủ tài khoản
    branch = Column(String(128), nullable=True)            # Chi nhánh
    is_default = Column(Boolean, default=False)
    qr_enabled = Column(Boolean, default=True)
    is_active = Column(Boolean, default=True)


"""
VeloX AI Gateway — Accounting Models (Asset Valuation, Expenses & COGS)
=======================================================================
Tracks capital expenditure for purchasing AI accounts, depositing into upstream
providers, and calculating depreciation and Gross/Net profit.
"""
from sqlalchemy import Column, String, Integer, BigInteger, Numeric, Text, ForeignKey
from app.common.base_model import Base, UUIDMixin, TimestampMixin


class ExpenseEntry(Base, UUIDMixin, TimestampMixin):
    """
    Sổ kế toán chi phí (Mua Account Muse/OpenAI, Nạp tiền ví NCC, Thuê Proxy/Server).
    """
    __tablename__ = "accounting_expenses"

    entry_code = Column(String(32), unique=True, nullable=False, index=True) # e.g. "EXP-202610-001"
    category = Column(String(32), nullable=False) # ACCOUNT_PURCHASE, PROVIDER_TOPUP, CAPTCHA_SOLVER, PROXY_NETWORK, SERVER_INFRA, OTHER
    title = Column(String(255), nullable=False)
    amount_vnd = Column(Numeric(14, 2), nullable=False)
    amount_usd = Column(Numeric(10, 2), nullable=True)
    provider = Column(String(64), nullable=False) # Meta AI, OpenAI, 2Captcha, AWS, Proxy6...
    account_count = Column(Integer, default=0) # Số acc đã mua trong đợt này
    tokens_capacity = Column(BigInteger, default=0) # Dung lượng token đã nhập (vd: 155_000_000_000)
    depreciation_method = Column(String(32), default="TOKEN_CONSUMPTION") # TOKEN_CONSUMPTION, STRAIGHT_LINE, PER_REQUEST
    depreciated_amount_vnd = Column(Numeric(14, 2), default=0.0) # Giá vốn đã phân bổ / khấu hao (COGS)
    remaining_value_vnd = Column(Numeric(14, 2), default=0.0) # Giá trị tài sản còn lại trong kho
    invoice_code = Column(String(64), nullable=True)
    notes = Column(Text, nullable=True)
    status = Column(String(32), default="COMPLETED") # COMPLETED, PENDING, CANCELLED
    created_by = Column(String(36), nullable=True)

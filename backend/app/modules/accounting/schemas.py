"""
VeloX AI Gateway — Accounting Schemas (Pydantic DTOs)
=====================================================
"""
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class ExpenseCreateRequest(BaseModel):
    category: str = Field(..., description="ACCOUNT_PURCHASE, PROVIDER_TOPUP, CAPTCHA_SOLVER, PROXY_NETWORK, SERVER_INFRA, OTHER")
    title: str = Field(..., min_length=2, max_length=255)
    amount_vnd: float = Field(..., gt=0, description="Số tiền chi (VND)")
    amount_usd: Optional[float] = Field(None, ge=0)
    provider: str = Field(..., description="Meta AI, OpenAI, 2Captcha, AWS, Proxy6...")
    account_count: Optional[int] = Field(0, ge=0, description="Số lượng account nhập (nếu là mua acc)")
    tokens_capacity: Optional[int] = Field(0, ge=0, description="Tổng số token nhập (vd: 31000000000)")
    invoice_code: Optional[str] = Field(None, description="Mã hóa đơn / Mã đối soát giao dịch")
    notes: Optional[str] = None


class ExpenseResponse(BaseModel):
    id: str
    entry_code: str
    category: str
    title: str
    amount_vnd: float
    amount_usd: Optional[float] = None
    provider: str
    account_count: int
    tokens_capacity: int
    depreciated_amount_vnd: float
    remaining_value_vnd: float
    status: str
    invoice_code: Optional[str] = None
    notes: Optional[str] = None
    created_at: Optional[str] = None

    class Config:
        from_attributes = True


class ExpenseListResponse(BaseModel):
    items: List[ExpenseResponse]
    total: int
    total_amount_vnd: float


class AccountInventoryItem(BaseModel):
    provider: str
    name: str
    account_count: int
    total_tokens: int
    unit_cost_vnd: float
    total_cost_vnd: float
    used_cost_vnd: float
    remaining_value_vnd: float


class AccountingOverviewResponse(BaseModel):
    total_revenue_vnd: float           # Tổng doanh thu từ khách nạp tiền
    total_expense_vnd: float           # Tổng chi tiền mặt (Mua acc + Nạp ví NCC)
    cogs_depreciated_vnd: float        # Giá vốn dịch vụ đã tiêu hao (COGS)
    remaining_assets_vnd: float        # Giá trị tài sản còn lại trong kho
    gross_profit_vnd: float            # Lợi nhuận gộp = Doanh thu - COGS
    net_profit_vnd: float              # Lợi nhuận ròng = Doanh thu - Tổng chi
    gross_margin_pct: float            # Biên lợi nhuận gộp %
    roi_pct: float                     # Tỉ suất sinh lời trên vốn (ROI %)
    customer_liabilities_vnd: float    # Nợ phải trả khách hàng (Credits chưa tiêu)
    account_inventory: List[AccountInventoryItem] # Thống kê chi tiết kho acc
    category_breakdown: Dict[str, float]          # Cơ cấu chi phí theo danh mục


class CashFlowMovementItem(BaseModel):
    id: str
    code: str
    movement_type: str                 # "INFLOW" (Nạp tiền vào) | "OUTFLOW" (Chi mua/nạp)
    source: str                        # "BANK_TRANSFER", "WALLET", "SUPPLIER_PURCHASE"
    counterparty: str                  # Khách hàng nạp hoặc Nhà cung cấp nhận
    amount_vnd: float
    description: str
    status: str
    timestamp: str


class CashFlowStatementResponse(BaseModel):
    total_inflow_vnd: float
    total_outflow_vnd: float
    net_cashflow_vnd: float
    customer_unearned_revenue_vnd: float
    movements: List[CashFlowMovementItem]

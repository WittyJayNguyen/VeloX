import json
from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field, field_validator


class AIModelBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=128)
    model_code: str = Field(..., min_length=2, max_length=64)
    category: str = Field(default="CHAT") # CHAT | IMAGE | VIDEO | DEV_REQ
    provider: str = Field(..., min_length=2, max_length=64)
    cost_per_req_or_1k_tok: float = Field(default=0.5, ge=0)
    selling_credit_price: int = Field(default=250, ge=0)

    # Token Pricing per 1M Tokens ($ USD from Upstream Provider)
    input_cost_per_1m: float = Field(default=0.0, ge=0)
    output_cost_per_1m: float = Field(default=0.0, ge=0)
    cache_read_cost_per_1m: float = Field(default=0.0, ge=0)

    # Selling Pricing in Credits (per 1M Tokens)
    input_credit_price: int = Field(default=0, ge=0)
    output_credit_price: int = Field(default=0, ge=0)
    cache_read_credit_price: int = Field(default=0, ge=0)

    is_available: bool = True
    pool_id: Optional[str] = None
    description: Optional[str] = None
    config: Optional[dict] = Field(default_factory=dict)


class AIModelCreate(AIModelBase):
    pass


class AIModelUpdate(BaseModel):
    name: Optional[str] = None
    model_code: Optional[str] = None
    category: Optional[str] = None
    provider: Optional[str] = None
    cost_per_req_or_1k_tok: Optional[float] = None
    selling_credit_price: Optional[int] = None
    input_cost_per_1m: Optional[float] = None
    output_cost_per_1m: Optional[float] = None
    cache_read_cost_per_1m: Optional[float] = None
    input_credit_price: Optional[int] = None
    output_credit_price: Optional[int] = None
    cache_read_credit_price: Optional[int] = None
    is_available: Optional[bool] = None
    pool_id: Optional[str] = None
    description: Optional[str] = None
    config: Optional[dict] = None


class AIModelResponse(BaseModel):
    id: str
    name: str
    model_code: str
    category: str
    provider: str
    cost_per_req_or_1k_tok: float
    selling_credit_price: int
    input_cost_per_1m: float
    output_cost_per_1m: float
    cache_read_cost_per_1m: float
    input_credit_price: int
    output_credit_price: int
    cache_read_credit_price: int
    is_available: bool
    pool_id: Optional[str] = None
    description: Optional[str] = None
    config: Optional[dict] = Field(default_factory=dict)
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    @field_validator('config', mode='before')
    @classmethod
    def parse_config(cls, v):
        if isinstance(v, str):
            try:
                import json
                return json.loads(v)
            except Exception:
                return {}
        return v or {}

    # Computed fields for 2-column Cost vs Selling & Profit
    cost_price_vnd: Optional[float] = None
    selling_price_vnd: Optional[float] = None
    profit_vnd: Optional[float] = None
    profit_margin_pct: Optional[float] = None

    class Config:
        from_attributes = True


class AIModelPublicResponse(BaseModel):
    """Schema dành cho người dùng công khai (Homepage /models /studio).
    TUYỆT ĐỐI KHÔNG chứa giá vốn hay thông tin NCC (cost, profit, margin).
    Chỉ hiển thị giá bán Credits niêm yết mà user sẽ bị trừ!"""
    id: str
    name: str
    model_code: str
    category: str
    provider: str
    selling_credit_price: int
    input_credit_price: int
    output_credit_price: int
    cache_read_credit_price: int
    is_available: bool
    description: Optional[str] = None
    config: Optional[dict] = Field(default_factory=dict)
    created_at: Optional[datetime] = None

    @field_validator('config', mode='before')
    @classmethod
    def parse_config(cls, v):
        if isinstance(v, str):
            try:
                import json
                return json.loads(v)
            except Exception:
                return {}
        return v or {}

    class Config:
        from_attributes = True


class UpdateModelPricingRequest(BaseModel):
    cost_per_req_or_1k_tok: Optional[float] = None  # Giá gốc (media/1k tok)
    selling_credit_price: Optional[int] = None      # Giá bán ra (Credits)
    input_cost_per_1m: Optional[float] = None       # Giá gốc đầu vào VNĐ/1M
    input_credit_price: Optional[int] = None        # Giá bán ra đầu vào Credits/1M
    output_cost_per_1m: Optional[float] = None      # Giá gốc đầu ra VNĐ/1M
    output_credit_price: Optional[int] = None       # Giá bán ra đầu ra Credits/1M
    cache_read_cost_per_1m: Optional[float] = None  # Giá gốc cache VNĐ/1M
    cache_read_credit_price: Optional[int] = None   # Giá bán cache Credits/1M


class BatchMarkupRequest(BaseModel):
    markup_percent: Optional[float] = Field(None, description="Tỷ lệ % lời (vd: 30 cho +30% lợi nhuận)")
    markup_multiplier: Optional[float] = Field(None, gt=0, description="Hệ số nhân (vd: 1.3 cho +30%, 2.0 cho +100%)")
    category: Optional[str] = None
    provider: Optional[str] = None
    model_ids: Optional[list[str]] = None


"""VeloX AI Gateway — Pool, Credential & Recaptcha Pydantic Schemas"""
from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, Field


# ── Pool Key / Credential Schemas ──
class PoolKeyBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=128)
    auth_type: str = Field(default="API_KEY") # API_KEY | SESSION_TOKEN
    key_val: Optional[str] = Field(default="", description="API Key hoặc Session Token của tài khoản")
    recap_token: Optional[str] = None
    cookies: Optional[str] = None
    metadata_json: Optional[str] = None
    quota_daily: int = Field(default=10000)
    quota_daily_used: int = Field(default=0)
    quota_monthly: int = Field(default=250000)
    quota_monthly_used: int = Field(default=0)
    points: int = Field(default=0)
    priority: int = Field(default=8, ge=1, le=10)
    plan_badge: str = Field(default="Pro") # Free | Plus | Pro | Team | Enterprise
    status: str = Field(default="ACTIVE") # ACTIVE | PAUSED | QUOTA_EXCEEDED | ERROR
    requests_count: int = Field(default=0)
    detected_models: List[str] = Field(default_factory=list)
    quota_remaining_usd: Optional[float] = None
    notes: Optional[str] = None


class PoolKeyCreate(PoolKeyBase):
    pool_id: str


class PoolKeyUpdate(BaseModel):
    pool_id: Optional[str] = None
    name: Optional[str] = None
    auth_type: Optional[str] = None
    key_val: Optional[str] = None
    recap_token: Optional[str] = None
    cookies: Optional[str] = None
    metadata_json: Optional[str] = None
    quota_daily: Optional[int] = None
    quota_daily_used: Optional[int] = None
    quota_monthly: Optional[int] = None
    quota_monthly_used: Optional[int] = None
    points: Optional[int] = None
    priority: Optional[int] = None
    plan_badge: Optional[str] = None
    status: Optional[str] = None
    requests_count: Optional[int] = None
    detected_models: Optional[List[str]] = None
    quota_remaining_usd: Optional[float] = None
    notes: Optional[str] = None


class PoolKeyResponse(BaseModel):
    id: str
    pool_id: str
    name: str
    auth_type: str
    key_val: str
    recap_token: Optional[str] = None
    cookies: Optional[str] = None
    metadata_json: Optional[str] = None
    quota_daily: int
    quota_daily_used: int
    quota_monthly: int
    quota_monthly_used: int
    points: int
    priority: int
    plan_badge: str
    status: str
    requests_count: int
    detected_models: List[str]
    last_checked_at: Optional[datetime] = None
    quota_remaining_usd: Optional[float] = None
    notes: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ── Service Pool Schemas ──
class ServicePoolBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=128)
    provider: str = Field(..., min_length=2, max_length=64)
    base_url: str = Field(..., min_length=5, max_length=255)
    auth_type: str = Field(default="HYBRID") # API_KEY | TOKEN_ACCOUNT | HYBRID
    routing_strategy: str = Field(default="LEAST_USED") # ROUND_ROBIN | PRIORITY | LEAST_USED | WEIGHTED
    is_active: bool = True
    rate_limit_per_min: int = Field(default=1000)
    max_tokens_per_min: Optional[int] = None
    timeout_ms: int = Field(default=30000)
    description: Optional[str] = None


class ServicePoolCreate(ServicePoolBase):
    pass


class ServicePoolUpdate(BaseModel):
    name: Optional[str] = None
    provider: Optional[str] = None
    base_url: Optional[str] = None
    auth_type: Optional[str] = None
    routing_strategy: Optional[str] = None
    is_active: Optional[bool] = None
    rate_limit_per_min: Optional[int] = None
    max_tokens_per_min: Optional[int] = None
    timeout_ms: Optional[int] = None
    description: Optional[str] = None


class ServicePoolResponse(BaseModel):
    id: str
    name: str
    provider: str
    base_url: str
    auth_type: str
    routing_strategy: str
    is_active: bool
    rate_limit_per_min: int
    max_tokens_per_min: Optional[int] = None
    timeout_ms: int
    description: Optional[str] = None
    keys: List[PoolKeyResponse] = Field(default_factory=list)
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ── Recaptcha Solver Schemas ──
class RecaptchaSolverBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=128)
    provider: str = Field(..., min_length=2, max_length=64) # 2Captcha | CapSolver | Anti-Captcha | EzCaptcha | CustomNode
    api_key: str = Field(..., min_length=1)
    supported_types: List[str] = Field(default_factory=list)
    balance_usd: float = 0.0
    avg_solve_time_sec: float = 3.0
    solved_count: int = 0
    success_rate_pct: float = 99.0
    timeout_sec: int = 30
    assigned_accounts_count: int = 0
    is_active: bool = True


class RecaptchaSolverCreate(RecaptchaSolverBase):
    pass


class RecaptchaSolverUpdate(BaseModel):
    name: Optional[str] = None
    provider: Optional[str] = None
    api_key: Optional[str] = None
    supported_types: Optional[List[str]] = None
    balance_usd: Optional[float] = None
    avg_solve_time_sec: Optional[float] = None
    solved_count: Optional[int] = None
    success_rate_pct: Optional[float] = None
    timeout_sec: Optional[int] = None
    assigned_accounts_count: Optional[int] = None
    is_active: Optional[bool] = None


class RecaptchaSolverResponse(BaseModel):
    id: str
    name: str
    provider: str
    api_key: str
    supported_types: List[str]
    balance_usd: float
    avg_solve_time_sec: float
    solved_count: int
    success_rate_pct: float
    timeout_sec: int
    assigned_accounts_count: int
    is_active: bool
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

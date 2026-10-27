"""
VeloX AI Gateway — Developer API Key Schemas (Pydantic DTOs)
============================================================
"""
from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field


class ApiKeyCreateRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=100, description="Tên định danh key (vd: App Mobile, Backend Staging)")
    rate_limit_per_min: Optional[int] = Field(60, ge=1, le=1000, description="Giới hạn số request trên 1 phút")


class ApiKeyUpdateRequest(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=100)
    is_active: Optional[bool] = None
    rate_limit_per_min: Optional[int] = Field(None, ge=1, le=1000)


class ApiKeyResponse(BaseModel):
    id: str
    user_id: str
    name: str
    key_prefix: str
    is_active: bool
    rate_limit_per_min: int
    total_requests: int
    last_used_at: Optional[str] = None
    created_at: Optional[str] = None

    class Config:
        from_attributes = True


class ApiKeyCreatedResponse(ApiKeyResponse):
    secret_key: str = Field(..., description="Full API key (Chỉ hiển thị 1 lần duy nhất khi tạo)")

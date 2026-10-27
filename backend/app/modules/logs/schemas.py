"""
VeloX AI Gateway — Logs & Media Library Schemas (Pydantic DTOs)
==============================================================
"""
from typing import Optional, List
from pydantic import BaseModel, Field


class MediaJobResponse(BaseModel):
    id: str
    user_id: Optional[str] = None
    user_email: Optional[str] = None
    model_id: Optional[str] = None
    media_type: str = Field(..., description="IMAGE or VIDEO")
    prompt: str
    output_url: Optional[str] = None
    credits_charged: float
    render_seconds: Optional[float] = None
    created_at: Optional[str] = None

    class Config:
        from_attributes = True


class MediaJobListResponse(BaseModel):
    items: List[MediaJobResponse]
    total: int
    page: int
    page_size: int


class ApiCallLogResponse(BaseModel):
    id: str
    user_id: Optional[str] = None
    user_email: Optional[str] = None
    model_id: Optional[str] = None
    credential_id: Optional[str] = None
    prompt_tokens: int
    completion_tokens: int
    total_credits_charged: float
    duration_ms: int
    status_code: int
    ip_address: Optional[str] = None
    created_at: Optional[str] = None

    class Config:
        from_attributes = True


class ApiCallLogListResponse(BaseModel):
    items: List[ApiCallLogResponse]
    total: int
    page: int
    page_size: int

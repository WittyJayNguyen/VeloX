"""
VeloX AI Gateway — Playground Schemas
=====================================
Pydantic data models for admin model testing, prompting, and debug telemetry.
"""
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class PlaygroundMessage(BaseModel):
    role: str = Field(..., description="Role: 'system', 'user', or 'assistant'")
    content: str = Field(..., description="Message text or base64 / URL for media")


class PlaygroundRequest(BaseModel):
    model_code: str = Field(..., description="Target model identifier, e.g. 'llama-3.3-70b-instruct' or 'meta-imagine'")
    messages: List[PlaygroundMessage] = Field(default_factory=list, description="Conversation history")
    key_id: Optional[str] = Field(None, description="Specific credential ID to test. None for auto-pool routing.")
    pool_id: Optional[str] = Field(None, description="Specific pool ID to route through.")
    temperature: Optional[float] = Field(0.7, ge=0.0, le=2.0)
    max_tokens: Optional[int] = Field(1024, ge=1, le=8192)
    system_prompt: Optional[str] = Field(None, description="Optional system instruction override")
    stream: Optional[bool] = Field(False, description="Streaming mode flag")
    aspect_ratio: Optional[str] = Field("1:1", description="Media aspect ratio: '1:1', '16:9', '9:16', '4:3', '3:4'")
    duration_sec: Optional[int] = Field(5, description="Video duration in seconds, e.g. 3, 5, 10")
    num_outputs: Optional[int] = Field(1, ge=1, le=4, description="Number of outputs to generate simultaneously (1-4)")
    quality: Optional[str] = Field("hd", description="Image resolution & quality: 'standard', 'hd', '4k'")
    reference_image: Optional[str] = Field(None, description="Base64 Data URL or link to reference image")


class PlaygroundUsage(BaseModel):
    prompt_tokens: int = 0
    completion_tokens: int = 0
    total_tokens: int = 0
    estimated_cost_vnd: float = 0.0


class PlaygroundResponse(BaseModel):
    id: str
    model_code: str
    provider: str
    category: str
    key_name: Optional[str] = None
    status: str = "success"  # "success" | "error" | "rate_limited"
    latency_ms: float
    content: str
    media_url: Optional[str] = None
    media_urls: List[str] = Field(default_factory=list, description="Generated media URLs/Base64")
    usage: PlaygroundUsage
    debug_info: Dict[str, Any] = Field(default_factory=dict)
    created_at: str


class ConnectionTestRequest(BaseModel):
    key_id: str


class ConnectionTestResponse(BaseModel):
    key_name: str
    provider: str
    is_live: bool
    latency_ms: float
    status_code: int
    message: str
    details: Dict[str, Any] = Field(default_factory=dict)

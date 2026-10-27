"""
VeloX AI Gateway — Proxy Schemas (OpenAI Standard Format)
=========================================================
Standardized API request/response schemas for developer integration.
Compatible with official OpenAI Python/NodeJS SDKs.
"""
from typing import List, Optional, Dict, Any, Union
from pydantic import BaseModel, Field


# --- OpenAI Chat Completions Format ---
class ChatMessage(BaseModel):
    role: str = Field(..., description="system, user, or assistant")
    content: str


class ChatCompletionRequest(BaseModel):
    model: str = Field(..., description="Mã mô hình (vd: llama-3.3-70b, meta-imagine, gpt-4o)")
    messages: List[ChatMessage]
    temperature: Optional[float] = 0.7
    max_tokens: Optional[int] = 2048
    stream: Optional[bool] = False


class ChatChoiceMessage(BaseModel):
    role: str = "assistant"
    content: str


class ChatChoice(BaseModel):
    index: int = 0
    message: ChatChoiceMessage
    finish_reason: str = "stop"


class UsageInfo(BaseModel):
    prompt_tokens: int
    completion_tokens: int
    total_tokens: int


class ChatCompletionResponse(BaseModel):
    id: str
    object: str = "chat.completion"
    created: int
    model: str
    choices: List[ChatChoice]
    usage: UsageInfo


# --- OpenAI Images Generation Format ---
class ImageGenerationRequest(BaseModel):
    model: Optional[str] = "meta-imagine"
    prompt: str = Field(..., min_length=2, description="Nội dung miêu tả ảnh muốn sinh")
    n: Optional[int] = Field(1, ge=1, le=4, description="Số lượng ảnh cần sinh")
    size: Optional[str] = "1024x1024"
    response_format: Optional[str] = "url"


class ImageData(BaseModel):
    url: str


class ImageGenerationResponse(BaseModel):
    created: int
    data: List[ImageData]


# --- Video Generation Format ---
class VideoGenerationRequest(BaseModel):
    model: Optional[str] = "meta-video-gen"
    prompt: str = Field(..., min_length=2, description="Nội dung kịch bản hoặc miêu tả video")
    duration_sec: Optional[int] = Field(5, ge=3, le=10, description="Độ dài video (3s, 5s hoặc 10s)")
    reference_image: Optional[str] = Field(None, description="URL ảnh tham chiếu (Image-to-Video)")


class VideoGenerationResponse(BaseModel):
    id: str
    object: str = "video.generation"
    created: int
    model: str
    video_url: str
    duration_sec: int
    credits_deducted: float

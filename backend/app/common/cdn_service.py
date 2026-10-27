"""
VeloX AI Gateway — Zero-Disk Multi-CDN Service
===============================================
Handles media routing to public, high-speed CDNs without writing to the local server disk.
Architecture Decision:
- NO Cloudflare R2 (Eliminates paid bucket storage, complex S3 credentials, and egress fees).
- Uses Zero-Disk Public & Fast Cloud CDNs:
  1. Upstream Direct CDN URLs (0 MB disk, 0 latency for external models).
  2. In-Memory Streaming CDN for Images (FreeImage.host / Catbox CDN fallback).
  3. In-Memory Streaming CDN for Videos (Catbox.moe CDN, up to 200MB MP4/WebM permanent hosting).
  4. Rolling User Job Retention: Enforces a strict quota per user (e.g. 50 jobs) to keep database lightweight.
"""
import uuid
import base64
import httpx
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete, desc
from app.modules.logs.models import MediaGenerationLog
from app.core.config import get_settings

settings = get_settings()


async def upload_image_to_cdn(raw_bytes: bytes, mime_type: str = "image/png") -> Optional[str]:
    """
    Streams image bytes in-memory to public high-speed CDN.
    Attempts FreeImage.host primary, then Catbox.moe secondary fallback.
    """
    # Attempt 1: FreeImage.host
    try:
        b64_str = base64.b64encode(raw_bytes).decode("utf-8")
        api_key = getattr(settings, "CDN_API_KEY", "") or "6d207e02198a847aa98d0a2a901485a5"
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.post(
                "https://freeimage.host/api/1/upload",
                data={
                    "key": api_key,
                    "action": "upload",
                    "source": b64_str,
                    "format": "json"
                }
            )
            if resp.status_code == 200:
                data = resp.json()
                if "image" in data and "url" in data["image"]:
                    return data["image"]["url"]
    except Exception as e:
        print(f"[WARN] FreeImage CDN upload failed: {e}. Falling back to Catbox CDN...")

    # Attempt 2: Catbox.moe
    try:
        ext = "png" if "png" in mime_type else "jpg" if "jpeg" in mime_type or "jpg" in mime_type else "webp"
        filename = f"velox_{uuid.uuid4().hex[:10]}.{ext}"
        async with httpx.AsyncClient(timeout=20.0) as client:
            files = {"fileToUpload": (filename, raw_bytes, mime_type)}
            data = {"reqtype": "fileupload"}
            resp = await client.post("https://catbox.moe/user/api.php", data=data, files=files)
            if resp.status_code == 200 and resp.text.startswith("http"):
                return resp.text.strip()
    except Exception as e:
        print(f"[ERROR] Catbox image CDN upload failed: {e}")

    return None


async def upload_video_to_cdn(raw_bytes: bytes, mime_type: str = "video/mp4") -> Optional[str]:
    """
    Streams video bytes in-memory to Catbox CDN (Zero VPS disk, permanent public URL).
    """
    try:
        ext = "mp4" if "mp4" in mime_type else "webm" if "webm" in mime_type else "mp4"
        filename = f"velox_vid_{uuid.uuid4().hex[:10]}.{ext}"
        async with httpx.AsyncClient(timeout=30.0) as client:
            files = {"fileToUpload": (filename, raw_bytes, mime_type)}
            data = {"reqtype": "fileupload"}
            resp = await client.post("https://catbox.moe/user/api.php", data=data, files=files)
            if resp.status_code == 200 and resp.text.startswith("http"):
                return resp.text.strip()
    except Exception as e:
        print(f"[ERROR] Catbox video CDN upload failed: {e}")

    return None


async def upload_base64_to_cdn(data_uri_or_b64: str, media_type: str = "IMAGE") -> Optional[str]:
    """
    Parses raw base64 or data URI and streams directly to Cloud CDN without VPS disk write.
    """
    if not data_uri_or_b64:
        return None

    mime_type = "image/png"
    clean_b64 = data_uri_or_b64

    if data_uri_or_b64.startswith("data:"):
        header, clean_b64 = data_uri_or_b64.split(",", 1)
        mime_type = header.split(";")[0].replace("data:", "")

    is_video = media_type.upper() == "VIDEO" or "video" in mime_type

    try:
        raw_bytes = base64.b64decode(clean_b64)
    except Exception as e:
        print(f"[WARN] Base64 decode failed for CDN streaming: {e}")
        return None

    if is_video:
        return await upload_video_to_cdn(raw_bytes, mime_type=mime_type or "video/mp4")
    else:
        return await upload_image_to_cdn(raw_bytes, mime_type=mime_type or "image/png")


async def ensure_cdn_url(media_url_or_base64: Optional[str], media_type: str = "IMAGE") -> Optional[str]:
    """
    Guarantees the URL stored in the user history is a lightweight CDN URL.
    - If already http(s)://, returns it directly (0 MB server disk).
    - If data URI / base64, uploads in-memory to CDN and returns permanent CDN URL.
    - If upload fails, preserves the original payload safely.
    """
    if not media_url_or_base64:
        return None

    # Already an external CDN URL (e.g. Meta CDN, Azure, AWS CloudFront, Unsplash, Catbox, etc.)
    if media_url_or_base64.startswith("http://") or media_url_or_base64.startswith("https://"):
        return media_url_or_base64

    # Base64 data URI: stream to CDN in-memory
    if media_url_or_base64.startswith("data:") or ";base64," in media_url_or_base64:
        cdn_url = await upload_base64_to_cdn(media_url_or_base64, media_type=media_type)
        if cdn_url:
            return cdn_url

    return media_url_or_base64


async def enforce_user_job_retention(user_id: str, db: AsyncSession, limit: Optional[int] = None):
    """
    Ensures a single user never exceeds `limit` stored media history jobs.
    Prunes older jobs to cap database storage per user.
    """
    if not user_id:
        return
    retention_limit = limit or getattr(settings, "USER_JOB_RETENTION_LIMIT", 50)
    try:
        stmt = (
            select(MediaGenerationLog.id)
            .where(MediaGenerationLog.user_id == user_id)
            .order_by(desc(MediaGenerationLog.created_at))
            .offset(retention_limit)
        )
        res = await db.execute(stmt)
        old_ids = res.scalars().all()
        if old_ids:
            await db.execute(
                delete(MediaGenerationLog).where(MediaGenerationLog.id.in_(old_ids))
            )
            await db.commit()
    except Exception as e:
        print(f"[WARN] Failed to enforce job retention for user {user_id}: {e}")

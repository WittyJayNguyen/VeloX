"""
VeloX AI Gateway — Logs & Media History Business Logic
======================================================
Guarantees strict tenant-isolation: Users can ONLY query and delete their own jobs.
Admin can review all CDN generation jobs across users.
Zero-Disk Cloud CDN storage: all images/videos routed to public CDNs.
"""
from typing import Optional, List, Tuple
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc, func, delete

from app.modules.logs.models import MediaGenerationLog, ApiCallLog
from app.modules.users.models import User
from app.modules.logs.schemas import (
    MediaJobResponse, MediaJobListResponse,
    ApiCallLogResponse, ApiCallLogListResponse
)
from app.common.cdn_service import ensure_cdn_url, enforce_user_job_retention


async def record_media_generation(
    user_id: Optional[str],
    model_id: str,
    media_type: str,
    prompt: str,
    output_url: Optional[str],
    credits_charged: float,
    render_seconds: Optional[float],
    db: AsyncSession
) -> MediaGenerationLog:
    """
    Saves a new media generation record with Zero-Disk CDN storage:
    1. Converts base64 to public CDN URL (Catbox for videos/images, FreeImage for images).
    2. Automatically trims older jobs for the user to keep database lightweight.
    """
    clean_cdn_url = await ensure_cdn_url(output_url, media_type=media_type)

    log_entry = MediaGenerationLog(
        user_id=user_id,
        model_id=model_id,
        media_type=media_type.upper(),
        prompt=prompt,
        output_url=clean_cdn_url,
        credits_charged=credits_charged,
        render_seconds=render_seconds,
    )
    db.add(log_entry)
    await db.commit()
    await db.refresh(log_entry)

    # Enforce rolling retention to prevent database bloat on limited disk servers
    if user_id:
        await enforce_user_job_retention(user_id, db)

    return log_entry


async def list_user_media_jobs(
    user_id: str,
    media_type: Optional[str],
    search: Optional[str],
    page: int,
    page_size: int,
    db: AsyncSession
) -> MediaJobListResponse:
    """
    Returns paginated media jobs owned by the user.
    STRICT DATA ISOLATION: user_id == current_user_id.
    """
    base_query = (
        select(MediaGenerationLog, User.email)
        .outerjoin(User, MediaGenerationLog.user_id == User.id)
        .where(MediaGenerationLog.user_id == user_id)
    )
    count_query = select(func.count()).select_from(MediaGenerationLog).where(MediaGenerationLog.user_id == user_id)

    if media_type and media_type.upper() in ["IMAGE", "VIDEO"]:
        base_query = base_query.where(MediaGenerationLog.media_type == media_type.upper())
        count_query = count_query.where(MediaGenerationLog.media_type == media_type.upper())

    if search:
        search_filter = f"%{search}%"
        base_query = base_query.where(MediaGenerationLog.prompt.ilike(search_filter))
        count_query = count_query.where(MediaGenerationLog.prompt.ilike(search_filter))

    total_res = await db.execute(count_query)
    total = total_res.scalar() or 0

    offset = (page - 1) * page_size
    query = base_query.order_by(desc(MediaGenerationLog.created_at)).offset(offset).limit(page_size)
    res = await db.execute(query)
    rows = res.all()

    items = [
        MediaJobResponse(
            id=str(r[0].id),
            user_id=r[0].user_id,
            user_email=r[1] or "user@velox.ai",
            model_id=r[0].model_id,
            media_type=r[0].media_type,
            prompt=r[0].prompt,
            output_url=r[0].output_url,
            credits_charged=float(r[0].credits_charged or 0.0),
            render_seconds=float(r[0].render_seconds) if r[0].render_seconds else None,
            created_at=r[0].created_at.isoformat() if r[0].created_at else None,
        )
        for r in rows
    ]

    return MediaJobListResponse(
        items=items,
        total=total,
        page=page,
        page_size=page_size
    )


async def list_all_media_jobs(
    user_id: Optional[str],
    media_type: Optional[str],
    search: Optional[str],
    page: int,
    page_size: int,
    db: AsyncSession,
    model_id: Optional[str] = None,
    has_media_only: bool = False,
) -> MediaJobListResponse:
    """
    Admin listing: view all users' media generation history stored on CDN.
    """
    base_query = (
        select(MediaGenerationLog, User.email)
        .outerjoin(User, MediaGenerationLog.user_id == User.id)
    )
    count_query = select(func.count()).select_from(MediaGenerationLog)

    if user_id and user_id != "ALL":
        base_query = base_query.where(MediaGenerationLog.user_id == user_id)
        count_query = count_query.where(MediaGenerationLog.user_id == user_id)

    if media_type and media_type.upper() in ["IMAGE", "VIDEO"]:
        base_query = base_query.where(MediaGenerationLog.media_type == media_type.upper())
        count_query = count_query.where(MediaGenerationLog.media_type == media_type.upper())

    if model_id and model_id.strip():
        base_query = base_query.where(MediaGenerationLog.model_id == model_id.strip())
        count_query = count_query.where(MediaGenerationLog.model_id == model_id.strip())

    if has_media_only:
        base_query = base_query.where(MediaGenerationLog.output_url.isnot(None), MediaGenerationLog.output_url != "")
        count_query = count_query.where(MediaGenerationLog.output_url.isnot(None), MediaGenerationLog.output_url != "")

    if search:
        search_filter = f"%{search}%"
        base_query = base_query.where(MediaGenerationLog.prompt.ilike(search_filter))
        count_query = count_query.where(MediaGenerationLog.prompt.ilike(search_filter))

    total_res = await db.execute(count_query)
    total = total_res.scalar() or 0

    offset = (page - 1) * page_size
    query = base_query.order_by(desc(MediaGenerationLog.created_at)).offset(offset).limit(page_size)
    res = await db.execute(query)
    rows = res.all()

    items = [
        MediaJobResponse(
            id=str(r[0].id),
            user_id=r[0].user_id,
            user_email=r[1] or "guest@velox.ai",
            model_id=r[0].model_id,
            media_type=r[0].media_type,
            prompt=r[0].prompt,
            output_url=r[0].output_url,
            credits_charged=float(r[0].credits_charged or 0.0),
            render_seconds=float(r[0].render_seconds) if r[0].render_seconds else None,
            created_at=r[0].created_at.isoformat() if r[0].created_at else None,
        )
        for r in rows
    ]

    return MediaJobListResponse(
        items=items,
        total=total,
        page=page,
        page_size=page_size
    )


async def get_media_vault_stats(db: AsyncSession) -> dict:
    """
    Get aggregated statistics for the master prompt & media vault.
    """
    total_q = select(func.count()).select_from(MediaGenerationLog)
    img_q = select(func.count()).select_from(MediaGenerationLog).where(MediaGenerationLog.media_type == "IMAGE")
    vid_q = select(func.count()).select_from(MediaGenerationLog).where(MediaGenerationLog.media_type == "VIDEO")
    credits_q = select(func.sum(MediaGenerationLog.credits_charged)).select_from(MediaGenerationLog)
    models_q = select(MediaGenerationLog.model_id).distinct().where(MediaGenerationLog.model_id.isnot(None))

    total = (await db.execute(total_q)).scalar() or 0
    total_imgs = (await db.execute(img_q)).scalar() or 0
    total_vids = (await db.execute(vid_q)).scalar() or 0
    total_credits = (await db.execute(credits_q)).scalar() or 0.0
    models_res = (await db.execute(models_q)).scalars().all()

    return {
        "total_prompts": int(total),
        "total_images": int(total_imgs),
        "total_videos": int(total_vids),
        "total_credits": float(total_credits or 0.0),
        "models": [m for m in models_res if m],
    }


async def delete_user_media_job(
    job_id: str,
    user_id: str,
    db: AsyncSession
) -> bool:
    """
    Deletes a media job ONLY if it belongs to user_id.
    """
    stmt = select(MediaGenerationLog).where(
        MediaGenerationLog.id == job_id,
        MediaGenerationLog.user_id == user_id
    )
    res = await db.execute(stmt)
    job = res.scalar_one_or_none()
    if not job:
        return False

    await db.delete(job)
    await db.commit()
    return True


async def admin_delete_media_job(
    job_id: str,
    db: AsyncSession
) -> bool:
    """
    Admin-level delete: remove any media job by ID regardless of owner.
    """
    stmt = select(MediaGenerationLog).where(MediaGenerationLog.id == job_id)
    res = await db.execute(stmt)
    job = res.scalar_one_or_none()
    if not job:
        return False

    await db.delete(job)
    await db.commit()
    return True



async def record_api_call(
    user_id: Optional[str],
    model_id: Optional[str],
    credential_id: Optional[str],
    prompt_tokens: int,
    completion_tokens: int,
    total_credits_charged: float,
    duration_ms: int,
    status_code: int,
    ip_address: Optional[str],
    db: AsyncSession
) -> ApiCallLog:
    """Records an API gateway transaction."""
    entry = ApiCallLog(
        user_id=user_id,
        model_id=model_id,
        credential_id=credential_id,
        prompt_tokens=prompt_tokens,
        completion_tokens=completion_tokens,
        total_credits_charged=total_credits_charged,
        duration_ms=duration_ms,
        status_code=status_code,
        ip_address=ip_address,
    )
    db.add(entry)
    await db.commit()
    await db.refresh(entry)
    return entry


async def list_api_call_logs(
    user_id: Optional[str],
    model_id: Optional[str],
    page: int,
    page_size: int,
    db: AsyncSession
) -> ApiCallLogListResponse:
    """Returns paginated API gateway transaction logs."""
    base_query = (
        select(ApiCallLog, User.email)
        .outerjoin(User, ApiCallLog.user_id == User.id)
    )
    count_query = select(func.count()).select_from(ApiCallLog)

    if user_id and user_id != "ALL":
        base_query = base_query.where(ApiCallLog.user_id == user_id)
        count_query = count_query.where(ApiCallLog.user_id == user_id)

    if model_id and model_id != "ALL":
        base_query = base_query.where(ApiCallLog.model_id == model_id)
        count_query = count_query.where(ApiCallLog.model_id == model_id)

    total_res = await db.execute(count_query)
    total = total_res.scalar() or 0

    offset = (page - 1) * page_size
    query = base_query.order_by(desc(ApiCallLog.created_at)).offset(offset).limit(page_size)
    res = await db.execute(query)
    rows = res.all()

    items = [
        ApiCallLogResponse(
            id=str(r[0].id),
            user_id=r[0].user_id,
            user_email=r[1] or "guest@velox.ai",
            model_id=r[0].model_id,
            credential_id=r[0].credential_id,
            prompt_tokens=r[0].prompt_tokens or 0,
            completion_tokens=r[0].completion_tokens or 0,
            total_credits_charged=float(r[0].total_credits_charged or 0.0),
            duration_ms=r[0].duration_ms or 0,
            status_code=r[0].status_code or 200,
            ip_address=r[0].ip_address,
            created_at=r[0].created_at.isoformat() if r[0].created_at else None,
        )
        for r in rows
    ]

    return ApiCallLogListResponse(
        items=items,
        total=total,
        page=page,
        page_size=page_size
    )

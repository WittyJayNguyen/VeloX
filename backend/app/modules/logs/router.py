"""
VeloX AI Gateway — Logs & Media History Router
==============================================
Provides endpoints for retrieving user-isolated generation history (Zero-Disk CDN storage)
and system auditing logs.
"""
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status, Body
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import get_current_user_payload
from app.modules.logs.schemas import (
    MediaJobListResponse, MediaJobResponse,
    ApiCallLogListResponse
)
from app.modules.logs.services import (
    list_user_media_jobs, list_all_media_jobs,
    delete_user_media_job, list_api_call_logs
)
from app.common.cdn_service import upload_base64_to_cdn, ensure_cdn_url

router = APIRouter(prefix="/logs", tags=["Auditing & User Media History"])


@router.get("/my-jobs", response_model=MediaJobListResponse)
async def api_get_my_media_jobs(
    media_type: Optional[str] = Query(None, description="Filter by IMAGE or VIDEO"),
    search: Optional[str] = Query(None, description="Search keyword in prompt"),
    page: int = Query(1, ge=1),
    page_size: int = Query(12, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    user_payload: dict = Depends(get_current_user_payload),
):
    """
    Get personal generation history (Photos & Videos) for the logged-in user.
    Each user ONLY sees their own generated assets stored on CDN.
    """
    user_id = user_payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token payload")

    return await list_user_media_jobs(
        user_id=user_id,
        media_type=media_type,
        search=search,
        page=page,
        page_size=page_size,
        db=db
    )


@router.delete("/my-jobs/{job_id}", status_code=status.HTTP_200_OK)
async def api_delete_my_media_job(
    job_id: str,
    db: AsyncSession = Depends(get_db),
    user_payload: dict = Depends(get_current_user_payload),
):
    """
    Delete a media asset from the user's private library.
    """
    user_id = user_payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token payload")

    success = await delete_user_media_job(job_id=job_id, user_id=user_id, db=db)
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found or access denied")

    return {"status": "success", "message": "Job removed from history"}


@router.get("/all-media", response_model=MediaJobListResponse)
async def api_get_all_media_jobs(
    user_id: Optional[str] = Query(None, description="Filter by specific user_id"),
    media_type: Optional[str] = Query(None, description="Filter by IMAGE or VIDEO"),
    search: Optional[str] = Query(None, description="Search keyword in prompt"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    user_payload: dict = Depends(get_current_user_payload),
):
    """
    Admin overview: list media generation history for all users stored on CDN.
    """
    return await list_all_media_jobs(
        user_id=user_id,
        media_type=media_type,
        search=search,
        page=page,
        page_size=page_size,
        db=db
    )


@router.get("/api-calls", response_model=ApiCallLogListResponse)
async def api_get_api_call_logs(
    user_id: Optional[str] = Query(None),
    model_id: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    user_payload: dict = Depends(get_current_user_payload),
):
    """
    Gateway API call transaction audit logs.
    """
    return await list_api_call_logs(
        user_id=user_id,
        model_id=model_id,
        page=page,
        page_size=page_size,
        db=db
    )


@router.post("/upload-cdn")
async def api_upload_to_cdn(
    data: dict = Body(...),
    user_payload: dict = Depends(get_current_user_payload),
):
    """
    On-demand direct streaming upload to Cloud CDN without VPS disk write.
    Accepts raw base64 or data URI and returns direct CDN URL.
    """
    media_data = data.get("media_data")
    media_type = data.get("media_type", "IMAGE")
    if not media_data:
        raise HTTPException(status_code=400, detail="media_data is required")

    cdn_url = await ensure_cdn_url(media_data, media_type=media_type)
    if not cdn_url or cdn_url.startswith("data:"):
        raise HTTPException(status_code=502, detail="Failed to upload to CDN")

    return {"status": "success", "cdn_url": cdn_url, "provider": "Cloud CDN (Zero-Disk)"}

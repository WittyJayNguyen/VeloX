"""
System Settings, Brand Customization & Notifications Router
"""
import os
import uuid
import base64
from datetime import datetime
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Request, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc

from app.core.database import get_db
from app.core.security import get_current_user
from app.modules.users.models import User
from app.modules.system.models import SystemSetting, SystemNotification

router = APIRouter(prefix="/system", tags=["System Settings & Notifications"])


async def require_admin(current_user: User = Depends(get_current_user)) -> User:
    """Verify that current user is an admin or super admin."""
    roles = current_user.roles or []
    is_admin = (
        getattr(current_user, "is_superuser", False)
        or any(r.id in ["ROLE_SUPER_ADMIN", "ROLE_ADMIN"] or getattr(r, "code", "") in ["ROLE_SUPER_ADMIN", "ROLE_ADMIN"] for r in roles)
        or getattr(current_user, "role", "") in ["ADMIN", "ROLE_ADMIN", "SUPER_ADMIN"]
    )
    if not is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Bảo mật cấp cao: Thao tác này chỉ dành riêng cho Quản trị viên (Admin)",
        )
    return current_user


async def get_optional_user(
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> Optional[User]:
    """Extract user if valid Bearer token provided, else None."""
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        return None
    token = auth_header.split(" ")[1]
    try:
        from app.core.security import decode_token
        payload = decode_token(token)
        user_id = payload.get("sub")
        if not user_id:
            return None
        res = await db.execute(select(User).where(User.id == user_id))
        return res.scalar_one_or_none()
    except Exception:
        return None


class PublicSettingsResponse(BaseModel):
    site_name: str
    site_title: str
    site_desc: str
    brand_logo_url: Optional[str] = None
    favicon_url: Optional[str] = None
    default_lang: str = "vi"
    maintenance_mode: bool = False
    maintenance_message: str


class FullSettingsResponse(PublicSettingsResponse):
    auto_backup: bool
    email_notif: bool
    webhook_url: Optional[str] = None
    updated_at: Optional[datetime] = None


class UpdateSettingsRequest(BaseModel):
    site_name: Optional[str] = None
    site_title: Optional[str] = None
    site_desc: Optional[str] = None
    brand_logo_url: Optional[str] = None
    favicon_url: Optional[str] = None
    default_lang: Optional[str] = None
    maintenance_mode: Optional[bool] = None
    maintenance_message: Optional[str] = None
    auto_backup: Optional[bool] = None
    email_notif: Optional[bool] = None
    webhook_url: Optional[str] = None
    broadcast_update: Optional[bool] = False
    broadcast_message: Optional[str] = None


class NotificationItem(BaseModel):
    id: str
    title: str
    message: str
    type: str
    is_broadcast: bool
    is_read: bool
    created_at: datetime


class CreateNotificationRequest(BaseModel):
    title: str
    message: str
    type: str = "info"  # info, warning, danger, success
    is_broadcast: bool = True
    user_id: Optional[str] = None


async def get_or_create_system_setting(db: AsyncSession) -> SystemSetting:
    res = await db.execute(select(SystemSetting).where(SystemSetting.id == "default"))
    setting = res.scalar_one_or_none()
    if not setting:
        setting = SystemSetting(
            id="default",
            site_name="VeloX AI Gateway",
            site_title="VeloX — AI Studio & Gateway",
            site_desc="Nền tảng trung gian AI Gateway thế hệ mới",
            brand_logo_url=None,
            maintenance_mode=False,
            maintenance_message="Hệ thống đang trong thời gian bảo trì nâng cấp. Mọi tiến trình AI và API tạm dừng. Vui lòng quay lại sau!",
        )
        db.add(setting)
        await db.commit()
        await db.refresh(setting)
    return setting


async def check_system_maintenance(db: AsyncSession, user: Optional[User] = None):
    """
    Checks if maintenance mode is active.
    If ON, non-admin requests are rejected with 503 Service Unavailable.
    """
    res = await db.execute(select(SystemSetting.maintenance_mode, SystemSetting.maintenance_message).where(SystemSetting.id == "default"))
    row = res.first()
    if row and row[0]:
        is_admin = False
        if user:
            if getattr(user, "is_superuser", False):
                is_admin = True
            elif hasattr(user, "roles") and any(
                getattr(r, "id", "") in ["ROLE_ADMIN", "ROLE_SUPER_ADMIN"]
                or getattr(r, "code", "") in ["ROLE_ADMIN", "ADMIN"]
                for r in getattr(user, "roles", [])
            ):
                is_admin = True
            elif getattr(user, "role", "") in ["ADMIN", "ROLE_ADMIN", "SUPER_ADMIN"]:
                is_admin = True
        if not is_admin:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=row[1] or "Hệ thống đang trong thời gian bảo trì nâng cấp. Mọi tiến trình AI và API tạm dừng. Vui lòng quay lại sau!",
            )


@router.get("/public-settings", response_model=PublicSettingsResponse)
async def get_public_settings(db: AsyncSession = Depends(get_db)):
    """
    Public endpoint: Get site brand name, logo and maintenance status.
    Called on every page load to check real-time maintenance and branding.
    """
    setting = await get_or_create_system_setting(db)
    return PublicSettingsResponse(
        site_name=setting.site_name,
        site_title=setting.site_title,
        site_desc=setting.site_desc,
        brand_logo_url=setting.brand_logo_url,
        favicon_url=setting.favicon_url,
        default_lang=setting.default_lang,
        maintenance_mode=setting.maintenance_mode,
        maintenance_message=setting.maintenance_message,
    )


@router.get("/settings", response_model=FullSettingsResponse)
async def get_admin_settings(
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    """Admin endpoint: Get complete system settings."""
    setting = await get_or_create_system_setting(db)
    return FullSettingsResponse(
        site_name=setting.site_name,
        site_title=setting.site_title,
        site_desc=setting.site_desc,
        brand_logo_url=setting.brand_logo_url,
        favicon_url=setting.favicon_url,
        default_lang=setting.default_lang,
        maintenance_mode=setting.maintenance_mode,
        maintenance_message=setting.maintenance_message,
        auto_backup=setting.auto_backup,
        email_notif=setting.email_notif,
        webhook_url=setting.webhook_url,
        updated_at=setting.updated_at,
    )


@router.put("/settings", response_model=FullSettingsResponse)
async def update_admin_settings(
    payload: UpdateSettingsRequest,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    """Admin endpoint: Update system settings including maintenance mode and branding."""
    setting = await get_or_create_system_setting(db)

    prev_maintenance = setting.maintenance_mode

    for field, val in payload.dict(exclude_unset=True).items():
        if hasattr(setting, field):
            setattr(setting, field, val)

    setting.updated_at = datetime.utcnow()

    # If maintenance mode just toggled ON, create a broadcast notification
    if payload.maintenance_mode is True and not prev_maintenance:
        notif = SystemNotification(
            title="Thông báo Bảo Trì Hệ Thống",
            message=setting.maintenance_message or "Hệ thống đang bảo trì định kỳ. Mọi tiến trình AI và API tạm dừng.",
            type="danger",
            is_broadcast=True,
        )
        db.add(notif)
    elif payload.maintenance_mode is False and prev_maintenance:
        notif = SystemNotification(
            title="Hệ thống đã hoạt động bình thường",
            message="Quá trình bảo trì đã hoàn tất. Cảm ơn sự kiên nhẫn của bạn!",
            type="success",
            is_broadcast=True,
        )
        db.add(notif)
    elif payload.broadcast_update and payload.broadcast_message:
        notif = SystemNotification(
            title=f"Cập nhật hệ thống: {setting.site_name}",
            message=payload.broadcast_message,
            type="info",
            is_broadcast=True,
        )
        db.add(notif)

    await db.commit()
    await db.refresh(setting)

    return FullSettingsResponse(
        site_name=setting.site_name,
        site_title=setting.site_title,
        site_desc=setting.site_desc,
        brand_logo_url=setting.brand_logo_url,
        favicon_url=setting.favicon_url,
        default_lang=setting.default_lang,
        maintenance_mode=setting.maintenance_mode,
        maintenance_message=setting.maintenance_message,
        auto_backup=setting.auto_backup,
        email_notif=setting.email_notif,
        webhook_url=setting.webhook_url,
        updated_at=setting.updated_at,
    )


@router.post("/upload-logo")
async def upload_brand_logo(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    """
    Admin endpoint: Upload brand logo image (PNG, JPG, SVG, WebP).
    Stores and returns base64 data URI or saves to public storage.
    """
    allowed_content_types = ["image/png", "image/jpeg", "image/jpg", "image/svg+xml", "image/webp"]
    if file.content_type not in allowed_content_types:
        raise HTTPException(
            status_code=400,
            detail="Định dạng ảnh không hợp lệ. Chỉ chấp nhận PNG, JPG, SVG hoặc WebP.",
        )

    contents = await file.read()
    if len(contents) > 5 * 1024 * 1024:  # 5MB max
        raise HTTPException(status_code=400, detail="Ảnh logo không được vượt quá 5MB.")

    # Save to uploads or convert to data URI for universal portability
    b64_str = base64.b64encode(contents).decode("utf-8")
    data_uri = f"data:{file.content_type};base64,{b64_str}"

    # Update system setting
    setting = await get_or_create_system_setting(db)
    setting.brand_logo_url = data_uri
    setting.updated_at = datetime.utcnow()
    await db.commit()

    return {
        "status": "success",
        "logo_url": data_uri,
        "message": "Cập nhật logo thương hiệu thành công!",
    }


@router.delete("/brand-logo")
async def reset_brand_logo(
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    """Admin endpoint: Reset brand logo back to default."""
    setting = await get_or_create_system_setting(db)
    setting.brand_logo_url = None
    setting.updated_at = datetime.utcnow()
    await db.commit()
    return {"status": "success", "message": "Đã đặt lại logo về mặc định."}


# ── Notifications APIs ──
@router.get("/notifications", response_model=List[NotificationItem])
async def get_notifications(
    db: AsyncSession = Depends(get_db),
    user: Optional[User] = Depends(get_optional_user),
):
    """
    Get notifications for user (Broadcasts + user-specific).
    """
    query = select(SystemNotification).order_by(desc(SystemNotification.created_at)).limit(30)
    res = await db.execute(query)
    notifs = res.scalars().all()

    # Always ensure a default welcome notification exists if none exist
    if not notifs:
        default_notif = SystemNotification(
            title="Chào mừng đến với VeloX AI Gateway",
            message="Trải nghiệm nền tảng AI thế hệ mới với hàng chục Model Chat, Image, Video và Audio đỉnh cao!",
            type="info",
            is_broadcast=True,
        )
        db.add(default_notif)
        await db.commit()
        await db.refresh(default_notif)
        notifs = [default_notif]

    return [
        NotificationItem(
            id=n.id,
            title=n.title,
            message=n.message,
            type=n.type,
            is_broadcast=n.is_broadcast,
            is_read=n.is_read,
            created_at=n.created_at,
        )
        for n in notifs
    ]


@router.post("/notifications/mark-all-read")
async def mark_all_notifications_read(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Mark all notifications as read for current user."""
    res = await db.execute(select(SystemNotification))
    notifs = res.scalars().all()
    for n in notifs:
        n.is_read = True
    await db.commit()
    return {"status": "success", "message": "Đã đánh dấu tất cả thông báo là đã đọc."}


@router.post("/notifications", response_model=NotificationItem)
async def create_broadcast_notification(
    payload: CreateNotificationRequest,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    """Admin endpoint: Post a new broadcast or user-specific notification."""
    notif = SystemNotification(
        title=payload.title,
        message=payload.message,
        type=payload.type,
        is_broadcast=payload.is_broadcast,
        user_id=payload.user_id,
    )
    db.add(notif)
    await db.commit()
    await db.refresh(notif)
    return NotificationItem(
        id=notif.id,
        title=notif.title,
        message=notif.message,
        type=notif.type,
        is_broadcast=notif.is_broadcast,
        is_read=notif.is_read,
        created_at=notif.created_at,
    )

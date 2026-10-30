"""
System Settings, Brand Customization & Notifications Router
"""
import os
import uuid
import json
import base64
from datetime import datetime
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Request, status, Query
from pydantic import BaseModel

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc, or_, func

from app.core.database import get_db
from app.core.security import get_current_user
from app.modules.users.models import User
from app.modules.system.models import SystemSetting, SystemNotification, SystemTranslation, LandingSection
from app.modules.billing.models import PaymentTransaction, CreditPackage
from app.modules.logs.models import ApiCallLog, MediaGenerationLog
from app.modules.pools.models import ServicePool, ProviderCredential
from app.modules.accounting.models import ExpenseEntry

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
    google_client_id: Optional[str] = None
    google_client_secret: Optional[str] = None
    telegram_bot_username: Optional[str] = None
    telegram_bot_token: Optional[str] = None
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
    google_client_id: Optional[str] = None
    google_client_secret: Optional[str] = None
    telegram_bot_username: Optional[str] = None
    telegram_bot_token: Optional[str] = None
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
        google_client_id=getattr(setting, "google_client_id", None),
        google_client_secret=getattr(setting, "google_client_secret", None),
        telegram_bot_username=getattr(setting, "telegram_bot_username", None),
        telegram_bot_token=getattr(setting, "telegram_bot_token", None),
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
        google_client_id=getattr(setting, "google_client_id", None),
        google_client_secret=getattr(setting, "google_client_secret", None),
        telegram_bot_username=getattr(setting, "telegram_bot_username", None),
        telegram_bot_token=getattr(setting, "telegram_bot_token", None),
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


# ==========================================
# MULTILINGUAL / TRANSLATION MANAGEMENT
# ==========================================

class TranslationItem(BaseModel):
    key: str
    category: str
    vi: Optional[str] = ""
    en: Optional[str] = ""
    zh: Optional[str] = ""
    ja: Optional[str] = ""
    ko: Optional[str] = ""
    updated_at: Optional[datetime] = None


class TranslationListResponse(BaseModel):
    items: List[TranslationItem]
    total: int
    page: int
    page_size: int
    categories: List[str]


class UpdateTranslationRequest(BaseModel):
    vi: Optional[str] = None
    en: Optional[str] = None
    zh: Optional[str] = None
    ja: Optional[str] = None
    ko: Optional[str] = None
    category: Optional[str] = None


class CreateTranslationRequest(BaseModel):
    key: str
    category: Optional[str] = "common"
    vi: Optional[str] = ""
    en: Optional[str] = ""
    zh: Optional[str] = ""
    ja: Optional[str] = ""
    ko: Optional[str] = ""


async def seed_default_translations(db: AsyncSession):
    """Seed base multilingual translations into system_translations if empty or missing keys."""
    try:
        cnt = (await db.execute(select(func.count()).select_from(SystemTranslation))).scalar() or 0
        
        # Locate locales_seed.json
        possible_paths = [
            os.path.join(os.path.dirname(__file__), "..", "locales", "locales_seed.json"),
            os.path.join(os.path.dirname(__file__), "..", "..", "locales", "locales_seed.json"),
            os.path.join(os.getcwd(), "app", "locales", "locales_seed.json"),
        ]
        seed_path = None
        for p in possible_paths:
            norm = os.path.normpath(p)
            if os.path.exists(norm):
                seed_path = norm
                break

        if not seed_path:
            return

        import json
        with open(seed_path, "r", encoding="utf-8") as f:
            seed_data = json.load(f)

        if cnt == 0:
            for item in seed_data:
                tr = SystemTranslation(
                    key=item["key"],
                    category=item.get("category", "common"),
                    vi=item.get("vi", ""),
                    en=item.get("en", ""),
                    zh=item.get("zh", ""),
                    ja=item.get("ja", ""),
                    ko=item.get("ko", ""),
                )
                db.add(tr)
            await db.commit()
            print(f"[I18N] Successfully seeded {len(seed_data)} translation keys into database")
        else:
            # Check for any new keys that might not exist in db
            existing_res = await db.execute(select(SystemTranslation.key))
            existing_keys = set(existing_res.scalars().all())
            added_cnt = 0
            for item in seed_data:
                k = item["key"]
                if k not in existing_keys:
                    tr = SystemTranslation(
                        key=k,
                        category=item.get("category", "common"),
                        vi=item.get("vi", ""),
                        en=item.get("en", ""),
                        zh=item.get("zh", ""),
                        ja=item.get("ja", ""),
                        ko=item.get("ko", ""),
                    )
                    db.add(tr)
                    added_cnt += 1
            if added_cnt > 0:
                await db.commit()
                print(f"[I18N] Seeded {added_cnt} new translation keys into database")
    except Exception as e:
        print(f"[WARN] Error seeding translations: {e}")


@router.get("/translations", response_model=TranslationListResponse)
async def api_get_translations(
    search: Optional[str] = Query(None, description="Search by translation key or text content"),
    category: Optional[str] = Query(None, description="Filter by category"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    """
    Admin listing: view all translation keys with pagination, search, and category filters.
    """
    # Ensure seed was run
    cnt = (await db.execute(select(func.count()).select_from(SystemTranslation))).scalar() or 0
    if cnt == 0:
        await seed_default_translations(db)

    base_query = select(SystemTranslation)
    count_query = select(func.count()).select_from(SystemTranslation)

    if category and category != "ALL":
        base_query = base_query.where(SystemTranslation.category == category)
        count_query = count_query.where(SystemTranslation.category == category)

    if search and search.strip():
        term = f"%{search.strip()}%"
        base_query = base_query.where(
            or_(
                SystemTranslation.key.ilike(term),
                SystemTranslation.vi.ilike(term),
                SystemTranslation.en.ilike(term),
                SystemTranslation.zh.ilike(term),
                SystemTranslation.ja.ilike(term),
                SystemTranslation.ko.ilike(term),
            )
        )
        count_query = count_query.where(
            or_(
                SystemTranslation.key.ilike(term),
                SystemTranslation.vi.ilike(term),
                SystemTranslation.en.ilike(term),
                SystemTranslation.zh.ilike(term),
                SystemTranslation.ja.ilike(term),
                SystemTranslation.ko.ilike(term),
            )
        )

    total = (await db.execute(count_query)).scalar() or 0
    offset = (page - 1) * page_size
    items_res = await db.execute(base_query.order_by(SystemTranslation.key.asc()).offset(offset).limit(page_size))
    items = items_res.scalars().all()

    # Get distinct categories
    cats_res = await db.execute(select(SystemTranslation.category).distinct().order_by(SystemTranslation.category.asc()))
    categories = [c for c in cats_res.scalars().all() if c]

    return TranslationListResponse(
        items=[
            TranslationItem(
                key=it.key,
                category=it.category,
                vi=it.vi or "",
                en=it.en or "",
                zh=it.zh or "",
                ja=it.ja or "",
                ko=it.ko or "",
                updated_at=it.updated_at,
            )
            for it in items
        ],
        total=total,
        page=page,
        page_size=page_size,
        categories=categories,
    )


@router.get("/translations/bundle")
async def api_get_translations_bundle(
    db: AsyncSession = Depends(get_db),
):
    """
    Public endpoint: Returns all translations formatted as nested dictionaries for i18next runtime override.
    """
    cnt = (await db.execute(select(func.count()).select_from(SystemTranslation))).scalar() or 0
    if cnt == 0:
        await seed_default_translations(db)

    res = await db.execute(select(SystemTranslation))
    translations = res.scalars().all()

    def set_deep(target: dict, key_path: str, value: str):
        parts = key_path.split(".")
        curr = target
        for p in parts[:-1]:
            if p not in curr or not isinstance(curr[p], dict):
                curr[p] = {}
            curr = curr[p]
        curr[parts[-1]] = value

    bundle = {
        "vi": {},
        "en": {},
        "zh": {},
        "ja": {},
        "ko": {},
    }

    for t in translations:
        if t.vi: set_deep(bundle["vi"], t.key, t.vi)
        if t.en: set_deep(bundle["en"], t.key, t.en)
        if t.zh: set_deep(bundle["zh"], t.key, t.zh)
        if t.ja: set_deep(bundle["ja"], t.key, t.ja)
        if t.ko: set_deep(bundle["ko"], t.key, t.ko)

    return {"status": "success", "bundle": bundle}


@router.put("/translations/{key:path}")
async def api_update_translation(
    key: str,
    payload: UpdateTranslationRequest,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    """
    Admin endpoint: Update an existing translation key in any language.
    """
    stmt = select(SystemTranslation).where(SystemTranslation.key == key)
    res = await db.execute(stmt)
    item = res.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="Translation key not found")

    if payload.vi is not None:
        item.vi = payload.vi
    if payload.en is not None:
        item.en = payload.en
    if payload.zh is not None:
        item.zh = payload.zh
    if payload.ja is not None:
        item.ja = payload.ja
    if payload.ko is not None:
        item.ko = payload.ko
    if payload.category is not None:
        item.category = payload.category

    item.updated_at = datetime.utcnow()
    await db.commit()
    await db.refresh(item)

    return {
        "status": "success",
        "message": f"Translation key '{key}' updated successfully",
        "item": TranslationItem(
            key=item.key,
            category=item.category,
            vi=item.vi or "",
            en=item.en or "",
            zh=item.zh or "",
            ja=item.ja or "",
            ko=item.ko or "",
            updated_at=item.updated_at,
        ),
    }


@router.post("/translations")
async def api_create_translation(
    payload: CreateTranslationRequest,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    """
    Admin endpoint: Create a new translation key.
    """
    clean_key = payload.key.strip()
    if not clean_key:
        raise HTTPException(status_code=400, detail="Key cannot be empty")

    stmt = select(SystemTranslation).where(SystemTranslation.key == clean_key)
    res = await db.execute(stmt)
    if res.scalar_one_or_none():
        raise HTTPException(status_code=400, detail=f"Key '{clean_key}' already exists")

    cat = payload.category.strip() if payload.category else "common"
    if not cat and "." in clean_key:
        cat = clean_key.split(".")[0]

    item = SystemTranslation(
        key=clean_key,
        category=cat or "common",
        vi=payload.vi or "",
        en=payload.en or "",
        zh=payload.zh or "",
        ja=payload.ja or "",
        ko=payload.ko or "",
    )
    db.add(item)
    await db.commit()
    await db.refresh(item)

    return {
        "status": "success",
        "message": f"Translation key '{clean_key}' created successfully",
        "item": TranslationItem(
            key=item.key,
            category=item.category,
            vi=item.vi or "",
            en=item.en or "",
            zh=item.zh or "",
            ja=item.ja or "",
            ko=item.ko or "",
            updated_at=item.updated_at,
        ),
    }


@router.delete("/translations/{key:path}")
async def api_delete_translation(
    key: str,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    """
    Admin endpoint: Delete a translation key.
    """
    stmt = select(SystemTranslation).where(SystemTranslation.key == key)
    res = await db.execute(stmt)
    item = res.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="Translation key not found")

    await db.delete(item)
    await db.commit()
    return {"status": "success", "message": f"Translation key '{key}' deleted successfully"}


@router.get("/dashboard")
async def get_system_dashboard(
    year: int = Query(2026, description="Filter year for balance & transactions"),
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    """
    Admin endpoint: Returns complete CRM & AI Gateway dashboard statistics:
    - KPIs (Users, Revenue, Lead Conversion, Daily Income, Total Requests)
    - Package Sales Breakdown
    - 4 Model Categories (Chat, Image, Video, Dev Request)
    - 12-Month Balance Overview (Revenue vs Cost)
    - Recent Payment Transactions / Deals
    - Service Pool Health Status
    """
    # 1. Top KPIs
    u_count = (await db.execute(select(func.count(User.id)))).scalar() or 0
    rev_sum = float((await db.execute(
        select(func.sum(PaymentTransaction.amount_vnd)).where(PaymentTransaction.status.in_(["COMPLETED", "PAID", "SUCCESS"]))
    )).scalar() or 0.0)
    
    paying_users = (await db.execute(
        select(func.count(func.distinct(PaymentTransaction.user_id))).where(PaymentTransaction.status.in_(["COMPLETED", "PAID", "SUCCESS"]))
    )).scalar() or 0
    lead_conv = round((paying_users / u_count * 100), 1) if u_count > 0 else 0.0
    
    now = datetime.now()
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    daily_rev = float((await db.execute(
        select(func.sum(PaymentTransaction.amount_vnd)).where(
            PaymentTransaction.status.in_(["COMPLETED", "PAID", "SUCCESS"]),
            PaymentTransaction.created_at >= today_start
        )
    )).scalar() or 0.0)
    
    api_count = (await db.execute(select(func.count(ApiCallLog.id)))).scalar() or 0
    media_count = (await db.execute(select(func.count(MediaGenerationLog.id)))).scalar() or 0
    cred_reqs = (await db.execute(select(func.sum(ProviderCredential.requests_count)))).scalar() or 0
    total_reqs = api_count + media_count + (cred_reqs or 0)

    # 2. Package Sales
    pkgs_res = await db.execute(select(CreditPackage).order_by(CreditPackage.sort_order.asc(), CreditPackage.price_vnd.asc()))
    all_pkgs = pkgs_res.scalars().all()
    
    pkg_sales_map = {}
    for p in all_pkgs:
        p_name = f"{p.name} ({int(p.price_vnd / 1000)}K)" if p.price_vnd < 1000000 else f"{p.name} ({p.price_vnd / 1000000:.1f}M)"
        pkg_sales_map[str(p.id)] = {"name": p_name, "price": float(p.price_vnd), "sales": 0, "revenue": 0.0}

    # Count transactions by package
    txns_all = (await db.execute(select(PaymentTransaction).where(PaymentTransaction.status.in_(["COMPLETED", "PAID", "SUCCESS"])))).scalars().all()
    for txn in txns_all:
        pkg_id = str(txn.package_id) if txn.package_id else None
        matched = False
        if pkg_id and pkg_id in pkg_sales_map:
            pkg_sales_map[pkg_id]["sales"] += 1
            pkg_sales_map[pkg_id]["revenue"] += float(txn.amount_vnd)
            matched = True
        else:
            for k, v in pkg_sales_map.items():
                if abs(v["price"] - float(txn.amount_vnd)) < 1.0:
                    v["sales"] += 1
                    v["revenue"] += float(txn.amount_vnd)
                    matched = True
                    break
        if not matched and all_pkgs:
            first_k = str(all_pkgs[0].id)
            pkg_sales_map[first_k]["sales"] += 1
            pkg_sales_map[first_k]["revenue"] += float(txn.amount_vnd)

    package_sales_data = []
    if not pkg_sales_map:
        package_sales_data = [
            {"name": "Starter (50K)", "sales": 0, "revenue": 0.0},
            {"name": "Pro (200K)", "sales": 0, "revenue": 0.0},
            {"name": "Studio (500K)", "sales": 0, "revenue": 0.0},
            {"name": "Enterprise (2M)", "sales": 0, "revenue": 0.0},
        ]
    else:
        for k, v in list(pkg_sales_map.items())[:6]:
            package_sales_data.append({
                "name": v["name"],
                "sales": v["sales"],
                "revenue": round(v["revenue"] / 1000000.0, 2),
            })

    # 3. 4 Model Categories
    img_count = (await db.execute(select(func.count(MediaGenerationLog.id)).where(MediaGenerationLog.media_type == "IMAGE"))).scalar() or 0
    vid_count = (await db.execute(select(func.count(MediaGenerationLog.id)).where(MediaGenerationLog.media_type == "VIDEO"))).scalar() or 0
    chat_count = (await db.execute(select(func.count(ApiCallLog.id)).where(or_(ApiCallLog.ip_address.is_(None), ApiCallLog.ip_address == "")))).scalar() or 0
    dev_count = (await db.execute(select(func.count(ApiCallLog.id)).where(ApiCallLog.ip_address.isnot(None), ApiCallLog.ip_address != ""))).scalar() or 0
    
    if cred_reqs:
        chat_count += cred_reqs

    total_cat_reqs = chat_count + img_count + vid_count + dev_count
    if total_cat_reqs > 0:
        c_val = round((chat_count / total_cat_reqs) * 100)
        i_val = round((img_count / total_cat_reqs) * 100)
        v_val = round((vid_count / total_cat_reqs) * 100)
        d_val = max(0, 100 - c_val - i_val - v_val)
    else:
        c_val, i_val, v_val, d_val = 40, 30, 20, 10

    def fmt_reqs(n: int) -> str:
        if n >= 1000000:
            return f"{n/1000000:.1f}M"
        if n >= 1000:
            return f"{n/1000:.1f}K"
        return str(n)

    model_category_data = [
        {"name": "Modal Chat", "value": c_val, "color": "#6366f1", "reqs": fmt_reqs(chat_count)},
        {"name": "Modal Tạo Ảnh", "value": i_val, "color": "#10b981", "reqs": fmt_reqs(img_count)},
        {"name": "Modal Tạo Video", "value": v_val, "color": "#f59e0b", "reqs": fmt_reqs(vid_count)},
        {"name": "Modal Req Dev", "value": d_val, "color": "#8b5cf6", "reqs": fmt_reqs(dev_count)},
    ]

    # 4. Balance Overview (12 months)
    months_labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    monthly_rev = {m: 0.0 for m in range(1, 13)}
    monthly_cost = {m: 0.0 for m in range(1, 13)}

    for txn in txns_all:
        if txn.created_at and txn.created_at.year == year:
            monthly_rev[txn.created_at.month] += float(txn.amount_vnd)

    expenses_res = await db.execute(select(ExpenseEntry))
    all_expenses = expenses_res.scalars().all()
    for exp in all_expenses:
        if exp.created_at and exp.created_at.year == year:
            monthly_cost[exp.created_at.month] += float(exp.amount_vnd)

    balance_overview_data = []
    for m_idx in range(1, 13):
        balance_overview_data.append({
            "month": months_labels[m_idx - 1],
            "revenue": round(monthly_rev[m_idx] / 1000000.0, 2),
            "cost": round(monthly_cost[m_idx] / 1000000.0, 2),
        })

    total_cost_sum = sum(float(e.amount_vnd) for e in all_expenses)
    gross_margin = round(((rev_sum - total_cost_sum) / rev_sum * 100.0), 1) if rev_sum > 0 else 0.0

    # 5. Recent Deals (Latest 10 transactions)
    deals_stmt = select(PaymentTransaction, User).outerjoin(User, PaymentTransaction.user_id == User.id).order_by(desc(PaymentTransaction.created_at)).limit(10)
    deals_rows = (await db.execute(deals_stmt)).all()
    
    recent_deals = []
    for txn, u in deals_rows:
        name = (u.full_name or u.email) if u else "Khách vãng lai"
        initials = "".join([part[0].upper() for part in name.replace("@", " ").split()[:2]]) or "VX"
        st = txn.status.upper() if txn.status else "PENDING"
        st_label = "Thành công" if st in ["COMPLETED", "PAID", "SUCCESS"] else ("Chờ xử lý" if st == "PENDING" else "Đã hủy")
        st_type = "success" if st in ["COMPLETED", "PAID", "SUCCESS"] else ("warning" if st == "PENDING" else "danger")
        
        pkg_name = "Nạp ví Credits"
        if txn.package_id and str(txn.package_id) in pkg_sales_map:
            pkg_name = pkg_sales_map[str(txn.package_id)]["name"]
        
        date_str = txn.created_at.strftime("%d/%m/%Y %H:%M") if txn.created_at else now.strftime("%d/%m/%Y %H:%M")
        recent_deals.append({
            "id": txn.transaction_code or f"TXN-{str(txn.id)[:8]}",
            "user": name,
            "avatar": initials,
            "package": pkg_name,
            "status": st_label,
            "statusType": st_type,
            "amount": f"{int(txn.amount_vnd):,} ₫".replace(",", "."),
            "date": date_str,
        })

    # 6. Pool Health
    pools_rows = (await db.execute(select(ServicePool))).scalars().all()
    pool_health_items = []
    for pool in pools_rows:
        creds = pool.credentials or []
        tot_keys = len(creds)
        act_keys = sum(1 for c in creds if c.status == "ACTIVE")
        
        if not pool.is_active or tot_keys == 0:
            p_status = "danger"
            p_quota = "Tạm dừng"
        elif act_keys < tot_keys:
            p_status = "warning"
            p_quota = f"{act_keys}/{tot_keys} Hoạt động"
        else:
            p_status = "active"
            p_quota = "Ổn định"
            
        pool_health_items.append({
            "name": pool.name,
            "status": p_status,
            "keys": f"{act_keys}/{tot_keys} Active Keys",
            "quota": p_quota,
        })

    return {
        "status": "success",
        "data": {
            "kpis": {
                "total_users": u_count,
                "total_users_trend": "+100%",
                "total_revenue_vnd": rev_sum,
                "total_revenue_trend": "+15%",
                "lead_conversion": lead_conv,
                "lead_conversion_trend": "+5%",
                "daily_income_vnd": daily_rev,
                "daily_income_trend": "+0%",
                "total_requests": total_reqs,
                "total_requests_trend": "+12%",
            },
            "package_sales": package_sales_data,
            "model_categories": model_category_data,
            "balance_overview": balance_overview_data,
            "balance_summary": {
                "total_revenue_vnd": rev_sum,
                "total_cost_vnd": total_cost_sum,
                "gross_margin_pct": gross_margin,
            },
            "recent_deals": recent_deals,
            "pool_health": pool_health_items,
            "year": year,
        }
    }


# ══════════════════════════════════════════════════════════════════════════════
# LANDING PAGE MANAGEMENT (SECTIONS, HERO, FEATURES, PRICING, TESTIMONIALS, CTA)
# ══════════════════════════════════════════════════════════════════════════════

DEFAULT_LANDING_SECTIONS = [
    {
        "id": "hero",
        "section_key": "hero",
        "title": "Hero Banner & Visual Showcase",
        "order": 1,
        "is_active": True,
        "content": json.dumps({
            "badge": "CỔNG KẾT NỐI AI GATEWAY THẾ HỆ MỚI",
            "heading_gradient": "Hơn 156+ AI Model Đỉnh Cao Thế Giới",
            "heading_sub": "Hội Tụ Tại Một Cổng Kết Nối Duy Nhất",
            "description": "Truy cập không giới hạn GPT-4o, Claude 3.5 Sonnet, Midjourney, FLUX, Kling và Luma AI. Tối ưu chi phí tới 80% với bộ nhớ đệm Context Caching và thanh toán linh hoạt qua VietQR.",
            "cta_primary_text": "Khám Phá AI Studio",
            "cta_primary_link": "/studio",
            "cta_secondary_text": "Dành Cho Lập Trình Viên",
            "cta_secondary_link": "/docs",
            "stat_models": "156+",
            "stat_models_desc": "Mô Hình AI Cao Cấp",
            "stat_latency": "99.98%",
            "stat_latency_desc": "Uptime & Băng Thông VIP",
            "stat_savings": "80%",
            "stat_savings_desc": "Tiết Kiệm Với Prompt Cache",
            "video_poster": "/velox_pro_poster.jpg"
        }, ensure_ascii=False)
    },
    {
        "id": "partners",
        "section_key": "partners",
        "title": "Đối Tác Công Nghệ Hàng Đầu",
        "order": 2,
        "is_active": True,
        "content": json.dumps({
            "title": "Tích Hợp Sẵn Cùng Các Đơn Vị Phát Triển AI Hàng Đầu",
            "partners": [
                {"name": "OpenAI", "badge": "Official"},
                {"name": "Anthropic", "badge": "Claude 3.5"},
                {"name": "Google DeepMind", "badge": "Gemini 1.5 Pro"},
                {"name": "ByteDance", "badge": "Seedance 2.5"},
                {"name": "Midjourney", "badge": "v6.1 Photo"},
                {"name": "Meta AI", "badge": "Llama 3.3"}
            ]
        }, ensure_ascii=False)
    },
    {
        "id": "features",
        "section_key": "features",
        "title": "Tính Năng & Kiến Trúc Cốt Lõi",
        "order": 3,
        "is_active": True,
        "content": json.dumps({
            "tag": "KIẾN TRÚC VƯỢT TRỘI",
            "heading": "Hệ Thống Hạ Tầng AI Chuẩn Doanh Nghiệp",
            "sub_desc": "Xây dựng trên nền tảng Gateway chịu tải hàng triệu request mỗi phút với độ trễ thấp nhất thị trường.",
            "cards": [
                {
                    "id": "studio",
                    "icon": "HiOutlinePhoto",
                    "title": "Multi-Modal AI Studio Trực Quan",
                    "desc": "Tạo ảnh siêu thực, dựng video điện ảnh và chuyển đổi văn bản thành giọng nói trên một không gian làm việc đồng nhất.",
                    "tags": ["Midjourney 6.1 & FLUX", "Kling 1.5 & Luma", "Render 4K Siêu Nét"]
                },
                {
                    "id": "router",
                    "icon": "HiOutlineCpuChip",
                    "title": "Multi-Provider Router & Load Balancing",
                    "desc": "Bộ định tuyến thông minh tự động phân bổ luồng yêu cầu đến máy chủ có độ trễ thấp nhất và chi phí tối ưu nhất.",
                    "tags": ["Độ Trễ Cực Thấp", "Hàng Đợi Ưu Tiên VIP", "Phân Bổ Tải Thông Minh"]
                },
                {
                    "id": "gateway",
                    "icon": "HiOutlineBolt",
                    "title": "Smart Pool Gateway & Prompt Cache",
                    "desc": "Hệ thống tự động xoay vòng API Key dự phòng khi NCC gặp sự cố, tự giải mã Cloudflare Captcha và kích hoạt bộ nhớ đệm Context Caching giúp tiết kiệm tới 80% chi phí.",
                    "tags": ["Zero Downtime Failover", "Giảm 80% Phí Cache", "Bảo Mật Chuẩn Doanh Nghiệp"]
                }
            ]
        }, ensure_ascii=False)
    },
    {
        "id": "models",
        "section_key": "models",
        "title": "Danh Mục Mô Hình Tiêu Biểu",
        "order": 4,
        "is_active": True,
        "content": json.dumps({
            "tag": "DANH MỤC TIÊU BIỂU",
            "heading": "Khám Phá Các Mô Hình Hàng Đầu",
            "sub_desc": "Bảng giá niêm yết minh bạch theo số lượng Credit thực tế bị trừ. Không phí phát sinh hay duy trì ẩn.",
            "view_all_text": "Xem Toàn Bộ 100+ Model Trên VeloX",
            "categories": ["ALL", "CHAT", "IMAGE", "VIDEO"]
        }, ensure_ascii=False)
    },
    {
        "id": "developer",
        "section_key": "developer",
        "title": "Tích Hợp Developer & SDK",
        "order": 5,
        "is_active": True,
        "content": json.dumps({
            "tag": "DÀNH CHO LẬP TRÌNH VIÊN",
            "heading": "Tích Hợp Trong 30 Giây Với Chuẩn OpenAI",
            "sub_desc": "Chỉ cần thay đổi baseURL và truyền API Key của VeloX, bạn có thể gọi toàn bộ mô hình Claude, DeepSeek, Gemini, Midjourney mà không phải sửa logic xử lý kết quả.",
            "base_url": "https://velox.nexoratech.com.vn/v1",
            "checkpoints": [
                "Base URL chuẩn quốc tế: https://velox.nexoratech.com.vn/v1",
                "Hỗ trợ cả 2 header: Authorization: Bearer và x-api-key",
                "Cấu hình 1-click cho các ứng dụng client phổ biến:"
            ],
            "clients": ["Cursor IDE", "Cline (VS Code)", "NextChat", "Cherry Studio", "LibreChat"],
            "cta_text": "Xem Tài Liệu Tích Hợp Kỹ Thuật",
            "cta_link": "/docs"
        }, ensure_ascii=False)
    },
    {
        "id": "pricing",
        "section_key": "pricing",
        "title": "Bảng Giá Gói Hội Viên & Nạp Credit",
        "order": 6,
        "is_active": True,
        "content": json.dumps({
            "tag": "BẢNG GIÁ & HỘI VIÊN",
            "heading_subscription": "Gói Hội Viên Tháng Tiết Kiệm",
            "heading_topup": "Nạp Bao Nhiêu, Dùng Bấy Nhiêu",
            "sub_desc_subscription": "Đầy đủ đặc quyền hội viên, mở khóa 156+ mô hình AI đỉnh cao thế giới và băng thông ưu tiên cao nhất.",
            "sub_desc_topup": "Không bị bó buộc hợp đồng cố định. Tín dụng sử dụng vĩnh viễn không hết hạn, nạp tự động qua VietQR trong 3 giây.",
            "compare_text": "Xem chi tiết so sánh tính năng & hạn ngạch toàn diện tại Trang Quản Lý Gói",
            "compare_link": "/subscription",
            "faq": [
                {"q": "Credit được tính như thế nào?", "a": "Mỗi tác vụ tạo ảnh, video hoặc gọi API sẽ tiêu hao một lượng Credit cụ thể được công khai minh bạch."},
                {"q": "Gói nạp thêm có bị hết hạn không?", "a": "Hoàn toàn không. Credit trong các gói nạp Pay-as-you-go được bảo lưu vĩnh viễn trong tài khoản của bạn."},
                {"q": "Thanh toán có tự động kích hoạt ngay không?", "a": "Có! Hệ thống tích hợp VietQR tự động cộng Credit và kích hoạt gói chỉ sau 3 giây từ khi chuyển khoản."}
            ]
        }, ensure_ascii=False)
    },
    {
        "id": "testimonials",
        "section_key": "testimonials",
        "title": "Đánh Giá & Nhận Xét Của Khách Hàng",
        "order": 7,
        "is_active": True,
        "content": json.dumps({
            "tag": "KHÁCH HÀNG & ĐỐI TÁC",
            "heading": "Hơn 12,000+ Nhà Sáng Tạo & Doanh Nghiệp Tin Dùng",
            "sub_desc": "Lắng nghe những chia sẻ từ các Content Creator, Developer và Agency đang sử dụng VeloX mỗi ngày.",
            "reviews": [
                {
                    "name": "Hoàng Nam",
                    "role": "Lead Prompt Engineer",
                    "company": "Creative Media Hub",
                    "rating": 5,
                    "text": "VeloX giúp studio của chúng tôi tiết kiệm hơn 60% chi phí AI mỗi tháng. Việc có thể gọi cả FLUX, Midjourney và Kling trên một API duy nhất là một cuộc cách mạng!",
                    "avatar": "HN"
                },
                {
                    "name": "Thùy Linh",
                    "role": "Founder & Marketing Director",
                    "company": "Nova Growth Agency",
                    "rating": 5,
                    "text": "Tốc độ phản hồi cực nhanh, nạp tiền qua QR 3 giây là có credit ngay. Giao diện Studio trực quan giúp team content của mình tạo video quảng cáo trong vài phút.",
                    "avatar": "TL"
                },
                {
                    "name": "Minh Trí",
                    "role": "Fullstack Developer",
                    "company": "SaaS Builder",
                    "rating": 5,
                    "text": "Cực kỳ ấn tượng với Gateway tương thích 100% chuẩn OpenAI. Mình chỉ cần đổi baseURL trên Cursor IDE là dùng được Claude 3.5 Sonnet mà không sợ bị chặn thẻ quốc tế.",
                    "avatar": "MT"
                }
            ]
        }, ensure_ascii=False)
    },
    {
        "id": "cta_banner",
        "section_key": "cta_banner",
        "title": "CTA Kêu Gọi Hành Động (Cuối Trang)",
        "order": 8,
        "is_active": True,
        "content": json.dumps({
            "tag": "TRẢI NGHIỆM MIỄN PHÍ HÔM NAY",
            "title": "Sẵn Sàng Tăng Tốc Cùng VeloX AI Gateway?",
            "subtitle": "Tạo tài khoản ngay bây giờ để nhận tín dụng trải nghiệm toàn bộ các mô hình AI đỉnh cao thế giới trong một giao diện duy nhất.",
            "btn_primary_text": "Bắt Đầu Sáng Tạo Ngay",
            "btn_primary_link": "/studio",
            "btn_secondary_text": "Đăng Ký Tài Khoản Mới",
            "btn_secondary_link": "/register"
        }, ensure_ascii=False)
    }
]


async def seed_default_landing_sections(db: AsyncSession):
    """Seed standard landing sections if table is empty."""
    res = await db.execute(select(LandingSection))
    existing = res.scalars().all()
    if not existing:
        for s in DEFAULT_LANDING_SECTIONS:
            sec = LandingSection(
                id=s["id"],
                section_key=s["section_key"],
                title=s["title"],
                order=s["order"],
                is_active=s["is_active"],
                content=s["content"]
            )
            db.add(sec)
        await db.commit()


class ReorderLandingItem(BaseModel):
    id: str
    order: int


class UpdateLandingSectionRequest(BaseModel):
    title: Optional[str] = None
    is_active: Optional[bool] = None
    order: Optional[int] = None
    content: Optional[Dict[str, Any]] = None


class CreateLandingSectionRequest(BaseModel):
    section_key: str
    title: str
    order: Optional[int] = 99
    is_active: Optional[bool] = True
    content: Optional[Dict[str, Any]] = None


def parse_section_content(sec: LandingSection) -> Dict[str, Any]:
    c = {}
    if sec.content:
        try:
            c = json.loads(sec.content)
        except Exception:
            c = {"raw": sec.content}
    return {
        "id": sec.id,
        "section_key": sec.section_key,
        "title": sec.title,
        "order": sec.order,
        "is_active": sec.is_active,
        "content": c,
        "created_at": sec.created_at,
        "updated_at": sec.updated_at,
    }


@router.get("/landing")
async def get_public_landing_sections(db: AsyncSession = Depends(get_db)):
    """Public endpoint: Get active landing page sections sorted by order."""
    await seed_default_landing_sections(db)
    res = await db.execute(
        select(LandingSection)
        .where(LandingSection.is_active == True)
        .order_by(LandingSection.order.asc())
    )
    sections = res.scalars().all()
    return [parse_section_content(s) for s in sections]


@router.get("/landing/admin")
async def get_admin_landing_sections(
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    """Admin endpoint: Get all landing sections (active and inactive) sorted by order."""
    await seed_default_landing_sections(db)
    res = await db.execute(
        select(LandingSection).order_by(LandingSection.order.asc())
    )
    sections = res.scalars().all()
    return [parse_section_content(s) for s in sections]


@router.put("/landing/admin/reorder")
async def reorder_landing_sections(
    payload: List[ReorderLandingItem],
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    """Admin endpoint: Update display orders of landing sections."""
    for item in payload:
        res = await db.execute(select(LandingSection).where(LandingSection.id == item.id))
        sec = res.scalar_one_or_none()
        if sec:
            sec.order = item.order
            sec.updated_at = datetime.utcnow()
    await db.commit()
    return {"status": "success", "message": "Đã cập nhật thứ tự các section thành công"}


@router.post("/landing/admin/sections")
async def create_landing_section(
    payload: CreateLandingSectionRequest,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    """Admin endpoint: Create a new custom landing section."""
    existing = await db.execute(select(LandingSection).where(LandingSection.section_key == payload.section_key))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Mã section_key đã tồn tại. Vui lòng chọn mã khác.")

    sec_id = f"custom_{uuid.uuid4().hex[:8]}"
    content_str = json.dumps(payload.content or {}, ensure_ascii=False)
    sec = LandingSection(
        id=sec_id,
        section_key=payload.section_key,
        title=payload.title,
        order=payload.order or 99,
        is_active=payload.is_active if payload.is_active is not None else True,
        content=content_str,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    db.add(sec)
    await db.commit()
    await db.refresh(sec)
    return parse_section_content(sec)


@router.put("/landing/admin/sections/{section_id}")
async def update_landing_section(
    section_id: str,
    payload: UpdateLandingSectionRequest,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    """Admin endpoint: Update an existing landing section."""
    res = await db.execute(
        select(LandingSection).where(or_(LandingSection.id == section_id, LandingSection.section_key == section_id))
    )
    sec = res.scalar_one_or_none()
    if not sec:
        raise HTTPException(status_code=404, detail="Section không tồn tại")

    if payload.title is not None:
        sec.title = payload.title
    if payload.is_active is not None:
        sec.is_active = payload.is_active
    if payload.order is not None:
        sec.order = payload.order
    if payload.content is not None:
        sec.content = json.dumps(payload.content, ensure_ascii=False)
    sec.updated_at = datetime.utcnow()

    await db.commit()
    await db.refresh(sec)
    return parse_section_content(sec)


@router.delete("/landing/admin/sections/{section_id}")
async def delete_landing_section(
    section_id: str,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    """Admin endpoint: Delete a landing section."""
    res = await db.execute(
        select(LandingSection).where(or_(LandingSection.id == section_id, LandingSection.section_key == section_id))
    )
    sec = res.scalar_one_or_none()
    if not sec:
        raise HTTPException(status_code=404, detail="Section không tồn tại")

    await db.delete(sec)
    await db.commit()
    return {"status": "success", "message": f"Đã xóa section '{sec.title}' thành công"}


@router.post("/landing/admin/reset")
async def reset_landing_sections(
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    """Admin endpoint: Reset all landing sections to default templates."""
    res = await db.execute(select(LandingSection))
    existing = res.scalars().all()
    for s in existing:
        await db.delete(s)
    await db.commit()

    for s in DEFAULT_LANDING_SECTIONS:
        sec = LandingSection(
            id=s["id"],
            section_key=s["section_key"],
            title=s["title"],
            order=s["order"],
            is_active=s["is_active"],
            content=s["content"]
        )
        db.add(sec)
    await db.commit()
    return {"status": "success", "message": "Đã khôi phục toàn bộ Landing Page về giao diện mẫu mặc định"}



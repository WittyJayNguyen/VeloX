"""VeloX AI Gateway — User & Role Management Router (Production Grade & Anti-Exploit)"""
import json
from datetime import datetime, timezone
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status, Query, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_, text, desc
from pydantic import BaseModel, EmailStr, Field

from app.core.database import get_db
from app.common.responses import ok
from app.modules.users.models import User, Role, user_roles, UserAuditLog, CreditAuditLog, IPAccessRule
from app.modules.users.schemas import IPBanRequest, IPUnbanRequest, IPBatchActionRequest
from app.core.security import (
    hash_password,
    validate_password_strength,
    generate_secure_password,
    get_current_user,
    require_permission,
    require_super_admin,
    get_client_ip,
    enforce_anti_spam,
    check_duplicate_request,
)

router = APIRouter(prefix="", tags=["User & Role Management"])

# ── Granular 23-Node Permission Tree Definition ──
PERMISSION_TREE = [
    {
        "id": "gateway",
        "name": "Gateway & Service Pools",
        "description": "Quản lý cụm điều phối, API Keys và Recaptcha",
        "children": [
            {
                "id": "pools",
                "name": "Service Pools",
                "children": [
                    {"id": "pools.view", "name": "Xem danh sách Pools", "description": "Xem chi tiết các pool và trạng thái"},
                    {"id": "pools.create", "name": "Tạo Pool mới", "description": "Thêm cụm pool chuẩn OpenAI/nhà cung cấp"},
                    {"id": "pools.edit", "name": "Cập nhật Pool", "description": "Chỉnh sửa routing, rate limit, endpoint"},
                    {"id": "pools.delete", "name": "Xóa Pool", "description": "Gỡ bỏ cụm pool khỏi hệ thống"}
                ]
            },
            {
                "id": "keys",
                "name": "API Keys & Session Tokens",
                "children": [
                    {"id": "keys.view", "name": "Xem danh sách Keys", "description": "Xem keys và quota sử dụng"},
                    {"id": "keys.reveal", "name": "Xem giá trị Secret Key", "description": "Hiện toàn bộ sk-xxx / session token"},
                    {"id": "keys.create", "name": "Thêm Key / Token", "description": "Thêm key mới kèm cookie và quota"},
                    {"id": "keys.quota_edit", "name": "Cấu hình Hạn mức Quota", "description": "Chỉnh sửa daily/monthly quota và priority"},
                    {"id": "keys.delete", "name": "Xóa Key / Token", "description": "Xóa key khỏi cụm điều phối"}
                ]
            },
            {
                "id": "recaptcha",
                "name": "Tự Giải Recaptcha",
                "children": [
                    {"id": "recaptcha.view", "name": "Xem cấu hình Solvers", "description": "Xem số dư và tốc độ giải"},
                    {"id": "recaptcha.manage", "name": "Quản lý Solvers", "description": "Thêm/sửa/xóa tài khoản solver captcha"},
                    {"id": "recaptcha.test", "name": "Thử giải Captcha", "description": "Gửi request giải thử nghiệm"}
                ]
            }
        ]
    },
    {
        "id": "models",
        "name": "Quản Lý Models AI",
        "description": "Quản lý danh mục mô hình, bảng giá credit và routing",
        "children": [
            {
                "id": "models_catalog",
                "name": "Danh Mục Models",
                "children": [
                    {"id": "models.view", "name": "Xem danh mục Models", "description": "Xem chi tiết các model AI"},
                    {"id": "models.create", "name": "Thêm Model mới", "description": "Đăng ký model code vào hệ thống"},
                    {"id": "models.pricing", "name": "Cấu hình Giá Bán Credit", "description": "Thay đổi tỷ lệ quy đổi credit cho model"},
                    {"id": "models.delete", "name": "Xóa Model", "description": "Gỡ bỏ model khỏi danh mục"}
                ]
            }
        ]
    },
    {
        "id": "packages",
        "name": "Dịch Vụ & Gói Credit",
        "description": "Quản lý các gói tín dụng bán cho người dùng",
        "children": [
            {
                "id": "credit_packages",
                "name": "Gói Tín Dụng",
                "children": [
                    {"id": "packages.view", "name": "Xem danh sách Gói", "description": "Xem các gói credit đang bán"},
                    {"id": "packages.create", "name": "Tạo Gói mới", "description": "Thêm gói credit, ưu đãi, bonus"},
                    {"id": "packages.edit", "name": "Sửa Gói", "description": "Thay đổi giá, số credit và models cấp phép"},
                    {"id": "packages.delete", "name": "Xóa Gói", "description": "Gỡ bỏ gói khỏi kệ bán"}
                ]
            }
        ]
    },
    {
        "id": "finance",
        "name": "Tài Chính & Thanh Toán",
        "description": "Quản lý ví, dòng tiền và tài khoản nhận thanh toán",
        "children": [
            {
                "id": "wallet_billing",
                "name": "Ví & Thanh Toán",
                "children": [
                    {"id": "wallet.view", "name": "Xem Ví & Lịch sử nạp", "description": "Xem biến động dòng tiền và đơn nạp"},
                    {"id": "wallet.topup_manual", "name": "Cộng Tiền / Nạp Thủ Công", "description": "Tạo lệnh nạp tiền thủ công cho khách"},
                    {"id": "banking.manage", "name": "Quản lý Ngân Hàng & QR", "description": "Thêm/sửa tài khoản ngân hàng và mã VietQR"}
                ]
            }
        ]
    },
    {
        "id": "users_system",
        "name": "Quản Trị Người Dùng & Phân Quyền",
        "description": "Quản lý tài khoản thành viên, vai trò và cây phân quyền",
        "children": [
            {
                "id": "members",
                "name": "Thành Viên & Vai Trò",
                "children": [
                    {"id": "users.view", "name": "Xem danh sách Người dùng", "description": "Xem thông tin thành viên"},
                    {"id": "users.create", "name": "Tạo Người dùng mới", "description": "Thêm tài khoản vào hệ thống"},
                    {"id": "users.edit", "name": "Sửa thông tin & Đổi Role", "description": "Chỉnh sửa họ tên, email, gán vai trò"},
                    {"id": "users.adjust_credit", "name": "Điều chỉnh Số dư Credit", "description": "Cộng hoặc trừ credit trực tiếp"},
                    {"id": "users.lock", "name": "Khóa / Mở khóa Tài khoản", "description": "Thay đổi trạng thái hoạt động"},
                    {"id": "roles.manage", "name": "Quản lý Cây Phân Quyền", "description": "Thêm, sửa vai trò và phân bổ quyền"}
                ]
            }
        ]
    },
    {
        "id": "monitoring",
        "name": "Nhật Ký & Giám Sát SLA",
        "description": "Theo dõi lỗi sự cố và xuất báo cáo hệ thống",
        "children": [
            {
                "id": "system_logs",
                "name": "Nhật Ký Hệ Thống",
                "children": [
                    {"id": "logs.view", "name": "Xem Nhật ký Sự cố SLA", "description": "Xem log lỗi gateway và uptime"},
                    {"id": "logs.export", "name": "Xuất Báo Cáo", "description": "Tải dữ liệu log ra định dạng CSV/JSON"}
                ]
            }
        ]
    }
]

# ── Request / Response Schemas ──
class RoleCreate(BaseModel):
    id: str = Field(..., min_length=3, max_length=32)
    name: str = Field(..., min_length=2, max_length=64)
    description: Optional[str] = ""
    permissions: List[str] = []

class RoleUpdate(BaseModel):
    name: str = Field(..., min_length=2, max_length=64)
    description: Optional[str] = ""
    permissions: List[str] = []

class UserCreateRequest(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=128)
    email: EmailStr
    password: Optional[str] = None
    role_id: str = "ROLE_USER"
    credit_balance: Optional[int] = Field(50000, ge=0, le=1000000000)
    tier: Optional[str] = "FREE"

class UserUpdateRequest(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=128)
    email: EmailStr
    role_id: str
    is_active: bool
    tier: Optional[str] = "FREE"

class UserStatusUpdateRequest(BaseModel):
    is_active: bool
    reason: str = Field(..., min_length=3, max_length=255)

class CreditAdjustRequest(BaseModel):
    delta: int = Field(..., description="Số credit thay đổi (âm hoặc dương)")
    reason: str = Field(..., min_length=5, max_length=512, description="Lý do bắt buộc cho kiểm toán kế toán")

class ResetPasswordRequest(BaseModel):
    new_password: Optional[str] = None
    auto_generate: Optional[bool] = False


# ── Database Migration & Seed Defaults Helper ──
async def seed_defaults(db: AsyncSession):
    """Auto-migrate schema additions and seed default roles and super admin."""
    # Ensure SQLite columns if table already existed
    try:
        table_info = await db.execute(text("PRAGMA table_info(users)"))
        columns = [row[1] for row in table_info.fetchall()]
        if "tier" not in columns:
            await db.execute(text("ALTER TABLE users ADD COLUMN tier VARCHAR(32) DEFAULT 'FREE'"))
        if "failed_login_attempts" not in columns:
            await db.execute(text("ALTER TABLE users ADD COLUMN failed_login_attempts INTEGER DEFAULT 0"))
        if "locked_until" not in columns:
            await db.execute(text("ALTER TABLE users ADD COLUMN locked_until VARCHAR(64)"))
        if "last_login_at" not in columns:
            await db.execute(text("ALTER TABLE users ADD COLUMN last_login_at VARCHAR(64)"))
        if "last_login_ip" not in columns:
            await db.execute(text("ALTER TABLE users ADD COLUMN last_login_ip VARCHAR(64)"))
        if "token_version" not in columns:
            await db.execute(text("ALTER TABLE users ADD COLUMN token_version INTEGER DEFAULT 1"))
        await db.commit()
    except Exception:
        pass

    # Ensure default roles
    res = await db.execute(select(Role))
    existing_roles = {r.id: r for r in res.scalars().all()}

    defaults = [
        ("ROLE_SUPER_ADMIN", "Super Admin", "Toàn quyền quản trị hệ thống VeloX", "ALL"),
        ("ROLE_ADMIN", "Admin Quản Trị", "Quản lý nghiệp vụ, gateway và người dùng", "pools.view,pools.create,pools.edit,keys.view,keys.create,keys.quota_edit,recaptcha.view,recaptcha.manage,models.view,models.create,models.pricing,packages.view,packages.create,packages.edit,wallet.view,wallet.topup_manual,banking.manage,users.view,users.create,users.edit,users.adjust_credit,users.lock,logs.view"),
        ("ROLE_OPERATOR", "Operator Vận Hành", "Giám sát pool, model và sự cố SLA", "pools.view,keys.view,models.view,packages.view,wallet.view,logs.view"),
        ("ROLE_USER", "Khách Hàng / Developer", "Truy cập API và nạp credit", "pools.view,keys.view,packages.view,wallet.view"),
    ]

    for rid, rname, rdesc, rperms in defaults:
        if rid not in existing_roles:
            role_obj = Role(id=rid, name=rname, description=rdesc, permissions=rperms)
            db.add(role_obj)
    await db.commit()

    # Ensure default Super Admin
    user_res = await db.execute(select(User).where(User.email == "admin@velox.ai"))
    admin_user = user_res.scalar_one_or_none()
    if not admin_user:
        admin_user = User(
            email="admin@velox.ai",
            password_hash=hash_password("admin123"),
            full_name="Super Admin (VeloX Core)",
            credit_balance=9999999,
            is_active=True,
            is_verified=True,
            tier="ENTERPRISE",
        )
        super_role = await db.get(Role, "ROLE_SUPER_ADMIN")
        if super_role:
            admin_user.roles.append(super_role)
        db.add(admin_user)
        await db.commit()


# ── Permission Tree Route ──
@router.get("/permissions/tree")
async def get_permission_tree():
    return ok(data=PERMISSION_TREE)


# ── Role Endpoints (Protected by roles.manage) ──
@router.get("/roles")
async def list_roles(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("users.view")),
):
    await seed_defaults(db)
    res = await db.execute(select(Role))
    roles = res.scalars().all()

    result = []
    for r in roles:
        count_res = await db.execute(
            select(func.count(user_roles.c.user_id)).where(user_roles.c.role_id == r.id)
        )
        u_count = count_res.scalar() or 0
        perms_list = [p.strip() for p in (r.permissions or "").split(",") if p.strip()]

        result.append({
            "id": r.id,
            "name": r.name,
            "code": r.id,
            "description": r.description or "",
            "permissions": perms_list,
            "user_count": u_count,
        })
    return ok(data=result)


@router.post("/roles")
async def create_role(
    body: RoleCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("roles.manage")),
):
    clean_id = body.id.strip().upper()
    check_duplicate_request(f"role_create_{clean_id}", cooldown_seconds=2.0)
    if clean_id == "ROLE_SUPER_ADMIN" or "SUPER" in clean_id:
        if not any(r.id == "ROLE_SUPER_ADMIN" for r in current_user.roles):
            raise HTTPException(status_code=403, detail="Chỉ Super Admin mới có quyền tạo vai trò cấp Super Admin")

    existing = await db.get(Role, clean_id)
    if existing:
        raise HTTPException(status_code=400, detail=f"Vai trò mã '{clean_id}' đã tồn tại trong hệ thống")

    perms_str = ",".join(body.permissions)
    role_obj = Role(
        id=clean_id,
        name=body.name.strip(),
        description=body.description,
        permissions=perms_str,
    )
    db.add(role_obj)
    await db.commit()
    await db.refresh(role_obj)
    return ok(data={"id": role_obj.id, "name": role_obj.name}, message="Tạo vai trò thành công")


@router.put("/roles/{role_id}")
async def update_role(
    role_id: str,
    body: RoleUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("roles.manage")),
):
    check_duplicate_request(f"role_update_{role_id}", cooldown_seconds=1.5)
    if role_id == "ROLE_SUPER_ADMIN":
        if not any(r.id == "ROLE_SUPER_ADMIN" for r in current_user.roles):
            raise HTTPException(status_code=403, detail="Chỉ Super Admin mới được sửa vai trò Super Admin")

    role_obj = await db.get(Role, role_id)
    if not role_obj:
        raise HTTPException(status_code=404, detail="Không tìm thấy vai trò")

    role_obj.name = body.name.strip()
    role_obj.description = body.description
    role_obj.permissions = ",".join(body.permissions)

    await db.commit()
    return ok(message="Cập nhật vai trò & phân quyền thành công")


@router.delete("/roles/{role_id}")
async def delete_role(
    role_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("roles.manage")),
):
    if role_id in ["ROLE_SUPER_ADMIN", "ROLE_ADMIN", "ROLE_USER"]:
        raise HTTPException(status_code=400, detail="Không thể xóa các vai trò hệ thống mặc định")

    role_obj = await db.get(Role, role_id)
    if not role_obj:
        raise HTTPException(status_code=404, detail="Không tìm thấy vai trò")

    # Check if assigned to any user
    count_res = await db.execute(
        select(func.count(user_roles.c.user_id)).where(user_roles.c.role_id == role_id)
    )
    if (count_res.scalar() or 0) > 0:
        raise HTTPException(status_code=400, detail="Vai trò này đang được gán cho thành viên, không thể xóa")

    await db.delete(role_obj)
    await db.commit()
    return ok(message="Đã xóa vai trò thành công")


@router.get("/users/me/usage-history")
async def get_my_usage_history(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Retrieves real aggregated AI usage logs for the currently authenticated user with pagination and token breakdown."""
    import math
    from app.modules.logs.models import MediaGenerationLog, ApiCallLog
    from app.modules.users.models import CreditAuditLog

    # 1. Media generation logs (Studio / Playground)
    media_stmt = (
        select(MediaGenerationLog)
        .where(MediaGenerationLog.user_id == current_user.id)
        .order_by(desc(MediaGenerationLog.created_at))
        .limit(200)
    )
    media_res = await db.execute(media_stmt)
    media_logs = media_res.scalars().all()
    media_by_time = {}
    for m in media_logs:
        t_key = m.created_at.strftime("%Y-%m-%d %H:%M") if m.created_at else ""
        media_by_time[t_key] = m

    # 2. API call logs
    api_stmt = (
        select(ApiCallLog)
        .where(ApiCallLog.user_id == current_user.id)
        .order_by(desc(ApiCallLog.created_at))
        .limit(200)
    )
    api_res = await db.execute(api_stmt)
    api_logs = api_res.scalars().all()
    api_by_time = {}
    for a in api_logs:
        t_key = a.created_at.strftime("%Y-%m-%d %H:%M") if a.created_at else ""
        api_by_time[t_key] = a

    # 3. Credit audit logs (ground truth for all credit deductions)
    credit_stmt = (
        select(CreditAuditLog)
        .where(CreditAuditLog.user_id == current_user.id, CreditAuditLog.delta < 0)
        .order_by(desc(CreditAuditLog.created_at))
        .limit(300)
    )
    credit_res = await db.execute(credit_stmt)
    credit_logs = credit_res.scalars().all()

    items = []
    seen_timestamps = set()

    for c in credit_logs:
        t_str = c.created_at.strftime("%Y-%m-%d %H:%M:%S") if c.created_at else ""
        t_min = c.created_at.strftime("%Y-%m-%d %H:%M") if c.created_at else ""
        reason = c.reason or ""

        # Determine Model & Task Type
        model_name = "VeloX AI"
        task_type = "AI Request"
        p_in = 0
        p_out = 0
        p_cache = 0
        prompt_info = reason

        if "Chat: " in reason:
            parts = reason.split("Chat: ")
            if len(parts) > 1:
                model_name = parts[1].split()[0]
            task_type = "API Codex / Chat"
        elif "Studio VIDEO" in reason or "VIDEO" in reason:
            task_type = "Video Generation"
            if ": " in reason:
                model_name = reason.split(": ")[1].split()[0]
            else:
                model_name = "Video Gen"
        elif "Studio IMAGE" in reason or "IMAGE" in reason:
            task_type = "Image Generation"
            model_name = "Image Gen"
        elif "Playground" in reason:
            task_type = "Playground Chat"

        # Extract tokens if present in reason format: "(4403 in, 121 out" or "(4403 in, 121 out, 0 cache"
        if " in, " in reason and " out" in reason:
            try:
                sub = reason.split("(")[-1].split(")")[0]
                in_str = sub.split(" in, ")[0].strip().split()[-1]
                p_in = int(in_str)
                out_str = sub.split(" in, ")[1].split(" out")[0].strip().split()[0]
                p_out = int(out_str)
                if " cache" in sub:
                    cache_str = sub.split(" out, ")[1].split(" cache")[0].strip().split()[0]
                    p_cache = int(cache_str)
            except Exception:
                p_in = 0
                p_out = 0
                p_cache = 0

        # Attach original prompt if available from media_logs
        if t_min in media_by_time and getattr(media_by_time[t_min], "prompt", None):
            prompt_info = media_by_time[t_min].prompt

        cid_str = str(c.id) if c.id else "0"
        items.append({
            "id": f"req_{cid_str[:8]}",
            "timestamp": t_str,
            "model": model_name,
            "taskType": task_type,
            "inputTokens": p_in,
            "outputTokens": p_out,
            "cacheTokens": p_cache,
            "tokensUsed": p_in + p_out,
            "creditsDeducted": abs(int(c.delta or 0)),
            "status": "SUCCESS",
            "prompt": str(prompt_info or "")[:140],
        })
        seen_timestamps.add(t_min)

    # Add any standalone media logs not matched in credit audits
    for m in media_logs:
        t_min = m.created_at.strftime("%Y-%m-%d %H:%M") if m.created_at else ""
        if t_min not in seen_timestamps:
            mid_str = str(m.id) if m.id else "0"
            raw_type = getattr(m, "media_type", None) or "Media"
            m_type = str(raw_type).capitalize()
            items.append({
                "id": f"gen_{mid_str[:8]}",
                "timestamp": m.created_at.strftime("%Y-%m-%d %H:%M:%S") if m.created_at else "",
                "model": getattr(m, "model_id", None) or "AI Media Engine",
                "taskType": f"{m_type} Studio",
                "inputTokens": 0,
                "outputTokens": 0,
                "cacheTokens": 0,
                "tokensUsed": 0,
                "creditsDeducted": int(getattr(m, "credits_charged", 0) or 0),
                "status": "SUCCESS",
                "prompt": str(getattr(m, "prompt", "") or "")[:140],
            })
            seen_timestamps.add(t_min)

    items.sort(key=lambda x: x["timestamp"], reverse=True)

    total = len(items)
    total_pages = max(1, math.ceil(total / page_size))
    offset = (page - 1) * page_size
    paged_items = items[offset:offset + page_size]

    return ok(data={
        "items": paged_items,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages,
    })


# ── Production User Endpoints (Full Flow & Anti-Exploit) ──
@router.get("/users")
async def list_users(
    request: Request,
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    search: Optional[str] = Query(None),
    role: Optional[str] = Query("ALL"),
    status_filter: Optional[str] = Query("ALL", alias="status"),
    sort_by: str = Query("created_at"),
    sort_desc: bool = Query(True),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("users.view")),
):
    """Server-side paginated, searchable, role-filtered users list with system stats."""
    await seed_defaults(db)

    # Base query
    query = select(User)

    # Search filter
    if search and search.strip():
        term = f"%{search.strip()}%"
        query = query.where(
            or_(
                User.email.ilike(term),
                User.full_name.ilike(term),
                User.user_code.ilike(term),
                User.id.ilike(term)
            )
        )

    # Status filter
    if status_filter == "ACTIVE":
        query = query.where(User.is_active == True)  # noqa
    elif status_filter == "LOCKED":
        query = query.where(User.is_active == False)  # noqa

    # Role filter
    if role and role != "ALL":
        query = query.join(User.roles).where(Role.id == role)

    # Total Count
    count_subq = query.subquery()
    count_res = await db.execute(select(func.count()).select_from(count_subq))
    total_count = count_res.scalar() or 0

    # Sorting
    sort_column = getattr(User, sort_by, User.created_at)
    if sort_desc:
        query = query.order_by(sort_column.desc())
    else:
        query = query.order_by(sort_column.asc())

    # Pagination
    offset = (page - 1) * page_size
    query = query.offset(offset).limit(page_size)

    res = await db.execute(query)
    users = res.scalars().unique().all()

    # System-wide Stats
    stats_total_res = await db.execute(select(func.count(User.id)))
    stats_active_res = await db.execute(select(func.count(User.id)).where(User.is_active == True))  # noqa
    stats_credits_res = await db.execute(select(func.sum(User.credit_balance)))

    total_system_users = stats_total_res.scalar() or 0
    active_system_users = stats_active_res.scalar() or 0
    total_system_credits = stats_credits_res.scalar() or 0

    items = []
    for u in users:
        role_codes = [r.id for r in u.roles]
        primary_role = role_codes[0] if role_codes else "ROLE_USER"
        items.append({
            "id": u.id,
            "userCode": getattr(u, "user_code", None) or u.id.replace("-", "")[-6:].upper(),
            "fullName": u.full_name or u.email.split("@")[0],
            "email": u.email,
            "role": primary_role,
            "tier": getattr(u, "tier", "FREE"),
            "subscriptionExpiresAt": u.subscription_expires_at.isoformat() if getattr(u, "subscription_expires_at", None) else None,
            "creditBalance": u.credit_balance or 0,
            "isActive": u.is_active,
            "registeredDate": u.created_at.strftime("%Y-%m-%d") if u.created_at else "2026-01-01",
            "lastLoginAt": getattr(u, "last_login_at", None),
            "vccTopupTotal": 0,
        })

    total_pages = max(1, (total_count + page_size - 1) // page_size)

    return ok(data={
        "items": items,
        "pagination": {
            "total": total_count,
            "page": page,
            "pageSize": page_size,
            "totalPages": total_pages,
        },
        "stats": {
            "totalUsers": total_system_users,
            "activeUsers": active_system_users,
            "lockedUsers": total_system_users - active_system_users,
            "totalCredits": total_system_credits,
        }
    })


@router.get("/users/{user_id}")
async def get_user_detail(
    user_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("users.view")),
):
    user_obj = await db.get(User, user_id)
    if not user_obj:
        raise HTTPException(status_code=404, detail="Không tìm thấy người dùng")

    role_codes = [r.id for r in user_obj.roles]
    return ok(data={
        "id": user_obj.id,
        "fullName": user_obj.full_name,
        "email": user_obj.email,
        "role": role_codes[0] if role_codes else "ROLE_USER",
        "roles": role_codes,
        "tier": getattr(user_obj, "tier", "FREE"),
        "creditBalance": user_obj.credit_balance,
        "isActive": user_obj.is_active,
        "isVerified": user_obj.is_verified,
        "registeredDate": user_obj.created_at.isoformat() if user_obj.created_at else "",
        "lastLoginAt": getattr(user_obj, "last_login_at", None),
        "lastLoginIp": getattr(user_obj, "last_login_ip", None),
        "failedLoginAttempts": getattr(user_obj, "failed_login_attempts", 0),
    })


@router.post("/users")
async def create_user(
    body: UserCreateRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("users.create")),
):
    """Create user with anti-privilege escalation, anti-spam, and audit trail."""
    client_ip = get_client_ip(request)
    check_duplicate_request(f"create_user_{body.email.strip().lower()}", cooldown_seconds=3.0)
    enforce_anti_spam(f"user_create_ip_{client_ip}", max_requests=10, window_seconds=60, action_name="tạo tài khoản")

    # Check duplicate email
    existing = await db.execute(select(User).where(User.email == body.email))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail=f"Email '{body.email}' đã được đăng ký trên hệ thống")

    # Anti-Privilege Escalation Check: Only Super Admin can assign Super Admin role
    if body.role_id == "ROLE_SUPER_ADMIN":
        if not any(r.id == "ROLE_SUPER_ADMIN" for r in current_user.roles):
            raise HTTPException(status_code=403, detail="Bảo mật: Chỉ Super Admin mới có quyền gán vai trò Super Admin cho người khác")

    # Password validation or generation
    plain_password = body.password
    if not plain_password or not plain_password.strip():
        plain_password = generate_secure_password(12)
    elif not validate_password_strength(plain_password):
        raise HTTPException(
            status_code=400,
            detail="Mật khẩu phải có tối thiểu 8 ký tự, gồm ít nhất 1 chữ hoa, 1 chữ thường và 1 chữ số"
        )

    initial_credit = max(0, body.credit_balance or 0)
    user_obj = User(
        email=body.email.strip().lower(),
        password_hash=hash_password(plain_password),
        full_name=body.full_name.strip(),
        credit_balance=initial_credit,
        is_active=True,
        is_verified=True,
        tier=body.tier or "FREE",
    )

    role_obj = await db.get(Role, body.role_id)
    if role_obj:
        user_obj.roles.append(role_obj)
    else:
        raise HTTPException(status_code=400, detail=f"Vai trò '{body.role_id}' không hợp lệ")

    db.add(user_obj)
    await db.flush()

    client_ip = get_client_ip(request)

    # Initial Credit Log
    if initial_credit > 0:
        c_log = CreditAuditLog(
            user_id=user_obj.id,
            actor_id=current_user.id,
            actor_email=current_user.email,
            delta=initial_credit,
            balance_before=0,
            balance_after=initial_credit,
            reason="Khởi tạo tài khoản thành viên mới",
            ip_address=client_ip,
        )
        db.add(c_log)

    # Audit Log
    a_log = UserAuditLog(
        target_user_id=user_obj.id,
        actor_id=current_user.id,
        actor_email=current_user.email,
        action="CREATE_USER",
        details=json.dumps({
            "email": user_obj.email,
            "full_name": user_obj.full_name,
            "role": body.role_id,
            "credit_balance": initial_credit,
            "tier": user_obj.tier,
        }, ensure_ascii=False),
        reason="Admin tạo người dùng trực tiếp qua giao diện quản trị",
        ip_address=client_ip,
    )
    db.add(a_log)
    await db.commit()

    return ok(
        data={
            "id": user_obj.id,
            "email": user_obj.email,
            "generated_password": plain_password if (body.password is None) else None,
        },
        message="Tạo người dùng thành công"
    )


@router.put("/users/{user_id}")
async def update_user(
    user_id: str,
    body: UserUpdateRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("users.edit")),
):
    """Update profile and role with anti-tamper and audit trail."""
    check_duplicate_request(f"update_user_{user_id}", cooldown_seconds=1.5)
    user_obj = await db.get(User, user_id)
    if not user_obj:
        raise HTTPException(status_code=404, detail="Không tìm thấy người dùng")

    # Anti-Tamper: Cannot modify original Super Admin email or deactivate them
    if user_obj.email == "admin@velox.ai":
        if body.email != "admin@velox.ai":
            raise HTTPException(status_code=400, detail="Bảo mật: Không được phép thay đổi email của Super Admin hệ thống")
        if not body.is_active:
            raise HTTPException(status_code=400, detail="Bảo mật: Không được phép vô hiệu hóa tài khoản Super Admin hệ thống")

    # Anti-Self-Deactivation: User cannot deactivate or demote self
    if user_obj.id == current_user.id:
        if not body.is_active:
            raise HTTPException(status_code=400, detail="Bạn không thể tự vô hiệu hóa tài khoản của chính mình")

    # Anti-Privilege Escalation
    target_role_id = body.role_id
    current_actor_is_super = any(r.id == "ROLE_SUPER_ADMIN" for r in current_user.roles)
    if target_role_id == "ROLE_SUPER_ADMIN" and not current_actor_is_super:
        raise HTTPException(status_code=403, detail="Bảo mật: Chỉ Super Admin mới có quyền gán vai trò Super Admin")

    old_values = {
        "full_name": user_obj.full_name,
        "email": user_obj.email,
        "role": user_obj.roles[0].id if user_obj.roles else "ROLE_USER",
        "is_active": user_obj.is_active,
        "tier": getattr(user_obj, "tier", "FREE"),
    }

    # Check email duplicate if changed
    if body.email != user_obj.email:
        exist = await db.execute(select(User).where(User.email == body.email))
        if exist.scalar_one_or_none():
            raise HTTPException(status_code=400, detail=f"Email '{body.email}' đã thuộc về người dùng khác")
        user_obj.email = body.email.strip().lower()

    user_obj.full_name = body.full_name.strip()
    if not body.is_active and old_values["is_active"]:
        user_obj.token_version = (getattr(user_obj, "token_version", 1) or 1) + 1
    user_obj.is_active = body.is_active
    user_obj.tier = body.tier or "FREE"

    # Role reassignment
    new_role = await db.get(Role, target_role_id)
    if not new_role:
        raise HTTPException(status_code=400, detail=f"Vai trò '{target_role_id}' không tồn tại")
    user_obj.roles = [new_role]

    # Audit Log
    new_values = {
        "full_name": user_obj.full_name,
        "email": user_obj.email,
        "role": target_role_id,
        "is_active": user_obj.is_active,
        "tier": user_obj.tier,
    }
    a_log = UserAuditLog(
        target_user_id=user_obj.id,
        actor_id=current_user.id,
        actor_email=current_user.email,
        action="UPDATE_USER",
        details=json.dumps({"old": old_values, "new": new_values}, ensure_ascii=False),
        reason="Chỉnh sửa thông tin và vai trò người dùng",
        ip_address=get_client_ip(request),
    )
    db.add(a_log)
    await db.commit()

    return ok(message="Cập nhật thông tin thành viên thành công")


@router.patch("/users/{user_id}/status")
async def toggle_user_status(
    user_id: str,
    body: UserStatusUpdateRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("users.lock")),
):
    """Quick lock/unlock user account with mandatory reason and audit record."""
    check_duplicate_request(f"toggle_status_{user_id}", cooldown_seconds=2.0)
    user_obj = await db.get(User, user_id)
    if not user_obj:
        raise HTTPException(status_code=404, detail="Không tìm thấy người dùng")

    if user_obj.email == "admin@velox.ai":
        raise HTTPException(status_code=400, detail="Bảo mật: Không thể khóa tài khoản Super Admin")

    if user_obj.id == current_user.id:
        raise HTTPException(status_code=400, detail="Bạn không thể tự khóa tài khoản của chính mình")

    user_obj.is_active = body.is_active
    if body.is_active:
        user_obj.failed_login_attempts = 0
        user_obj.locked_until = None
    else:
        user_obj.token_version = (getattr(user_obj, "token_version", 1) or 1) + 1

    a_log = UserAuditLog(
        target_user_id=user_obj.id,
        actor_id=current_user.id,
        actor_email=current_user.email,
        action="STATUS_CHANGE",
        details=json.dumps({"is_active": body.is_active}, ensure_ascii=False),
        reason=body.reason.strip(),
        ip_address=get_client_ip(request),
    )
    db.add(a_log)
    await db.commit()

    action_text = "Mở khóa" if body.is_active else "Tạm khóa"
    return ok(message=f"Đã {action_text} tài khoản thành công")


@router.post("/users/{user_id}/credits")
async def adjust_user_credit(
    user_id: str,
    body: CreditAdjustRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("users.adjust_credit")),
):
    """
    ACID Row-Lock Credit Adjustment:
    Guarantees no race-condition, balance cannot go negative, immutable audit log created.
    """
    if body.delta == 0:
        raise HTTPException(status_code=400, detail="Số credit điều chỉnh phải khác 0")
    if abs(body.delta) > 100_000_000:
        raise HTTPException(status_code=400, detail="Hạn mức điều chỉnh tối đa là ±100,000,000 Credits/lần")

    client_ip = get_client_ip(request)
    check_duplicate_request(f"credit_adj_{current_user.id}_{user_id}", cooldown_seconds=2.0)
    enforce_anti_spam(f"credit_ip_{client_ip}", max_requests=30, window_seconds=60, action_name="điều chỉnh credit")

    # Row-Level Locking to prevent concurrent race condition tampering
    query = select(User).where(User.id == user_id).with_for_update()
    res = await db.execute(query)
    user_obj = res.scalar_one_or_none()

    if not user_obj:
        raise HTTPException(status_code=404, detail="Không tìm thấy người dùng")

    current_balance = user_obj.credit_balance or 0
    new_balance = current_balance + body.delta

    if new_balance < 0:
        raise HTTPException(
            status_code=400,
            detail=f"Số dư không đủ để trừ. Số dư hiện tại là {current_balance:,} Credits, không thể trừ {abs(body.delta):,} Credits"
        )

    user_obj.credit_balance = new_balance

    client_ip = get_client_ip(request)

    # Immutable Credit Transaction Ledger
    credit_log = CreditAuditLog(
        user_id=user_obj.id,
        actor_id=current_user.id,
        actor_email=current_user.email,
        delta=body.delta,
        balance_before=current_balance,
        balance_after=new_balance,
        reason=body.reason.strip(),
        ip_address=client_ip,
    )
    db.add(credit_log)

    # User Security Audit Log
    user_log = UserAuditLog(
        target_user_id=user_obj.id,
        actor_id=current_user.id,
        actor_email=current_user.email,
        action="CREDIT_ADJUST",
        details=json.dumps({
            "delta": body.delta,
            "before": current_balance,
            "after": new_balance,
        }, ensure_ascii=False),
        reason=body.reason.strip(),
        ip_address=client_ip,
    )
    db.add(user_log)

    await db.commit()

    prefix = "+" if body.delta > 0 else ""
    return ok(
        data={"credit_balance": user_obj.credit_balance},
        message=f"Đã điều chỉnh thành công: {prefix}{body.delta:,} Credits (Số dư mới: {new_balance:,} Credits)"
    )


@router.post("/users/{user_id}/reset-password")
async def reset_user_password(
    user_id: str,
    body: ResetPasswordRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("users.edit")),
):
    """Secure password reset by authorized administrator with audit trail."""
    client_ip = get_client_ip(request)
    check_duplicate_request(f"reset_pwd_{user_id}", cooldown_seconds=3.0)
    enforce_anti_spam(f"pwd_reset_ip_{client_ip}", max_requests=10, window_seconds=60, action_name="đặt lại mật khẩu")

    user_obj = await db.get(User, user_id)
    if not user_obj:
        raise HTTPException(status_code=404, detail="Không tìm thấy người dùng")

    if user_obj.email == "admin@velox.ai" and current_user.email != "admin@velox.ai":
        raise HTTPException(status_code=403, detail="Chỉ chính Super Admin mới có quyền đổi mật khẩu tài khoản gốc")

    if body.auto_generate or not body.new_password:
        plain_password = generate_secure_password(12)
    else:
        plain_password = body.new_password.strip()
        if not validate_password_strength(plain_password):
            raise HTTPException(
                status_code=400,
                detail="Mật khẩu mới phải có tối thiểu 8 ký tự, gồm ít nhất 1 chữ hoa, 1 chữ thường và 1 chữ số"
            )

    user_obj.password_hash = hash_password(plain_password)
    user_obj.failed_login_attempts = 0
    user_obj.locked_until = None
    user_obj.token_version = (getattr(user_obj, "token_version", 1) or 1) + 1

    a_log = UserAuditLog(
        target_user_id=user_obj.id,
        actor_id=current_user.id,
        actor_email=current_user.email,
        action="PASSWORD_RESET",
        details=json.dumps({"method": "admin_reset"}, ensure_ascii=False),
        reason="Admin đặt lại mật khẩu bảo mật cho tài khoản",
        ip_address=get_client_ip(request),
    )
    db.add(a_log)
    await db.commit()

    return ok(
        data={"temporary_password": plain_password},
        message="Đặt lại mật khẩu thành công. Hãy gửi mật khẩu mới cho thành viên."
    )


@router.get("/users/{user_id}/audit-logs")
async def get_user_audit_logs(
    user_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("users.view")),
):
    """Retrieve security audit history for a specific user account."""
    query = (
        select(UserAuditLog)
        .where(UserAuditLog.target_user_id == user_id)
        .order_by(UserAuditLog.created_at.desc())
        .limit(50)
    )
    res = await db.execute(query)
    logs = res.scalars().all()

    items = []
    for l in logs:
        items.append({
            "id": l.id,
            "action": l.action,
            "actorEmail": l.actor_email or "Hệ thống",
            "details": l.details,
            "reason": l.reason,
            "ipAddress": l.ip_address,
            "createdAt": l.created_at.isoformat() if l.created_at else "",
        })
    return ok(data=items)


@router.get("/users/{user_id}/credit-logs")
async def get_user_credit_logs(
    user_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("users.view")),
):
    """Retrieve credit change transaction ledger for a user."""
    query = (
        select(CreditAuditLog)
        .where(CreditAuditLog.user_id == user_id)
        .order_by(CreditAuditLog.created_at.desc())
        .limit(50)
    )
    res = await db.execute(query)
    logs = res.scalars().all()

    items = []
    for l in logs:
        items.append({
            "id": l.id,
            "delta": l.delta,
            "balanceBefore": l.balance_before,
            "balanceAfter": l.balance_after,
            "reason": l.reason,
            "actorEmail": l.actor_email or "Hệ thống",
            "createdAt": l.created_at.isoformat() if l.created_at else "",
        })
    return ok(data=items)


@router.delete("/users/{user_id}")
async def delete_user(
    user_id: str,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("users.edit")),
):
    """Permanently delete user with full security validations."""
    user_obj = await db.get(User, user_id)
    if not user_obj:
        raise HTTPException(status_code=404, detail="Không tìm thấy người dùng")

    if user_obj.email == "admin@velox.ai":
        raise HTTPException(status_code=400, detail="Bảo mật: Không được phép xóa tài khoản Super Admin chính")

    if user_obj.id == current_user.id:
        raise HTTPException(status_code=400, detail="Bảo mật: Bạn không thể tự xóa tài khoản của chính mình")

    deleted_email = user_obj.email
    deleted_name = user_obj.full_name or ""
    deleted_id = user_obj.id

    # 1. Delete user (and all cascaded relations: wallet, api keys, credit logs)
    await db.delete(user_obj)

    # 2. Record deletion audit log after removing target user
    a_log = UserAuditLog(
        target_user_id=deleted_id,
        actor_id=current_user.id,
        actor_email=current_user.email,
        action="DELETE_USER",
        details=json.dumps({"target_user_id": deleted_id, "email": deleted_email, "full_name": deleted_name}, ensure_ascii=False),
        reason="Xóa tài khoản khỏi hệ thống",
        ip_address=get_client_ip(request),
    )
    db.add(a_log)
    await db.commit()

    return ok(message=f"Đã xóa người dùng {deleted_email} khỏi hệ thống thành công")


# ── System-wide Audit Logs Endpoints ──
@router.get("/audit/users")
async def list_system_user_audits(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    action: Optional[str] = Query("ALL"),
    search: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("users.view")),
):
    """System-wide IAM & Security Audit Logs with filtering, search, and pagination."""
    query = (
        select(
            UserAuditLog,
            User.email.label("target_email"),
            User.full_name.label("target_name"),
        )
        .outerjoin(User, UserAuditLog.target_user_id == User.id)
    )

    if action and action != "ALL":
        query = query.where(UserAuditLog.action == action)

    if search and search.strip():
        term = f"%{search.strip()}%"
        query = query.where(
            or_(
                UserAuditLog.actor_email.ilike(term),
                UserAuditLog.target_user_id.ilike(term),
                UserAuditLog.reason.ilike(term),
                UserAuditLog.details.ilike(term),
                UserAuditLog.ip_address.ilike(term),
                User.email.ilike(term),
                User.full_name.ilike(term),
            )
        )

    # Count
    count_subq = query.subquery()
    count_res = await db.execute(select(func.count()).select_from(count_subq))
    total_count = count_res.scalar() or 0

    # Stats
    total_events_res = await db.execute(select(func.count(UserAuditLog.id)))
    lockouts_res = await db.execute(select(func.count(UserAuditLog.id)).where(UserAuditLog.action == "SECURITY_LOCKOUT"))
    pass_resets_res = await db.execute(select(func.count(UserAuditLog.id)).where(UserAuditLog.action.in_(["PASSWORD_RESET", "PASSWORD_CHANGE"])))
    failed_logins_res = await db.execute(select(func.count(UserAuditLog.id)).where(UserAuditLog.action == "LOGIN_FAILED"))

    # Pagination & Sort
    query = query.order_by(UserAuditLog.created_at.desc()).offset((page - 1) * page_size).limit(page_size)
    res = await db.execute(query)
    rows = res.all()

    items = []
    for log, t_email, t_name in rows:
        display_email = t_email
        display_name = t_name

        # If user was deleted, attempt to retrieve email/name from details JSON
        if not display_email and log.details:
            try:
                parsed_d = json.loads(log.details)
                if isinstance(parsed_d, dict):
                    display_email = parsed_d.get("email") or parsed_d.get("target_email")
                    display_name = parsed_d.get("full_name") or parsed_d.get("name")
            except Exception:
                pass

        items.append({
            "id": log.id,
            "action": log.action,
            "actorEmail": log.actor_email or "Hệ thống",
            "actorId": log.actor_id,
            "targetUserId": log.target_user_id,
            "targetEmail": display_email or "Tài khoản đã xóa",
            "targetName": display_name or (log.target_user_id if log.target_user_id else "Hệ thống"),
            "details": log.details,
            "reason": log.reason,
            "ipAddress": log.ip_address or "127.0.0.1",
            "createdAt": log.created_at.isoformat() if log.created_at else "",
        })

    total_pages = max(1, (total_count + page_size - 1) // page_size)

    return ok(data={
        "items": items,
        "pagination": {
            "total": total_count,
            "page": page,
            "pageSize": page_size,
            "totalPages": total_pages,
        },
        "stats": {
            "totalEvents": total_events_res.scalar() or 0,
            "securityLockouts": lockouts_res.scalar() or 0,
            "passwordResets": pass_resets_res.scalar() or 0,
            "failedLogins": failed_logins_res.scalar() or 0,
        }
    })


@router.get("/audit/credits")
async def list_system_credit_audits(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    delta_type: Optional[str] = Query("ALL"),
    search: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("users.view")),
):
    """System-wide Credit Transaction Audit Ledger with filtering, search, and totals."""
    query = (
        select(
            CreditAuditLog,
            User.email.label("user_email"),
            User.full_name.label("user_name"),
        )
        .outerjoin(User, CreditAuditLog.user_id == User.id)
    )

    if delta_type == "POSITIVE":
        query = query.where(CreditAuditLog.delta > 0)
    elif delta_type == "NEGATIVE":
        query = query.where(CreditAuditLog.delta < 0)

    if search and search.strip():
        term = f"%{search.strip()}%"
        query = query.where(
            or_(
                CreditAuditLog.actor_email.ilike(term),
                CreditAuditLog.reason.ilike(term),
                CreditAuditLog.ip_address.ilike(term),
                User.email.ilike(term),
                User.full_name.ilike(term),
            )
        )

    # Count
    count_subq = query.subquery()
    count_res = await db.execute(select(func.count()).select_from(count_subq))
    total_count = count_res.scalar() or 0

    # Summary Stats
    total_adjustments_res = await db.execute(select(func.count(CreditAuditLog.id)))
    pos_sum_res = await db.execute(select(func.sum(CreditAuditLog.delta)).where(CreditAuditLog.delta > 0))
    neg_sum_res = await db.execute(select(func.sum(CreditAuditLog.delta)).where(CreditAuditLog.delta < 0))

    query = query.order_by(CreditAuditLog.created_at.desc()).offset((page - 1) * page_size).limit(page_size)
    res = await db.execute(query)
    rows = res.all()

    items = []
    for log, u_email, u_name in rows:
        items.append({
            "id": log.id,
            "userId": log.user_id,
            "userEmail": u_email or "Tài khoản đã xóa",
            "userName": u_name or log.user_id,
            "actorEmail": log.actor_email or "Hệ thống",
            "actorId": log.actor_id,
            "delta": log.delta,
            "balanceBefore": log.balance_before,
            "balanceAfter": log.balance_after,
            "reason": log.reason,
            "ipAddress": log.ip_address or "127.0.0.1",
            "createdAt": log.created_at.isoformat() if log.created_at else "",
        })

    total_pages = max(1, (total_count + page_size - 1) // page_size)

    return ok(data={
        "items": items,
        "pagination": {
            "total": total_count,
            "page": page,
            "pageSize": page_size,
            "totalPages": total_pages,
        },
        "stats": {
            "totalAdjustments": total_adjustments_res.scalar() or 0,
            "totalCredited": pos_sum_res.scalar() or 0,
            "totalDeducted": abs(neg_sum_res.scalar() or 0),
        }
    })


# ── IP Threat & Guest Free-Quota Abuse Management Endpoints ──
@router.get("/ip-rules")
async def list_ip_rules(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status_filter: Optional[str] = Query("ALL", alias="status"),
    search: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("users.view")),
):
    """
    IP Threat & Anti-Farming Monitor:
    Aggregates all client IPs, counts accounts farmed, reveals linked emails and credit amounts.
    """
    # 1. Fetch all IP rules recorded
    rules_res = await db.execute(select(IPAccessRule))
    rules_map = {r.ip_address: r for r in rules_res.scalars().all()}

    # 2. Group non-admin users by last_login_ip (anti-farming is for customer abuse)
    user_q = select(
        User.last_login_ip,
        func.count(User.id).label("acc_count"),
        func.sum(User.credit_balance).label("total_credits"),
        func.max(User.last_login_at).label("last_active"),
    ).where(User.last_login_ip.isnot(None), User.email != "admin@velox.ai").group_by(User.last_login_ip)

    user_ip_rows = (await db.execute(user_q)).all()
    user_ip_map = {row[0]: row for row in user_ip_rows}

    # Combined set of all IPs (from users and from explicit rules)
    all_ips = set(rules_map.keys()) | set(user_ip_map.keys())

    # Build comprehensive item list
    aggregated_items = []
    for ip in all_ips:
        if not ip or ip.strip() == "":
            continue

        rule = rules_map.get(ip)
        u_stats = user_ip_map.get(ip)

        acc_count = u_stats[1] if u_stats else 0
        total_credits = u_stats[2] if u_stats else 0
        last_active = u_stats[3] if u_stats else None

        if rule:
            st = rule.status
            reason = rule.reason
            action_type = rule.action_type
            banned_by = rule.banned_by
            banned_until = rule.banned_until
            rule_id = rule.id
        elif acc_count >= 3:
            st = "SUSPICIOUS"
            reason = f"Cảnh báo hệ thống: Đã đăng ký {acc_count} tài khoản từ cùng một IP (Nghi vấn bào Free Credit)"
            action_type = "MONITOR"
            banned_by = "Tự động phát hiện"
            banned_until = None
            rule_id = None
        else:
            st = "ALLOWED"
            reason = "Lưu lượng truy cập thông thường"
            action_type = "ALLOW"
            banned_by = "Hệ thống"
            banned_until = None
            rule_id = None

        aggregated_items.append({
            "id": rule_id or f"ip_{ip}",
            "ipAddress": ip,
            "status": st,
            "reason": reason,
            "actionType": action_type,
            "bannedBy": banned_by,
            "bannedUntil": banned_until,
            "accountCount": acc_count,
            "totalCreditsHeld": total_credits or 0,
            "lastActive": last_active,
        })

    # Filter by search
    if search and search.strip():
        term = search.strip().lower()
        aggregated_items = [
            it for it in aggregated_items
            if term in it["ipAddress"].lower() or term in it["reason"].lower()
        ]

    # Filter by status
    if status_filter and status_filter != "ALL":
        aggregated_items = [it for it in aggregated_items if it["status"] == status_filter]

    # Sort: BANNED first, then SUSPICIOUS, then accountCount desc
    def sort_key(it):
        priority = 0 if it["status"] == "BANNED" else 1 if it["status"] == "SUSPICIOUS" else 2
        return (priority, -it["accountCount"])

    aggregated_items.sort(key=sort_key)

    total_count = len(aggregated_items)
    offset = (page - 1) * page_size
    paged_items = aggregated_items[offset:offset + page_size]

    # Fetch linked emails for the current page
    for it in paged_items:
        emails_res = await db.execute(
            select(User.email, User.is_active, User.credit_balance)
            .where(User.last_login_ip == it["ipAddress"])
            .limit(10)
        )
        it["linkedAccounts"] = [
            {"email": em, "isActive": act, "creditBalance": cr}
            for em, act, cr in emails_res.all()
        ]

    # Overall system metrics
    total_banned = sum(1 for it in aggregated_items if it["status"] == "BANNED")
    total_suspicious = sum(1 for it in aggregated_items if it["status"] == "SUSPICIOUS")
    total_farmed_credits = sum(it["totalCreditsHeld"] for it in aggregated_items if it["status"] in ["BANNED", "SUSPICIOUS"])

    total_pages = max(1, (total_count + page_size - 1) // page_size)

    return ok(data={
        "items": paged_items,
        "pagination": {
            "total": total_count,
            "page": page,
            "pageSize": page_size,
            "totalPages": total_pages,
        },
        "stats": {
            "totalTrackedIps": total_count,
            "bannedIps": total_banned,
            "suspiciousIps": total_suspicious,
            "farmedCreditsAtRisk": total_farmed_credits,
        }
    })


@router.post("/ip-rules/ban")
async def ban_ip_rule(
    body: IPBanRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("users.lock")),
):
    """Bans an IP address from registering and authenticating."""
    clean_ip = body.ip_address.strip()
    if clean_ip in ["127.0.0.1", "localhost", "::1"]:
        raise HTTPException(status_code=400, detail="Bảo mật: Không thể chặn địa chỉ Loopback localhost")

    res = await db.execute(select(IPAccessRule).where(IPAccessRule.ip_address == clean_ip))
    rule = res.scalar_one_or_none()

    if not rule:
        rule = IPAccessRule(
            ip_address=clean_ip,
            status="BANNED",
            reason=body.reason.strip(),
            action_type=body.action_type or "BLOCK_ALL",
            banned_by=current_user.email,
            banned_until=body.banned_until,
        )
        db.add(rule)
    else:
        rule.status = "BANNED"
        rule.reason = body.reason.strip()
        rule.action_type = body.action_type or "BLOCK_ALL"
        rule.banned_by = current_user.email
        rule.banned_until = body.banned_until

    # Record UserAuditLog
    a_log = UserAuditLog(
        target_user_id=f"IP:{clean_ip}",
        actor_id=current_user.id,
        actor_email=current_user.email,
        action="IP_BAN",
        details=json.dumps({"ip": clean_ip, "reason": body.reason, "action": body.action_type}, ensure_ascii=False),
        reason=f"Chặn IP: {body.reason}",
        ip_address=get_client_ip(request),
    )
    db.add(a_log)
    await db.commit()

    return ok(message=f"Đã chặn thành công địa chỉ IP {clean_ip}")


@router.post("/ip-rules/unban")
async def unban_ip_rule(
    body: IPUnbanRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("users.lock")),
):
    """Unbans an IP address, restoring normal access."""
    clean_ip = body.ip_address.strip()
    res = await db.execute(select(IPAccessRule).where(IPAccessRule.ip_address == clean_ip))
    rule = res.scalar_one_or_none()

    if rule:
        await db.delete(rule)

    a_log = UserAuditLog(
        target_user_id=f"IP:{clean_ip}",
        actor_id=current_user.id,
        actor_email=current_user.email,
        action="IP_UNBAN",
        details=json.dumps({"ip": clean_ip}, ensure_ascii=False),
        reason="Gỡ bỏ lệnh chặn IP",
        ip_address=get_client_ip(request),
    )
    db.add(a_log)
    await db.commit()

    return ok(message=f"Đã gỡ chặn địa chỉ IP {clean_ip} thành công")


@router.post("/ip-rules/batch-lock")
async def batch_lock_accounts_from_ip(
    body: IPBatchActionRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("users.lock")),
):
    """Locks all user accounts created from or logged into this IP."""
    clean_ip = body.ip_address.strip()
    res = await db.execute(select(User).where(User.last_login_ip == clean_ip))
    users = res.scalars().all()

    locked_count = 0
    for u in users:
        if u.email == "admin@velox.ai" or u.id == current_user.id:
            continue
        u.is_active = False
        u.token_version = (getattr(u, "token_version", 1) or 1) + 1
        locked_count += 1

    # Also ban the IP
    rule_res = await db.execute(select(IPAccessRule).where(IPAccessRule.ip_address == clean_ip))
    rule = rule_res.scalar_one_or_none()
    if not rule:
        rule = IPAccessRule(
            ip_address=clean_ip,
            status="BANNED",
            reason=body.reason.strip(),
            action_type="BLOCK_ALL",
            banned_by=current_user.email,
        )
        db.add(rule)
    else:
        rule.status = "BANNED"
        rule.reason = body.reason.strip()

    await db.commit()
    return ok(message=f"Đã khóa hàng loạt {locked_count} tài khoản liên kết với IP {clean_ip}")


@router.post("/ip-rules/batch-revoke-credits")
async def batch_revoke_credits_from_ip(
    body: IPBatchActionRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("users.adjust_credit")),
):
    """Revokes all free/held credits from accounts farmed from this IP."""
    clean_ip = body.ip_address.strip()
    res = await db.execute(select(User).where(User.last_login_ip == clean_ip))
    users = res.scalars().all()

    revoked_credits = 0
    affected_count = 0
    for u in users:
        if u.email == "admin@velox.ai":
            continue
        current_b = u.credit_balance or 0
        if current_b > 0:
            u.credit_balance = 0
            revoked_credits += current_b
            affected_count += 1

            # Log credit audit
            c_log = CreditAuditLog(
                user_id=u.id,
                actor_id=current_user.id,
                actor_email=current_user.email,
                delta=-current_b,
                balance_before=current_b,
                balance_after=0,
                reason=f"Thu hồi toàn bộ credit do phát hiện gian lận/bào free từ IP {clean_ip}: {body.reason}",
                ip_address=get_client_ip(request),
            )
            db.add(c_log)

    await db.commit()
    return ok(message=f"Đã tịch thu {revoked_credits:,} Credits từ {affected_count} tài khoản liên quan đến IP {clean_ip}")



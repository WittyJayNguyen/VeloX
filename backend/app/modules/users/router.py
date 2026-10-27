"""VeloX AI Gateway — User & Role Management Router"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, delete
from pydantic import BaseModel, EmailStr
from typing import Optional, List
from app.core.database import get_db
from app.common.responses import ok
from app.modules.users.models import User, Role, user_roles
from app.core.security import hash_password

router = APIRouter(prefix="", tags=["User & Role Management"])

# ── Permission Tree Definition ──
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

# ── Schemas ──
class RoleCreate(BaseModel):
    id: str
    name: str
    description: Optional[str] = ""
    permissions: List[str] = []

class RoleUpdate(BaseModel):
    name: str
    description: Optional[str] = ""
    permissions: List[str] = []

class UserCreateRequest(BaseModel):
    email: EmailStr
    password: Optional[str] = "Velox@123456"
    full_name: str
    role_id: str = "ROLE_USER"
    credit_balance: Optional[int] = 50000

class UserUpdateRequest(BaseModel):
    full_name: str
    email: EmailStr
    role_id: str
    is_active: bool

class CreditAdjustRequest(BaseModel):
    delta: int


# ── Seed Defaults Helper ──
async def seed_defaults(db: AsyncSession):
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

    # Ensure admin user
    user_res = await db.execute(select(User).where(User.email == "admin@velox.ai"))
    admin_user = user_res.scalar_one_or_none()
    if not admin_user:
        admin_user = User(
            email="admin@velox.ai",
            password_hash=hash_password("admin123"),
            full_name="Admin VeloX (Quản Trị)",
            credit_balance=9999999,
            is_active=True,
            is_verified=True,
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


# ── Role Endpoints ──
@router.get("/roles")
async def list_roles(db: AsyncSession = Depends(get_db)):
    await seed_defaults(db)
    res = await db.execute(select(Role))
    roles = res.scalars().all()

    result = []
    for r in roles:
        # Count users in this role
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
async def create_role(body: RoleCreate, db: AsyncSession = Depends(get_db)):
    existing = await db.get(Role, body.id)
    if existing:
        raise HTTPException(status_code=400, detail=f"Vai trò mã '{body.id}' đã tồn tại")

    perms_str = ",".join(body.permissions)
    role_obj = Role(
        id=body.id.strip().upper(),
        name=body.name.strip(),
        description=body.description,
        permissions=perms_str,
    )
    db.add(role_obj)
    await db.commit()
    await db.refresh(role_obj)
    return ok(data={"id": role_obj.id, "name": role_obj.name}, message="Tạo vai trò thành công")


@router.put("/roles/{role_id}")
async def update_role(role_id: str, body: RoleUpdate, db: AsyncSession = Depends(get_db)):
    role_obj = await db.get(Role, role_id)
    if not role_obj:
        raise HTTPException(status_code=404, detail="Không tìm thấy vai trò")

    role_obj.name = body.name.strip()
    role_obj.description = body.description
    role_obj.permissions = ",".join(body.permissions)

    await db.commit()
    return ok(message="Cập nhật vai trò & cây phân quyền thành công")


@router.delete("/roles/{role_id}")
async def delete_role(role_id: str, db: AsyncSession = Depends(get_db)):
    if role_id == "ROLE_SUPER_ADMIN":
        raise HTTPException(status_code=400, detail="Không thể xóa vai trò Super Admin mặc định")

    role_obj = await db.get(Role, role_id)
    if not role_obj:
        raise HTTPException(status_code=404, detail="Không tìm thấy vai trò")

    await db.delete(role_obj)
    await db.commit()
    return ok(message="Đã xóa vai trò thành công")


# ── User Endpoints ──
@router.get("/users")
async def list_users(db: AsyncSession = Depends(get_db)):
    await seed_defaults(db)
    res = await db.execute(select(User))
    users = res.scalars().all()

    result = []
    for u in users:
        role_codes = [r.id for r in u.roles]
        primary_role = role_codes[0] if role_codes else "ROLE_USER"
        result.append({
            "id": u.id,
            "fullName": u.full_name or u.email.split("@")[0],
            "email": u.email,
            "role": primary_role,
            "creditBalance": u.credit_balance or 0,
            "isActive": u.is_active,
            "registeredDate": u.created_at.strftime("%Y-%m-%d") if u.created_at else "2026-01-01",
            "vccTopupTotal": 0,
        })
    return ok(data=result)


@router.post("/users")
async def create_user(body: UserCreateRequest, db: AsyncSession = Depends(get_db)):
    existing = await db.execute(select(User).where(User.email == body.email))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email này đã được sử dụng")

    user_obj = User(
        email=body.email,
        password_hash=hash_password(body.password or "Velox@123456"),
        full_name=body.full_name,
        credit_balance=body.credit_balance or 50000,
        is_active=True,
    )
    role_obj = await db.get(Role, body.role_id)
    if role_obj:
        user_obj.roles.append(role_obj)

    db.add(user_obj)
    await db.commit()
    await db.refresh(user_obj)
    return ok(data={"id": user_obj.id, "email": user_obj.email}, message="Tạo người dùng thành công")


@router.put("/users/{user_id}")
async def update_user(user_id: str, body: UserUpdateRequest, db: AsyncSession = Depends(get_db)):
    user_obj = await db.get(User, user_id)
    if not user_obj:
        raise HTTPException(status_code=404, detail="Không tìm thấy người dùng")

    user_obj.full_name = body.full_name
    user_obj.email = body.email
    user_obj.is_active = body.is_active

    # Update role
    role_obj = await db.get(Role, body.role_id)
    if role_obj:
        user_obj.roles = [role_obj]

    await db.commit()
    return ok(message="Cập nhật thông tin người dùng thành công")


@router.delete("/users/{user_id}")
async def delete_user(user_id: str, db: AsyncSession = Depends(get_db)):
    user_obj = await db.get(User, user_id)
    if not user_obj:
        raise HTTPException(status_code=404, detail="Không tìm thấy người dùng")

    if user_obj.email == "admin@velox.ai":
        raise HTTPException(status_code=400, detail="Không thể xóa tài khoản Super Admin chính")

    await db.delete(user_obj)
    await db.commit()
    return ok(message="Đã xóa người dùng thành công")


@router.post("/users/{user_id}/credits")
async def adjust_user_credit(user_id: str, body: CreditAdjustRequest, db: AsyncSession = Depends(get_db)):
    user_obj = await db.get(User, user_id)
    if not user_obj:
        raise HTTPException(status_code=404, detail="Không tìm thấy người dùng")

    user_obj.credit_balance = max(0, (user_obj.credit_balance or 0) + body.delta)
    await db.commit()
    return ok(
        data={"credit_balance": user_obj.credit_balance},
        message=f"Đã điều chỉnh thành công ({'+' if body.delta > 0 else ''}{body.delta} Credits)"
    )

"""
VeloX AI Gateway — Billing & Credit Packages Database Seed
==========================================================
Seeds standard subscription plans and VietQR topup tiers optimized for maximum profitability.
"""
import json
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from app.modules.billing.models import CreditPackage


OPTIMAL_PACKAGES = [
    # ── 1. GÓI HỘI VIÊN THÁNG (SUBSCRIPTION TIERS) ──
    {
        "name": "Creator Standard",
        "category": "STARTER",
        "description": "Dành cho cá nhân sáng tạo nội dung, thiết kế & lập trình",
        "price_vnd": 189000,
        "original_price_vnd": 280000,
        "credits_given": 2000,
        "bonus_percentage": 0,
        "is_popular": False,
        "is_active": True,
        "tag_badge": "TIẾT KIỆM",
        "sort_order": 1,
        "features": [
            "2,000 Credits / tháng (~60 ảnh FLUX / Midjourney hoặc 800 câu chat)",
            "Truy cập đầy đủ 150+ Model AI hàng đầu thế giới",
            "Mở khóa tạo ảnh và video cơ bản với Kling, Luma & FLUX",
            "Ưu tiên tốc độ xử lý nhanh",
            "Hỗ trợ kỹ thuật 24/7",
        ],
    },
    {
        "name": "Pro Studio",
        "category": "PRO",
        "description": "Tối ưu nhất cho Creator chuyên nghiệp, Designer & Developer",
        "price_vnd": 489000,
        "original_price_vnd": 690000,
        "credits_given": 5500,
        "bonus_percentage": 10,
        "is_popular": True,
        "is_active": True,
        "tag_badge": "KHUYÊN DÙNG",
        "sort_order": 2,
        "features": [
            "5,500 Credits / tháng (Tạo ~150 ảnh Midjourney 4K hoặc 65 video Full HD)",
            "Mở khóa trọn bộ 156+ Model AI (Claude 3.5 Sonnet, Midjourney v6.1, Kling 1.5 Pro)",
            "Hàng đợi ưu tiên VIP, render độ phân giải 4K không chờ đợi",
            "Tạo API Key kết nối MCP, Cursor, IDEs & phần mềm bên thứ 3",
            "Không giới hạn Workflows tự động hóa",
            "Hỗ trợ kỹ thuật 1-1 chuyên sâu",
        ],
    },
    {
        "name": "Business & Agency",
        "category": "ENTERPRISE",
        "description": "Giải pháp toàn diện cho đội nhóm, Studio & Doanh nghiệp",
        "price_vnd": 1290000,
        "original_price_vnd": 1850000,
        "credits_given": 15000,
        "bonus_percentage": 15,
        "is_popular": False,
        "is_active": True,
        "tag_badge": "DOANH NGHIỆP",
        "sort_order": 3,
        "features": [
            "15,000 Credits / tháng (~400 ảnh Studio 4K hoặc 180 video thương mại)",
            "Toàn quyền khai thác 156+ Model cao cấp với độ trễ thấp nhất",
            "Workspace nhóm tối đa 10 nhân sự phân bổ quota độc lập",
            "Băng thông mạng riêng biệt, cam kết SLA 99.9% Uptime",
            "Custom Domain Gateway riêng cho doanh nghiệp",
            "Hỗ trợ xuất hóa đơn tài chính VAT",
        ],
    },
    {
        "name": "Enterprise Scale",
        "category": "ENTERPRISE",
        "description": "Hạ tầng AI quy mô lớn dành cho Agency & Studio sản xuất hàng loạt",
        "price_vnd": 2890000,
        "original_price_vnd": 3900000,
        "credits_given": 35000,
        "bonus_percentage": 20,
        "is_popular": False,
        "is_active": True,
        "tag_badge": "ENTERPRISE VIP",
        "sort_order": 4,
        "features": [
            "35,000 Credits / tháng (~950 ảnh 4K hoặc 420 video điện ảnh)",
            "Tối ưu hóa sản lượng lớn cho Agency & Studio sản xuất hàng loạt",
            "Workspace không giới hạn số lượng nhân sự",
            "Cổng Gateway API riêng biệt tải trọng cao",
            "Tùy biến giải pháp và Prompt Engineering chuyên biệt",
            "Hợp đồng doanh nghiệp & cam kết bảo mật cấp cao",
        ],
    },

    # ── 2. GÓI NẠP TRỰC TIẾP VIETQR (TOP-UP PAY-AS-YOU-GO) ──
    {
        "name": "Gói Nạp Khởi Động",
        "category": "TOPUP",
        "description": "Nạp thử nhanh tính năng, số dư vĩnh viễn",
        "price_vnd": 100000,
        "original_price_vnd": 100000,
        "credits_given": 1000,
        "bonus_percentage": 0,
        "is_popular": False,
        "is_active": True,
        "tag_badge": "Khởi động",
        "sort_order": 10,
        "features": [
            "1,000 Credits sử dụng vĩnh viễn không hết hạn",
            "Tạo được ~30 ảnh chất lượng cao hoặc 500 câu chat AI",
            "Tạo được 13 video Full HD Kling AI",
            "Kích hoạt tự động qua VietQR trong 3 giây",
        ],
    },
    {
        "name": "Gói Nạp Tiêu Chuẩn",
        "category": "TOPUP",
        "description": "Mức nạp phổ biến cho nhu cầu sử dụng hàng tuần",
        "price_vnd": 200000,
        "original_price_vnd": 200000,
        "credits_given": 2050,
        "bonus_percentage": 2.5,
        "is_popular": False,
        "is_active": True,
        "tag_badge": "+2.5% THƯỞNG",
        "sort_order": 11,
        "features": [
            "2,050 Credits (Đã gồm 50 credits thưởng thêm)",
            "Tạo được ~60 ảnh FLUX / Midjourney 4K",
            "Tạo được 26 video điện ảnh Kling / Runway",
            "Chat ~1,000 câu AI hoặc gọi API Gateway",
        ],
    },
    {
        "name": "Gói Nạp Bán Chạy",
        "category": "TOPUP",
        "description": "Gói nạp được lựa chọn nhiều nhất, tối ưu chi phí",
        "price_vnd": 500000,
        "original_price_vnd": 530000,
        "credits_given": 5300,
        "bonus_percentage": 6,
        "is_popular": True,
        "is_active": True,
        "tag_badge": "BÁN CHẠY NHẤT",
        "sort_order": 12,
        "features": [
            "5,300 Credits (Đã gồm 300 credits thưởng thêm)",
            "Tạo được ~150 ảnh 4K hoặc 65 video Full HD",
            "Chat ~2,600 câu AI hoặc gọi code thoải mái",
            "Ưu tiên băng thông cao, không phải xếp hàng",
        ],
    },
    {
        "name": "Gói VIP Sáng Tạo",
        "category": "TOPUP",
        "description": "Thưởng lớn 10% Credit dành cho Creator & Studio",
        "price_vnd": 1000000,
        "original_price_vnd": 1100000,
        "credits_given": 11000,
        "bonus_percentage": 10,
        "is_popular": False,
        "is_active": True,
        "tag_badge": "+10% THƯỞNG",
        "sort_order": 13,
        "features": [
            "11,000 Credits (Đã gồm 1,000 credits thưởng thêm)",
            "Tạo được ~320 ảnh 4K hoặc 150 video AI thương mại",
            "Sử dụng cho nhiều dự án và chiến dịch nội dung",
            "Hỗ trợ kỹ thuật ưu tiên 24/7",
        ],
    },
    {
        "name": "Gói Super VIP Doanh Nghiệp",
        "category": "TOPUP",
        "description": "Ưu đãi tối đa 15% Credit dành cho Studio lớn",
        "price_vnd": 2000000,
        "original_price_vnd": 2300000,
        "credits_given": 23000,
        "bonus_percentage": 15,
        "is_popular": False,
        "is_active": True,
        "tag_badge": "SUPER VIP +15%",
        "sort_order": 14,
        "features": [
            "23,000 Credits (Đã gồm 3,000 credits thưởng thêm)",
            "Tạo được ~680 ảnh 4K hoặc 300 video AI",
            "Băng thông riêng chuyên biệt, cam kết SLA 99.9%",
            "Hỗ trợ cấu hình tích hợp hệ thống riêng",
        ],
    },
]


async def seed_default_packages(db: AsyncSession, force_sync: bool = False):
    """Seed or synchronize initial subscription and topup packages."""
    stmt = select(CreditPackage)
    res = await db.execute(stmt)
    existing = res.scalars().all()

    # If existing and not forcing sync, check if we need to sync to optimal
    if existing and not force_sync:
        # Check if first package has old credits_given (e.g. 1000 for Free Starter)
        starter = next((p for p in existing if p.name == "Free Starter"), None)
        if starter and starter.credits_given <= 100:
            return  # Already synced to optimal

    # Replace or synchronize
    if existing:
        await db.execute(delete(CreditPackage))
        await db.commit()

    for item in OPTIMAL_PACKAGES:
        pkg = CreditPackage(
            name=item["name"],
            category=item["category"],
            description=item["description"],
            price_vnd=item["price_vnd"],
            original_price_vnd=item["original_price_vnd"],
            credits_given=item["credits_given"],
            bonus_percentage=item["bonus_percentage"],
            is_popular=item["is_popular"],
            is_active=item["is_active"],
            tag_badge=item["tag_badge"],
            sort_order=item["sort_order"],
            features=json.dumps(item["features"]),
        )
        db.add(pkg)

    await db.commit()
    print("[SEED] Default Credit Packages & Subscription Tiers synced successfully!")

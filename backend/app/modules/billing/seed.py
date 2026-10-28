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
        "name": "Free Starter",
        "category": "STARTER",
        "description": "Trải nghiệm miễn phí các mô hình AI cơ bản",
        "price_vnd": 0,
        "original_price_vnd": 0,
        "credits_given": 100,
        "bonus_percentage": 0,
        "is_popular": False,
        "is_active": True,
        "tag_badge": "MIỄN PHÍ",
        "sort_order": 1,
        "features": [
            "100 Credits trải nghiệm khi đăng ký",
            "Chat GPT-4o-mini & DeepSeek-V3",
            "Tạo thử nghiệm 4-5 ảnh chất lượng cao",
            "Tốc độ xử lý tiêu chuẩn",
            "Hỗ trợ cộng đồng VeloX",
        ],
    },
    {
        "name": "Basic Creator",
        "category": "STARTER",
        "description": "Dành cho cá nhân sáng tạo nội dung & thiết kế cơ bản",
        "price_vnd": 99000,
        "original_price_vnd": 150000,
        "credits_given": 1200,
        "bonus_percentage": 0,
        "is_popular": False,
        "is_active": True,
        "tag_badge": "TIẾT KIỆM",
        "sort_order": 2,
        "features": [
            "1,200 Credits / tháng (~50 ảnh FLUX hoặc 600 câu chat)",
            "Mở khóa 10 Model tạo ảnh (FLUX.1, SD 3.5, DALL-E 3)",
            "Tạo video AI cơ bản với Grok & Luma",
            "Ưu tiên tốc độ xử lý nhanh",
            "Hỗ trợ kỹ thuật 24/7",
        ],
    },
    {
        "name": "Pro Creator",
        "category": "PRO",
        "description": "Tối ưu nhất cho Creator chuyên nghiệp & Lập trình viên",
        "price_vnd": 249000,
        "original_price_vnd": 350000,
        "credits_given": 3800,
        "bonus_percentage": 15,
        "is_popular": True,
        "is_active": True,
        "tag_badge": "KHUYÊN DÙNG",
        "sort_order": 3,
        "features": [
            "3,800 Credits / tháng (Tạo ~108 ảnh Midjourney 4K hoặc 50 video 1080p)",
            "Mở khóa trọn bộ 115 Model AI (Claude 3.5 Sonnet, Kling 1.5, Runway)",
            "Hàng đợi ưu tiên VIP, render độ phân giải 4K không chờ đợi",
            "Tạo API Key cá nhân kết nối MCP & các phần mềm bên thứ 3",
            "Không giới hạn Workflows tự động hóa",
            "Hỗ trợ kỹ thuật 1-1 chuyên sâu",
        ],
    },
    {
        "name": "Business & Agency",
        "category": "ENTERPRISE",
        "description": "Giải pháp toàn diện cho đội nhóm, Studio & Doanh nghiệp",
        "price_vnd": 699000,
        "original_price_vnd": 999000,
        "credits_given": 12000,
        "bonus_percentage": 25,
        "is_popular": False,
        "is_active": True,
        "tag_badge": "DOANH NGHIỆP",
        "sort_order": 4,
        "features": [
            "12,000 Credits / tháng (~342 ảnh Studio 4K hoặc 160 video thương mại)",
            "Toàn quyền khai thác 115 Model cao cấp nhất",
            "Workspace nhóm tối đa 10 nhân sự phân bổ quota độc lập",
            "Băng thông mạng riêng biệt, cam kết SLA 99.9% Uptime",
            "Custom Domain Gateway riêng cho doanh nghiệp",
            "Hỗ trợ xuất hóa đơn tài chính VAT",
        ],
    },

    # ── 2. GÓI NẠP TRỰC TIẾP VIETQR (TOP-UP PAY-AS-YOU-GO) ──
    {
        "name": "Gói Nạp Trải Nghiệm",
        "category": "TOPUP",
        "description": "Nạp dùng thử nhanh tính năng, số dư vĩnh viễn",
        "price_vnd": 50000,
        "original_price_vnd": 50000,
        "credits_given": 400,
        "bonus_percentage": 0,
        "is_popular": False,
        "is_active": True,
        "tag_badge": "Trải nghiệm",
        "sort_order": 10,
        "features": [
            "400 Credits sử dụng vĩnh viễn không hết hạn",
            "Tạo được ~16 ảnh FLUX hoặc 5 video Kling 1080p",
            "Chat ~200 câu hỏi với GPT-4o-mini / DeepSeek",
            "Kích hoạt tự động qua VietQR trong 10 giây",
        ],
    },
    {
        "name": "Gói Nạp Tiêu Chuẩn",
        "category": "TOPUP",
        "description": "Mức nạp phổ biến cho nhu cầu sử dụng hàng tuần",
        "price_vnd": 100000,
        "original_price_vnd": 100000,
        "credits_given": 1000,
        "bonus_percentage": 0,
        "is_popular": False,
        "is_active": True,
        "tag_badge": "Tiêu chuẩn",
        "sort_order": 11,
        "features": [
            "1,000 Credits sử dụng vĩnh viễn không hết hạn",
            "Tạo được ~40 ảnh FLUX / 28 ảnh Midjourney 4K",
            "Tạo được 13 video Full HD Kling AI 1.5 Pro",
            "Chat ~500 câu AI hoặc 55 câu code Claude 3.5 Sonnet",
        ],
    },
    {
        "name": "Gói Nạp Phổ Biến",
        "category": "TOPUP",
        "description": "Gói nạp được lựa chọn nhiều nhất, tối ưu chi phí",
        "price_vnd": 200000,
        "original_price_vnd": 220000,
        "credits_given": 2000,
        "bonus_percentage": 10,
        "is_popular": True,
        "is_active": True,
        "tag_badge": "BÁN CHẠY NHẤT",
        "sort_order": 12,
        "features": [
            "2,000 Credits sử dụng vĩnh viễn không hết hạn",
            "Tạo được ~80 ảnh FLUX / 57 ảnh Midjourney Studio 4K",
            "Tạo được 26 video điện ảnh Kling / Runway",
            "Chat ~1,000 câu AI hoặc 111 câu code chuyên sâu",
        ],
    },
    {
        "name": "Gói Nạp Tiết Kiệm",
        "category": "TOPUP",
        "description": "Thưởng thêm 10% Credit dành cho nhà sáng tạo",
        "price_vnd": 500000,
        "original_price_vnd": 550000,
        "credits_given": 5500,
        "bonus_percentage": 10,
        "is_popular": False,
        "is_active": True,
        "tag_badge": "+10% THƯỞNG",
        "sort_order": 13,
        "features": [
            "5,500 Credits (Đã gồm 10% thưởng thêm)",
            "Tạo được ~150 ảnh 4K hoặc 73 video Full HD",
            "Chat ~2,750 câu AI hoặc gọi API Gateway thoải mái",
            "Ưu tiên băng thông cao, không phải xếp hàng",
        ],
    },
    {
        "name": "Gói VIP Doanh Nghiệp",
        "category": "TOPUP",
        "description": "Thưởng lớn 25% Credit cho Agency & Studio sản xuất",
        "price_vnd": 1000000,
        "original_price_vnd": 1250000,
        "credits_given": 12500,
        "bonus_percentage": 25,
        "is_popular": False,
        "is_active": True,
        "tag_badge": "+25% THƯỞNG",
        "sort_order": 14,
        "features": [
            "12,500 Credits (Đã gồm 25% thưởng thêm)",
            "Tạo được ~350 ảnh 4K hoặc 166 video AI thương mại",
            "Sử dụng cho nhiều dự án và chiến dịch nội dung",
            "Hỗ trợ kỹ thuật ưu tiên 24/7",
        ],
    },
    {
        "name": "Gói Super VIP Studio",
        "category": "TOPUP",
        "description": "Ưu đãi tối đa 35% Credit dành cho hệ thống lớn",
        "price_vnd": 2000000,
        "original_price_vnd": 2700000,
        "credits_given": 27000,
        "bonus_percentage": 35,
        "is_popular": False,
        "is_active": True,
        "tag_badge": "SUPER VIP +35%",
        "sort_order": 15,
        "features": [
            "27,000 Credits (Đã gồm 35% thưởng thêm)",
            "Tạo được ~770 ảnh 4K hoặc 360 video AI",
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

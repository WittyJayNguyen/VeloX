"""
VeloX AI Gateway — Billing & Credit Packages Database Seed
==========================================================
Seeds standard subscription plans and VietQR topup tiers if database is empty.
"""
import json
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.modules.billing.models import CreditPackage


async def seed_default_packages(db: AsyncSession):
    """Seed initial subscription and topup packages if not present."""
    stmt = select(CreditPackage)
    res = await db.execute(stmt)
    existing = res.scalars().all()
    if existing:
        return

    default_packages = [
        # ── 1. Subscription / Membership Tiers ──
        CreditPackage(
            name="Free Starter",
            category="STARTER",
            description="Dành cho người mới bắt đầu trải nghiệm AI Gateway",
            price_vnd=0,
            original_price_vnd=0,
            credits_given=1000,
            bonus_percentage=0,
            is_popular=False,
            is_active=True,
            tag_badge="",
            sort_order=1,
            features=json.dumps([
                "Truy cập GPT-4o-mini & Claude 3.5 Haiku",
                "Tốc độ xử lý tiêu chuẩn",
                "10 workflows cơ bản",
                "Hỗ trợ cộng đồng",
            ]),
        ),
        CreditPackage(
            name="Pro Creator",
            category="PRO",
            description="Tối ưu cho cá nhân sáng tạo nội dung & nhà phát triển",
            price_vnd=199000,
            original_price_vnd=250000,
            credits_given=15000,
            bonus_percentage=10,
            is_popular=True,
            is_active=True,
            tag_badge="KHUYÊN DÙNG",
            sort_order=2,
            features=json.dumps([
                "Truy cập đầy đủ 100+ Model cao cấp (GPT-4o, Claude 3.5 Sonnet, Midjourney v6)",
                "Ưu tiên hàng đợi cao nhất, latency < 300ms",
                "Không giới hạn Workflows AI",
                "Tạo API Key cá nhân & kết nối MCP",
                "Hỗ trợ kỹ thuật 24/7",
            ]),
        ),
        CreditPackage(
            name="Team & Business",
            category="ENTERPRISE",
            description="Giải pháp toàn diện cho đội nhóm & doanh nghiệp vừa",
            price_vnd=599000,
            original_price_vnd=799000,
            credits_given=50000,
            bonus_percentage=20,
            is_popular=False,
            is_active=True,
            tag_badge="DOANH NGHIỆP",
            sort_order=3,
            features=json.dumps([
                "Tất cả tính năng của gói Pro",
                "Workspace nhóm tối đa 20 thành viên",
                "Phân bổ hạn mức Credit độc lập cho từng nhân sự",
                "Custom Domain & Private Endpoint Gateway",
                "Cam kết SLA 99.9% Uptime",
            ]),
        ),

        # ── 2. VietQR Top-Up Packages ──
        CreditPackage(
            name="Gói Nạp Cơ Bản",
            category="TOPUP",
            description="Nạp nhanh 500 Credits sử dụng ngay",
            price_vnd=50000,
            original_price_vnd=50000,
            credits_given=500,
            bonus_percentage=0,
            is_popular=False,
            is_active=True,
            tag_badge="Cơ bản",
            sort_order=10,
            features=json.dumps(["500 Credits", "Duy trì vĩnh viễn", "Hỗ trợ 24/7"]),
        ),
        CreditPackage(
            name="Gói Nạp Phổ Biến",
            category="TOPUP",
            description="Nạp 100k nhận 1.100 Credits (+10% thưởng)",
            price_vnd=100000,
            original_price_vnd=110000,
            credits_given=1100,
            bonus_percentage=10,
            is_popular=True,
            is_active=True,
            tag_badge="Phổ biến",
            sort_order=11,
            features=json.dumps(["1,100 Credits (Thưởng 10%)", "Duy trì vĩnh viễn", "Ưu tiên xử lý"]),
        ),
        CreditPackage(
            name="Gói Nạp Tiết Kiệm",
            category="TOPUP",
            description="Nạp 200k nhận 2.400 Credits (+20% thưởng)",
            price_vnd=200000,
            original_price_vnd=240000,
            credits_given=2400,
            bonus_percentage=20,
            is_popular=False,
            is_active=True,
            tag_badge="Tiết kiệm",
            sort_order=12,
            features=json.dumps(["2,400 Credits (Thưởng 20%)", "Duy trì vĩnh viễn", "Tốc độ xử lý cao"]),
        ),
        CreditPackage(
            name="Gói Nạp Ưu Đãi Cao",
            category="TOPUP",
            description="Nạp 500k nhận 6.500 Credits (+30% thưởng)",
            price_vnd=500000,
            original_price_vnd=650000,
            credits_given=6500,
            bonus_percentage=30,
            is_popular=False,
            is_active=True,
            tag_badge="Ưu đãi cao",
            sort_order=13,
            features=json.dumps(["6,500 Credits (Thưởng 30%)", "Duy trì vĩnh viễn", "Băng thông riêng"]),
        ),
        CreditPackage(
            name="Gói VIP Doanh Nghiệp",
            category="TOPUP",
            description="Nạp 1 Triệu nhận 14.000 Credits (+40% thưởng)",
            price_vnd=1000000,
            original_price_vnd=1400000,
            credits_given=14000,
            bonus_percentage=40,
            is_popular=False,
            is_active=True,
            tag_badge="VIP Doanh nghiệp",
            sort_order=14,
            features=json.dumps(["14,000 Credits (Thưởng 40%)", "Duy trì vĩnh viễn", "SLA 99.9%", "Hỗ trợ riêng 24/7"]),
        ),
    ]

    for p in default_packages:
        db.add(p)
    await db.commit()
    print("[SEED] Default Credit Packages & Subscription Tiers seeded successfully!")

"""
VeloX AI Gateway — Studio Generation & Job Management Router
============================================================
Handles authenticated Studio job creations, verifies user credit balances,
and automatically deducts credits with full immutable transaction audit logging.
"""
from typing import Optional, Dict, Any, List
import uuid
from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc

from app.core.database import get_db
from app.core.security import get_current_user
from app.common.responses import ok
from app.modules.users.models import User, CreditAuditLog
from app.modules.models_catalog.models import AIModel
from app.modules.logs.models import MediaGenerationLog
from app.modules.users.router import get_client_ip

router = APIRouter(prefix="/studio", tags=["Studio Workspace & Jobs"])

DEFAULT_CREDIT_COSTS = {
    "CHAT": 15,
    "IMAGE": 35,
    "VIDEO": 80,
    "AUDIO": 15,
}

# Dynamic Structured Prompt Presets
STUDIO_PRESETS = {
    "chat": [
        {
            "groupName": "LẬP TRÌNH & CÔNG NGHỆ",
            "items": [
                {
                    "title": "Viết code và giải thuật tối ưu",
                    "prompt": "Hãy giúp tôi xây dựng hàm tối ưu hóa thuật toán và phân tích độ phức tạp thời gian/không gian chi tiết.",
                },
                {
                    "title": "Thiết kế kiến trúc hệ thống phân tán",
                    "prompt": "Đề xuất kiến trúc Microservices có khả năng mở rộng cao, chịu tải 100k RPS và cơ chế caching đa tầng.",
                },
                {
                    "title": "Debug và rà soát bảo mật mã nguồn",
                    "prompt": "Hãy phân tích đoạn mã sau, tìm các lỗ hổng tiềm ẩn (memory leak, injection, race condition) và hướng dẫn cách khắc phục.",
                },
            ],
        },
        {
            "groupName": "SÁNG TẠO & MARKETING",
            "items": [
                {
                    "title": "Kịch bản video ngắn triệu view",
                    "prompt": "Viết kịch bản video ngắn 45 giây cho TikTok/Reels giới thiệu công cụ AI với câu hook thu hút trong 3 giây đầu.",
                },
                {
                    "title": "Chiến lược Marketing Go-To-Market",
                    "prompt": "Lập kế hoạch chiến dịch ra mắt sản phẩm công nghệ 30 ngày, bao gồm kênh truyền thông, thông điệp chính và KPI.",
                },
                {
                    "title": "Soạn email thuyết phục đối tác B2B",
                    "prompt": "Soạn thảo email đề xuất hợp tác kinh doanh B2B chuyên nghiệp, lịch sự, nêu bật giá trị cốt lõi và kêu gọi hành động rõ ràng.",
                },
            ],
        },
    ],
    "image": [
        {
            "groupName": "TẠO ẢNH",
            "items": [
                {
                    "title": "Chân dung studio với ánh sáng điện ảnh",
                    "prompt": "Masterpiece studio portrait photography, Rembrandt dramatic lighting, 85mm f/1.4 lens, natural skin texture, masterpiece, 8k resolution, photorealistic",
                    "ratio": "1:1",
                },
                {
                    "title": "Phong cảnh siêu thực",
                    "prompt": "Surreal dreamlike ethereal landscape with floating islands, glowing bioluminescent crystal waterfalls, aurora borealis night sky, wide angle, 8k render",
                    "ratio": "16:9",
                },
                {
                    "title": "Sản phẩm trên bề mặt được tạo kiểu",
                    "prompt": "Commercial luxury product photography on a styled minimalist podium, gentle water ripple reflections, studio softbox diffused rim light, award-winning advertising",
                    "ratio": "1:1",
                },
                {
                    "title": "Nhân vật 3D có cá tính",
                    "prompt": "Expressive 3D stylized character design, cute cybernetic companion, vibrant Pixar animation style, rich subsurface scattering, octane 3d render",
                    "ratio": "1:1",
                },
            ],
        },
        {
            "groupName": "NÂNG CAO & KHÔI PHỤC ẢNH",
            "items": [
                {
                    "title": "Làm sắc nét và sửa mờ",
                    "prompt": "Ultra-sharp high-definition image enhancement, crisp edge details, clear focus recovery, noise reduction, studio pristine clarity 8k",
                    "ratio": "1:1",
                },
                {
                    "title": "Phóng to lên 4K",
                    "prompt": "Super-resolution 4K upscaled fidelity, hyper-detailed micro textures, pristine sharpness, photographic clarity",
                    "ratio": "16:9",
                },
                {
                    "title": "Khôi phục ảnh cổ điển",
                    "prompt": "Vintage archival photograph full restoration, vivid natural realistic colorization, scratch repair, balanced dynamic range",
                    "ratio": "1:1",
                },
            ],
        },
    ],
    "video": [
        {
            "groupName": "TẠO VIDEO TỪ VĂN BẢN",
            "items": [
                {
                    "title": "Chuyển động máy quay điện ảnh Slow-motion",
                    "prompt": "Cinematic slow-motion 120fps camera orbit around an athlete in a moody modern gym, volumetric neon light, floating chalk dust, 4k ultra-realistic",
                    "duration": "5s",
                    "ratio": "16:9",
                },
                {
                    "title": "Flycam bay lướt qua phong cảnh thiên nhiên",
                    "prompt": "Breathtaking FPV drone flyover across majestic misty mountain peaks, golden sunrise light, cinematic smooth aerial photography",
                    "duration": "5s",
                    "ratio": "16:9",
                },
                {
                    "title": "Diễn hoạt nhân vật chuyển động tự nhiên",
                    "prompt": "Natural fluid character animation, walking through bustling futuristic cyberpunk city street, neon rain reflections, photorealistic 60fps",
                    "duration": "6s",
                    "ratio": "16:9",
                },
                {
                    "title": "Hiệu ứng kỹ xảo biến đổi hạt điện quang",
                    "prompt": "Explosive kinetic visual effects, particle simulation dissolving into glowing golden energy sparks, dramatic cinematic trailer sequence",
                    "duration": "5s",
                    "ratio": "16:9",
                },
            ],
        },
        {
            "groupName": "VIDEO SẢN PHẨM & QUẢNG CÁO",
            "items": [
                {
                    "title": "Giới thiệu sản phẩm 3D xoay 360 độ",
                    "prompt": "High-end commercial 3D product turntable showcase, luxury smartwatch rotating gracefully on dark reflective marble, dramatic studio lighting",
                    "duration": "5s",
                    "ratio": "16:9",
                },
            ],
        },
    ],
    "audio": [
        {
            "groupName": "GIỌNG ĐỌC & DIỄN CẢM",
            "items": [
                {
                    "title": "Giọng đọc kể chuyện đêm khuya truyền cảm",
                    "prompt": "Đêm đã về khuya, không gian lắng đọng và bình yên. Hãy thả lỏng tâm trí, hít một hơi thật sâu...",
                },
                {
                    "title": "Giọng phát thanh viên bản tin công nghệ",
                    "prompt": "Chào mừng quý vị khán giả đến với bản tin chuyển đổi số và công nghệ trí tuệ nhân tạo VeloX hôm nay.",
                },
                {
                    "title": "Giọng truyền cảm hứng, động lực phát triển",
                    "prompt": "Mỗi buổi sáng thức dậy là một cơ hội mới để bạn chạm tới phiên bản vĩ đại nhất của chính mình.",
                },
            ],
        },
    ],
}


STUDIO_INSPIRATIONS = {
    "chat": [
        "Giải thích nguyên lý hoạt động của Mạng nơ-ron Transformer một cách trực quan và dễ hiểu nhất",
        "Viết kịch bản video ngắn 60 giây giới thiệu giải pháp AI sáng tạo hình ảnh & video thế hệ mới",
        "Tối ưu hóa đoạn mã SQL query phức tạp để cải thiện hiệu năng cơ sở dữ liệu lớn",
        "Lập kế hoạch chiến lược Content Marketing 30 ngày cho startup công nghệ B2B",
        "Viết bài luận phân tích tác động của Trí tuệ nhân tạo đối với thị trường lao động toàn cầu",
        "Thiết kế kiến trúc hệ thống Microservices xử lý 100.000 requests/giây bằng Go và Redis",
    ],
    "image": [
        "Chân dung studio điện ảnh 8K, ánh sáng Rembrandt mềm mại, ống kính 85mm f/1.4",
        "Phong cảnh viễn tưởng huyền ảo với những hòn đảo bay lơ lửng và thác nước pha lê phát quang",
        "Hình chụp macro hoa sen pha lê phát sáng lung linh trong sương sớm, chi tiết 8K cực nét",
        "Chiến binh Bắc Âu dũng mãnh với hình xăm cổ ngữ rực sáng trong bão tuyết bí ẩn",
        "Sản phẩm công nghệ tương lai tối giản trên bục đá cẩm thạch đen phản chiếu gợn nước",
        "Tạo hình nhân vật 3D phong cách hoạt hình Pixar đáng yêu, hiệu ứng ánh sáng Octane Render",
    ],
    "video": [
        "Máy quay điện ảnh 120fps quay slow-motion lướt quanh vận động viên thể thao trong phòng tập neon hiện đại",
        "Flycam FPV bay lượn ngoạn mục qua những đỉnh núi mù sương đón ánh bình minh vàng rực rỡ",
        "Nhân vật bước đi tự nhiên qua con phố cyberpunk tương lai dưới ánh đèn neon phản chiếu mặt đường ướt mưa",
        "Mô hình sản phẩm 3D xoay 360 độ siêu nét trên mặt bàn bóng bẩy, ánh sáng studio sang trọng",
        "Hiệu ứng kỹ xảo biến đổi hạt năng lượng vàng tan biến vào không gian đầy kịch tính",
        "Xe thể thao phong cách Synthwave thập niên 80 lao vút trên xa lộ laser hướng về phía hoàng hôn",
    ],
    "audio": [
        "Giọng đọc nam trầm ấm truyền cảm, phong cách kể chuyện podcast thư giãn đêm khuya",
        "Giọng nữ truyền cảm hứng, năng lượng tích cực lan tỏa động lực bứt phá giới hạn bản thân",
        "Lời chào tổng đài chuyên nghiệp: Chào mừng quý khách đến với dịch vụ trí tuệ nhân tạo VeloX",
        "Bản tin công nghệ nhịp điệu nhanh, rõ ràng, phát âm chuẩn xác từng thuật ngữ",
        "Giọng đọc lồng tiếng TVC quảng cáo thương mại cao cấp, sang trọng và đầy thuyết phục",
        "Đọc thơ nhẹ nhàng, êm đềm với ngữ điệu sâu lắng chạm vào cảm xúc người nghe",
    ],
}


class StudioJobCreateRequest(BaseModel):
    type: str = Field(..., description="Loại job: 'chat' | 'image' | 'video' | 'audio'")
    model_code: str = Field(..., description="Mã model (vd: seedance-2.5, gpt-4o, flux-1-dev)")
    prompt: str = Field(..., min_length=1, description="Prompt yêu cầu")
    options: Optional[Dict[str, Any]] = Field(default_factory=dict, description="Các tham số studio (resolution, duration, ratio, voice, etc.)")


@router.get("/presets")
async def get_studio_presets():
    """Retrieve structured dynamic prompt presets categorized by Studio mode."""
    return ok(data={"groups": STUDIO_PRESETS, "inspirations": STUDIO_INSPIRATIONS})


@router.get("/history")
async def get_studio_history(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Retrieve user's generation history from MediaGenerationLog in database."""
    stmt = (
        select(MediaGenerationLog)
        .where(MediaGenerationLog.user_id == current_user.id)
        .order_by(desc(MediaGenerationLog.created_at))
        .limit(30)
    )
    res = await db.execute(stmt)
    records = res.scalars().all()
    return ok(data=[
        {
            "id": r.id,
            "media_type": r.media_type,
            "model_id": r.model_id,
            "prompt": r.prompt,
            "output_url": r.output_url,
            "credits_charged": float(r.credits_charged),
            "created_at": r.created_at.isoformat() if r.created_at else None,
        }
        for r in records
    ])


@router.post("/jobs")
async def create_studio_job(
    body: StudioJobCreateRequest,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Creates and authorizes a generation job from Studio:
    1. Looks up model price from AIModel table.
    2. Validates user has sufficient credits. If insufficient or zero, blocks job creation with HTTP 402.
    3. Atomically deducts required credits from the user's account and records immutable audit log.
    4. Records job into MediaGenerationLog database table for user history.
    """
    job_type = body.type.strip().lower()
    cat_lookup = job_type.upper()

    # 1. Lookup model selling credit price from catalog
    stmt = select(AIModel).where(AIModel.model_code == body.model_code)
    res = await db.execute(stmt)
    model_obj = res.scalar_one_or_none()

    if model_obj and model_obj.selling_credit_price and model_obj.selling_credit_price > 0:
        cost = model_obj.selling_credit_price
        model_name = model_obj.name
    else:
        cost = DEFAULT_CREDIT_COSTS.get(cat_lookup, 30)
        model_name = body.model_code

    # 2. Lock user record to prevent concurrent double-spending
    user_stmt = select(User).where(User.id == current_user.id).with_for_update()
    user_res = await db.execute(user_stmt)
    user_obj = user_res.scalar_one_or_none()

    if not user_obj:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Không tìm thấy thông tin tài khoản."
        )

    current_balance = user_obj.credit_balance or 0

    if current_balance < cost or current_balance <= 0:
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail={
                "message": f"Số dư không đủ. Cần {cost:,} Credits cho model '{model_name}', nhưng số dư tài khoản của bạn chỉ còn {current_balance:,} Credits.",
                "code": "insufficient_credits",
                "cost": cost,
                "current_balance": current_balance,
            }
        )

    # 3. Deduct credits
    balance_before = current_balance
    new_balance = balance_before - cost
    user_obj.credit_balance = new_balance

    client_ip = get_client_ip(request)
    job_id = f"job-{uuid.uuid4().hex[:12]}"

    audit = CreditAuditLog(
        user_id=user_obj.id,
        actor_id=user_obj.id,
        actor_email=user_obj.email,
        delta=-cost,
        balance_before=balance_before,
        balance_after=new_balance,
        reason=f"Studio {cat_lookup} Job [{job_id}]: {model_name} (-{cost:,} cr)",
        ip_address=client_ip,
    )
    db.add(audit)

    # 4. Save into MediaGenerationLog if image, video, or audio
    output_url = body.options.get("url") if body.options else None
    if cat_lookup in ["IMAGE", "VIDEO", "AUDIO"]:
        log_entry = MediaGenerationLog(
            user_id=user_obj.id,
            model_id=body.model_code,
            media_type=cat_lookup,
            prompt=body.prompt,
            output_url=output_url or "",
            credits_charged=cost,
            render_seconds=float(body.options.get("duration", "5").replace("s", "")) if (body.options and body.options.get("duration")) else 3.5,
        )
        db.add(log_entry)

    await db.commit()

    return ok(
        data={
            "job_id": job_id,
            "type": job_type,
            "model_code": body.model_code,
            "model_name": model_name,
            "cost": cost,
            "credit_balance": user_obj.credit_balance,
            "balance_before": balance_before,
            "status": "QUEUED",
        },
        message=f"Tạo job thành công (-{cost:,} Credits). Số dư còn lại: {new_balance:,} Credits."
    )

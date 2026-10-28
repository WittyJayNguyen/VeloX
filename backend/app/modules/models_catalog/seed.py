"""VeloX AI Gateway — Default Models Catalog Seeder"""
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.modules.models_catalog.models import AIModel

DEFAULT_MODELS = [
    # ── CHAT MODELS ──
    {
        "name": "OpenAI GPT-4o Omni",
        "model_code": "gpt-4o",
        "category": "CHAT",
        "provider": "OpenAI",
        "cost_per_req_or_1k_tok": 10.0,
        "selling_credit_price": 15,
        "input_cost_per_1m": 62500.0,
        "output_cost_per_1m": 250000.0,
        "cache_read_cost_per_1m": 31250.0,
        "input_credit_price": 75,
        "output_credit_price": 300,
        "cache_read_credit_price": 38,
        "is_available": True,
        "description": "Mô hình đa phương thức flagship của OpenAI, thị giác máy tính và phân tích dữ liệu chuyên sâu",
    },
    {
        "name": "OpenAI GPT-4o Mini",
        "model_code": "gpt-4o-mini",
        "category": "CHAT",
        "provider": "OpenAI",
        "cost_per_req_or_1k_tok": 1.0,
        "selling_credit_price": 2,
        "input_cost_per_1m": 3750.0,
        "output_cost_per_1m": 15000.0,
        "cache_read_cost_per_1m": 1875.0,
        "input_credit_price": 5,
        "output_credit_price": 18,
        "cache_read_credit_price": 3,
        "is_available": True,
        "description": "Siêu tốc độ, chi phí siêu rẻ, tối ưu cho tác vụ hội thoại thường nhật và tóm tắt văn bản",
    },
    {
        "name": "OpenAI o1 Reasoning",
        "model_code": "o1",
        "category": "CHAT",
        "provider": "OpenAI",
        "cost_per_req_or_1k_tok": 50.0,
        "selling_credit_price": 60,
        "input_cost_per_1m": 375000.0,
        "output_cost_per_1m": 1500000.0,
        "cache_read_cost_per_1m": 187500.0,
        "input_credit_price": 450,
        "output_credit_price": 1800,
        "cache_read_credit_price": 225,
        "is_available": True,
        "description": "Mô hình suy luận chuỗi tư duy cấp cao (Chain of Thought), chuyên toán học, lập trình thuật toán và khoa học",
    },
    {
        "name": "Claude 3.5 Sonnet",
        "model_code": "claude-3-5-sonnet",
        "category": "CHAT",
        "provider": "Anthropic",
        "cost_per_req_or_1k_tok": 12.0,
        "selling_credit_price": 18,
        "input_cost_per_1m": 75000.0,
        "output_cost_per_1m": 375000.0,
        "cache_read_cost_per_1m": 7500.0,
        "input_credit_price": 90,
        "output_credit_price": 450,
        "cache_read_credit_price": 9,
        "is_available": True,
        "description": "Đỉnh cao code, văn phong tự nhiên sắc bén, phân tích tài liệu học thuật và tư duy kiến trúc hệ thống",
    },
    {
        "name": "Claude 3.5 Haiku",
        "model_code": "claude-3-5-haiku",
        "category": "CHAT",
        "provider": "Anthropic",
        "cost_per_req_or_1k_tok": 3.0,
        "selling_credit_price": 5,
        "input_cost_per_1m": 20000.0,
        "output_cost_per_1m": 100000.0,
        "cache_read_cost_per_1m": 2000.0,
        "input_credit_price": 24,
        "output_credit_price": 120,
        "cache_read_credit_price": 3,
        "is_available": True,
        "description": "Tốc độ phản hồi tức thì, chi phí nhẹ nhàng, xử lý prompt nhanh và trích xuất dữ liệu chuẩn",
    },
    {
        "name": "DeepSeek-V3",
        "model_code": "deepseek-chat",
        "category": "CHAT",
        "provider": "DeepSeek",
        "cost_per_req_or_1k_tok": 1.0,
        "selling_credit_price": 2,
        "input_cost_per_1m": 3500.0,
        "output_cost_per_1m": 7000.0,
        "cache_read_cost_per_1m": 350.0,
        "input_credit_price": 5,
        "output_credit_price": 10,
        "cache_read_credit_price": 1,
        "is_available": True,
        "description": "Mô hình mã nguồn mở thế hệ mới với 671B tham số (37B active), hiệu năng sánh ngang GPT-4o",
    },
    {
        "name": "DeepSeek-R1",
        "model_code": "deepseek-reasoner",
        "category": "CHAT",
        "provider": "DeepSeek",
        "cost_per_req_or_1k_tok": 6.0,
        "selling_credit_price": 10,
        "input_cost_per_1m": 13750.0,
        "output_cost_per_1m": 54750.0,
        "cache_read_cost_per_1m": 3500.0,
        "input_credit_price": 18,
        "output_credit_price": 70,
        "cache_read_credit_price": 5,
        "is_available": True,
        "description": "Khả năng tự suy luận sâu từng bước, giải quyết các bài toán logic hóc búa với chi phí tối ưu",
    },
    {
        "name": "Google Gemini 2.0 Flash",
        "model_code": "gemini-2-0-flash",
        "category": "CHAT",
        "provider": "Google",
        "cost_per_req_or_1k_tok": 1.0,
        "selling_credit_price": 2,
        "input_cost_per_1m": 2500.0,
        "output_cost_per_1m": 10000.0,
        "cache_read_cost_per_1m": 625.0,
        "input_credit_price": 3,
        "output_credit_price": 12,
        "cache_read_credit_price": 1,
        "is_available": True,
        "description": "Mô hình mới nhất của Google với tốc độ cực nhanh, hỗ trợ đa phương thức văn bản, audio và video",
    },
    {
        "name": "Google Gemini 1.5 Pro",
        "model_code": "gemini-1-5-pro",
        "category": "CHAT",
        "provider": "Google",
        "cost_per_req_or_1k_tok": 8.0,
        "selling_credit_price": 12,
        "input_cost_per_1m": 31250.0,
        "output_cost_per_1m": 125000.0,
        "cache_read_cost_per_1m": 7812.0,
        "input_credit_price": 38,
        "output_credit_price": 150,
        "cache_read_credit_price": 10,
        "is_available": True,
        "description": "Context window cực lớn lên đến 2 triệu tokens, phân tích video dài và kho tài liệu khổng lồ",
    },
    {
        "name": "Meta Llama 3.3 (70B)",
        "model_code": "llama-3-3-70b",
        "category": "CHAT",
        "provider": "Meta AI",
        "cost_per_req_or_1k_tok": 4.0,
        "selling_credit_price": 6,
        "input_cost_per_1m": 14750.0,
        "output_cost_per_1m": 19750.0,
        "cache_read_cost_per_1m": 7500.0,
        "input_credit_price": 18,
        "output_credit_price": 24,
        "cache_read_credit_price": 9,
        "is_available": True,
        "description": "Mã nguồn mở tốc độ cao, độ trễ cực thấp, tối ưu chi phí cho các luồng xử lý tự động",
    },

    # ── IMAGE MODELS ──
    {
        "name": "Midjourney v6.1",
        "model_code": "midjourney-v6",
        "category": "IMAGE",
        "provider": "Midjourney Inc.",
        "cost_per_req_or_1k_tok": 25.0,
        "selling_credit_price": 35,
        "input_credit_price": 0,
        "output_credit_price": 0,
        "cache_read_credit_price": 0,
        "is_available": True,
        "description": "Tiêu chuẩn vàng về thẩm mỹ hội họa, ánh sáng studio và bố cục điện ảnh 8K chân thực",
    },
    {
        "name": "FLUX.1 [dev/pro]",
        "model_code": "flux-1-dev",
        "category": "IMAGE",
        "provider": "Black Forest Labs",
        "cost_per_req_or_1k_tok": 18.0,
        "selling_credit_price": 25,
        "input_credit_price": 0,
        "output_credit_price": 0,
        "cache_read_credit_price": 0,
        "is_available": True,
        "description": "Độ chân thực mô phỏng da người xuất sắc, texture tự nhiên, bám sát prompt chữ viết và poster",
    },
    {
        "name": "OpenAI DALL-E 3 Ultra",
        "model_code": "dall-e-3",
        "category": "IMAGE",
        "provider": "OpenAI",
        "cost_per_req_or_1k_tok": 22.0,
        "selling_credit_price": 30,
        "input_credit_price": 0,
        "output_credit_price": 0,
        "cache_read_credit_price": 0,
        "is_available": True,
        "description": "Hiểu ngữ cảnh prompt phức tạp, màu sắc rực rỡ và chi tiết kỹ thuật sắc sảo chuẩn concept art",
    },
    {
        "name": "Stable Diffusion 3.5 Large",
        "model_code": "sd-3-5-large",
        "category": "IMAGE",
        "provider": "Stability AI",
        "cost_per_req_or_1k_tok": 15.0,
        "selling_credit_price": 20,
        "input_credit_price": 0,
        "output_credit_price": 0,
        "cache_read_credit_price": 0,
        "is_available": True,
        "description": "Tạo ảnh nghệ thuật đa phong cách, hỗ trợ tùy biến typography và bố cục hình học tinh tế",
    },

    # ── VIDEO MODELS ──
    {
        "name": "Runway Gen-3 Alpha",
        "model_code": "runway-gen3",
        "category": "VIDEO",
        "provider": "Runway AI",
        "cost_per_req_or_1k_tok": 60.0,
        "selling_credit_price": 80,
        "input_credit_price": 0,
        "output_credit_price": 0,
        "cache_read_credit_price": 0,
        "is_available": True,
        "description": "Hiệu ứng chuyển động camera điện ảnh chuyên nghiệp, vật lý ánh sáng sống động độ phân giải cao",
    },
    {
        "name": "Luma Dream Machine 1.5",
        "model_code": "luma-dream-machine",
        "category": "VIDEO",
        "provider": "Luma AI",
        "cost_per_req_or_1k_tok": 50.0,
        "selling_credit_price": 70,
        "input_credit_price": 0,
        "output_credit_price": 0,
        "cache_read_credit_price": 0,
        "is_available": True,
        "description": "Thời gian sinh video cực nhanh, chuyển động nhân vật uyển chuyển mượt mà tự nhiên",
    },
    {
        "name": "Kling AI 1.5 Pro",
        "model_code": "kling-ai-1-5",
        "category": "VIDEO",
        "provider": "Kuaishou Technology",
        "cost_per_req_or_1k_tok": 55.0,
        "selling_credit_price": 75,
        "input_credit_price": 0,
        "output_credit_price": 0,
        "cache_read_credit_price": 0,
        "is_available": True,
        "description": "Tạo video dài đến 10s với độ phân giải Full HD và độ bám sát vật lý chuẩn mực",
    },
    {
        "name": "Minimax Video-01",
        "model_code": "minimax-video-01",
        "category": "VIDEO",
        "provider": "Hailuo AI",
        "cost_per_req_or_1k_tok": 45.0,
        "selling_credit_price": 65,
        "input_credit_price": 0,
        "output_credit_price": 0,
        "cache_read_credit_price": 0,
        "is_available": True,
        "description": "Diễn hoạt biểu cảm gương mặt và hành động tự nhiên, khung hình 60fps mượt mà",
    },
    {
        "name": "ByteDance Seedance 2.5",
        "model_code": "seedance-2.5",
        "category": "VIDEO",
        "provider": "ByteDance",
        "cost_per_req_or_1k_tok": 50.0,
        "selling_credit_price": 80,
        "input_credit_price": 0,
        "output_credit_price": 0,
        "cache_read_credit_price": 0,
        "is_available": True,
        "description": "Tạo video chân thực độ phân giải cao, chuyển động uyển chuyển bám sát nhịp điệu",
    },
    {
        "name": "Runway Gen-3 Alpha HD",
        "model_code": "runway-gen3-alpha",
        "category": "VIDEO",
        "provider": "Runway",
        "cost_per_req_or_1k_tok": 70.0,
        "selling_credit_price": 95,
        "input_credit_price": 0,
        "output_credit_price": 0,
        "cache_read_credit_price": 0,
        "is_available": True,
        "description": "Đỉnh cao video điện ảnh thế hệ mới, điều khiển góc máy camera 360 độ hoàn hảo",
    },
    {
        "name": "FLUX.1 [dev/pro]",
        "model_code": "flux-1-dev",
        "category": "IMAGE",
        "provider": "Black Forest Labs",
        "cost_per_req_or_1k_tok": 18.0,
        "selling_credit_price": 25,
        "input_credit_price": 0,
        "output_credit_price": 0,
        "cache_read_credit_price": 0,
        "is_available": True,
        "description": "Mô hình tạo ảnh thế hệ mới 12 tỷ tham số, tái hiện chữ text và bàn tay giải phẫu siêu chuẩn",
    },
    {
        "name": "Midjourney v6.1 Ultra",
        "model_code": "midjourney-v6.1",
        "category": "IMAGE",
        "provider": "Midjourney",
        "cost_per_req_or_1k_tok": 30.0,
        "selling_credit_price": 45,
        "input_credit_price": 0,
        "output_credit_price": 0,
        "cache_read_credit_price": 0,
        "is_available": True,
        "description": "Nhiếp ảnh chân thực, ánh sáng studio nghệ thuật và độ sắc nét chi tiết da cực đỉnh",
    },

    # ── AUDIO & VOICE MODELS ──
    {
        "name": "ElevenLabs Multilingual v3",
        "model_code": "eleven-multilingual-v3",
        "category": "AUDIO",
        "provider": "ElevenLabs",
        "cost_per_req_or_1k_tok": 10.0,
        "selling_credit_price": 15,
        "input_credit_price": 0,
        "output_credit_price": 0,
        "cache_read_credit_price": 0,
        "is_available": True,
        "description": "Giọng đọc truyền cảm, đa ngôn ngữ với ngữ điệu tự nhiên như người bản xứ",
    },
    {
        "name": "OpenAI TTS-1 HD",
        "model_code": "tts-1-hd",
        "category": "AUDIO",
        "provider": "OpenAI",
        "cost_per_req_or_1k_tok": 12.0,
        "selling_credit_price": 20,
        "input_credit_price": 0,
        "output_credit_price": 0,
        "cache_read_credit_price": 0,
        "is_available": True,
        "description": "Bộ tạo giọng nói độ trung thực cao từ OpenAI với 6 âm sắc linh hoạt",
    },
    {
        "name": "Chatterbox Voice Turbo",
        "model_code": "chatterbox-turbo",
        "category": "AUDIO",
        "provider": "Meta",
        "cost_per_req_or_1k_tok": 6.0,
        "selling_credit_price": 10,
        "input_credit_price": 0,
        "output_credit_price": 0,
        "cache_read_credit_price": 0,
        "is_available": True,
        "description": "Sinh âm thanh và giọng đọc siêu tốc độ với độ trễ thấp",
    },
]


def get_model_config(item: dict) -> dict:
    code = (item.get("model_code") or "").lower()
    cat = (item.get("category") or "").upper()
    
    # Specific Video configs
    if "seedance" in code:
        return {
            "durations": ["5s", "10s"],
            "resolutions": ["720p", "1080p"],
            "aspectRatios": ["Tự động", "16:9", "9:16", "1:1"],
            "defaultDuration": "5s",
            "defaultResolution": "1080p",
            "defaultAspectRatio": "Tự động",
        }
    if "runway" in code:
        return {
            "durations": ["5s", "10s (Pro)"],
            "resolutions": ["720p", "1080p", "4K"],
            "aspectRatios": ["16:9", "9:16"],
            "defaultDuration": "5s",
            "defaultResolution": "1080p",
            "defaultAspectRatio": "16:9",
        }
    if "minimax" in code:
        return {
            "durations": ["6s"],
            "resolutions": ["720p", "1080p"],
            "aspectRatios": ["Tự động", "16:9", "9:16", "1:1"],
            "defaultDuration": "6s",
            "defaultResolution": "1080p",
            "defaultAspectRatio": "Tự động",
        }
    if "kling" in code:
        return {
            "durations": ["5s", "10s"],
            "resolutions": ["1080p"],
            "aspectRatios": ["16:9", "9:16", "1:1"],
            "defaultDuration": "5s",
            "defaultResolution": "1080p",
            "defaultAspectRatio": "16:9",
        }
    if "grok" in code and "video" in code:
        return {
            "durations": ["5s"],
            "resolutions": ["720p", "1080p"],
            "aspectRatios": ["16:9", "9:16"],
            "defaultDuration": "5s",
            "defaultResolution": "1080p",
            "defaultAspectRatio": "16:9",
        }
    if "luma" in code:
        return {
            "durations": ["5s"],
            "resolutions": ["720p", "1080p"],
            "aspectRatios": ["16:9", "9:16"],
            "defaultDuration": "5s",
            "defaultResolution": "1080p",
            "defaultAspectRatio": "16:9",
        }

    # Specific Image configs
    if "midjourney" in code:
        return {
            "resolutions": ["1K", "2K", "4K"],
            "aspectRatios": ["1:1", "16:9", "9:16", "4:3", "21:9"],
            "qualities": ["Tiêu chuẩn", "Cao", "Ultra"],
            "defaultResolution": "2K",
            "defaultAspectRatio": "16:9",
            "defaultQuality": "Ultra",
        }
    if "flux" in code:
        return {
            "resolutions": ["1K", "2K"],
            "aspectRatios": ["1:1", "16:9", "9:16", "4:3"],
            "qualities": ["Tiêu chuẩn", "Cao"],
            "defaultResolution": "1K",
            "defaultAspectRatio": "1:1",
            "defaultQuality": "Cao",
        }
    if "dall-e" in code:
        return {
            "resolutions": ["1K", "2K"],
            "aspectRatios": ["1:1", "16:9", "9:16"],
            "qualities": ["Tiêu chuẩn", "HD"],
            "defaultResolution": "1K",
            "defaultAspectRatio": "1:1",
            "defaultQuality": "HD",
        }

    # Category defaults
    if cat == "VIDEO":
        return {
            "durations": ["5s", "10s"],
            "resolutions": ["720p", "1080p"],
            "aspectRatios": ["Tự động", "16:9", "9:16", "1:1"],
            "defaultDuration": "5s",
            "defaultResolution": "1080p",
            "defaultAspectRatio": "Tự động",
        }
    if cat == "IMAGE":
        return {
            "resolutions": ["1K", "2K", "4K"],
            "aspectRatios": ["Tự động", "1:1", "16:9", "9:16", "4:3", "21:9"],
            "qualities": ["Tiêu chuẩn", "Cao", "Ultra"],
            "defaultResolution": "1K",
            "defaultAspectRatio": "Tự động",
            "defaultQuality": "Cao",
        }
    if cat == "AUDIO":
        return {
            "voices": ["English · American", "English · British", "Tiếng Việt · Hà Nội", "Tiếng Việt · Sài Gòn"],
            "defaultVoice": "English · American",
        }
    if cat == "CHAT":
        return {
            "tones": ["creative", "balanced", "precise"],
            "defaultTone": "balanced",
        }
    return {}


async def seed_default_models(db: AsyncSession):
    """Seed initial models catalog and ensure all standard models exist with full config"""
    import json
    res = await db.execute(select(AIModel.model_code))
    existing_codes = set(res.scalars().all())

    added_count = 0
    for item in DEFAULT_MODELS:
        if item["model_code"] in existing_codes:
            continue

        cfg_dict = get_model_config(item)
        model = AIModel(
            name=item["name"],
            model_code=item["model_code"],
            category=item["category"],
            provider=item["provider"],
            cost_per_req_or_1k_tok=item.get("cost_per_req_or_1k_tok", 0.5),
            selling_credit_price=item.get("selling_credit_price", 250),
            input_cost_per_1m=item.get("input_cost_per_1m", 0.0),
            output_cost_per_1m=item.get("output_cost_per_1m", 0.0),
            cache_read_cost_per_1m=item.get("cache_read_cost_per_1m", 0.0),
            input_credit_price=item.get("input_credit_price", 0),
            output_credit_price=item.get("output_credit_price", 0),
            cache_read_credit_price=item.get("cache_read_credit_price", 0),
            is_available=item.get("is_available", True),
            description=item.get("description", ""),
            config=json.dumps(cfg_dict, ensure_ascii=False),
        )
        db.add(model)
        existing_codes.add(item["model_code"])
        added_count += 1

    # Backfill config for existing models in database if missing
    all_models_res = await db.execute(select(AIModel))
    all_models = all_models_res.scalars().all()
    updated_config_count = 0
    for m in all_models:
        if not m.config or m.config.strip() in ("", "{}", "null"):
            cfg = get_model_config({"model_code": m.model_code, "category": m.category})
            m.config = json.dumps(cfg, ensure_ascii=False)
            updated_config_count += 1

    if added_count > 0 or updated_config_count > 0:
        await db.commit()
        if added_count > 0:
            print(f"[DB] Seeded {added_count} new standard AI models into catalog")
        if updated_config_count > 0:
            print(f"[DB] Updated configurations for {updated_config_count} existing AI models")

    return added_count

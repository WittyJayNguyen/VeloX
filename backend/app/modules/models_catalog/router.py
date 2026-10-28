"""VeloX AI Gateway — Models Catalog API Endpoints"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_, desc
from app.core.database import get_db
from app.core.security import get_current_user_payload
from app.modules.models_catalog.models import AIModel
from app.modules.models_catalog.schemas import (
    AIModelCreate, AIModelUpdate, AIModelResponse, AIModelPublicResponse,
    UpdateModelPricingRequest, BatchMarkupRequest
)

router = APIRouter(tags=["Gateway — AI Models Catalog"])


@router.get("/models/public", response_model=List[AIModelPublicResponse])
async def list_public_models(
    category: Optional[str] = None,
    provider: Optional[str] = None,
    search: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
):
    """Public Models Catalog API for landing page & Studio explorer.
    Only shows publicly available models and customer credit pricing.
    Strictly excludes upstream supplier cost and profit margins.
    """
    stmt = select(AIModel).where(AIModel.is_available == True)
    if category and category != "ALL":
        stmt = stmt.where(AIModel.category == category.upper())
    if provider and provider != "ALL":
        stmt = stmt.where(AIModel.provider == provider)
    if search:
        search_filter = f"%{search}%"
        stmt = stmt.where(
            or_(
                AIModel.name.ilike(search_filter),
                AIModel.model_code.ilike(search_filter),
                AIModel.provider.ilike(search_filter),
                AIModel.description.ilike(search_filter),
            )
        )

    stmt = stmt.order_by(desc(AIModel.created_at))
    result = await db.execute(stmt)
    return result.scalars().all()


@router.get("/models", response_model=List[AIModelResponse])
async def list_models(
    category: Optional[str] = None,
    provider: Optional[str] = None,
    search: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    _user: dict = Depends(get_current_user_payload),
):
    stmt = select(AIModel)
    if category and category != "ALL":
        stmt = stmt.where(AIModel.category == category)
    if provider and provider != "ALL":
        stmt = stmt.where(AIModel.provider == provider)
    if search:
        search_filter = f"%{search}%"
        stmt = stmt.where(
            or_(
                AIModel.name.ilike(search_filter),
                AIModel.model_code.ilike(search_filter),
                AIModel.provider.ilike(search_filter),
            )
        )

    stmt = stmt.order_by(desc(AIModel.created_at))
    result = await db.execute(stmt)
    models = result.scalars().all()
    return models


@router.post("/models", response_model=AIModelResponse, status_code=status.HTTP_201_CREATED)
async def create_model(
    payload: AIModelCreate,
    db: AsyncSession = Depends(get_db),
    _user: dict = Depends(get_current_user_payload),
):
    # Check if model_code already exists
    existing_stmt = select(AIModel).where(AIModel.model_code == payload.model_code)
    existing_res = await db.execute(existing_stmt)
    if existing_res.scalar_one_or_none():
        raise HTTPException(status_code=400, detail=f"Model code '{payload.model_code}' already exists")

    config_val = payload.config
    if isinstance(config_val, dict):
        import json
        config_str = json.dumps(config_val, ensure_ascii=False)
    else:
        config_str = str(config_val or "{}")

    model = AIModel(
        name=payload.name,
        model_code=payload.model_code,
        category=payload.category,
        provider=payload.provider,
        cost_per_req_or_1k_tok=payload.cost_per_req_or_1k_tok,
        selling_credit_price=payload.selling_credit_price,
        input_cost_per_1m=payload.input_cost_per_1m,
        output_cost_per_1m=payload.output_cost_per_1m,
        cache_read_cost_per_1m=payload.cache_read_cost_per_1m,
        input_credit_price=payload.input_credit_price,
        output_credit_price=payload.output_credit_price,
        cache_read_credit_price=payload.cache_read_credit_price,
        is_available=payload.is_available,
        pool_id=payload.pool_id,
        description=payload.description,
        config=config_str,
    )
    db.add(model)
    await db.commit()
    await db.refresh(model)
    return model


@router.get("/models/{model_id}", response_model=AIModelResponse)
async def get_model(
    model_id: str,
    db: AsyncSession = Depends(get_db),
    _user: dict = Depends(get_current_user_payload),
):
    stmt = select(AIModel).where(AIModel.id == model_id)
    result = await db.execute(stmt)
    model = result.scalar_one_or_none()
    if not model:
        raise HTTPException(status_code=404, detail="AI Model not found")
    return model


@router.put("/models/{model_id}", response_model=AIModelResponse)
async def update_model(
    model_id: str,
    payload: AIModelUpdate,
    db: AsyncSession = Depends(get_db),
    _user: dict = Depends(get_current_user_payload),
):
    stmt = select(AIModel).where(AIModel.id == model_id)
    result = await db.execute(stmt)
    model = result.scalar_one_or_none()
    if not model:
        raise HTTPException(status_code=404, detail="AI Model not found")

    update_data = payload.model_dump(exclude_unset=True)
    for field, val in update_data.items():
        if field == "config":
            if isinstance(val, dict):
                import json
                val = json.dumps(val, ensure_ascii=False)
            elif val is None:
                val = "{}"
        setattr(model, field, val)

    await db.commit()
    await db.refresh(model)
    return model


@router.put("/models/{model_id}/pricing", response_model=AIModelResponse)
async def update_model_pricing(
    model_id: str,
    payload: UpdateModelPricingRequest,
    db: AsyncSession = Depends(get_db),
    _user: dict = Depends(get_current_user_payload),
):
    """Update individual model cost and selling prices (profit margin)."""
    stmt = select(AIModel).where(AIModel.id == model_id)
    result = await db.execute(stmt)
    model = result.scalar_one_or_none()
    if not model:
        raise HTTPException(status_code=404, detail="AI Model not found")

    if payload.cost_per_req_or_1k_tok is not None:
        model.cost_per_req_or_1k_tok = payload.cost_per_req_or_1k_tok
    if payload.selling_credit_price is not None:
        model.selling_credit_price = payload.selling_credit_price
    if payload.input_cost_per_1m is not None:
        model.input_cost_per_1m = payload.input_cost_per_1m
    if payload.input_credit_price is not None:
        model.input_credit_price = payload.input_credit_price
    if payload.output_cost_per_1m is not None:
        model.output_cost_per_1m = payload.output_cost_per_1m
    if payload.output_credit_price is not None:
        model.output_credit_price = payload.output_credit_price
    if payload.cache_read_cost_per_1m is not None:
        model.cache_read_cost_per_1m = payload.cache_read_cost_per_1m
    if payload.cache_read_credit_price is not None:
        model.cache_read_credit_price = payload.cache_read_credit_price

    await db.commit()
    await db.refresh(model)
    return model


@router.post("/models/bulk-markup")
async def bulk_markup_models(
    payload: BatchMarkupRequest,
    db: AsyncSession = Depends(get_db),
    _user: dict = Depends(get_current_user_payload),
):
    """
    Bulk update selling prices based on a profit margin percent (e.g. +30%) or multiplier.
    Applies to all matching models across categories or selected model IDs.
    """
    mult = 1.3
    if payload.markup_percent is not None:
        mult = 1.0 + (payload.markup_percent / 100.0)
    elif payload.markup_multiplier is not None:
        mult = payload.markup_multiplier

    stmt = select(AIModel)
    if payload.category and payload.category != "ALL":
        stmt = stmt.where(AIModel.category == payload.category)
    if payload.provider and payload.provider != "ALL":
        stmt = stmt.where(AIModel.provider == payload.provider)
    if payload.model_ids:
        stmt = stmt.where(AIModel.id.in_(payload.model_ids))

    result = await db.execute(stmt)
    models = result.scalars().all()

    for m in models:
        # Token rates (Convert VND cost / 1000 to standard credit units if in VND)
        if m.input_cost_per_1m and m.input_cost_per_1m > 0:
            base_in = m.input_cost_per_1m / 1000.0 if m.input_cost_per_1m > 1000 else m.input_cost_per_1m
            m.input_credit_price = max(1, int(round(base_in * mult)))
        if m.output_cost_per_1m and m.output_cost_per_1m > 0:
            base_out = m.output_cost_per_1m / 1000.0 if m.output_cost_per_1m > 1000 else m.output_cost_per_1m
            m.output_credit_price = max(1, int(round(base_out * mult)))
        if m.cache_read_cost_per_1m and m.cache_read_cost_per_1m > 0:
            base_cache = m.cache_read_cost_per_1m / 1000.0 if m.cache_read_cost_per_1m > 1000 else m.cache_read_cost_per_1m
            m.cache_read_credit_price = max(1, int(round(base_cache * mult)))

        # Media & Per-request rates
        if m.category in ["IMAGE", "VIDEO"]:
            base_cost = m.cost_per_req_or_1k_tok or (2.0 if m.category == "IMAGE" else 10.0)
            m.selling_credit_price = max(1, int(round(base_cost * mult)))
        else:
            # For Chat/Text models, the minimum request floor should be 1 credit (or 2 for heavy reasoning models)
            m.selling_credit_price = 2 if "o1" in m.model_code.lower() else 1

    await db.commit()
    markup_pct = round((mult - 1.0) * 100.0, 1)
    return {
        "status": "SUCCESS",
        "updated_count": len(models),
        "markup_percent": markup_pct,
        "message": f"Đã áp dụng tỷ lệ lợi nhuận +{markup_pct}% cho {len(models)} models thành công."
    }



@router.delete("/models/{model_id}")
async def delete_model(
    model_id: str,
    db: AsyncSession = Depends(get_db),
    _user: dict = Depends(get_current_user_payload),
):
    stmt = select(AIModel).where(AIModel.id == model_id)
    result = await db.execute(stmt)
    model = result.scalar_one_or_none()
    if not model:
        raise HTTPException(status_code=404, detail="AI Model not found")

    await db.delete(model)
    await db.commit()
    return {"message": "AI Model deleted successfully"}


@router.post("/models/{model_id}/toggle", response_model=AIModelResponse)
async def toggle_model(
    model_id: str,
    db: AsyncSession = Depends(get_db),
    _user: dict = Depends(get_current_user_payload),
):
    stmt = select(AIModel).where(AIModel.id == model_id)
    result = await db.execute(stmt)
    model = result.scalar_one_or_none()
    if not model:
        raise HTTPException(status_code=404, detail="AI Model not found")

    model.is_available = not model.is_available
    await db.commit()
    await db.refresh(model)
    return model


@router.post("/models/sync-from-keys")
async def sync_models_from_keys(
    db: AsyncSession = Depends(get_db),
    _user: dict = Depends(get_current_user_payload),
):
    """Scan all provider credentials / keys in the database and automatically register/sync detected models into AI Models catalog."""
    import json
    from app.modules.pools.models import ProviderCredential, ServicePool

    # Fetch all credentials with their pools
    stmt = select(ProviderCredential, ServicePool).join(ServicePool, ProviderCredential.pool_id == ServicePool.id)
    result = await db.execute(stmt)
    rows = result.all()

    synced_models = []
    for cred, pool in rows:
        models_list = []
        pricing_catalog = {}
        if pool.base_url:
            try:
                from app.modules.models_catalog.pricing import fetch_upstream_provider_pricing
                pricing_catalog = await fetch_upstream_provider_pricing(pool.base_url, cred.key_val)
            except Exception:
                pass

        if cred.detected_models:
            try:
                models_list = json.loads(cred.detected_models)
            except Exception:
                models_list = [m.strip() for m in cred.detected_models.split(",") if m.strip()]

        # If detected_models is empty but pricing_catalog has models, use official models!
        if not models_list and pricing_catalog:
            models_list = pricing_catalog.get("__official_models__") or [k for k in pricing_catalog.keys() if not k.startswith("__")]
            cred.detected_models = json.dumps(models_list)

        if not models_list and cred.key_val:
            from app.modules.pools.router import query_provider_models
            detect_res = await query_provider_models(
                key_val=cred.key_val,
                provider=pool.provider,
                base_url=pool.base_url,
                auth_type=cred.auth_type,
            )
            models_list = detect_res.get("detected_models", [])
            if models_list:
                cred.detected_models = json.dumps(models_list)

        for code in models_list:
            code = str(code).strip()
            if not code:
                continue

            from app.modules.models_catalog.pricing import resolve_model_pricing
            upstream_p = pricing_catalog.get(code)
            pricing = resolve_model_pricing(code, pool.provider, upstream_pricing=upstream_p)

            existing_stmt = select(AIModel).where(AIModel.model_code == code)
            existing_res = await db.execute(existing_stmt)
            existing_model = existing_res.scalar_one_or_none()

            if existing_model:
                # Upstream live pricing takes precedence over fallback
                if upstream_p is not None:
                    existing_model.input_cost_per_1m = pricing["input_cost_per_1m"]
                    existing_model.output_cost_per_1m = pricing["output_cost_per_1m"]
                    existing_model.cache_read_cost_per_1m = pricing["cache_read_cost_per_1m"]
                    existing_model.input_credit_price = pricing["input_credit_price"]
                    existing_model.output_credit_price = pricing["output_credit_price"]
                    existing_model.cache_read_credit_price = pricing["cache_read_credit_price"]
                elif not existing_model.input_cost_per_1m and pricing["input_cost_per_1m"]:
                    existing_model.input_cost_per_1m = pricing["input_cost_per_1m"]
                    existing_model.output_cost_per_1m = pricing["output_cost_per_1m"]
                    existing_model.cache_read_cost_per_1m = pricing["cache_read_cost_per_1m"]
                    existing_model.input_credit_price = pricing["input_credit_price"]
                    existing_model.output_credit_price = pricing["output_credit_price"]
                    existing_model.cache_read_credit_price = pricing["cache_read_credit_price"]
                if not existing_model.pool_id:
                    existing_model.pool_id = pool.id
                continue

            code_lower = code.lower()
            if any(w in code_lower for w in ["dall-e", "midjourney", "flux", "image", "sd-", "imagine"]):
                category = "IMAGE"
            elif any(w in code_lower for w in ["gen3", "gen-2", "video", "luma", "sora", "runway", "seedance", "veo", "kling", "minimax-video"]):
                category = "VIDEO"
            elif any(w in code_lower for w in ["tts", "whisper", "audio", "voice", "speech"]):
                category = "AUDIO"
            elif any(w in code_lower for w in ["agent", "coder", "dev", "cursor"]):
                category = "DEV_REQ"
            else:
                category = "CHAT"

            name_parts = [p.capitalize() for p in code.replace("-", " ").replace("_", " ").split()]
            friendly_name = f"{pool.provider} " + " ".join(name_parts)

            new_model = AIModel(
                name=friendly_name,
                model_code=code,
                category=category,
                provider=pool.provider,
                cost_per_req_or_1k_tok=pricing["cost_per_req_or_1k_tok"],
                selling_credit_price=pricing["selling_credit_price"],
                input_cost_per_1m=pricing["input_cost_per_1m"],
                output_cost_per_1m=pricing["output_cost_per_1m"],
                cache_read_cost_per_1m=pricing["cache_read_cost_per_1m"],
                input_credit_price=pricing["input_credit_price"],
                output_credit_price=pricing["output_credit_price"],
                cache_read_credit_price=pricing["cache_read_credit_price"],
                is_available=True,
                pool_id=pool.id,
                description=f"Tự động nhận diện từ cụm {pool.name}",
            )
            db.add(new_model)
            synced_models.append(code)

    await db.commit()
    return {
        "status": "SUCCESS",
        "synced_count": len(synced_models),
        "synced_models": synced_models,
        "message": f"Đã tự động đồng bộ thành công {len(synced_models)} models mới từ các API Key / Session Token vào danh mục."
    }


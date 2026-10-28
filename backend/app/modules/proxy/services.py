"""
VeloX AI Gateway — Proxy Execution Engine (Scrum Enterprise Grade)
==================================================================
Routes incoming Developer API requests through the internal Provider Pool (Muse/OpenAI),
deducts developer credits, and records isolated job history in MediaGenerationLog.
"""
import time
import uuid
from typing import Dict, Any, List
from datetime import datetime, timezone
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

import httpx
from app.modules.developers.models import UserApiKey
from app.modules.users.models import User, CreditAuditLog
from app.modules.models_catalog.models import AIModel
from app.modules.pools.models import ProviderCredential, ServicePool
from app.modules.logs.services import record_media_generation
from app.modules.playground.muse_worker import generate_media_via_muse
from app.modules.proxy.schemas import (
    ImageGenerationRequest, ImageGenerationResponse, ImageData,
    VideoGenerationRequest, VideoGenerationResponse,
    ChatCompletionRequest, ChatCompletionResponse, ChatChoice, ChatChoiceMessage, UsageInfo
)


# Pricing configuration (in User Credits)
CREDIT_RATES = {
    "IMAGE": 2,     # 2 Credits per generated image
    "VIDEO": 10,    # 10 Credits per generated video
    "CHAT": 1,      # 1 Credit per text completion
}


async def _deduct_user_credits(user: User, amount: int, reason: str, db: AsyncSession):
    """Safely checks and deducts credits with an immutable audit log entry."""
    if user.credit_balance < amount:
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail={
                "error": {
                    "message": f"Số dư không đủ. Bạn cần {amount} credits nhưng số dư hiện tại là {user.credit_balance} credits.",
                    "type": "insufficient_quota",
                    "code": "insufficient_credits",
                }
            }
        )
    balance_before = user.credit_balance
    user.credit_balance -= amount
    balance_after = user.credit_balance

    audit = CreditAuditLog(
        user_id=user.id,
        actor_id=user.id,
        actor_email=user.email,
        delta=-amount,
        balance_before=balance_before,
        balance_after=balance_after,
        reason=reason,
    )
    db.add(audit)

    try:
        from app.modules.billing.models import UserWallet
        w_res = await db.execute(select(UserWallet).where(UserWallet.user_id == user.id))
        wallet = w_res.scalar_one_or_none()
        if wallet:
            wallet.balance_credits = user.credit_balance
            wallet.total_spent = (wallet.total_spent or 0) + amount
    except Exception:
        pass

    await db.commit()


async def _find_active_credential(provider: str, db: AsyncSession) -> ProviderCredential:
    """Finds an available credential from the pool with remaining daily quota."""
    stmt = (
        select(ProviderCredential)
        .where(
            ProviderCredential.status.in_(["ACTIVE", "TESTED"]),
        )
        .order_by(ProviderCredential.requests_count.asc())
    )
    res = await db.execute(stmt)
    creds = res.scalars().all()
    if not creds:
        # Fallback to any credential
        fallback_res = await db.execute(select(ProviderCredential).limit(1))
        cred = fallback_res.scalar_one_or_none()
        if not cred:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail={"error": {"message": "No active provider credentials available in pool.", "type": "gateway_error"}}
            )
        return cred
    return creds[0]


async def proxy_generate_image(
    payload: ImageGenerationRequest,
    api_key: UserApiKey,
    user: User,
    db: AsyncSession
) -> ImageGenerationResponse:
    """Generates images via internal Pool, deducts credits based on model selling price, logs job to user library."""
    n_outputs = payload.n or 1
    model_code = payload.model or "meta-imagine"

    # 1. Lookup model selling price
    m_stmt = select(AIModel).where(AIModel.model_code == model_code)
    m_res = await db.execute(m_stmt)
    model_obj = m_res.scalar_one_or_none()
    unit_cost = (model_obj.selling_credit_price if (model_obj and model_obj.selling_credit_price > 0) else CREDIT_RATES["IMAGE"])
    total_cost = unit_cost * n_outputs

    # 2. Pre-check credit balance
    if user.credit_balance < total_cost:
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail={"error": {"message": f"Số dư không đủ. Cần {total_cost} credits cho model {model_code}, số dư hiện tại: {user.credit_balance}", "code": "insufficient_credits"}}
        )

    # 3. Pick pool credential
    cred = await _find_active_credential("Meta AI", db)
    t0 = time.perf_counter()

    # 4. Call Muse worker
    worker_res = await generate_media_via_muse(
        session_id=cred.key_val or "",
        prompt=payload.prompt,
        mode="image",
        num_outputs=n_outputs,
    )

    if not worker_res.get("success"):
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail={"error": {"message": f"Upstream provider error: {worker_res.get('error')}", "type": "provider_error"}}
        )

    media_urls = worker_res.get("media_urls", [])
    if not media_urls and worker_res.get("media_url"):
        media_urls = [worker_res["media_url"]]

    render_time = round(time.perf_counter() - t0, 2)

    # 5. Deduct credits & Log private job for each output
    await _deduct_user_credits(user, total_cost, f"Proxy API Key [{api_key.name}] Image Gen: {model_code} ({n_outputs} outputs @ {unit_cost} cr)", db)

    cdn_media_urls = []
    for url in media_urls:
        job = await record_media_generation(
            user_id=user.id,
            model_id=model_code,
            media_type="IMAGE",
            prompt=payload.prompt,
            output_url=url,
            credits_charged=unit_cost,
            render_seconds=render_time,
            db=db
        )
        cdn_media_urls.append(job.output_url or url)

    # Record API transaction audit log
    from app.modules.logs.services import record_api_call
    await record_api_call(
        user_id=user.id,
        model_id=model_code,
        credential_id=cred.id if cred else None,
        prompt_tokens=len(payload.prompt.split()) * 2,
        completion_tokens=n_outputs * 1000,
        total_credits_charged=total_cost,
        duration_ms=int(render_time * 1000),
        status_code=200,
        ip_address=None,
        db=db
    )

    if cred:
        cred.record_usage(n_outputs)
    if api_key:
        api_key.record_usage()
    await db.commit()

    return ImageGenerationResponse(
        created=int(datetime.now(timezone.utc).timestamp()),
        data=[ImageData(url=u) for u in cdn_media_urls]
    )


async def proxy_generate_video(
    payload: VideoGenerationRequest,
    api_key: UserApiKey,
    user: User,
    db: AsyncSession
) -> VideoGenerationResponse:
    """Generates video via internal Pool, deducts credits based on model selling price, logs job to user library."""
    model_code = payload.model or "meta-video-gen"

    # 1. Lookup model selling price
    m_stmt = select(AIModel).where(AIModel.model_code == model_code)
    m_res = await db.execute(m_stmt)
    model_obj = m_res.scalar_one_or_none()
    total_cost = (model_obj.selling_credit_price if (model_obj and model_obj.selling_credit_price > 0) else CREDIT_RATES["VIDEO"])

    # 2. Pre-check credit balance
    if user.credit_balance < total_cost:
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail={"error": {"message": f"Số dư không đủ. Cần {total_cost} credits cho model {model_code}, số dư hiện tại: {user.credit_balance}", "code": "insufficient_credits"}}
        )

    # 3. Pick pool credential
    cred = await _find_active_credential("Meta AI", db)
    t0 = time.perf_counter()

    # 4. Call Muse worker
    worker_res = await generate_media_via_muse(
        session_id=cred.key_val or "",
        prompt=payload.prompt,
        mode="video",
        duration_sec=payload.duration_sec or 5,
        reference_image=payload.reference_image,
    )

    if not worker_res.get("success"):
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail={"error": {"message": f"Upstream provider error: {worker_res.get('error')}", "type": "provider_error"}}
        )

    video_url = worker_res.get("media_url")
    render_time = round(time.perf_counter() - t0, 2)

    # 5. Deduct credits & Log private job to CDN
    await _deduct_user_credits(user, total_cost, f"Proxy API Key [{api_key.name}] Video Gen: {model_code} ({payload.duration_sec}s @ {total_cost} cr)", db)

    job_entry = await record_media_generation(
        user_id=user.id,
        model_id=model_code,
        media_type="VIDEO",
        prompt=payload.prompt,
        output_url=video_url,
        credits_charged=total_cost,
        render_seconds=render_time,
        db=db
    )

    final_cdn_url = job_entry.output_url or video_url

    # Record API transaction audit log
    from app.modules.logs.services import record_api_call
    await record_api_call(
        user_id=user.id,
        model_id=model_code,
        credential_id=cred.id if cred else None,
        prompt_tokens=len(payload.prompt.split()) * 2,
        completion_tokens=5000,
        total_credits_charged=total_cost,
        duration_ms=int(render_time * 1000),
        status_code=200,
        ip_address=None,
        db=db
    )

    if cred:
        cred.record_usage(1)
    if api_key:
        api_key.record_usage()
    await db.commit()

    return VideoGenerationResponse(
        id=f"vid_{str(job_entry.id)[:12]}",
        created=int(datetime.now(timezone.utc).timestamp()),
        model=model_code,
        video_url=final_cdn_url,
        duration_sec=payload.duration_sec or 5,
        credits_deducted=total_cost
    )


async def proxy_chat_completion(
    payload: ChatCompletionRequest,
    api_key: UserApiKey,
    user: User,
    db: AsyncSession
) -> ChatCompletionResponse:
    """Executes chat completion via VeloX Gateway models, forwarding to upstream AI pools and deducting credits."""
    start_time = time.time()
    model_code = payload.model or "gpt-4o"
    m_stmt = select(AIModel).where(AIModel.model_code == model_code)
    m_res = await db.execute(m_stmt)
    model_obj = m_res.scalar_one_or_none()

    # 1. Resolve Provider Credential & Service Pool
    target_pool = None
    target_cred = None

    if model_obj and model_obj.pool_id:
        p_res = await db.execute(select(ServicePool).where(ServicePool.id == model_obj.pool_id, ServicePool.is_active == True))
        target_pool = p_res.scalars().first()

    if not target_pool:
        p_res = await db.execute(
            select(ServicePool).where(
                ServicePool.provider == "OpenAI",
                ServicePool.is_active == True,
                ServicePool.base_url.isnot(None)
            ).limit(1)
        )
        target_pool = p_res.scalars().first()

    if not target_pool:
        p_res = await db.execute(
            select(ServicePool).where(
                ServicePool.is_active == True,
                ServicePool.base_url.isnot(None)
            ).limit(1)
        )
        target_pool = p_res.scalars().first()

    if target_pool:
        c_stmt = (
            select(ProviderCredential)
            .where(
                ProviderCredential.pool_id == target_pool.id,
                ProviderCredential.status == "ACTIVE",
                ProviderCredential.auth_type == "API_KEY"
            )
            .order_by(ProviderCredential.priority.desc(), ProviderCredential.requests_count.asc())
        )
        target_cred = (await db.execute(c_stmt)).scalars().first()

    if not target_cred:
        c_stmt = (
            select(ProviderCredential)
            .where(
                ProviderCredential.status == "ACTIVE",
                ProviderCredential.auth_type == "API_KEY"
            )
            .order_by(ProviderCredential.priority.desc(), ProviderCredential.requests_count.asc())
        )
        target_cred = (await db.execute(c_stmt)).scalars().first()
        if target_cred:
            p_res = await db.execute(select(ServicePool).where(ServicePool.id == target_cred.pool_id))
            target_pool = p_res.scalars().first()

    # 2. Determine upstream candidate models to try (supporting codex, gpt, claude aliases)
    candidate_models = [model_code]
    fallback_map = {
        "gpt-4o": ["gpt-6.1-sol", "gpt-6-astra-ts", "claude-sonnet-5-5-ccmax"],
        "gpt-4o-mini": ["gpt-6.1-sol", "gpt-6-astra-ts", "claude-sonnet-5-5-ccmax"],
        "gpt-4": ["gpt-6.1-sol", "gpt-6-astra-ts", "claude-sonnet-5-5-ccmax"],
        "gpt-3.5-turbo": ["gpt-6.1-sol", "gpt-6-astra-ts"],
        "codex": ["gpt-6.1-sol", "gpt-6-astra-ts", "claude-sonnet-5-5-ccmax"],
        "code": ["gpt-6.1-sol", "gpt-6-astra-ts", "claude-sonnet-5-5-ccmax"],
        "claude-3-5-sonnet": ["claude-sonnet-5-5-ccmax", "gpt-6.1-sol"],
        "claude-3-5-haiku": ["claude-haiku-5-5", "claude-sonnet-5-5-ccmax"],
    }
    if model_code in fallback_map:
        candidate_models.extend(fallback_map[model_code])
    elif any(k in model_code.lower() for k in ["codex", "code", "gpt"]):
        candidate_models.extend(["gpt-6.1-sol", "gpt-6-astra-ts", "claude-sonnet-5-5-ccmax"])

    seen = set()
    unique_candidates = [m for m in candidate_models if not (m in seen or seen.add(m))]

    # 3. Call Upstream AI Provider
    last_user_msg = payload.messages[-1].content if payload.messages else "Hello"
    content = ""
    p_tokens = max(1, len(last_user_msg.split()) * 2)
    c_tokens = 0

    if target_pool and target_pool.base_url and target_cred and target_cred.key_val:
        for cand in unique_candidates:
            try:
                async with httpx.AsyncClient(timeout=75.0) as client:
                    chat_req = {
                        "model": cand,
                        "messages": [{"role": m.role, "content": m.content} for m in payload.messages],
                        "temperature": payload.temperature if payload.temperature is not None else 0.7,
                    }
                    if payload.max_tokens:
                        chat_req["max_tokens"] = payload.max_tokens

                    c_url = f"{target_pool.base_url.rstrip('/')}/chat/completions"
                    c_resp = await client.post(
                        c_url,
                        json=chat_req,
                        headers={
                            "Authorization": f"Bearer {target_cred.key_val}",
                            "Content-Type": "application/json",
                        }
                    )
                    if c_resp.status_code == 200:
                        c_data = c_resp.json()
                        if "choices" in c_data and len(c_data["choices"]) > 0:
                            content = c_data["choices"][0]["message"]["content"]
                            if "usage" in c_data and c_data["usage"]:
                                p_tokens = c_data["usage"].get("prompt_tokens", p_tokens)
                                c_tokens = c_data["usage"].get("completion_tokens", c_tokens)
                            break
            except Exception as ex:
                print(f"[Proxy Upstream Chat Error] with model '{cand}': {ex}")

    if not content:
        content = (
            f"VeloX Gateway Response ({model_code}):\n\n"
            f"Phản hồi từ proxy VeloX cho yêu cầu: \"{last_user_msg}\"\n\n"
            f"(Lưu ý: Upstream AI Provider tạm thời không khả dụng hoặc đang bận. Vui lòng thử lại sau giây lát.)"
        )
    if c_tokens == 0:
        c_tokens = max(1, len(content.split()) * 2)

    # 4. Determine selling price (credits) for chat completion
    if not model_obj:
        alias_code = "gpt-4o" if any(k in model_code.lower() for k in ["codex", "code", "gpt"]) else "gpt-4o-mini"
        m_stmt2 = select(AIModel).where(AIModel.model_code == alias_code)
        m_res2 = await db.execute(m_stmt2)
        model_obj = m_res2.scalar_one_or_none()

    if model_obj and (model_obj.input_credit_price > 0 or model_obj.output_credit_price > 0):
        in_sell = model_obj.input_credit_price or (model_obj.selling_credit_price * 1000) or 250
        out_sell = model_obj.output_credit_price or (model_obj.selling_credit_price * 1000) or 500
        cost = int(round((p_tokens * in_sell + c_tokens * out_sell) / 1_000_000.0))
        if cost < 1:
            cost = max(1, model_obj.selling_credit_price or 1)
    elif model_obj and model_obj.selling_credit_price > 0:
        cost = model_obj.selling_credit_price
    else:
        cost = CREDIT_RATES["CHAT"]

    if user.credit_balance < cost:
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail={"error": {"message": f"Số dư không đủ cho model {model_code}. Yêu cầu {cost} credits, hiện có: {user.credit_balance}", "code": "insufficient_credits"}}
        )

    await _deduct_user_credits(user, cost, f"Proxy API Key [{api_key.name}] Chat: {model_code} ({p_tokens} in, {c_tokens} out @ {cost} cr)", db)

    # Record API transaction audit log
    from app.modules.logs.services import record_api_call
    render_time = max(0.1, time.time() - start_time)
    await record_api_call(
        user_id=user.id,
        model_id=model_code,
        credential_id=target_cred.id if target_cred else None,
        prompt_tokens=p_tokens,
        completion_tokens=c_tokens,
        total_credits_charged=cost,
        duration_ms=int(render_time * 1000),
        status_code=200,
        ip_address=None,
        db=db
    )

    try:
        if target_cred:
            target_cred.record_usage(1)
        if api_key:
            api_key.record_usage()
        await db.commit()
    except Exception:
        pass

    return ChatCompletionResponse(
        id=f"chatcmpl-{uuid.uuid4().hex[:12]}",
        created=int(datetime.now(timezone.utc).timestamp()),
        model=model_code,
        choices=[
            ChatChoice(
                index=0,
                message=ChatChoiceMessage(role="assistant", content=content),
                finish_reason="stop"
            )
        ],
        usage=UsageInfo(
            prompt_tokens=p_tokens,
            completion_tokens=c_tokens,
            total_tokens=p_tokens + c_tokens
        )
    )


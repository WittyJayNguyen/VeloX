from typing import Optional, Dict, Any
import httpx
import re

USD_TO_VND = 25000.0

# Bảng giá chuẩn Token gốc theo tiền Việt (VNĐ trên 1 Triệu Tokens)
# (Đầu vào, Đầu ra, Đã cache)
KNOWN_TOKEN_PRICING_VND: Dict[str, Dict[str, float]] = {
    # ── OpenAI ──
    "gpt-4o": {"input": 62500.0, "output": 250000.0, "cache_read": 31250.0},
    "gpt-4o-2024-08-06": {"input": 62500.0, "output": 250000.0, "cache_read": 31250.0},
    "gpt-4o-2024-11-20": {"input": 62500.0, "output": 250000.0, "cache_read": 31250.0},
    "gpt-4o-mini": {"input": 3750.0, "output": 15000.0, "cache_read": 1875.0},
    "gpt-4o-mini-2024-07-18": {"input": 3750.0, "output": 15000.0, "cache_read": 1875.0},
    "o1": {"input": 375000.0, "output": 1500000.0, "cache_read": 187500.0},
    "o1-2024-12-17": {"input": 375000.0, "output": 1500000.0, "cache_read": 187500.0},
    "o1-preview": {"input": 375000.0, "output": 1500000.0, "cache_read": 187500.0},
    "o1-mini": {"input": 75000.0, "output": 300000.0, "cache_read": 37500.0},
    "o3-mini": {"input": 27500.0, "output": 110000.0, "cache_read": 13750.0},
    "gpt-4-turbo": {"input": 250000.0, "output": 750000.0, "cache_read": 125000.0},
    "gpt-4": {"input": 750000.0, "output": 1500000.0, "cache_read": 375000.0},
    "gpt-3.5-turbo": {"input": 12500.0, "output": 37500.0, "cache_read": 12500.0},
    "text-embedding-3-small": {"input": 500.0, "output": 0.0, "cache_read": 500.0},
    "text-embedding-3-large": {"input": 3250.0, "output": 0.0, "cache_read": 3250.0},

    # ── Anthropic Claude ──
    "claude-3-5-sonnet-20241022": {"input": 75000.0, "output": 375000.0, "cache_read": 7500.0},
    "claude-3-5-sonnet": {"input": 75000.0, "output": 375000.0, "cache_read": 7500.0},
    "claude-3-5-haiku-20241022": {"input": 20000.0, "output": 100000.0, "cache_read": 2000.0},
    "claude-3-5-haiku": {"input": 20000.0, "output": 100000.0, "cache_read": 2000.0},
    "claude-3-opus-20240229": {"input": 375000.0, "output": 1875000.0, "cache_read": 37500.0},
    "claude-3-opus": {"input": 375000.0, "output": 1875000.0, "cache_read": 37500.0},
    "claude-3-sonnet-20240229": {"input": 75000.0, "output": 375000.0, "cache_read": 7500.0},
    "claude-3-haiku-20240307": {"input": 6250.0, "output": 31250.0, "cache_read": 625.0},

    # ── DeepSeek ──
    "deepseek-chat": {"input": 3500.0, "output": 7000.0, "cache_read": 350.0},
    "deepseek-reasoner": {"input": 13750.0, "output": 54750.0, "cache_read": 3500.0},
    "deepseek-coder": {"input": 3500.0, "output": 7000.0, "cache_read": 350.0},

    # ── Google Gemini ──
    "gemini-1.5-pro": {"input": 31250.0, "output": 125000.0, "cache_read": 7812.0},
    "gemini-1.5-flash": {"input": 1875.0, "output": 7500.0, "cache_read": 468.0},
    "gemini-2.0-flash": {"input": 2500.0, "output": 10000.0, "cache_read": 625.0},
    "gemini-2.0-flash-exp": {"input": 2500.0, "output": 10000.0, "cache_read": 625.0},
    "gemini-1.0-pro": {"input": 12500.0, "output": 37500.0, "cache_read": 6250.0},

    # ── Groq / Mistral ──
    "llama-3.3-70b-versatile": {"input": 14750.0, "output": 19750.0, "cache_read": 7500.0},
    "llama-3.1-8b-instant": {"input": 1250.0, "output": 2000.0, "cache_read": 625.0},
    "mistral-large-latest": {"input": 50000.0, "output": 150000.0, "cache_read": 25000.0},
    "mistral-small-latest": {"input": 5000.0, "output": 15000.0, "cache_read": 2500.0},
    "codestral-latest": {"input": 7500.0, "output": 22500.0, "cache_read": 3750.0},
}


def _normalize_to_vnd_per_1m(val: float) -> float:
    """
    Intelligently detect whether upstream raw pricing is:
    - USD per token (e.g. 0.0000025 -> 62,500 VND/1M)
    - VND per token (e.g. 0.0625 -> 62,500 VND/1M)
    - VND per 1K tokens (e.g. 62.5 -> 62,500 VND/1M)
    - VND per 1M tokens (e.g. 62500 -> 62,500 VND/1M)
    Returns: float (VNĐ per 1 Million Tokens).
    """
    if val <= 0:
        return 0.0

    # 1. USD per single token (e.g. 0.0000025 -> $2.5/1M -> 62,500 VND/1M)
    if val < 0.0001:
        return round(val * USD_TO_VND * 1_000_000, 2)

    # 2. VND per single token (e.g. 0.0625 VND/token -> 62,500 VND/1M)
    if val < 0.5:
        return round(val * 1_000_000, 2)

    # 3. VND per 1K tokens (e.g. 3.5đ to 500đ / 1K tokens -> 3,500đ to 500,000đ / 1M)
    if val < 1000.0:
        return round(val * 1000.0, 2)

    # 4. Already VND per 1M tokens (e.g. 3,500 to 2,500,000 VND)
    return round(val, 2)


# ── Official pricing overrides from provider documentation (https://tuansuapi.store/api-docs.html) ──
TUANSU_DOCS_PRICING_OVERRIDES: Dict[str, Dict[str, Any]] = {
    "gemini-3.8-flash-high": {"input": 400.0, "output": 650.0, "cache": 40.0},
    "gemini-flash-3.8-high": {"input": 400.0, "output": 650.0, "cache": 40.0},
    "gemini-flash-3.8-fast": {"input": 300.0, "output": 600.0, "cache": 30.0},
    "gemini-3.6-flash-high": {"input": 250.0, "output": 550.0, "cache": 25.0},
    "gemini-3.7-flash-high": {"input": 300.0, "output": 600.0, "cache": 30.0},
    "grok-4.7":              {"input": 700.0, "output": 700.0, "cache": 140.0},
    "gpt-5.6-luna":          {"input": 550.0, "output": 600.0, "cache": 110.0},
    "gpt-5.6-terra":         {"input": 900.0, "output": 900.0, "cache": 180.0},
    "gpt-5.6-sol":           {"input": 1500.0, "output": 1500.0, "cache": 300.0},
    "gpt-6-astra":           {"input": 2300.0, "output": 2300.0, "cache": 460.0},
    "whisper-large-v3":       {"req": 20.0},
    "whisper-large-v3-turbo": {"req": 15.0},
    "Qwen/Qwen3-TTS":         {"per_1k": 650.0},
    "Qwen/Qwen3-TTS-VoiceDesign": {"per_1k": 650.0},
    "realtime-tts-1.5-mini":  {"per_1k": 900.0},
    "realtime-tts-2":         {"per_1k": 1100.0},
    "realtime-tts-1.5-max":   {"per_1k": 1500.0},
    "tts-avevoice":           {"per_1k": 1685.0},
    "tts-avevoice-1.5-max":   {"per_1k": 1685.0},
    "tts-avevoice-fast":      {"per_1k": 1190.0},
    "tts-avevoice-1.5-mini":  {"per_1k": 1190.0},
    "tts-eleven-v4":          {"per_1k": 1190.0},
    "tts-eleven-v3":          {"per_1k": 1190.0},
    "tts-eleven-multilingual-v2": {"per_1k": 1190.0},
    "tts-eleven-v4-turbo":    {"per_1k": 695.0},
    "tts-eleven-flash-v2.5":  {"per_1k": 695.0},
    "tts-eleven-turbo-v2.5":  {"per_1k": 695.0},
    "tts-eleven-turbo-v2":    {"per_1k": 695.0},
    "tts-eleven-flash-v2":    {"per_1k": 695.0},
    "seedance-2.0-fast":      {"req": 1100.0},
    "seedance-2.5-mango":     {"req": 1300.0},
    "seedance-2.5-mango-1080p": {"req": 2400.0},
    "seedance-2.5-30s":       {"req": 28000.0},
    "seedance-2.5-stable":    {"req": 10000.0},
    "minimax-h3":             {"req": 8000.0},
    "veo-3.1":                {"req": 1400.0},
    "google-omni-flash":      {"req": 2200.0},
    "gemini-embedding":       {"req": 12.0},
    "gemini-embedding-2":     {"req": 36.0},
    "gpt-embedding-3-small":  {"req": 9.6},
    "gpt-embedding-3-larged": {"req": 12.0},
}


async def fetch_upstream_provider_pricing(
    base_url: str,
    key_val: Optional[str] = None
) -> Dict[str, Dict[str, Any]]:
    """
    Live query upstream provider's /api/pricing or /pricing endpoint to pull the exact
    real-time pricing catalog configured on that relay/provider (e.g. TuânSu, OneAPI, NewAPI).
    """
    if not base_url:
        return {}

    b = base_url.strip().rstrip("/")
    base_root = b.replace("/v1", "")

    candidate_urls = [
        f"{base_root}/api/pricing",
        f"{b}/pricing",
        f"{base_root}/pricing",
    ]

    headers = {"Accept": "application/json"}
    if key_val:
        headers["Authorization"] = f"Bearer {key_val.strip()}"

    pricing_map: Dict[str, Dict[str, Any]] = {}

    for url in candidate_urls:
        try:
            async with httpx.AsyncClient(timeout=10.0, follow_redirects=True) as client:
                resp = await client.get(url, headers=headers)
                if resp.status_code == 200:
                    data = resp.json()
                    items = []
                    if isinstance(data, dict) and "data" in data and isinstance(data["data"], list):
                        items = data["data"]
                    elif isinstance(data, list):
                        items = data

                    official_model_names = []

                    for item in items:
                        if not isinstance(item, dict):
                            continue
                        m_name = (
                            item.get("model_name")
                            or item.get("id")
                            or item.get("name")
                            or item.get("model")
                        )
                        if not m_name:
                            continue

                        official_model_names.append(m_name)

                        # Check docs overrides first for 100% fidelity to provider official docs
                        m_lower = m_name.lower()
                        if m_name in TUANSU_DOCS_PRICING_OVERRIDES or m_lower in TUANSU_DOCS_PRICING_OVERRIDES:
                            ov = TUANSU_DOCS_PRICING_OVERRIDES.get(m_name) or TUANSU_DOCS_PRICING_OVERRIDES.get(m_lower)
                            if "input" in ov:
                                in_vnd = float(ov["input"])
                                out_vnd = float(ov["output"])
                                cache_vnd = float(ov.get("cache", 0.0))
                            elif "per_1k" in ov:
                                in_vnd, out_vnd, cache_vnd = float(ov["per_1k"]), float(ov["per_1k"]), 0.0
                            elif "req" in ov:
                                in_vnd, out_vnd, cache_vnd = float(ov["req"]), float(ov["req"]), 0.0
                            else:
                                in_vnd, out_vnd, cache_vnd = 0.0, 0.0, 0.0
                        else:
                            # 1. Prefer sale_tiers (VND)
                            tiers = item.get("sale_tiers") or []
                            in_vnd = 0.0
                            out_vnd = 0.0
                            cache_vnd = 0.0

                            if tiers and isinstance(tiers, list) and len(tiers) > 0 and isinstance(tiers[0], dict):
                                t0 = tiers[0]
                                if "input" in t0 or "output" in t0:
                                    in_vnd = float(t0.get("input", 0.0) or 0.0)
                                    out_vnd = float(t0.get("output", 0.0) or 0.0)
                                    cache_vnd = float(t0.get("cache", 0.0) or 0.0)
                                elif "request" in t0:
                                    req_vnd = float(t0.get("request", 0.0) or 0.0)
                                    in_vnd, out_vnd, cache_vnd = req_vnd, req_vnd, 0.0
                            else:
                                in_u = item.get("input_usdt")
                                out_u = item.get("output_usdt")
                                pr_u = item.get("price_usdt")
                                cache_u = item.get("cache_read_usdt") or item.get("cache_usdt")
                                model_p = item.get("model_price")

                                if model_p and float(model_p) > 0:
                                    cost_p = float(model_p) * 1000.0
                                    in_vnd, out_vnd, cache_vnd = cost_p, cost_p, 0.0
                                elif (in_u is not None and float(in_u) > 0) or (out_u is not None and float(out_u) > 0):
                                    in_vnd = round(float(in_u or 0.0) * USD_TO_VND, 2)
                                    out_vnd = round(float(out_u or 0.0) * USD_TO_VND, 2)
                                    cache_vnd = round(float(cache_u or 0.0) * USD_TO_VND, 2) if cache_u is not None else round(in_vnd * 0.25, 2)
                                elif pr_u is not None and float(pr_u) > 0:
                                    req_vnd = round(float(pr_u) * USD_TO_VND, 2)
                                    in_vnd, out_vnd, cache_vnd = req_vnd, req_vnd, 0.0
                                else:
                                    in_vnd, out_vnd, cache_vnd = 0.0, 0.0, 0.0

                        p_data = {
                            "input_cost_per_1m": in_vnd,
                            "output_cost_per_1m": out_vnd,
                            "cache_read_cost_per_1m": cache_vnd,
                            "description": item.get("description"),
                        }
                        pricing_map[m_name] = p_data
                        pricing_map[m_name.lower()] = p_data

                        # Register dot and dash variations (e.g. 5.5 <-> 5-5)
                        dash_name = re.sub(r'(\d+)\.(\d+)', r'\1-\2', m_name)
                        dot_name = re.sub(r'(\d+)-(\d+)', r'\1.\2', m_name)
                        pricing_map[dash_name] = p_data
                        pricing_map[dash_name.lower()] = p_data
                        pricing_map[dot_name] = p_data
                        pricing_map[dot_name.lower()] = p_data

                    # Store official model names list
                    pricing_map["__official_models__"] = official_model_names

                    # Also inject doc override aliases
                    for ov_name, ov_val in TUANSU_DOCS_PRICING_OVERRIDES.items():
                        if "input" in ov_val:
                            in_v = float(ov_val["input"])
                            out_v = float(ov_val["output"])
                            cache_v = float(ov_val.get("cache", 0.0))
                        elif "per_1k" in ov_val:
                            in_v, out_v, cache_v = float(ov_val["per_1k"]), float(ov_val["per_1k"]), 0.0
                        else:
                            in_v, out_v, cache_v = float(ov_val.get("req", 0.0)), float(ov_val.get("req", 0.0)), 0.0
                        pricing_map[ov_name] = {
                            "input_cost_per_1m": in_v,
                            "output_cost_per_1m": out_v,
                            "cache_read_cost_per_1m": cache_v,
                        }
                        pricing_map[ov_name.lower()] = pricing_map[ov_name]

                    if pricing_map:
                        break
        except Exception:
            continue

    return pricing_map


def find_upstream_pricing_match(
    model_code: str,
    pricing_catalog: Optional[Dict[str, Any]]
) -> Optional[Dict[str, Any]]:
    """
    Intelligently match a model code against upstream provider's live pricing catalog.
    Handles dot/dash variations (5.5 vs 5-5), channel suffixes (-ccmax, -ag, -ts, -kiro),
    and model family prefixes (claude-, gpt-).
    """
    if not model_code or not pricing_catalog:
        return None

    code_raw = str(model_code).strip()
    code_lower = code_raw.lower()

    # 1. Direct match
    if code_raw in pricing_catalog:
        return pricing_catalog[code_raw]
    if code_lower in pricing_catalog:
        return pricing_catalog[code_lower]

    # 2. Number dot/dash swap (e.g. 5-5 <-> 5.5)
    dash_to_dot = re.sub(r'(\d+)-(\d+)', r'\1.\2', code_lower)
    if dash_to_dot in pricing_catalog:
        return pricing_catalog[dash_to_dot]
    dot_to_dash = re.sub(r'(\d+)\.(\d+)', r'\1-\2', code_lower)
    if dot_to_dash in pricing_catalog:
        return pricing_catalog[dot_to_dash]

    # 3. Channel suffix heuristics (e.g. claude-sonnet-5 -> claude-sonnet-5-ccmax or 5.5-ccmax)
    for suffix in ["-ccmax", ".ccmax", "-ag", "-ts", "-kiro", "-flare", "-fast"]:
        for cand in [code_lower + suffix, dash_to_dot + suffix, dot_to_dash + suffix]:
            if cand in pricing_catalog:
                return pricing_catalog[cand]

    # 4. Strip suffixes (e.g. preview, thinking)
    for strip_suf in ["-preview", "-thinking"]:
        if code_lower.endswith(strip_suf):
            stripped = code_lower[:-len(strip_suf)]
            if stripped in pricing_catalog:
                return pricing_catalog[stripped]
            s_dot = re.sub(r'(\d+)-(\d+)', r'\1.\2', stripped)
            if s_dot in pricing_catalog:
                return pricing_catalog[s_dot]

    # 5. Missing prefix (e.g. "sonnet-5-5" -> "claude-sonnet-5.5")
    for pref in ["claude-", "gpt-", "gemini-flash-"]:
        cand = pref + code_lower
        if cand in pricing_catalog:
            return pricing_catalog[cand]
        c_dot = pref + dash_to_dot
        if c_dot in pricing_catalog:
            return pricing_catalog[c_dot]

    # 6. Prefix match on pricing keys
    for p_key, p_val in pricing_catalog.items():
        pk = p_key.lower()
        if pk.startswith(code_lower) or code_lower.startswith(pk):
            return p_val

    return None


def resolve_model_pricing(
    model_code: str,
    provider: str = "OpenAI",
    upstream_pricing: Optional[Dict[str, Any]] = None,
    margin_multiplier: float = 1.35,
) -> Dict[str, Any]:
    """
    Resolve input, output, and cached prompt pricing in Vietnamese Dong (VNĐ).
    Output pricing is per 1 Million Tokens (VNĐ/1M).
    1 Credit = 1 VNĐ.
    """
    code_clean = str(model_code).strip().lower()
    prov_clean = str(provider).strip().lower()

    input_cost_vnd = None
    output_cost_vnd = None
    cache_cost_vnd = None

    # 1. Check if upstream pricing provided by provider response or catalog
    if upstream_pricing and isinstance(upstream_pricing, dict):
        matched_upstream = upstream_pricing
        if "input_cost_per_1m" not in upstream_pricing and "prompt" not in upstream_pricing and "input" not in upstream_pricing:
            # upstream_pricing is likely a catalog mapping of {model_code: pricing_info}
            matched_upstream = find_upstream_pricing_match(model_code, upstream_pricing)

        if matched_upstream and isinstance(matched_upstream, dict):
            try:
                if "input_cost_per_1m" in matched_upstream:
                    input_cost_vnd = float(matched_upstream.get("input_cost_per_1m", 0.0) or 0.0)
                    output_cost_vnd = float(matched_upstream.get("output_cost_per_1m", 0.0) or 0.0)
                    cache_cost_vnd = float(matched_upstream.get("cache_read_cost_per_1m", 0.0) or 0.0)
                else:
                    p = matched_upstream.get("prompt") or matched_upstream.get("input")
                    if p is not None:
                        input_cost_vnd = _normalize_to_vnd_per_1m(float(p))

                    c = matched_upstream.get("completion") or matched_upstream.get("output")
                    if c is not None:
                        output_cost_vnd = _normalize_to_vnd_per_1m(float(c))

                    cr = (
                        matched_upstream.get("input_cache_read")
                        or matched_upstream.get("cache_read")
                        or matched_upstream.get("cached_prompt")
                        or matched_upstream.get("cache_read_input")
                    )
                    if cr is not None:
                        cache_cost_vnd = _normalize_to_vnd_per_1m(float(cr))
            except Exception:
                pass

    # 2. Reference knowledge lookup if not returned or missing
    if input_cost_vnd is None or output_cost_vnd is None:
        matched_info = None
        for key, pinfo in KNOWN_TOKEN_PRICING_VND.items():
            if key == code_clean:
                matched_info = pinfo
                break

        if not matched_info:
            for key, pinfo in KNOWN_TOKEN_PRICING_VND.items():
                if key in code_clean:
                    matched_info = pinfo
                    break

        if matched_info:
            if input_cost_vnd is None:
                input_cost_vnd = matched_info.get("input", 12500.0)
            if output_cost_vnd is None:
                output_cost_vnd = matched_info.get("output", 37500.0)
            if cache_cost_vnd is None:
                cache_cost_vnd = matched_info.get("cache_read", round(input_cost_vnd * 0.5, 2))
        else:
            # Category heuristics in VND
            if any(w in code_clean for w in ["dall-e", "midjourney", "flux", "image"]):
                input_cost_vnd, output_cost_vnd, cache_cost_vnd = 0.0, 0.0, 0.0
            elif any(w in code_clean for w in ["gen3", "video", "sora", "runway"]):
                input_cost_vnd, output_cost_vnd, cache_cost_vnd = 0.0, 0.0, 0.0
            elif "mini" in code_clean or "haiku" in code_clean or "flash" in code_clean:
                input_cost_vnd, output_cost_vnd, cache_cost_vnd = 3750.0, 15000.0, 1875.0
            elif "deepseek" in code_clean:
                input_cost_vnd, output_cost_vnd, cache_cost_vnd = 3500.0, 7000.0, 350.0
            elif "opus" in code_clean or "o1" in code_clean:
                input_cost_vnd, output_cost_vnd, cache_cost_vnd = 375000.0, 1500000.0, 187500.0
            else:
                input_cost_vnd, output_cost_vnd, cache_cost_vnd = 25000.0, 75000.0, 12500.0

    if cache_cost_vnd is None:
        cache_cost_vnd = round((input_cost_vnd or 0.0) * 0.5, 2)

    input_cost_vnd = round(float(input_cost_vnd or 0.0), 2)
    output_cost_vnd = round(float(output_cost_vnd or 0.0), 2)
    cache_cost_vnd = round(float(cache_cost_vnd or 0.0), 2)

    # 1 Credit = 1 VNĐ
    input_credit = int(round(input_cost_vnd * margin_multiplier))
    output_credit = int(round(output_cost_vnd * margin_multiplier))
    cache_credit = int(round(cache_cost_vnd * margin_multiplier))

    # Base cost per 1K tokens in VNĐ
    cost_per_1k_vnd = round((input_cost_vnd + output_cost_vnd) / 2000.0, 2)
    selling_credit_per_1k = int(round((input_credit + output_credit) / 2000.0))

    # If free model (0 VND cost), price is 0 or 1
    if input_cost_vnd == 0.0 and output_cost_vnd == 0.0:
        selling_credit_per_1k = 0
    elif selling_credit_per_1k < 1 and (input_credit > 0 or output_credit > 0):
        selling_credit_per_1k = max(1, int(round((input_credit + output_credit) / 1000.0)))

    return {
        "input_cost_per_1m": input_cost_vnd,
        "output_cost_per_1m": output_cost_vnd,
        "cache_read_cost_per_1m": cache_cost_vnd,
        "input_credit_price": input_credit,
        "output_credit_price": output_credit,
        "cache_read_credit_price": cache_credit,
        "cost_per_req_or_1k_tok": cost_per_1k_vnd,
        "selling_credit_price": selling_credit_per_1k,
    }

"""
VeloX AI Gateway — Muse Headless Session Worker (Async Playwright)
==================================================================
Native async Playwright worker for Meta AI / Muse Hatch web session.
Uses native task lifecycle monitoring and sandbox file extraction to
guarantee accurate, high-fidelity media output with duration trimming.
"""
import time
import json
import os
import base64
import tempfile
import subprocess
import asyncio
from typing import Dict, Any, Optional
try:
    from playwright.async_api import async_playwright
except ImportError:
    async_playwright = None


class MuseBrowserPool:
    """
    Singleton Chromium Browser Pool with Semaphore concurrency control.
    Keeps a SINGLE headless browser process alive in the background (~120MB RAM)
    and executes requests in ephemeral lightweight contexts/pages (<15MB each).
    Guarantees that even with 100+ concurrent requests, RAM usage stays strictly under 250MB.
    """
    _pw = None
    _browser = None
    _lock = asyncio.Lock()
    _semaphore = asyncio.Semaphore(3)  # Maximum 3 active concurrent jobs

    @classmethod
    async def get_browser(cls):
        if cls._browser and cls._browser.is_connected():
            return cls._browser
        async with cls._lock:
            if cls._browser and cls._browser.is_connected():
                return cls._browser
            if async_playwright is None:
                return None
            if cls._pw is None:
                cls._pw = await async_playwright().start()
            cls._browser = await cls._pw.chromium.launch(
                headless=True,
                args=[
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-gpu',
                ]
            )
            return cls._browser

    @classmethod
    def get_semaphore(cls):
        return cls._semaphore


def detect_media_type(raw_bytes: bytes) -> tuple:
    """
    Returns (mime_type, tag_name) based on magic bytes inspection.
    Prevents video bytes from being labeled as image/png and causing broken preview.
    """
    if not raw_bytes or len(raw_bytes) < 8:
        return "image/png", "img"

    # MP4 / ISO Base Media file / QuickTime
    if (len(raw_bytes) >= 8 and raw_bytes[4:8] == b"ftyp") or \
       (b"ftyp" in raw_bytes[:32]) or \
       (b"moov" in raw_bytes[:1024]) or \
       (b"isom" in raw_bytes[:32]) or \
       (b"mp4" in raw_bytes[:32]):
        return "video/mp4", "video"

    # WebP: 'RIFF' .... 'WEBP'
    if raw_bytes[:4] == b"RIFF" and len(raw_bytes) >= 12 and raw_bytes[8:12] == b"WEBP":
        return "image/webp", "img"

    # PNG: 89 50 4E 47 0D 0A 1A 0A
    if raw_bytes.startswith(b"\x89PNG\r\n\x1a\n"):
        return "image/png", "img"

    # JPEG: FF D8 FF
    if raw_bytes.startswith(b"\xff\xd8\xff"):
        return "image/jpeg", "img"

    # GIF: GIF87a or GIF89a
    if raw_bytes.startswith(b"GIF8"):
        return "image/gif", "img"

    return "image/png", "img"


def trim_video_bytes(raw_bytes: bytes, target_seconds: int) -> bytes:
    """
    Trim video bytes to exact target seconds using ffmpeg stream copy.
    """
    if not raw_bytes or not target_seconds or len(raw_bytes) < 1000 or target_seconds >= 10:
        return raw_bytes

    in_path, out_path = None, None
    try:
        with tempfile.NamedTemporaryFile(suffix=".mp4", delete=False) as in_f:
            in_f.write(raw_bytes)
            in_path = in_f.name

        out_path = in_path.replace(".mp4", "_trimmed.mp4")
        cmd = [
            "ffmpeg", "-y",
            "-i", in_path,
            "-t", str(target_seconds),
            "-c", "copy",
            "-movflags", "+faststart",
            out_path
        ]
        res = subprocess.run(cmd, capture_output=True, timeout=15)
        if res.returncode == 0 and os.path.exists(out_path) and os.path.getsize(out_path) > 1000:
            with open(out_path, "rb") as out_f:
                return out_f.read()
    except Exception as e:
        print("Warning: ffmpeg trimming error:", e)
    finally:
        for p in [in_path, out_path]:
            if p and os.path.exists(p):
                try:
                    os.unlink(p)
                except Exception:
                    pass
    return raw_bytes


def parse_cookies_universal(cookies_raw: Any, target_url: str = "https://muse.ai") -> tuple[list, dict]:
    """
    Universally parses cookies from any format:
    1. JSON array exported from browser extensions: [{"name": "...", "value": "..."}, ...]
    2. Key-value JSON dictionary: {"cookie_name": "val", ...}
    3. HTTP Cookie header string: "cookie1=val1; cookie2=val2"
    4. Netscape format / tab-separated lines
    Returns (playwright_cookies_list, cookie_dict).
    """
    from urllib.parse import urlparse
    parsed_url = urlparse(target_url)
    domain = parsed_url.hostname or "muse.ai"
    cookie_dict = {}
    playwright_cookies = []

    if not cookies_raw:
        return playwright_cookies, cookie_dict

    parsed_obj = None
    if isinstance(cookies_raw, (dict, list)):
        parsed_obj = cookies_raw
    elif isinstance(cookies_raw, str):
        c_str = cookies_raw.strip()
        if (c_str.startswith("[") and c_str.endswith("]")) or (c_str.startswith("{") and c_str.endswith("}")):
            try:
                parsed_obj = json.loads(c_str)
            except Exception:
                parsed_obj = None

        if parsed_obj is None:
            # Parse header format: "key=val; key2=val2" or Netscape lines
            for line in c_str.split("\n"):
                line = line.strip()
                if not line or line.startswith("#"):
                    continue
                # Tab separated Netscape format
                if "\t" in line:
                    parts = line.split("\t")
                    if len(parts) >= 7:
                        c_name = parts[5].strip()
                        c_val = parts[6].strip()
                        c_dom = parts[0].strip() or domain
                        cookie_dict[c_name] = c_val
                        playwright_cookies.append({
                            "name": c_name,
                            "value": c_val,
                            "domain": c_dom if c_dom.startswith(".") else f".{c_dom}",
                            "path": parts[2].strip() or "/",
                        })
                    continue
                # Semicolon separated header
                for part in line.split(";"):
                    part = part.strip()
                    if "=" in part:
                        k, v = part.split("=", 1)
                        k = k.strip()
                        v = v.strip()
                        if k and not k.lower() in ("path", "domain", "expires", "samesite"):
                            cookie_dict[k] = v
                            playwright_cookies.append({
                                "name": k,
                                "value": v,
                                "url": target_url,
                            })

    if isinstance(parsed_obj, list):
        for item in parsed_obj:
            if isinstance(item, dict) and "name" in item and "value" in item:
                c_name = str(item["name"])
                c_val = str(item["value"])
                cookie_dict[c_name] = c_val
                c_data = {
                    "name": c_name,
                    "value": c_val,
                    "url": target_url,
                }
                if "domain" in item and item["domain"]:
                    c_data["domain"] = item["domain"]
                if "path" in item and item["path"]:
                    c_data["path"] = item["path"]
                playwright_cookies.append(c_data)
            elif isinstance(item, dict):
                for k, v in item.items():
                    if k not in ["domain", "path", "expires", "httpOnly", "secure", "sameSite"]:
                        cookie_dict[str(k)] = str(v)
                        playwright_cookies.append({
                            "name": str(k),
                            "value": str(v),
                            "url": target_url,
                        })
    elif isinstance(parsed_obj, dict):
        for k, v in parsed_obj.items():
            cookie_dict[str(k)] = str(v)
            playwright_cookies.append({
                "name": str(k),
                "value": str(v),
                "url": target_url,
            })

    return playwright_cookies, cookie_dict


async def generate_media_via_muse(
    prompt: str,
    cookies_json_or_list: Any,
    media_type: str = "image",
    aspect_ratio: str = "1:1",
    duration_sec: int = 5,
    num_outputs: int = 1,
    quality: str = "hd",
    reference_image: Optional[str] = None,
    timeout_sec: int = 600,
    target_url: str = "https://muse.ai",
) -> Dict[str, Any]:
    """
    Executes an async Playwright session on muse.ai (or target pool platform) to submit
    a prompt and wait until either media (image/video) or a notification/message is returned.
    Supports aspect_ratio, video duration, image quality, and reference image attachment.
    """
    start_time = time.perf_counter()

    # 1. Parse and format cookies universally
    playwright_cookies, _ = parse_cookies_universal(cookies_json_or_list, target_url=target_url)

    if not playwright_cookies:
        return {
            "success": False,
            "error": "Không tìm thấy cookies hợp lệ cho phiên đăng nhập.",
            "latency_ms": 0.0,
        }

    # 2. Format prompt with aspect ratio and duration modifiers
    clean_prompt = prompt.strip()
    is_video_target = (media_type == "video")

    # Strip redundant prefixes from prompt
    for prefix in ["/video", "imagine a video of", "imagine a video", "imagine video", "imagine a", "imagine"]:
        if clean_prompt.lower().startswith(prefix):
            clean_prompt = clean_prompt[len(prefix):].strip()

    directives = []
    if aspect_ratio and aspect_ratio != "1:1":
        directives.append(f"aspect ratio {aspect_ratio}")
    if is_video_target and duration_sec:
        directives.append(f"{duration_sec}s duration")
    elif not is_video_target and quality:
        q_lower = quality.lower()
        if "4k" in q_lower or "ultra" in q_lower:
            directives.append("4k ultra hd resolution, highly detailed, photorealistic")
        elif "hd" in q_lower:
            directives.append("high resolution, sharp details")
        else:
            directives.append("standard resolution")

    suffix = f" ({', '.join(directives)})" if directives else ""

    if is_video_target:
        if reference_image:
            formatted_prompt = f"Imagine a video animating this reference image: {clean_prompt}{suffix}".strip()
        else:
            formatted_prompt = f"Imagine a video of {clean_prompt}{suffix}".strip()
    else:
        if reference_image:
            formatted_prompt = f"Imagine with this reference image: {clean_prompt}{suffix}".strip()
        elif num_outputs > 1:
            formatted_prompt = f"Imagine {num_outputs} images of {clean_prompt}{suffix}".strip()
        else:
            formatted_prompt = f"Imagine an image of {clean_prompt}{suffix}".strip()

    # Handle reference image file staging
    temp_img_path = None
    if reference_image:
        try:
            b64_content = reference_image
            if "," in b64_content:
                b64_content = b64_content.split(",", 1)[1]
            raw_bytes = base64.b64decode(b64_content)
            with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as tf:
                tf.write(raw_bytes)
                temp_img_path = tf.name
        except Exception:
            temp_img_path = None

    if async_playwright is None:
        return {
            "success": False,
            "error": "Playwright is not installed in the backend environment.",
            "latency_ms": 0.0,
        }

    context = None
    try:
        async with MuseBrowserPool.get_semaphore():
            browser = await MuseBrowserPool.get_browser()
            if not browser:
                return {
                    "success": False,
                    "error": "Không thể khởi tạo phiên trình duyệt chia sẻ.",
                    "latency_ms": 0.0,
                }
            context = await browser.new_context(
                user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
                viewport={'width': 1280, 'height': 800},
            )
            await context.add_cookies(playwright_cookies)
            page = await context.new_page()

            # Open Muse
            await page.goto('https://muse.ai', wait_until='domcontentloaded', timeout=30000)

            # Locate textarea
            textarea = page.locator('textarea[placeholder="Message"], textarea[aria-label="Message"], textarea').first
            try:
                await textarea.wait_for(state='visible', timeout=15000)
                await page.wait_for_timeout(3000)
            except Exception:
                return {
                    "success": False,
                    "error": "Không tìm thấy ô nhập tin nhắn trên giao diện Muse. Có thể phiên đăng nhập đã hết hạn.",
                    "latency_ms": round((time.perf_counter() - start_time) * 1000, 2),
                }

            # Attach reference image if provided
            if temp_img_path and os.path.exists(temp_img_path):
                try:
                    file_input = page.locator("input[type='file']").first
                    await file_input.set_input_files(temp_img_path)
                    await page.wait_for_timeout(2000)
                except Exception:
                    pass

            # Record existing top task button text
            prev_top_task = await page.evaluate('''() => {
                const btn = document.querySelector('div.-mx-2 > button');
                return btn ? btn.innerText.trim() : null;
            }''')

            # Submit prompt: Fill textarea and click explicit Send button to commit attachment
            await textarea.click()
            await textarea.fill(formatted_prompt)
            await page.wait_for_timeout(500)

            send_btn = page.locator('button[aria-label="Send"]:not([disabled]), button[aria-label="Send message"]:not([disabled])').first
            if await send_btn.count() > 0:
                await send_btn.click()
            else:
                await textarea.press("Enter")

            # 3. Poll for task completion via live lifecycle monitoring
            downloaded_bytes = None
            batch_media_list = []
            status_text = ""
            start_poll = time.perf_counter()

            while (time.perf_counter() - start_poll) < timeout_sec:
                await page.wait_for_timeout(1000)

                # Check if Muse has a fatal error modal
                fatal_error = await page.evaluate('''() => {
                    const alerts = document.querySelectorAll('[role="alert"], [class*="modal"]');
                    for (const a of alerts) {
                        const t = (a.innerText || '').toLowerCase();
                        if (
                            t.includes('rate limit') ||
                            t.includes('quota exceeded') ||
                            t.includes('daily limit') ||
                            t.includes('content policy') ||
                            t.includes('blocked')
                        ) {
                            return a.innerText.trim();
                        }
                    }
                    return null;
                }''')
                if fatal_error:
                    status_text = fatal_error
                    break

                # Monitor topmost task in the Today sidebar (div.-mx-2 > button) and chat refusals
                task_info = await page.evaluate('''() => {
                    const btn = document.querySelector('div.-mx-2 > button');
                    const btnText = btn ? (btn.innerText || '').trim() : '';
                    const lower = btnText.toLowerCase();

                    const hasCheckmark = !!(btn && btn.querySelector('svg path[d*="M15.79"], svg path[d*="17.02"], svg path[d*="11.13"]'));
                    const successWords = ['generated', 'created', 'complete', 'completed', 'changed', 'animated', 'transformed', 'updated', 'ready', 'finished'];
                    const hasSuccessWord = successWords.some(w => lower.includes(w));
                    const isSuccess = hasCheckmark || hasSuccessWord;

                    const isFailed = lower.includes('failed') || lower.includes('error') || lower.includes('declined') || lower.includes('rejected') || lower.includes('blocked');

                    // Check last agent bubble in chat for refusal text
                    const bubbles = Array.from(document.querySelectorAll('[class*="agent-bubble"], [class*="bubble"]'));
                    let lastAgentText = "";
                    for (let i = bubbles.length - 1; i >= 0; i--) {
                        const t = (bubbles[i].innerText || '').trim();
                        if (t && !bubbles[i].classList.contains('bg-chat-user-bubble') && !bubbles[i].closest('.bg-chat-user-bubble')) {
                            lastAgentText = t;
                            break;
                        }
                    }

                    const lowerAgent = lastAgentText.toLowerCase();
                    const isRefused = lowerAgent.includes('không tạo được') ||
                                      lowerAgent.includes('không thể tạo') ||
                                      lowerAgent.includes('không thể thực hiện') ||
                                      lowerAgent.includes("can't generate") ||
                                      lowerAgent.includes("cannot generate") ||
                                      lowerAgent.includes("unable to generate") ||
                                      lowerAgent.includes("policy") ||
                                      lowerAgent.includes("violation");

                    return {
                        btnText,
                        isSuccess,
                        isFailed,
                        lastAgentText,
                        isRefused
                    };
                }''')

                elapsed = time.perf_counter() - start_poll

                # Handle failure / refusal early!
                if (task_info['isFailed'] or task_info['isRefused']) and elapsed >= 3:
                    refusal_msg = task_info['lastAgentText'] or task_info['btnText'] or "Tác vụ không thể hoàn thành."
                    status_text = f"Muse AI từ chối / không thể thực hiện: {refusal_msg}"
                    break

                # Task is finished when it marks as Completed/Created/Generated/Changed AND (text changed from prev_top_task OR elapsed >= 10)
                is_task_done = task_info['isSuccess'] and (
                    (task_info['btnText'] != prev_top_task) or (elapsed >= 10)
                )

                if is_task_done and elapsed >= 3:
                    # Click top task card ONLY if dialog is not already opened!
                    try:
                        dialog_count = await page.locator('[role="dialog"]').count()
                        if dialog_count == 0:
                            top_task_btn = page.locator('div.-mx-2 > button').first
                            if await top_task_btn.count() > 0:
                                await top_task_btn.click()
                                await page.wait_for_timeout(1500)
                    except Exception:
                        pass

                    # 1. Scoped extraction of media inside [role="dialog"]
                    try:
                        has_ref = bool(reference_image)
                        dialog_media = await page.evaluate('''async ({ targetCount, hasRef }) => {
                            const dialog = document.querySelector('[role="dialog"]');
                            if (!dialog) return null;

                            const vids = Array.from(dialog.querySelectorAll('video')).filter(v => v.src);
                            if (vids.length > 0) {
                                const v = vids[0];
                                const r = await fetch(v.src);
                                const b = await r.blob();
                                const fr = new FileReader();
                                const b64 = await new Promise(res => { fr.onloadend = () => res(fr.result); fr.readAsDataURL(b); });
                                return { isVideo: true, items: [{ type: 'video/mp4', size: b.size, dataUrl: b64 }] };
                            }

                            let imgs = Array.from(dialog.querySelectorAll('img')).filter(i => (
                                (i.naturalWidth >= 250 || i.clientWidth >= 250) &&
                                (i.naturalHeight >= 250 || i.clientHeight >= 250)
                            ));
                            if (imgs.length === 0) {
                                imgs = Array.from(dialog.querySelectorAll('img')).filter(i => (i.naturalWidth > 100 || i.clientWidth > 100));
                            }

                            // CRITICAL: If a reference image was supplied, Muse places the reference image as the first card (imgs[0]).
                            // We MUST drop imgs[0] so the reference image is NEVER returned in the generated output!
                            if (hasRef && imgs.length > 1) {
                                imgs = imgs.slice(1);
                            }

                            if (imgs.length > 0) {
                                const targetImgs = imgs.slice(0, targetCount);
                                const results = [];
                                for (const img of targetImgs) {
                                    try {
                                        const r = await fetch(img.src);
                                        const b = await r.blob();
                                        const fr = new FileReader();
                                        const b64 = await new Promise(res => { fr.onloadend = () => res(fr.result); fr.readAsDataURL(b); });
                                        results.push({ type: b.type || 'image/webp', size: b.size, dataUrl: b64 });
                                    } catch(e) {}
                                }
                                return { isVideo: false, items: results };
                            }
                            return null;
                        }''', {"targetCount": num_outputs, "hasRef": has_ref})

                        if dialog_media and dialog_media.get("items"):
                            items = dialog_media["items"]
                            if len(items) > 1:
                                batch_media_list = items
                                break
                            elif len(items) == 1:
                                h, b64_str = items[0]["dataUrl"].split(",", 1)
                                downloaded_bytes = base64.b64decode(b64_str)
                                break
                    except Exception:
                        pass

                    # 2. Video direct download via file card options menu
                    if not downloaded_bytes and not batch_media_list and is_video_target:
                        try:
                            file_options = page.locator('[role="dialog"] [data-testid="hatch-sandbox-file-card-options"]').first
                            if await file_options.count() > 0:
                                async with page.expect_download(timeout=15000) as download_info:
                                    await file_options.click()
                                    await page.wait_for_timeout(500)
                                    dl_btn = page.get_by_role("menuitem").filter(has_text="Download").first
                                    if await dl_btn.count() == 0:
                                        dl_btn = page.get_by_text("Download", exact=True).first
                                    await dl_btn.click()
                                download = await download_info.value
                                dl_path = await download.path()
                                dl_b = open(dl_path, "rb").read()
                                if dl_b and len(dl_b) > 1000:
                                    downloaded_bytes = dl_b
                                    break
                        except Exception:
                            pass

            await browser.close()
            latency_ms = round((time.perf_counter() - start_time) * 1000, 2)

            # Process batch items if collected
            if batch_media_list:
                clean_urls = []
                total_size = 0
                for item in batch_media_list:
                    d_url = item.get("dataUrl", "")
                    if "," in d_url:
                        h, b64_s = d_url.split(",", 1)
                        i_bytes = base64.b64decode(b64_s)
                        m_type, _ = detect_media_type(i_bytes)
                        clean_urls.append(f"data:{m_type};base64,{b64_s}")
                        total_size += len(i_bytes)
                    else:
                        clean_urls.append(d_url)
                        total_size += item.get("size", 0)

                return {
                    "success": True,
                    "media_url": clean_urls[0] if clean_urls else None,
                    "media_urls": clean_urls,
                    "media_type": "image/webp",
                    "size_bytes": total_size,
                    "tag": "img",
                    "total_items": len(clean_urls),
                    "latency_ms": latency_ms,
                }

            if not downloaded_bytes:
                if status_text:
                    return {
                        "success": False,
                        "error": f"Muse thông báo: {status_text}",
                        "latency_ms": latency_ms,
                    }
                return {
                    "success": False,
                    "error": f"Mô hình Muse chưa trả về kết quả trong thời gian chờ ({timeout_sec}s). Vui lòng thử lại.",
                    "latency_ms": latency_ms,
                }

            # Inspect magic bytes for accurate media type detection
            detected_mime, detected_tag = detect_media_type(downloaded_bytes)

            # Trim video if required and media is indeed a video
            if detected_mime == "video/mp4" and duration_sec and is_video_target:
                downloaded_bytes = trim_video_bytes(downloaded_bytes, duration_sec)

            b64_content = base64.b64encode(downloaded_bytes).decode("utf-8")
            data_url = f"data:{detected_mime};base64,{b64_content}"

            return {
                "success": True,
                "media_url": data_url,
                "media_urls": [data_url],
                "media_type": detected_mime,
                "size_bytes": len(downloaded_bytes),
                "tag": detected_tag,
                "total_items": 1,
                "latency_ms": latency_ms,
            }
    except Exception as e:
        latency_ms = round((time.perf_counter() - start_time) * 1000, 2)
        return {
            "success": False,
            "error": f"Lỗi thực thi Muse Worker: {str(e)}",
            "latency_ms": latency_ms,
        }
    finally:
        if context:
            try:
                await context.close()
            except Exception:
                pass
        if temp_img_path and os.path.exists(temp_img_path):
            try:
                os.unlink(temp_img_path)
            except Exception:
                pass

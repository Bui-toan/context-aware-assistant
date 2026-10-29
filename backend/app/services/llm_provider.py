import json
import re
import time
import asyncio
from typing import Protocol

import httpx
from google import genai
from google.genai import types

from app.core.config import settings


# --- CẤU HÌNH ---
REQUEST_TIMEOUT_MS = 90000   # 90 giây, theo khuyến nghị cho Gemini
TOTAL_TIMEOUT_S = 300        # 5 phút cho toàn bộ chuỗi thử
MAX_OVERLOAD_RETRIES = 2     # Thử lại tối đa 2 lần khi gặp 503


# --- LỖI RIÊNG: để route trả 503 thay vì 500 chung chung ---
class LLMUnavailableError(Exception):
    """Tất cả key/model đều quá tải, hết quota hoặc quá thời gian chờ."""


# --- BỘ LỌC JSON AN TOÀN ---
def extract_json(text: str) -> dict:
    """Trích xuất JSON từ response của AI, kể cả khi có markdown bọc ngoài."""
    match = re.search(r'\{.*\}', text, re.DOTALL)
    if match:
        try:
            return json.loads(match.group(0))
        except json.JSONDecodeError:
            pass
    return {}


# --- INTERFACE CHUNG ---
class LLMProvider(Protocol):
    async def complete(self, system_prompt: str, user_prompt: str) -> str: ...


# --- MOCK PROVIDER (Dùng để test UI không tốn quota) ---
class MockProvider:
    async def complete(self, system_prompt: str, user_prompt: str) -> str:
        return json.dumps({
            "meaning": "Đây là nghĩa giả lập (Mock).",
            "explanation": "Đây là giải thích giả lập để test giao diện.",
            "examples": ["Ví dụ 1", "Ví dụ 2"],
            "original": user_prompt,
            "suggested": user_prompt,
            "errors": [],
            "rewritten": user_prompt,
            "score": 100,
            "tone": "Trang trọng",
            "overall_feedback": "Văn bản giả lập."
        }, ensure_ascii=False)


# --- GEMINI PROVIDER (XOAY KEY + FALLBACK MODEL + FAIL NHANH) ---
class GeminiProvider:
    def __init__(self):
        raw_keys = settings.gemini_api_key
        self.api_keys = [k.strip() for k in raw_keys.split(",") if k.strip()]
        if not self.api_keys:
            raise ValueError("Chưa cấu hình GEMINI_API_KEY trong file .env")

        # Model chính + các model dự phòng (bỏ trùng, giữ thứ tự)
        fallbacks = [
            m.strip()
            for m in settings.gemini_fallback_models.split(",")
            if m.strip()
        ]
        self.models = list(dict.fromkeys([settings.gemini_model, *fallbacks]))
        # Trong __init__, sau khi có self.models
        self.models = [m for m in self.models if m != "gemini-2.5-flash-lite"]
        self.current_key_index = 0
        self._update_client()
        print(f"📋 Danh sách model: {self.models}")

    def _update_client(self):
        self.client = genai.Client(
            api_key=self.api_keys[self.current_key_index],
            http_options=types.HttpOptions(timeout=REQUEST_TIMEOUT_MS),
        )

    def _switch_to_next_key(self):
        self.current_key_index = (self.current_key_index + 1) % len(self.api_keys)
        print(f"🔄 Đã chuyển sang Key số {self.current_key_index + 1}")
        self._update_client()

    @staticmethod
    def _error_code(e: Exception):
        """Lấy mã lỗi HTTP từ exception của google-genai."""
        # Hết thời gian chờ -> coi như quá tải
        if isinstance(e, (httpx.TimeoutException, TimeoutError)):
            return 503
        msg = str(e)
        if "timed out" in msg.lower() or "timeout" in msg.lower():
            return 503

        code = getattr(e, "code", None)
        if isinstance(code, int):
            return code

        if "RESOURCE_EXHAUSTED" in msg or "429" in msg:
            return 429
        if "UNAVAILABLE" in msg or "503" in msg:
            return 503
        if "NOT_FOUND" in msg or "404" in msg:
            return 404
        return None

    async def _call(self, model: str, prompt: str):
        response = await asyncio.to_thread(
            self.client.models.generate_content,
            model=model,
            contents=prompt,
        )
        return response.text

    async def complete(self, system_prompt: str, user_prompt: str) -> str:
        # Gộp system vào prompt: chạy được cho cả Gemini lẫn Gemma
        prompt = f"{system_prompt}\n\n{user_prompt}"
        deadline = time.monotonic() + TOTAL_TIMEOUT_S

        for model in self.models:
            key_failures = 0
            overload_retries = 0

            while True:
                if time.monotonic() > deadline:
                    raise LLMUnavailableError(
                        "Quá thời gian chờ, vui lòng thử lại sau!"
                    )

                try:
                    text = await self._call(model, prompt)
                    if text:
                        return text
                    print(f"⚠️ [{model}] trả về rỗng, thử model khác")
                    break

                except Exception as e:
                    code = self._error_code(e)
                    short = str(e)[:150]
                    print(f"⚠️ [{model}] Key {self.current_key_index + 1} lỗi {code}: {short}")

                    if code == 429:
                        # Hết quota -> đổi key; hết 1 vòng key thì sang model khác
                        key_failures += 1
                        if key_failures >= len(self.api_keys):
                            break
                        self._switch_to_next_key()
                        continue

                    if code in (500, 503, 504):
                        if overload_retries >= MAX_OVERLOAD_RETRIES:
                            break
                        overload_retries += 1
                        wait_time = 2 ** overload_retries  # 2s, 4s, 8s...
                        print(f"⏳ Quá tải, thử lại sau {wait_time}s...")
                        await asyncio.sleep(wait_time)
                        continue

                    if code == 404:
                        # Tên model sai/không hỗ trợ -> bỏ qua, thử model kế tiếp
                        print(f"❌ Model '{model}' không tồn tại, kiểm tra lại tên trong .env")
                        break

                    # Lỗi khác (sai prompt, lỗi mạng...) -> báo ngay
                    raise

            print(f"➡️ Bỏ qua model {model}, thử model tiếp theo")

        raise LLMUnavailableError(
            "Tất cả model đều đang quá tải hoặc hết hạn mức. Vui lòng thử lại sau!"
        )
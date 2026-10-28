import json
import re
import asyncio
from typing import Protocol
from app.core.config import settings

# --- BỘ LỌC JSON AN TOÀN ---
def extract_json(text: str) -> dict:
    """Trích xuất JSON từ response của AI, kể cả khi có markdown bọc ngoài."""
    match = re.search(r'\{.*\}', text, re.DOTALL)
    if match:
        try:
            return json.loads(match.group(0))
        except json.JSONDecodeError:
            pass
    raise ValueError("AI không trả về định dạng JSON hợp lệ")

# --- INTERFACE ---
class LLMProvider(Protocol):
    async def complete(self, system_prompt: str, user_prompt: str) -> str: ...

class MockProvider:
    async def complete(self, system_prompt: str, user_prompt: str) -> str:
        return '{"meaning": "Test", "explanation": "Test", "examples": [], "original": "Test", "suggested": "Test", "errors": [], "rewritten": "Test"}'

# --- GEMINI PROVIDER (BẢN MỚI) ---
from google import genai

class GeminiProvider:
    def __init__(self):
        # Khởi tạo client mới của google-genai
        self.client = genai.Client(api_key=settings.gemini_api_key)
        self.model_name = settings.gemini_model

    async def complete(self, system_prompt: str, user_prompt: str) -> str:
        max_retries = 3
        for attempt in range(max_retries):
            try:
                # Gộp prompt
                full_prompt = f"{system_prompt}\n\n{user_prompt}"
                
                # Gọi API qua client mới, dùng asyncio.to_thread để không block FastAPI
                response = await asyncio.to_thread(
                    self.client.models.generate_content,
                    model=self.model_name,
                    contents=full_prompt
                )
                return response.text
            except Exception as e:
                if "503" in str(e) or "UNAVAILABLE" in str(e):
                    if attempt < max_retries - 1:
                        await asyncio.sleep(2 * (attempt + 1)) # Đợi 2s, 4s
                        continue
                raise e
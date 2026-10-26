"""Interface trừu tượng cho LLM Provider và các implementation cụ thể."""
from typing import Protocol
import json
import asyncio
from google import genai
from google.genai import types
from app.core.config import settings


class LLMProvider(Protocol):
    """Protocol cho mọi LLM provider — theo SDS mục 3.4."""
    async def complete(self, system_prompt: str, user_prompt: str) -> str:
        ...


class MockProvider:
    """Provider giả để test khi chưa có API key."""
    async def complete(self, system_prompt: str, user_prompt: str) -> str:
        return json.dumps(
            {
                "meaning": "Nghĩa mô phỏng của từ/cụm từ trong ngữ cảnh.",
                "explanation": "Giải thích mô phỏng (MockProvider).",
                "examples": ["Ví dụ 1 mô phỏng.", "Ví dụ 2 mô phỏng."],
            },
            ensure_ascii=False,
        )


class GeminiProvider:
    """Provider sử dụng Google GenAI SDK mới (hỗ trợ Auth Key AQ.)."""

    def __init__(self):
        if not settings.gemini_api_key:
            raise ValueError("GEMINI_API_KEY chưa được cấu hình trong .env")
        
        # Sử dụng Client của SDK mới
        self.client = genai.Client(api_key=settings.gemini_api_key)
        self.model_name = settings.gemini_model

    async def complete(self, system_prompt: str, user_prompt: str) -> str:
        full_prompt = f"{system_prompt}\n\n{user_prompt}"
        
        # google-genai có API async native: await self.client.aio.models.generate_content(...)
        try:
            response = await asyncio.wait_for(
                self.client.aio.models.generate_content(
                    model=self.model_name,
                    contents=full_prompt,
                ),
                timeout=settings.ai_timeout
            )
            if not response.text:
                raise ValueError("Gemini trả về nội dung rỗng (có thể do bộ lọc an toàn)")
            return response.text

        except asyncio.TimeoutError:
            raise TimeoutError("AI_TIMEOUT")
        except Exception as e:
            raise Exception(f"AI_PROVIDER_ERROR: {str(e)}")
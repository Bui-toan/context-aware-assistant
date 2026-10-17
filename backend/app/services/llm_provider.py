"""Interface trừu tượng cho LLM Provider.

Mọi service (explain, grammar, rewrite) chỉ gọi qua interface này,
KHÔNG được gọi thẳng SDK của OpenAI/Gemini/... trong service.
Khi người dùng chốt provider, chỉ cần viết 1 class implement Protocol này.
"""
from typing import Protocol


class LLMProvider(Protocol):
    """Protocol cho mọi LLM provider — theo SDS mục 3.4."""

    async def complete(self, system_prompt: str, user_prompt: str) -> str:
        """Nhận system + user prompt, trả về raw text từ LLM."""
        ...


class MockProvider:
    """Provider giả để test khi chưa có API key.

    Trả về JSON string mô phỏng đúng schema ExplainResponse.
    """

    async def complete(self, system_prompt: str, user_prompt: str) -> str:
        # Mock trả JSON giống AI thật
        import json

        return json.dumps(
            {
                "meaning": "Nghĩa mô phỏng của từ/cụm từ trong ngữ cảnh.",
                "explanation": "Giải thích mô phỏng (MockProvider, chưa gọi AI thật).",
                "examples": [
                    "Ví dụ 1 mô phỏng.",
                    "Ví dụ 2 mô phỏng.",
                ],
            },
            ensure_ascii=False,
        )
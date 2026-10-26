import json
from app.schemas.grammar import GrammarRequest, GrammarResponse, GrammarError
from app.services.llm_provider import LLMProvider

SYSTEM_PROMPT = """Bạn là chuyên gia ngữ pháp.
QUY TẮC: Trả về DUY NHẤT JSON. Không giải thích ngoài lề.
{
  "original": "văn bản gốc",
  "suggested": "văn bản đã sửa",
  "errors": [{"type": "loại lỗi", "explanation": "giải thích"}]
}"""

async def check_grammar(req: GrammarRequest, provider: LLMProvider) -> GrammarResponse:
    task = f"Hãy kiểm tra ngữ pháp đoạn văn sau (ngôn ngữ: {req.language}):\n\n[USER TEXT]\n{req.text}"
    if req.context:
        task += f"\n\n[WEBSITE CONTEXT]\n{req.context}"
        
    raw = await provider.complete(SYSTEM_PROMPT, task)
    
    # Parse JSON an toàn
    cleaned = raw.strip().removeprefix("```json").removeprefix("```").removesuffix("```").strip()
    data = json.loads(cleaned)
    
    return GrammarResponse(
        original=data.get("original", req.text),
        suggested=data.get("suggested", req.text),
        errors=[GrammarError(**e) for e in data.get("errors", [])]
    )
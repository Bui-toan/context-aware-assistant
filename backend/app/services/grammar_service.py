from app.schemas.grammar import GrammarRequest, GrammarResponse, GrammarError
from app.services.llm_provider import LLMProvider, extract_json

SYSTEM_PROMPT = """Bạn là một chuyên gia ngôn ngữ học.
QUY TẮC BẮT BUỘC:
1. Chấm điểm ngữ pháp (score) từ 0 đến 100.
2. Trả về DUY NHẤT một JSON object đúng định dạng:
{
  "score": 85,
  "tone": "Tên văn phong",
  "overall_feedback": "Nhận xét của bạn",
  "original": "văn bản gốc",
  "suggested": "văn bản đã sửa",
  "errors": [{"type": "Loại lỗi", "explanation": "Giải thích"}]
}
3. NGÔN NGỮ QUY ĐỊNH:
   - Trường "original" và "suggested" phải giữ nguyên ngôn ngữ của [USER TEXT].
   - Trường "tone", "overall_feedback", và "explanation" phải khớp với ngôn ngữ yêu cầu.
   - Nếu ngôn ngữ yêu cầu là "vi", trả về tiếng Việt. Nếu là "en", trả về tiếng Anh.
"""

async def check_grammar(req: GrammarRequest, provider: LLMProvider) -> GrammarResponse:
    lang_instruction = "Tiếng Việt" if req.language == "vi" else "English"
    
    task = f"Hãy kiểm tra ngữ pháp và văn phong đoạn văn sau. Trả lời bằng {lang_instruction}:\n\n[USER TEXT]\n{req.text}"
    # ... phần còn lại giữ nguyên
    if req.context:
        task += f"\n\n[WEBSITE CONTEXT]\n{req.context}"
        
    raw = await provider.complete(SYSTEM_PROMPT, task)
    data = extract_json(raw)
    
    return GrammarResponse(
        score=data.get("score", 0),
        tone=data.get("tone", "Không xác định"),
        overall_feedback=data.get("overall_feedback", ""),
        original=data.get("original", req.text),
        suggested=data.get("suggested", req.text),
        errors=[GrammarError(**e) for e in data.get("errors", [])]
    )
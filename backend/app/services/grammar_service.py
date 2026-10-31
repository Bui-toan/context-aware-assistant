from app.schemas.grammar import GrammarRequest, GrammarResponse, GrammarError
from app.services.llm_provider import LLMProvider, extract_json

SYSTEM_PROMPT = """Bạn là một chuyên gia ngôn ngữ học và là một công cụ kiểm tra ngữ pháp (như Grammarly).
QUY TẮC BẮT BUỘC:
1. Chấm điểm ngữ pháp (score) từ 0 đến 100.
2. Đánh giá văn phong (tone) và đưa ra nhận xét (overall_feedback).
3. Trả về DUY NHẤT một JSON object đúng định dạng:
{
  "score": 85,
  "tone": "Tên văn phong",
  "overall_feedback": "Nhận xét của bạn",
  "original": "văn bản gốc",
  "suggested": "văn bản đã sửa",
  "errors": [{"type": "Loại lỗi", "explanation": "Giải thích"}]
}
4. NGÔN NGỮ CỦA CÁC TRƯỜNG (tone, overall_feedback, errors) PHẢI KHỚP VỚI NGÔN NGỮ YÊU CẦU.
   - Nếu ngôn ngữ yêu cầu là "vi": Trả về tiếng Việt.
   - Nếu ngôn ngữ yêu cầu là "en": Trả về tiếng Anh. TUYỆT ĐỐI KHÔNG DÙNG TIẾNG VIỆT.
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
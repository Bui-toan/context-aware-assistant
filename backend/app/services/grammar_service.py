from app.schemas.grammar import GrammarRequest, GrammarResponse, GrammarError
from app.services.llm_provider import LLMProvider, extract_json

SYSTEM_PROMPT = """Bạn là một chuyên gia ngôn ngữ học và là một công cụ kiểm tra ngữ pháp (như Grammarly).
QUY TẮC:
1. Tự động nhận diện ngôn ngữ của [USER TEXT]. Trả kết quả bằng chính ngôn ngữ đó.
2. Chấm điểm ngữ pháp (score) từ 0 đến 100.
3. Đánh giá văn phong (tone): Trang trọng, Thân mật, Học thuật, v.v.
4. Đưa ra nhận xét tổng quan (overall_feedback).
5. Liệt kê các lỗi sai (errors) và giải thích.
6. BẮT BUỘC TRẢ LỜI BẰNG NGÔN NGỮ ĐƯỢC YÊU CẦU TRONG TASK. Nếu Task yêu cầu "Tiếng Việt", toàn bộ JSON phải là tiếng Việt. Nếu yêu cầu "English", toàn bộ phải là tiếng Anh.
7. Trả về DUY NHẤT một JSON object đúng định dạng:
{
  "score": 85,
  "tone": "Trang trọng",
  "overall_feedback": "Câu văn khá tốt nhưng có lỗi chính tả nhỏ.",
  "original": "văn bản gốc",
  "suggested": "văn bản đã sửa",
  "errors": [{"type": "Chính tả", "explanation": "viết sai chính tả từ '...'"}]
}"""

async def check_grammar(req: GrammarRequest, provider: LLMProvider) -> GrammarResponse:
    task = f"Hãy kiểm tra ngữ pháp và văn phong đoạn văn sau:\n\n[USER TEXT]\n{req.text}"
    if req.context:
        task += f"\n\n[WEBSITE CONTEXT]\n{req.context}"
        
    raw = await provider.complete(SYSTEM_PROMPT, task)
    data = extract_json(raw)
    
    # Nếu AI trả về thiếu trường nào, gán giá trị mặc định để không bị lỗi
    return GrammarResponse(
        score=data.get("score", 0),
        tone=data.get("tone", "Không xác định"),
        overall_feedback=data.get("overall_feedback", ""),
        original=data.get("original", req.text),
        suggested=data.get("suggested", req.text),
        errors=[GrammarError(**e) for e in data.get("errors", [])]
    )
import json
import numpy as np
from app.schemas.rewrite import RewriteRequest, RewriteResponse, VerificationInfo
from app.services.llm_provider import LLMProvider, extract_json
from app.services.embedding_service import EmbeddingService

SYSTEM_PROMPT = """Bạn là công cụ viết lại văn bản chính xác.
QUY TẮC BẮT BUỘC:
1. Giữ nguyên định dạng và độ dài tương đương của văn bản gốc.
2. KHÔNG ĐƯỢC tự ý thêm các từ ngữ giao tiếp (như "nè", "nhé", "ạ") hoặc giải thích thêm nếu không có trong văn bản gốc.
3. Chỉ sửa lỗi chính tả hoặc thay đổi văn phong theo yêu cầu, giữ nguyên ý nghĩa cốt lõi.
4. Tự động nhận diện ngôn ngữ của [USER TEXT] và trả kết quả bằng chính ngôn ngữ đó.
5. BẮT BUỘC TRẢ LỜI BẰNG NGÔN NGỮ ĐƯỢC YÊU CẦU TRONG TASK. Nếu Task yêu cầu "Tiếng Việt", toàn bộ JSON phải là tiếng Việt. Nếu yêu cầu "English", toàn bộ phải là tiếng Anh.
6. Trả về DUY NHẤT một JSON object đúng định dạng:
{"rewritten": "văn bản đã viết lại"}"""

async def rewrite_text(req: RewriteRequest, provider: LLMProvider) -> RewriteResponse:
    modes = {
        "formal": "Trang trọng, lịch sự",
        "casual": "Thân mật, đời thường",
        "academic": "Học thuật, hàn lâm",
        "shorten": "Rút gọn, súc tích",
        "improve": "Cải thiện, mượt mà hơn"
    }
    
    task = f"""Hãy viết lại đoạn văn sau theo phong cách: {modes.get(req.mode, "mặc định")}.
    
[USER TEXT]
{req.text}"""

    raw = await provider.complete(SYSTEM_PROMPT, task)
    data = extract_json(raw)
    rewritten_text = data.get("rewritten", req.text)

    # Tính Verification
    model = EmbeddingService.get_model()
    emb_orig = model.encode(req.text)
    emb_new = model.encode(rewritten_text)
    
    sim = np.dot(emb_orig, emb_new) / (np.linalg.norm(emb_orig) * np.linalg.norm(emb_new))
    len_change = ((len(rewritten_text) - len(req.text)) / len(req.text)) * 100 if len(req.text) > 0 else 0
    compression = len(rewritten_text) / len(req.text) if req.mode == "shorten" and len(req.text) > 0 else None

    return RewriteResponse(
        rewritten=rewritten_text,
        verification=VerificationInfo(
            semanticSimilarity=float(sim),
            lengthChangePercent=float(len_change),
            compressionRatio=float(compression) if compression else None
        )
    )
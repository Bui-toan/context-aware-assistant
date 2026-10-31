import json
import numpy as np
from app.schemas.rewrite import RewriteRequest, RewriteResponse, VerificationInfo
from app.services.llm_provider import LLMProvider, extract_json
from app.services.embedding_service import EmbeddingService

# Chuyển toàn bộ System Prompt sang tiếng Anh để triệt tiêu thiên vị ngôn ngữ
SYSTEM_PROMPT = """Bạn là một chuyên gia biên tập viên văn bản.
QUY TẮC TỐI THƯỢNG BẮT BUỘC:
1. Hãy đọc kỹ [USER TEXT] và TỰ ĐỘNG NHẬN DIỆN ngôn ngữ của nó (Tiếng Việt hay Tiếng Anh).
2. Sửa các lỗi chính tả nhỏ (nếu có) và viết lại đoạn văn đó theo phong cách yêu cầu.
3. KẾT QUẢ TRẢ VỀ BẮT BUỘC PHẢI CÙNG NGÔN NGỮ VỚI [USER TEXT].
4. TUYỆT ĐỐI KHÔNG dùng từ lóng (slang), teencode, hoặc viết tắt kiểu mạng xã hội (Ví dụ: KHÔNG viết "luv u", "b4", "gr8"). Phải sử dụng tiếng Anh hoặc tiếng Việt chuẩn mực.
5. Trả về DUY NHẤT một JSON object đúng định dạng:
{"rewritten": "văn bản đã viết lại"}"""

async def rewrite_text(req: RewriteRequest, provider: LLMProvider) -> RewriteResponse:
    # Map các mode sang tiếng Anh để AI không bị lẫn lộn
    modes_en = {
        "formal": "Formal, professional",
        "casual": "Casual, conversational",
        "academic": "Academic, scholarly",
        "shorten": "Concise. Remove redundant words but KEEP full words, correct grammar, and standard spelling. DO NOT use abbreviations.", 
        "improve": "Improved, fluent and smooth"
    }
    
    style = modes_en.get(req.mode, "Formal")
    
    # Thêm ví dụ mẫu (Few-shot) để AI bắt chước
    task = f"""Rewrite the following text in a {style} style.
CRITICAL REMINDER: DO NOT TRANSLATE. Match the exact language of the input.

Example 1 (English input):
Input: "I want to buy a car."
Output: {{"rewritten": "I am looking to purchase a vehicle."}}

Example 2 (Vietnamese input):
Input: "Tôi muốn mua một chiếc xe hơi."
Output: {{"rewritten": "Tôi đang có nhu cầu mua sắm một chiếc ô tô."}}

[USER TEXT]
{req.text}"""

    raw = await provider.complete(SYSTEM_PROMPT, task)
    data = extract_json(raw)
    rewritten_text = data.get("rewritten", req.text)

    # --- Phần Verification (Giữ nguyên) ---
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
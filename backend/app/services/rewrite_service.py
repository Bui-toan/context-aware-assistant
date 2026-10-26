import json
from app.schemas.rewrite import RewriteRequest, RewriteResponse, VerificationInfo
from app.services.llm_provider import LLMProvider
from app.services.embedding_service import EmbeddingService
import numpy as np

SYSTEM_PROMPT = """Bạn là chuyên gia viết lại văn bản.
QUY TẮC: Trả về DUY NHẤT JSON. Không giải thích ngoài lề.
{"rewritten": "văn bản đã viết lại"}"""

async def rewrite_text(req: RewriteRequest, provider: LLMProvider) -> RewriteResponse:
    modes = {
        "formal": "Trang trọng, lịch sự",
        "casual": "Thân mật, đời thường",
        "academic": "Học thuật, hàn lâm",
        "shorten": "Rút gọn, súc tích",
        "improve": "Cải thiện, mượt mà hơn"
    }
    
    task = f"""Hãy viết lại đoạn văn sau theo phong cách: {modes[req.mode]}.
Ngôn ngữ: {req.language}.

[USER TEXT]
{req.text}"""

    raw = await provider.complete(SYSTEM_PROMPT, task)
    cleaned = raw.strip().removeprefix("```json").removeprefix("```").removesuffix("```").strip()
    data = json.loads(cleaned)
    rewritten_text = data.get("rewritten", req.text)

    # Tính Verification
    model = EmbeddingService.get_model()
    emb_orig = model.encode(req.text)
    emb_new = model.encode(rewritten_text)
    
    # Cosine Similarity
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
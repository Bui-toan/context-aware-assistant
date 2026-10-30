import json
import numpy as np
from app.schemas.rewrite import RewriteRequest, RewriteResponse, VerificationInfo
from app.services.llm_provider import LLMProvider, extract_json
from app.services.embedding_service import EmbeddingService

# Chuyển toàn bộ System Prompt sang tiếng Anh để triệt tiêu thiên vị ngôn ngữ
SYSTEM_PROMPT = """You are an expert text editor.
MANDATORY RULES:
1. Automatically detect the language of the [USER TEXT].
2. Rewrite the text in the requested style.
3. THE OUTPUT MUST BE IN THE EXACT SAME LANGUAGE AS THE [USER TEXT]. 
   - If the input is English, output English.
   - If the input is Vietnamese, output Vietnamese.
4. DO NOT TRANSLATE. DO NOT change the language. Match the input language perfectly.
5. Return ONLY a valid JSON object with this exact structure:
{"rewritten": "your rewritten text here"}"""

async def rewrite_text(req: RewriteRequest, provider: LLMProvider) -> RewriteResponse:
    # Map các mode sang tiếng Anh để AI không bị lẫn lộn
    modes_en = {
        "formal": "Formal, professional",
        "casual": "Casual, conversational",
        "academic": "Academic, scholarly",
        "shorten": "Concise, shortened",
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
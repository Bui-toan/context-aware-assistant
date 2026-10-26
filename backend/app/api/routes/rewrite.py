from fastapi import APIRouter
from app.schemas.rewrite import RewriteRequest, RewriteResponse
from app.services.rewrite_service import rewrite_text
from app.services.llm_provider import GeminiProvider # <-- Đổi thành AI thật

router = APIRouter()
_provider = GeminiProvider() # Khởi tạo AI thật

@router.post("/rewrite", response_model=RewriteResponse, tags=["ai"])
async def rewrite_route(req: RewriteRequest) -> RewriteResponse:
    return await rewrite_text(req, _provider)
from fastapi import APIRouter
from app.schemas.grammar import GrammarRequest, GrammarResponse
from app.services.grammar_service import check_grammar
from app.services.llm_provider import GeminiProvider # <-- Đổi thành AI thật

router = APIRouter()
_provider = GeminiProvider() # Khởi tạo AI thật

@router.post("/grammar", response_model=GrammarResponse, tags=["ai"])
async def grammar_route(req: GrammarRequest) -> GrammarResponse:
    return await check_grammar(req, _provider)
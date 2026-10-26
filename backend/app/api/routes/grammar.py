# grammar.py
from fastapi import APIRouter
from app.schemas.grammar import GrammarRequest, GrammarResponse
from app.services.grammar_service import check_grammar
from app.services.llm_provider import MockProvider # Hoặc GeminiProvider
from app.security.validation import validate_explain_input

router = APIRouter()
_provider = MockProvider() # Nhớ đổi thành GeminiProvider nếu bạn đã cấu hình

@router.post("/grammar", response_model=GrammarResponse, tags=["ai"])
async def grammar_route(req: GrammarRequest) -> GrammarResponse:
    validate_explain_input(req.text, req.context)
    return await check_grammar(req, _provider)
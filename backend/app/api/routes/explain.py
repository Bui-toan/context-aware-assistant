"""Route POST /api/explain."""
from fastapi import APIRouter, HTTPException

from app.schemas.error import ErrorBody, ErrorResponse
from app.schemas.explain import ExplainRequest, ExplainResponse
from app.services.explain_service import explain
from app.services.llm_provider import MockProvider

router = APIRouter()

# MVP: dùng MockProvider. Phase 5.2 sẽ đổi sang provider thật.
_provider = MockProvider()


@router.post(
    "/explain",
    response_model=ExplainResponse,
    responses={
        400: {"model": ErrorResponse, "description": "Input không hợp lệ"},
        500: {"model": ErrorResponse, "description": "Lỗi từ AI Provider"},
    },
    tags=["ai"],
)
async def explain_route(req: ExplainRequest) -> ExplainResponse:
    # ---- Validate: text rỗng ----
    if not req.text or not req.text.strip():
        raise HTTPException(
            status_code=400,
            detail=ErrorBody(code="EMPTY_TEXT", message="Text không được rỗng").model_dump(),
        )

    # ---- Gọi service ----
    try:
        return await explain(req, _provider)
    except ValueError as e:
        raise HTTPException(
            status_code=500,
            detail=ErrorBody(code="AI_PROVIDER_ERROR", message=str(e)).model_dump(),
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=ErrorBody(code="INTERNAL_ERROR", message=str(e)).model_dump(),
        )
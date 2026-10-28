"""Route POST /api/explain."""
import logging
import traceback

from fastapi import APIRouter, HTTPException

from app.schemas.error import ErrorBody, ErrorResponse
from app.schemas.explain import ExplainRequest, ExplainResponse
from app.services.explain_service import explain
from app.services.llm_provider import GeminiProvider, MockProvider
from app.security.validation import validate_explain_input

logger = logging.getLogger(__name__)
router = APIRouter()


def _build_provider():
    """Tạo provider 1 lần khi khởi động server; thiếu key/model thì dùng Mock và ghi cảnh báo."""
    try:
        return GeminiProvider()
    except Exception as e:
        logger.warning("Không khởi tạo được GeminiProvider (%s), dùng MockProvider", type(e).__name__)
        return MockProvider()


_provider = _build_provider()


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
    validate_explain_input(req.text, req.context)
    if not req.text or not req.text.strip():
        raise HTTPException(
            status_code=400,
            detail=ErrorBody(code="EMPTY_TEXT", message="Text không được rỗng").model_dump(),
        )

    # ---- Gọi service ----
    try:
        return await explain(req, _provider)
    except TimeoutError:
        raise HTTPException(
            status_code=504,
            detail={"code": "AI_TIMEOUT", "message": "AI phản hồi quá chậm, vui lòng thử lại."},
        )
    except ValueError as e:
        raise HTTPException(
            status_code=500,
            detail={"code": "AI_PROVIDER_ERROR", "message": str(e)},
        )
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail={"code": "AI_PROVIDER_ERROR", "message": str(e)},
        )
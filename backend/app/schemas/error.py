"""Format lỗi chung cho mọi endpoint — theo SDS mục 3.2."""
from typing import Literal
from pydantic import BaseModel

ErrorCode = Literal[
    "EMPTY_TEXT",
    "CONTEXT_TOO_LONG",
    "INVALID_MODE",
    "AI_TIMEOUT",
    "AI_PROVIDER_ERROR",
    "INTERNAL_ERROR",
]


class ErrorBody(BaseModel):
    code: ErrorCode
    message: str


class ErrorResponse(BaseModel):
    error: ErrorBody
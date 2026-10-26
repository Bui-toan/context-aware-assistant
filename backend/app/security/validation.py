"""Kiểm tra dữ liệu đầu vào."""
from fastapi import HTTPException
from app.core.config import settings
from app.schemas.error import ErrorBody

def validate_explain_input(text: str, context: str):
    if not text.strip():
        raise HTTPException(status_code=400, detail=ErrorBody(code="EMPTY_TEXT", message="Văn bản không được rỗng").model_dump())
    if len(context) > settings.max_context_length:
        raise HTTPException(status_code=400, detail=ErrorBody(code="CONTEXT_TOO_LONG", message=f"Context vượt quá {settings.max_context_length} ký tự").model_dump())
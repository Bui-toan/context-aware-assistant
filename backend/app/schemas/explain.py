"""Schema cho endpoint POST /api/explain — theo SDS mục 3.1."""
from typing import Literal
from pydantic import BaseModel, Field


class ExplainRequest(BaseModel):
    text: str = Field(..., description="Đoạn được chọn (selection)")
    context: str = Field("", description="Câu trước + câu chứa + câu sau")
    language: str = "vi" # <-- Đã mở khóa


class ExplainResponse(BaseModel):
    meaning: str
    explanation: str
    examples: list[str]
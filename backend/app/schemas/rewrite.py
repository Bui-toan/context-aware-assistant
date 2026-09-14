"""Schema cho endpoint POST /api/rewrite — theo SDS mục 3.1."""
from typing import Literal, Optional
from pydantic import BaseModel

RewriteMode = Literal["formal", "casual", "academic", "shorten", "improve"]


class RewriteRequest(BaseModel):
    text: str
    context: str = ""
    mode: RewriteMode
    language: Literal["vi", "en"] = "vi"


class VerificationInfo(BaseModel):
    semanticSimilarity: float
    lengthChangePercent: float
    compressionRatio: Optional[float] = None  # chỉ có khi mode = "shorten"


class RewriteResponse(BaseModel):
    rewritten: str
    verification: VerificationInfo
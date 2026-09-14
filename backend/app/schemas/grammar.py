"""Schema cho endpoint POST /api/grammar — theo SDS mục 3.1."""
from typing import Literal
from pydantic import BaseModel


class GrammarRequest(BaseModel):
    text: str
    context: str = ""
    language: Literal["vi", "en"] = "vi"


class GrammarError(BaseModel):
    type: str
    explanation: str


class GrammarResponse(BaseModel):
    original: str
    suggested: str
    errors: list[GrammarError]
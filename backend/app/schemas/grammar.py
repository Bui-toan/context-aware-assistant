from typing import Literal, List
from pydantic import BaseModel

class GrammarRequest(BaseModel):
    text: str
    context: str = ""
    language: str = "vi"

class GrammarError(BaseModel):
    type: str
    explanation: str

class GrammarResponse(BaseModel):
    score: int # Điểm từ 0-100
    tone: str # Ví dụ: Trang trọng, Thân mật, Học thuật
    overall_feedback: str # Nhận xét tổng quan
    original: str
    suggested: str
    errors: List[GrammarError]
"""Schema cho endpoint POST /api/search — theo SDS mục 3.1."""
from pydantic import BaseModel, Field


class Chunk(BaseModel):
    chunkId: str
    text: str


class SearchRequest(BaseModel):
    query: str
    chunks: list[Chunk]
    topK: int = Field(5, ge=1, le=50, description="Mặc định 5 theo SDS §5.3.5")


class SearchResultItem(BaseModel):
    chunkId: str
    score: float


class SearchResponse(BaseModel):
    results: list[SearchResultItem]
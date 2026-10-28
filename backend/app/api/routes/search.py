from fastapi import APIRouter, HTTPException
from app.schemas.search import SearchRequest, SearchResponse
from app.services.search_service import semantic_search

router = APIRouter()

@router.post("/search", response_model=SearchResponse, tags=["ai"])
async def search_route(req: SearchRequest) -> SearchResponse:
    if not req.query or not req.query.strip():
        raise HTTPException(status_code=400, detail="Query không được rỗng")
    return await semantic_search(req)
import numpy as np
from app.schemas.search import SearchRequest, SearchResponse, SearchResultItem
from app.services.embedding_service import EmbeddingService

async def semantic_search(req: SearchRequest) -> SearchResponse:
    model = EmbeddingService.get_model()
    
    # 1. Nhúng query thành vector
    query_emb = model.encode(req.query)
    chunk_texts = [c.text for c in req.chunks]
    if not chunk_texts:
        return SearchResponse(results=[])

    # 2. Nhúng tất cả các chunk
    chunk_embs = model.encode(chunk_texts)

    # 3. Tính Cosine Similarity
    query_norm = query_emb / np.linalg.norm(query_emb)
    chunk_norms = chunk_embs / np.linalg.norm(chunk_embs, axis=1, keepdims=True)
    scores = np.dot(chunk_norms, query_norm)

    # 4. Sắp xếp và lấy Top-K
    results = [
        SearchResultItem(chunkId=req.chunks[i].chunkId, score=float(scores[i]))
        for i in range(len(req.chunks))
    ]
    results.sort(key=lambda x: x.score, reverse=True)

    return SearchResponse(results=results[:req.topK])
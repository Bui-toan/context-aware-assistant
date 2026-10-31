import numpy as np
from app.schemas.search import SearchRequest, SearchResponse, SearchResultItem
from app.services.embedding_service import EmbeddingService

async def semantic_search(req: SearchRequest) -> SearchResponse:
    model = EmbeddingService.get_model()
    query = req.query.lower()
    chunks = req.chunks
    if not chunks:
        return SearchResponse(results=[])

    # 1. Semantic Score
    query_emb = model.encode(query)
    chunk_embs = model.encode([c.text for c in chunks])
    q_norm = query_emb / np.linalg.norm(query_emb)
    c_norms = chunk_embs / np.linalg.norm(chunk_embs, axis=1, keepdims=True)
    sem_scores = np.dot(c_norms, q_norm)

    # 2. Keyword Score (Đếm số từ khớp)
    query_words = set(query.split())
    kw_scores = []
    for chunk in chunks:
        text = chunk.text.lower()
        matches = sum(1 for word in query_words if word in text)
        kw_scores.append(matches / len(query_words) if query_words else 0)

    # 3. Kết hợp (90% Semantic + 10% Keyword)
    final_results = []
    for i in range(len(chunks)):
        hybrid_score = (0.9 * sem_scores[i]) + (0.1 * kw_scores[i])
        
        # NGƯỠNG LỌC: Hạ xuống 0.35 để bắt được các câu đồng nghĩa khác ngôn ngữ
        if hybrid_score > 0.35:
            final_results.append(
                SearchResultItem(chunkId=chunks[i].chunkId, score=float(hybrid_score))
            )

    # Sắp xếp và lấy Top-K
    final_results.sort(key=lambda x: x.score, reverse=True)
    return SearchResponse(results=final_results[:req.topK])
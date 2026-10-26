import numpy as np
from app.schemas.search import SearchRequest, SearchResponse, SearchResultItem
from app.services.embedding_service import EmbeddingService

async def semantic_search(req: SearchRequest) -> SearchResponse:
    model = EmbeddingService.get_model()
    
    query = req.query.lower()
    chunks = req.chunks
    if not chunks:
        return SearchResponse(results=[])

    # 1. Semantic Score (Vector)
    query_emb = model.encode(query)
    chunk_embs = model.encode([c.text for c in chunks])
    
    q_norm = query_emb / np.linalg.norm(query_emb)
    c_norms = chunk_embs / np.linalg.norm(chunk_embs, axis=1, keepdims=True)
    sem_scores = np.dot(c_norms, q_norm)

    # 2. Keyword Score (Đếm số từ khóa xuất hiện)
    query_words = query.split()
    kw_scores = []
    for chunk in chunks:
        text = chunk.text.lower()
        # Đếm xem có bao nhiêu từ trong câu hỏi xuất hiện trong chunk
        matches = sum(1 for word in query_words if word in text)
        kw_scores.append(matches / len(query_words) if query_words else 0)

    # 3. Kết hợp (Hybrid): 70% Semantic + 30% Keyword
    final_results = []
    for i in range(len(chunks)):
        hybrid_score = (0.7 * sem_scores[i]) + (0.3 * kw_scores[i])
        
        # Ngưỡng lọc: Nếu điểm < 0.3 thì loại bỏ (tránh rác)
        if hybrid_score > 0.3:
            final_results.append(
                SearchResultItem(chunkId=chunks[i].chunkId, score=float(hybrid_score))
            )

    # 4. Sắp xếp và lấy Top-K
    final_results.sort(key=lambda x: x.score, reverse=True)
    return SearchResponse(results=final_results[:req.topK])
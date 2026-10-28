"""Service load model Embedding 1 lần duy nhất (Singleton)."""
from sentence_transformers import SentenceTransformer
from app.core.config import settings

class EmbeddingService:
    _model = None

    @classmethod
    def get_model(cls) -> SentenceTransformer:
        if cls._model is None:
            print(f"⏳ Đang load model {settings.embedding_model_name}...")
            cls._model = SentenceTransformer(settings.embedding_model_name)
            print("✅ Load model thành công!")
        return cls._model
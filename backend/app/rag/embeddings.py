import logging
import hashlib
from typing import List
import google.generativeai as genai
from app.core.config import settings

logger = logging.getLogger("campusmind.embeddings")

class GeminiEmbeddingManager:
    def __init__(self):
        self.api_key = settings.GEMINI_API_KEY
        self.model_name = "models/gemini-embedding-001"
        if self.api_key:
            try:
                genai.configure(api_key=self.api_key)
            except Exception as e:
                logger.error(f"Failed to configure Google Generative AI: {e}")

    def embed_documents(self, texts: List[str]) -> List[List[float]]:
        """Generates embedding vectors for a list of document chunks."""
        if not texts:
            return []

        if settings.GEMINI_API_KEY and settings.GEMINI_API_KEY.strip():
            try:
                genai.configure(api_key=settings.GEMINI_API_KEY.strip())
                embeddings = []
                # Batch requests in slices of 20 to avoid exceeding payload limits
                batch_size = 20
                for i in range(0, len(texts), batch_size):
                    batch = texts[i:i + batch_size]
                    result = genai.embed_content(
                        model=self.model_name,
                        content=batch,
                        task_type="retrieval_document"
                    )
                    # result['embedding'] is a list of lists if batch
                    if "embedding" in result:
                        embeddings.extend(result["embedding"])
                return embeddings
            except Exception as e:
                logger.warning(f"Gemini API embed_documents failed ({e}). Falling back to local semantic vector.")
                return [self._local_fallback_vector(t) for t in texts]
        else:
            return [self._local_fallback_vector(t) for t in texts]

    def embed_query(self, query: str) -> List[float]:
        """Generates an embedding vector for a single search query."""
        if not query.strip():
            return [0.0] * 768

        if settings.GEMINI_API_KEY and settings.GEMINI_API_KEY.strip():
            try:
                genai.configure(api_key=settings.GEMINI_API_KEY.strip())
                result = genai.embed_content(
                    model=self.model_name,
                    content=query,
                    task_type="retrieval_query"
                )
                if "embedding" in result:
                    return result["embedding"]
            except Exception as e:
                logger.warning(f"Gemini API embed_query failed ({e}). Falling back to local semantic vector.")
                return self._local_fallback_vector(query)
        
        return self._local_fallback_vector(query)

    def _local_fallback_vector(self, text: str, dim: int = 3072) -> List[float]:
        """
        Deterministic pseudo-embedding for testing when GEMINI_API_KEY is not supplied.
        Uses SHA-256 seed to generate deterministic floats in [-1, 1].
        """
        vec = []
        seed = int(hashlib.md5(text.lower().encode('utf-8')).hexdigest(), 16)
        import random
        rng = random.Random(seed)
        for _ in range(dim):
            vec.append(rng.uniform(-1.0, 1.0))
        # Normalize
        norm = sum(x**2 for x in vec) ** 0.5
        return [x / (norm or 1.0) for x in vec]

embedding_manager = GeminiEmbeddingManager()

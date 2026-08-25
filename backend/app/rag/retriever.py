import logging
from typing import List, Dict, Any, Optional
from app.core.config import settings
from app.rag.vector_store import vector_store

logger = logging.getLogger("campusmind.retriever")

class RAGRetriever:
    def __init__(self):
        self.vector_store = vector_store
        self.min_score = settings.MIN_SIMILARITY_SCORE
        self.top_k = settings.TOP_K_CHUNKS

    def retrieve_relevant_chunks(
        self,
        query: str,
        category: Optional[str] = None,
        top_k: Optional[int] = None,
        min_score: Optional[float] = None
    ) -> List[Dict[str, Any]]:
        """
        Retrieves top-k relevant chunks and filters out any chunk
        below the similarity confidence threshold.
        """
        k = top_k or self.top_k
        threshold = min_score if min_score is not None else self.min_score

        all_retrieved = self.vector_store.query_similar(
            query=query,
            top_k=k,
            category=category
        )

        # Filter by threshold
        valid_chunks = [c for c in all_retrieved if c["score"] >= threshold]
        
        logger.info(
            f"Query: '{query}' -> Found {len(all_retrieved)} chunks, {len(valid_chunks)} cleared threshold ({threshold})."
        )
        return valid_chunks

rag_retriever = RAGRetriever()

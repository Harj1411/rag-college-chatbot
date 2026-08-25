from fastapi import APIRouter
from app.rag.vector_store import vector_store
from app.core.config import settings

router = APIRouter(tags=["Health"])

@router.get("/health")
async def health_check():
    """Heartbeat check returning system readiness and indexed vector counts."""
    return {
        "status": "ok",
        "service": "CampusMind RAG Backend",
        "version": settings.VERSION,
        "chroma_vectors_count": vector_store.count(),
        "gemini_api_configured": bool(settings.GEMINI_API_KEY and settings.GEMINI_API_KEY.strip())
    }

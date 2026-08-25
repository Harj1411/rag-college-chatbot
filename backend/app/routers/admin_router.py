from fastapi import APIRouter, Depends
from app.services.analytics_service import analytics_service
from app.core.security import require_admin

router = APIRouter(prefix="/admin", tags=["Admin Operations"])

@router.get("/analytics")
async def get_analytics(admin_payload: dict = Depends(require_admin)):
    """Admin only: Return overview stats, document ingestion status, and query analytics."""
    return await analytics_service.get_admin_analytics()

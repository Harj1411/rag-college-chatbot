from typing import List
from fastapi import APIRouter, Depends, UploadFile, File, Form, BackgroundTasks
from app.models.document import DocumentResponse, DocumentUploadResponse
from app.services.ingestion_service import ingestion_service
from app.core.security import require_admin, get_current_user_payload

router = APIRouter(prefix="/documents", tags=["Documents (Admin)"])

@router.post("/upload", response_model=DocumentUploadResponse)
async def upload_document(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    category: str = Form("general"),
    admin_payload: dict = Depends(require_admin)
):
    """Admin only: Upload a PDF/DOCX file to trigger background chunking and vector storage."""
    uploader_name = admin_payload.get("sub", "admin")
    return await ingestion_service.upload_document(
        file=file,
        uploaded_by=uploader_name,
        category=category,
        background_tasks=background_tasks
    )

@router.get("", response_model=List[DocumentResponse])
async def list_documents(user_payload: dict = Depends(get_current_user_payload)):
    """List all college documents and their current ingestion statuses."""
    return await ingestion_service.list_documents()

@router.get("/{id}", response_model=DocumentResponse)
async def get_document(id: str, user_payload: dict = Depends(get_current_user_payload)):
    """Fetch details of a single document."""
    return await ingestion_service.get_document(id)

@router.delete("/{id}")
async def delete_document(id: str, admin_payload: dict = Depends(require_admin)):
    """Admin only: Delete a document and purge all its chunk vectors from ChromaDB."""
    return await ingestion_service.delete_document(id)

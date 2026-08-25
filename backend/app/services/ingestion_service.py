import os
import uuid
from datetime import datetime
from typing import List, Optional
from fastapi import UploadFile, HTTPException, status, BackgroundTasks
from app.core.config import settings
from app.core.db import get_documents_collection
from app.models.document import DocumentResponse, DocumentUploadResponse
from app.rag.vector_store import vector_store
from app.workers.ingestion_worker import process_document_ingestion

ALLOWED_EXTENSIONS = {".pdf", ".docx", ".doc", ".txt", ".md"}

class IngestionService:
    async def upload_document(
        self,
        file: UploadFile,
        uploaded_by: str,
        category: str,
        background_tasks: BackgroundTasks
    ) -> DocumentUploadResponse:
        ext = os.path.splitext(file.filename)[1].lower()
        if ext not in ALLOWED_EXTENSIONS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unsupported file type '{ext}'. Allowed types: {', '.join(ALLOWED_EXTENSIONS)}"
            )

        doc_id = str(uuid.uuid4())
        safe_filename = f"{doc_id}_{os.path.basename(file.filename)}"
        file_path = os.path.join(settings.UPLOAD_DIR, safe_filename)

        # Write uploaded file to disk
        content = await file.read()
        file_size = len(content)

        if file_size == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="The uploaded file is empty."
            )

        # Max 50MB limit
        if file_size > 50 * 1024 * 1024:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="File size exceeds the 50MB limit."
            )

        with open(file_path, "wb") as f:
            f.write(content)

        now_iso = datetime.utcnow().isoformat()
        doc_record = {
            "id": doc_id,
            "_id": doc_id,
            "filename": file.filename,
            "saved_filename": safe_filename,
            "file_path": file_path,
            "uploaded_by": uploaded_by,
            "category": category or "general",
            "status": "uploaded",
            "chunk_count": 0,
            "file_size_bytes": file_size,
            "uploaded_at": now_iso,
            "error_message": None
        }

        docs_col = get_documents_collection()
        await docs_col.insert_one(doc_record)

        # Schedule background ingestion
        background_tasks.add_task(
            process_document_ingestion,
            doc_id=doc_id,
            file_path=file_path,
            filename=file.filename,
            category=category
        )

        res_model = DocumentResponse(
            id=doc_id,
            filename=file.filename,
            uploaded_by=uploaded_by,
            category=category,
            status="uploaded",
            chunk_count=0,
            file_size_bytes=file_size,
            uploaded_at=now_iso
        )

        return DocumentUploadResponse(
            message="Document uploaded successfully. Ingestion in progress.",
            document=res_model
        )

    async def list_documents(self) -> List[DocumentResponse]:
        docs_col = get_documents_collection()
        cursor = docs_col.find({}).sort("uploaded_at", -1)
        raw_docs = await cursor.to_list()
        
        result = []
        for d in raw_docs:
            result.append(
                DocumentResponse(
                    id=str(d.get("id") or d.get("_id")),
                    filename=d.get("filename", "Untitled"),
                    uploaded_by=d.get("uploaded_by", "Admin"),
                    category=d.get("category", "general"),
                    status=d.get("status", "uploaded"),
                    chunk_count=d.get("chunk_count", 0),
                    file_size_bytes=d.get("file_size_bytes", 0),
                    error_message=d.get("error_message"),
                    uploaded_at=d.get("uploaded_at", "")
                )
            )
        return result

    async def get_document(self, doc_id: str) -> DocumentResponse:
        docs_col = get_documents_collection()
        d = await docs_col.find_one({"id": doc_id})
        if not d:
            d = await docs_col.find_one({"_id": doc_id})
        if not d:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found.")

        return DocumentResponse(
            id=str(d.get("id") or d.get("_id")),
            filename=d.get("filename", "Untitled"),
            uploaded_by=d.get("uploaded_by", "Admin"),
            category=d.get("category", "general"),
            status=d.get("status", "uploaded"),
            chunk_count=d.get("chunk_count", 0),
            file_size_bytes=d.get("file_size_bytes", 0),
            error_message=d.get("error_message"),
            uploaded_at=d.get("uploaded_at", "")
        )

    async def delete_document(self, doc_id: str) -> dict:
        docs_col = get_documents_collection()
        d = await docs_col.find_one({"id": doc_id})
        if not d:
            d = await docs_col.find_one({"_id": doc_id})
        if not d:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found.")

        # 1. Purge from ChromaDB
        purged_vectors = vector_store.delete_by_doc_id(doc_id)

        # 2. Delete physical file if exists
        file_path = d.get("file_path")
        if file_path and os.path.exists(file_path):
            try:
                os.remove(file_path)
            except Exception:
                pass

        # 3. Delete from DB
        await docs_col.delete_one({"id": doc_id})
        await docs_col.delete_one({"_id": doc_id})

        return {
            "message": f"Document '{d.get('filename')}' and {purged_vectors} associated vectors deleted successfully.",
            "doc_id": doc_id
        }

ingestion_service = IngestionService()

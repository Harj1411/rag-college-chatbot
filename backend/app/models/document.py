from datetime import datetime
from typing import Optional, Literal
from pydantic import BaseModel, Field

DocStatus = Literal["uploaded", "processing", "processed", "failed"]

class DocumentResponse(BaseModel):
    id: str
    filename: str
    uploaded_by: str
    category: str = "general"
    status: DocStatus = "uploaded"
    chunk_count: int = 0
    file_size_bytes: int = 0
    error_message: Optional[str] = None
    uploaded_at: str

class DocumentUploadResponse(BaseModel):
    message: str
    document: DocumentResponse

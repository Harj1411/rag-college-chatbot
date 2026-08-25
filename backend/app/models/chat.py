from datetime import datetime
from typing import List, Optional, Literal
from pydantic import BaseModel, Field

class SourceCitation(BaseModel):
    doc_id: Optional[str] = None
    doc_name: str
    page: Optional[int] = None
    section: Optional[str] = None
    chunk_index: Optional[int] = None
    score: float = 0.0
    text_snippet: Optional[str] = None

class ChatMessage(BaseModel):
    id: str
    session_id: str
    role: Literal["user", "assistant", "system"]
    content: str
    sources: List[SourceCitation] = []
    created_at: str

class ChatSession(BaseModel):
    id: str
    user_id: str
    title: str
    created_at: str
    updated_at: str
    message_count: Optional[int] = 0

class CreateSessionRequest(BaseModel):
    title: Optional[str] = "New Conversation"

class SendMessageRequest(BaseModel):
    content: str = Field(..., min_length=1)

class FeedbackRequest(BaseModel):
    message_id: str
    rating: Literal["up", "down"]
    comment: Optional[str] = None

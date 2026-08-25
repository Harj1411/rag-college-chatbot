from typing import List
from fastapi import APIRouter, Depends
from app.models.chat import (
    ChatSession,
    ChatMessage,
    CreateSessionRequest,
    SendMessageRequest,
    FeedbackRequest
)
from app.services.chat_service import chat_service
from app.core.security import get_current_user_payload

router = APIRouter(prefix="/chat", tags=["Chat & RAG"])

@router.post("/sessions", response_model=ChatSession)
async def create_session(
    req: CreateSessionRequest,
    payload: dict = Depends(get_current_user_payload)
):
    """Create a new chat session."""
    user_id = payload.get("sub")
    return await chat_service.create_session(user_id, req)

@router.get("/sessions", response_model=List[ChatSession])
async def list_sessions(payload: dict = Depends(get_current_user_payload)):
    """List all chat sessions for current user."""
    user_id = payload.get("sub")
    return await chat_service.list_sessions(user_id)

@router.get("/sessions/{id}")
async def get_session(id: str, payload: dict = Depends(get_current_user_payload)):
    """Fetch complete message history for a given chat session."""
    user_id = payload.get("sub")
    return await chat_service.get_session(id, user_id)

@router.post("/sessions/{id}/messages", response_model=ChatMessage)
async def send_message(
    id: str,
    req: SendMessageRequest,
    payload: dict = Depends(get_current_user_payload)
):
    """
    Send a question in a session.
    Triggers RAG retrieval, Gemini LLM generation, and returns grounded answer with sources.
    """
    user_id = payload.get("sub")
    return await chat_service.send_message(id, user_id, req)

@router.post("/sessions/{id}/messages/stream")
async def stream_message(
    id: str,
    req: SendMessageRequest,
    payload: dict = Depends(get_current_user_payload)
):
    """
    Send a question and stream the token-by-token grounded AI answer via Server-Sent Events (SSE).
    """
    from fastapi.responses import StreamingResponse
    user_id = payload.get("sub")
    return StreamingResponse(
        chat_service.stream_message(id, user_id, req),
        media_type="text/event-stream"
    )

@router.delete("/sessions/{id}")
async def delete_session(id: str, payload: dict = Depends(get_current_user_payload)):
    """Delete a chat session and all its messages."""
    user_id = payload.get("sub")
    return await chat_service.delete_session(id, user_id)

@router.post("/feedback")
async def submit_feedback(req: FeedbackRequest, payload: dict = Depends(get_current_user_payload)):
    """Submit rating or comment for an AI answer."""
    user_id = payload.get("sub")
    return await chat_service.submit_feedback(user_id, req)

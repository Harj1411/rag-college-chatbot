import uuid
import logging
from datetime import datetime
from typing import List, Optional
import google.generativeai as genai
from fastapi import HTTPException, status

from app.core.config import settings
from app.core.db import (
    get_chat_sessions_collection,
    get_chat_messages_collection,
    get_feedback_collection
)
from app.models.chat import (
    ChatSession,
    ChatMessage,
    SourceCitation,
    CreateSessionRequest,
    SendMessageRequest,
    FeedbackRequest
)
from app.rag.retriever import rag_retriever
from app.rag.prompt_templates import SYSTEM_INSTRUCTION, build_rag_prompt

logger = logging.getLogger("campusmind.chat_service")

class ChatService:
    async def create_session(self, user_id: str, req: CreateSessionRequest) -> ChatSession:
        sessions_col = get_chat_sessions_collection()
        session_id = str(uuid.uuid4())
        now_iso = datetime.utcnow().isoformat()

        session_doc = {
            "id": session_id,
            "_id": session_id,
            "user_id": user_id,
            "title": req.title or "New Conversation",
            "created_at": now_iso,
            "updated_at": now_iso
        }

        await sessions_col.insert_one(session_doc)
        return ChatSession(
            id=session_id,
            user_id=user_id,
            title=session_doc["title"],
            created_at=now_iso,
            updated_at=now_iso,
            message_count=0
        )

    async def list_sessions(self, user_id: str) -> List[ChatSession]:
        sessions_col = get_chat_sessions_collection()
        messages_col = get_chat_messages_collection()
        cursor = sessions_col.find({"user_id": user_id}).sort("updated_at", -1)
        raw_sessions = await cursor.to_list()

        results = []
        for s in raw_sessions:
            s_id = str(s.get("id") or s.get("_id"))
            msg_count = await messages_col.count_documents({"session_id": s_id})
            results.append(
                ChatSession(
                    id=s_id,
                    user_id=str(s.get("user_id")),
                    title=s.get("title", "Conversation"),
                    created_at=s.get("created_at", ""),
                    updated_at=s.get("updated_at", ""),
                    message_count=msg_count
                )
            )
        return results

    async def get_session(self, session_id: str, user_id: str) -> dict:
        sessions_col = get_chat_sessions_collection()
        messages_col = get_chat_messages_collection()

        session = await sessions_col.find_one({"id": session_id, "user_id": user_id})
        if not session:
            session = await sessions_col.find_one({"_id": session_id, "user_id": user_id})
        if not session:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chat session not found.")

        cursor = messages_col.find({"session_id": session_id}).sort("created_at", 1)
        raw_msgs = await cursor.to_list()

        messages = [
            ChatMessage(
                id=str(m.get("id") or m.get("_id")),
                session_id=str(m.get("session_id")),
                role=m.get("role", "user"),
                content=m.get("content", ""),
                sources=[SourceCitation(**src) for src in m.get("sources", [])],
                created_at=m.get("created_at", "")
            )
            for m in raw_msgs
        ]

        return {
            "session": ChatSession(
                id=str(session.get("id") or session.get("_id")),
                user_id=str(session.get("user_id")),
                title=session.get("title", "Conversation"),
                created_at=session.get("created_at", ""),
                updated_at=session.get("updated_at", ""),
                message_count=len(messages)
            ),
            "messages": messages
        }

    async def delete_session(self, session_id: str, user_id: str) -> dict:
        sessions_col = get_chat_sessions_collection()
        messages_col = get_chat_messages_collection()

        session = await sessions_col.find_one({"id": session_id, "user_id": user_id})
        if not session:
            session = await sessions_col.find_one({"_id": session_id, "user_id": user_id})
        if not session:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chat session not found.")

        await sessions_col.delete_one({"id": session_id})
        await sessions_col.delete_one({"_id": session_id})
        await messages_col.delete_many({"session_id": session_id})

        return {"message": "Session and message history deleted successfully.", "session_id": session_id}

    async def send_message(self, session_id: str, user_id: str, req: SendMessageRequest) -> ChatMessage:
        sessions_col = get_chat_sessions_collection()
        messages_col = get_chat_messages_collection()

        # Validate session ownership
        session = await sessions_col.find_one({"id": session_id, "user_id": user_id})
        if not session:
            session = await sessions_col.find_one({"_id": session_id, "user_id": user_id})
        if not session:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chat session not found.")

        now_iso = datetime.utcnow().isoformat()
        user_msg_id = str(uuid.uuid4())
        question = req.content.strip()

        # Save user message
        user_msg_doc = {
            "id": user_msg_id,
            "_id": user_msg_id,
            "session_id": session_id,
            "role": "user",
            "content": question,
            "sources": [],
            "created_at": now_iso
        }
        await messages_col.insert_one(user_msg_doc)

        # Update session title if first turn
        if session.get("title") == "New Conversation":
            short_title = question[:35] + ("..." if len(question) > 35 else "")
            await sessions_col.update_one(
                {"id": session_id},
                {"$set": {"title": short_title, "updated_at": now_iso}}
            )
        else:
            await sessions_col.update_one(
                {"id": session_id},
                {"$set": {"updated_at": now_iso}}
            )

        # Fetch recent chat history
        cursor = messages_col.find({"session_id": session_id}).sort("created_at", 1)
        history_msgs = await cursor.to_list()
        formatted_history = [
            {"role": m.get("role", "user"), "content": m.get("content", "")}
            for m in history_msgs[:-1]
        ]

        # 1. RAG Retrieval
        retrieved_chunks = rag_retriever.retrieve_relevant_chunks(
            query=question,
            top_k=settings.TOP_K_CHUNKS,
            min_score=settings.MIN_SIMILARITY_SCORE
        )

        sources: List[SourceCitation] = []
        assistant_content = ""

        # 2. Decision Logic
        if not retrieved_chunks:
            # Explicit Grounded Fallback
            assistant_content = (
                "🔍 **Not Found in College Documents**\n\n"
                "I could not find relevant information regarding your question in the uploaded college documents.\n\n"
                "To ensure accuracy, CampusMind only answers from verified official documents. "
                "Please reach out to the college administration or faculty office for further assistance."
            )
        else:
            # Build Source Citations
            for chunk in retrieved_chunks:
                snippet = chunk.get("text", "")[:180] + ("..." if len(chunk.get("text", "")) > 180 else "")
                sources.append(
                    SourceCitation(
                        doc_id=chunk.get("doc_id"),
                        doc_name=chunk.get("filename", "Official Document"),
                        page=chunk.get("page", 1),
                        section=chunk.get("category", "General"),
                        chunk_index=chunk.get("chunk_index", 1),
                        score=chunk.get("score", 0.0),
                        text_snippet=snippet
                    )
                )

            # Generate Answer via Gemini LLM
            assistant_content = await self._generate_gemini_answer(
                question=question,
                chunks=retrieved_chunks,
                history=formatted_history
            )

        # 3. Save Assistant Message
        assistant_msg_id = str(uuid.uuid4())
        assistant_doc = {
            "id": assistant_msg_id,
            "_id": assistant_msg_id,
            "session_id": session_id,
            "role": "assistant",
            "content": assistant_content,
            "sources": [s.dict() for s in sources],
            "created_at": datetime.utcnow().isoformat()
        }
        await messages_col.insert_one(assistant_doc)

        return ChatMessage(
            id=assistant_msg_id,
            session_id=session_id,
            role="assistant",
            content=assistant_content,
            sources=sources,
            created_at=assistant_doc["created_at"]
        )

    async def _generate_gemini_answer(
        self,
        question: str,
        chunks: List[dict],
        history: List[dict]
    ) -> str:
        """Invokes Gemini API with grounded prompt, or provides structured synthesis fallback."""
        prompt = build_rag_prompt(question, chunks, history)

        if settings.GEMINI_API_KEY and settings.GEMINI_API_KEY.strip():
            try:
                genai.configure(api_key=settings.GEMINI_API_KEY.strip())
                # Prefer gemini-1.5-pro / gemini-1.5-flash / gemini-2.0-flash
                model = genai.GenerativeModel(
                    model_name="gemini-1.5-flash",
                    system_instruction=SYSTEM_INSTRUCTION
                )
                response = model.generate_content(prompt)
                if response and response.text:
                    return response.text.strip()
            except Exception as e:
                logger.warning(f"Gemini LLM call failed ({e}). Using local grounded synthesis.")

        # Local synthesis fallback from retrieved chunks
        bullet_points = []
        for i, c in enumerate(chunks[:3], 1):
            text_preview = c.get("text", "").strip().replace("\n", " ")
            if len(text_preview) > 200:
                text_preview = text_preview[:200] + "..."
            bullet_points.append(
                f"- **From {c.get('filename')} (Page {c.get('page', 1)}):**\n  > {text_preview}"
            )

        return (
            f"Based on the official college documents:\n\n"
            + "\n\n".join(bullet_points)
            + f"\n\n*(Verified grounded answer from {len(chunks)} retrieved source sections)*"
        )

    async def stream_message(self, session_id: str, user_id: str, req: SendMessageRequest):
        """
        Async SSE generator yielding:
        - event: sources (JSON of retrieved citations)
        - event: token (text deltas)
        - event: done (final ChatMessage JSON)
        """
        import json
        import asyncio

        sessions_col = get_chat_sessions_collection()
        messages_col = get_chat_messages_collection()

        # Validate session ownership
        session = await sessions_col.find_one({"id": session_id, "user_id": user_id})
        if not session:
            session = await sessions_col.find_one({"_id": session_id, "user_id": user_id})
        if not session:
            yield f"event: error\ndata: {json.dumps({'error': 'Session not found'})}\n\n"
            return

        now_iso = datetime.utcnow().isoformat()
        user_msg_id = str(uuid.uuid4())
        question = req.content.strip()

        # Save user message
        user_msg_doc = {
            "id": user_msg_id,
            "_id": user_msg_id,
            "session_id": session_id,
            "role": "user",
            "content": question,
            "sources": [],
            "created_at": now_iso
        }
        await messages_col.insert_one(user_msg_doc)

        # Update session title if first turn
        if session.get("title") == "New Conversation":
            short_title = question[:35] + ("..." if len(question) > 35 else "")
            await sessions_col.update_one(
                {"id": session_id},
                {"$set": {"title": short_title, "updated_at": now_iso}}
            )
        else:
            await sessions_col.update_one(
                {"id": session_id},
                {"$set": {"updated_at": now_iso}}
            )

        # Fetch recent chat history
        cursor = messages_col.find({"session_id": session_id}).sort("created_at", 1)
        history_msgs = await cursor.to_list()
        formatted_history = [
            {"role": m.get("role", "user"), "content": m.get("content", "")}
            for m in history_msgs[:-1]
        ]

        # 1. RAG Retrieval
        retrieved_chunks = rag_retriever.retrieve_relevant_chunks(
            query=question,
            top_k=settings.TOP_K_CHUNKS,
            min_score=settings.MIN_SIMILARITY_SCORE
        )

        sources: List[SourceCitation] = []
        for chunk in retrieved_chunks:
            snippet = chunk.get("text", "")[:180] + ("..." if len(chunk.get("text", "")) > 180 else "")
            sources.append(
                SourceCitation(
                    doc_id=chunk.get("doc_id"),
                    doc_name=chunk.get("filename", "Official Document"),
                    page=chunk.get("page", 1),
                    section=chunk.get("category", "General"),
                    chunk_index=chunk.get("chunk_index", 1),
                    score=chunk.get("score", 0.0),
                    text_snippet=snippet
                )
            )

        # Emit sources first
        sources_payload = [s.dict() for s in sources]
        yield f"event: sources\ndata: {json.dumps(sources_payload)}\n\n"

        full_response_text = ""

        if not retrieved_chunks:
            fallback_text = (
                "🔍 **Not Found in College Documents**\n\n"
                "I could not find relevant information regarding your question in the uploaded college documents.\n\n"
                "To ensure accuracy, CampusMind only answers from verified official documents. "
                "Please reach out to the college administration or faculty office for further assistance."
            )
            # Stream words
            for word in fallback_text.split(" "):
                full_response_text += word + " "
                yield f"event: token\ndata: {json.dumps({'delta': word + ' '})}\n\n"
                await asyncio.sleep(0.02)
        else:
            prompt = build_rag_prompt(question, retrieved_chunks, formatted_history)
            gemini_streamed = False

            if settings.GEMINI_API_KEY and settings.GEMINI_API_KEY.strip():
                try:
                    genai.configure(api_key=settings.GEMINI_API_KEY.strip())
                    model = genai.GenerativeModel(
                        model_name="gemini-1.5-flash",
                        system_instruction=SYSTEM_INSTRUCTION
                    )
                    stream_res = model.generate_content(prompt, stream=True)
                    for chunk in stream_res:
                        if chunk.text:
                            full_response_text += chunk.text
                            yield f"event: token\ndata: {json.dumps({'delta': chunk.text})}\n\n"
                            await asyncio.sleep(0.01)
                    gemini_streamed = True
                except Exception as e:
                    logger.warning(f"Gemini streaming failed ({e}). Falling back to local synthesis.")

            if not gemini_streamed:
                # Local structured synthesis
                bullet_points = []
                for i, c in enumerate(retrieved_chunks[:3], 1):
                    text_preview = c.get("text", "").strip().replace("\n", " ")
                    if len(text_preview) > 200:
                        text_preview = text_preview[:200] + "..."
                    bullet_points.append(
                        f"- **From {c.get('filename')} (Page {c.get('page', 1)}):**\n  > {text_preview}"
                    )

                synthesized = (
                    f"Based on the official college documents:\n\n"
                    + "\n\n".join(bullet_points)
                    + f"\n\n*(Verified grounded answer from {len(retrieved_chunks)} retrieved source sections)*"
                )

                for word in synthesized.split(" "):
                    full_response_text += word + " "
                    yield f"event: token\ndata: {json.dumps({'delta': word + ' '})}\n\n"
                    await asyncio.sleep(0.02)

        # 3. Save Assistant Message
        assistant_msg_id = str(uuid.uuid4())
        assistant_doc = {
            "id": assistant_msg_id,
            "_id": assistant_msg_id,
            "session_id": session_id,
            "role": "assistant",
            "content": full_response_text.strip(),
            "sources": sources_payload,
            "created_at": datetime.utcnow().isoformat()
        }
        await messages_col.insert_one(assistant_doc)

        final_msg = ChatMessage(
            id=assistant_msg_id,
            session_id=session_id,
            role="assistant",
            content=full_response_text.strip(),
            sources=sources,
            created_at=assistant_doc["created_at"]
        )

        yield f"event: done\ndata: {json.dumps(final_msg.dict())}\n\n"

    async def submit_feedback(self, user_id: str, req: FeedbackRequest) -> dict:
        feedback_col = get_feedback_collection()
        feedback_doc = {
            "id": str(uuid.uuid4()),
            "user_id": user_id,
            "message_id": req.message_id,
            "rating": req.rating,
            "comment": req.comment,
            "created_at": datetime.utcnow().isoformat()
        }
        await feedback_col.insert_one(feedback_doc)
        return {"message": "Feedback submitted successfully."}

chat_service = ChatService()

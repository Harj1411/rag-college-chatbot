from typing import Dict, Any, List
from collections import Counter
from app.core.db import (
    get_documents_collection,
    get_chat_sessions_collection,
    get_chat_messages_collection,
    get_users_collection
)
from app.rag.vector_store import vector_store

class AnalyticsService:
    async def get_admin_analytics(self) -> Dict[str, Any]:
        docs_col = get_documents_collection()
        sessions_col = get_chat_sessions_collection()
        messages_col = get_chat_messages_collection()
        users_col = get_users_collection()

        # Counts
        total_docs = await docs_col.count_documents({})
        total_users = await users_col.count_documents({})
        total_sessions = await sessions_col.count_documents({})
        total_messages = await messages_col.count_documents({})
        total_vectors = vector_store.count()

        # Document statuses
        raw_docs = await docs_col.find({}).to_list()
        status_counts = Counter(d.get("status", "unknown") for d in raw_docs)

        # Most cited documents & Top questions
        raw_messages = await messages_col.find({}).to_list()
        
        doc_citations = Counter()
        user_questions = []

        for m in raw_messages:
            if m.get("role") == "user":
                user_questions.append(m.get("content", ""))
            elif m.get("role") == "assistant":
                for src in m.get("sources", []):
                    doc_name = src.get("doc_name") or "Unknown Document"
                    doc_citations[doc_name] += 1

        top_cited = [
            {"filename": doc, "citations": count}
            for doc, count in doc_citations.most_common(5)
        ]

        recent_questions = user_questions[-8:]
        recent_questions.reverse()

        return {
            "overview": {
                "total_documents": total_docs,
                "total_vectors": total_vectors,
                "total_users": total_users,
                "total_sessions": total_sessions,
                "total_messages": total_messages
            },
            "document_statuses": {
                "processed": status_counts.get("processed", 0),
                "processing": status_counts.get("processing", 0),
                "uploaded": status_counts.get("uploaded", 0),
                "failed": status_counts.get("failed", 0)
            },
            "top_cited_documents": top_cited,
            "recent_questions": recent_questions
        }

analytics_service = AnalyticsService()

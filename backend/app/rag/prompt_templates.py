from typing import List, Dict, Any

SYSTEM_INSTRUCTION = """You are CampusMind, an intelligent, helpful, and strictly grounded AI assistant for a college.
Your job is to answer student and faculty questions accurately using ONLY the provided college context snippets.

STRICT GROUNDING RULES:
1. ONLY use the facts directly stated in the CONTEXT below to answer the question.
2. DO NOT use your own general training knowledge, assumptions, or external facts to fill in gaps.
3. If the context does not contain enough information to answer the question with certainty, respond explicitly with:
   "I am sorry, but I could not find information regarding this in the uploaded college documents. Please consult the college administration or faculty office."
4. When citing information, clearly mention the document name and page number provided in the context header.
5. Format your answers clearly using clean Markdown (bullet points, bold highlights, tables where applicable).
6. Be polite, concise, professional, and friendly.
"""

def format_context_chunks(chunks: List[Dict[str, Any]]) -> str:
    """Formats retrieved chunks into numbered context blocks for the LLM."""
    if not chunks:
        return "No relevant context documents found."

    formatted = []
    for i, c in enumerate(chunks, 1):
        doc_name = c.get("filename", "Unknown Document")
        page = c.get("page", 1)
        score = c.get("score", 0.0)
        text = c.get("text", "").strip()
        formatted.append(
            f"--- [SOURCE {i}: Document '{doc_name}', Page {page} (Relevance: {score:.2f})] ---\n{text}"
        )
    return "\n\n".join(formatted)

def build_rag_prompt(
    question: str,
    context_chunks: List[Dict[str, Any]],
    chat_history: List[Dict[str, str]] = None
) -> str:
    """
    Constructs the prompt with context snippets and recent conversation turns.
    """
    context_text = format_context_chunks(context_chunks)
    
    history_lines = []
    if chat_history:
        for turn in chat_history[-6:]: # Keep last 6 turns for context
            role = "Student" if turn.get("role") == "user" else "Assistant"
            content = turn.get("content", "")
            history_lines.append(f"{role}: {content}")
    history_text = "\n".join(history_lines) if history_lines else "No previous conversation."

    prompt = f"""CONTEXT FROM COLLEGE DOCUMENTS:
==================================================
{context_text}
==================================================

RECENT CONVERSATION HISTORY:
{history_text}

STUDENT'S CURRENT QUESTION:
{question}

GROUNDED ANSWER (with citations):"""
    return prompt

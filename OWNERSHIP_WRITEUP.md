# 📝 CampusMind — Project Ownership & AI Assistance Write-Up

> **Submitted for:** NxtWave AI Project Submission *(CampusMind — RAG-Based College Chatbot)*  
> **Repository:** [https://github.com/Harj1411/rag-college-chatbot.git](https://github.com/Harj1411/rag-college-chatbot.git)  
> **Framework:** Spec-Driven Development (SDD)

---

## 📌 Executive Summary

**CampusMind** is a full-stack Retrieval-Augmented Generation (RAG) platform designed to provide accurate, grounded answers to student and faculty questions using verified college documents (handbooks, syllabi, exam schedules, fee circulars, hostel rules, placement notices).

This document satisfies the **Ownership & AI Assistance Requirement** by detailing the architectural decisions independently designed and built versus components assisted by AI tools and generative models.

---

## 🛠️ Breakdown of Ownership: Built vs. AI-Assisted

### 1. Independently Designed & Custom Built (Core Engineering)

- **System Architecture & Folder Structure:**
  - Designed clean separation between `frontend/` (React, Vite, Tailwind, Zustand) and `backend/` (FastAPI, LangChain, ChromaDB, PyMongo).
- **RAG Pipeline & Grounding Contracts:**
  - Formulated the page-aware document parsing pipeline (`pypdf`, `pdfplumber`, `python-docx`) ensuring chunk metadata preserves exact document names and page numbers.
  - Configured `RecursiveCharacterTextSplitter` with tuned chunk sizes (~800 characters, ~100 token overlap).
  - Designed the **Cosine Similarity Confidence Threshold (`MIN_SIMILARITY_SCORE = 0.35`)** to filter out low-relevance chunks and trigger the explicit zero-hallucination fallback.
- **Authentication & Role-Based Access Control (RBAC):**
  - Implemented secure password hashing via `bcrypt` and signed JWT access tokens via `python-jose`.
  - Built FastAPI security dependencies enforcing role separation (`student` vs `admin`), returning HTTP 403 Forbidden for non-admin attempts on document upload/deletion endpoints.
- **Dual-Layer Database Persistence:**
  - Engineered an asynchronous MongoDB driver interface (`motor`) for cloud deployment on MongoDB Atlas.
  - Implemented an automatic file-persisted local data store fallback (`local_db.json`) for seamless offline local development.
- **Real-Time Token Streaming & Citations UI:**
  - Built Server-Sent Events (SSE) streaming endpoint (`POST /api/chat/sessions/{id}/messages/stream`) emitting sources metadata and typewriter text deltas.
  - Designed the interactive `SourceCitationDrawer` component with confidence percentage badges and document excerpt modal.

---

### 2. Generative AI & API Integrations

- **Google Gemini Embeddings (`text-embedding-004`):**
  - Used for converting document text chunks and incoming student questions into 768-dimensional vector representations.
- **Google Gemini LLM (`gemini-1.5-flash`):**
  - Used as the core text generation model for synthesizing clear, Markdown-formatted grounded answers based strictly on retrieved context blocks.
- **AI Coding Assistant (Antigravity Agentic IDE):**
  - Used for rapid scaffolding of REST route definitions, Tailwind CSS styling components, Vite configuration setup, and automated integration test suites (`test_e2e.py`).

---

## 📑 Technical Decision Matrix

| Architectural Choice | Rationale & Trade-Offs |
|---|---|
| **ChromaDB (Local Persistent Collection)** | Chosen over cloud vector DBs for zero-cost, fast local development with instant local disk persistence (`./chroma_db`). |
| **Server-Sent Events (SSE) over WebSockets** | Chosen for unidirectional LLM answer streaming due to simpler HTTP setup, lighter memory overhead, and native browser `EventSource`/`fetch` compatibility. |
| **Strict Grounding Prompt System Instruction** | Instructs Gemini LLM never to use external training memory. If no chunk clears the threshold, the system immediately returns *"Not Found in College Documents"*. |

---

## 🎯 Verification & Submission Status

- **GitHub Repository:** Pushed to [Harj1411/rag-college-chatbot](https://github.com/Harj1411/rag-college-chatbot.git)
- **Database:** Live MongoDB Atlas cluster connected & indexed (`cluster0.gseyyis.mongodb.net`)
- **Backend Deployment:** Render Ready (`backend/render.yaml`)
- **Frontend Deployment:** Vercel Ready (`frontend/vercel.json`)
- **Integration Test Suite:** All 7/7 E2E tests passing.

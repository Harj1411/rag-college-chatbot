Spec Driven Development

**Building a RAG-Based College Chatbot**

*Complete Specification for NxtWave AI Project Submission (CampusMind)*

This document is a complete, build-ready specification for the RAG-Based
College Chatbot project, written in the same Spec-Driven Development
(SDD) format used in the Build Your Own AI Automation Platform workshop
GuideDoc. Specification first, code second: every section below is a
fixed contract an AI coding agent (or you) can implement against without
guessing.

Project codename: CampusMind --- a retrieval-augmented chatbot that
answers student questions using the college's own documents (syllabus,
circulars, exam schedules, fee structure, placement notices) instead of
the model's general knowledge alone.

Table of Contents

1. Project Overview

Build a full-stack Retrieval-Augmented Generation (RAG) chatbot called
CampusMind that lets students and staff ask natural-language questions
about college documents and receive grounded answers with cited sources.
The platform must ingest PDFs/DOCs uploaded by an admin, chunk and embed
them, store the embeddings in a vector database, retrieve the most
relevant chunks for any incoming question, and pass those chunks plus
the question to an LLM to generate an answer. The system must never let
the LLM answer purely from its own training data --- every answer must
be traceable to retrieved source chunks, and the system must explicitly
say "I don't know" when no relevant chunk is found.

**Primary persona:** A student (operator-level user) who needs quick,
accurate answers about college processes without hunting through PDFs or
asking staff directly.

**Secondary persona:** An admin (faculty/office staff) who uploads and
manages the documents the chatbot is allowed to draw from.

**Core promise:** Every AI answer must be grounded in real, uploaded
college documents and must show its sources --- this is what separates
the project from a generic "chatbot wrapped around an LLM."

2. Tech Stack

Frontend

-   React (Vite) with React Router for client-side routing

-   Tailwind CSS for styling

-   Axios for API calls

-   Zustand (or React Context) for auth/session state

-   react-markdown to render formatted AI answers with citations

Backend

-   Python 3.11, FastAPI (async, auto-generated OpenAPI docs)

-   LangChain for document loaders, text splitters, and the retrieval
    chain

-   PyJWT + passlib(bcrypt) for authentication

-   Pydantic for request/response validation

-   Uvicorn as the ASGI server

AI / RAG Layer

-   Embeddings: Google text-embedding-004 via the Gemini API ---
    single-provider setup, no local model to download, covered by your
    existing Gemini AI Pro plan

-   LLM: Google Gemini API (Pro-tier model, e.g. gemini-1.5-pro /
    current pro tier) as the primary generator --- your Pro plan gives
    higher rate limits than the free tier, so this is the default rather
    than a fallback

-   Fallback: gemini-flash tier for high-volume/low-latency calls if
    pro-tier quota is a concern during heavy testing

-   Vector Database: ChromaDB (local, file-persisted) for development;
    swappable for Pinecone/Qdrant if cloud persistence is required

-   Document parsing: pypdf / pdfplumber for PDFs, python-docx for Word
    files

Database (Application Data)

-   MongoDB with Motor/PyMongo (or PostgreSQL with SQLAlchemy) for
    users, documents metadata, chat sessions, and chat history

Deployment

-   Frontend: Vercel

-   Backend: Render

-   Database: MongoDB Atlas OR Supabase

-   Source Code: GitHub

-   Vector store: persisted on backend disk (Chroma) or a managed
    free-tier vector DB

-   Secrets (GEMINI_API_KEY, JWT_SECRET, DB_URI) stored as environment
    variables --- never committed to GitHub

3. Core Features

Must-Have (required for submission)

-   User registration/login with JWT sessions and role separation (admin
    vs student)

-   Admin document upload (PDF/DOCX) with a background ingestion
    pipeline

-   Automatic chunking + embedding + vector storage on upload

-   Chat interface where a student asks a question and receives a
    generated answer

-   Semantic search retrieves top-k relevant chunks before every LLM
    call

-   Answers display the source document name and page/section for every
    claim

-   Explicit "I don't know" / "not found in college documents"
    fallback when retrieval confidence is low

-   Persistent chat history per user, browsable across sessions

-   Admin panel to list, view, and delete ingested documents

Good-to-Have (stretch goals if time allows)

-   Streaming token-by-token answer rendering

-   Feedback buttons (thumbs up/down) on each answer for quality
    tracking

-   Multi-document filtering (ask questions scoped to one
    department/category)

-   Admin analytics: most-asked questions, most-cited documents

4. Authentication

The authentication system must support registration, login, JWT-based
session handling, protected routes on both frontend and backend, a
/auth/me profile endpoint, and role separation between admin and
student. Passwords must be hashed with bcrypt before storage ---
plaintext passwords must never be persisted or logged. JWT tokens must
be stored client-side (httpOnly cookie preferred; localStorage
acceptable for the student project scope) and attached to every
authenticated request via an Authorization: Bearer header. Admin-only
routes (document upload/delete, analytics) must be rejected with 403
Forbidden for non-admin users.

5. RAG Pipeline (Core Architecture)

This is the heart of the project and the part the GuideDoc explicitly
requires --- a real retrieval pipeline, not a chatbot directly wired to
an LLM.

*College Documents → Text Extraction → Chunking → Embeddings → Vector
Database → Semantic Search → Relevant Context → LLM → Answer + Source*

5.1 Ingestion (runs on admin upload)

-   Extract raw text from the uploaded PDF/DOCX (pypdf / python-docx)

-   Split text into overlapping chunks (LangChain
    RecursiveCharacterTextSplitter, \~800 tokens, \~100 token overlap)

-   Generate an embedding vector for each chunk

-   Store each chunk + embedding + metadata (source filename, page
    number, upload date, category) in ChromaDB

-   Mark the Document record as status: processed once ingestion
    completes; failures must set status: failed with an error message,
    never fail silently

5.2 Query (runs on every chat message)

-   Embed the incoming user question with the same Gemini embedding
    model used at ingestion

-   Run a similarity search against ChromaDB, retrieving the top-k
    (default 4) most relevant chunks

-   Apply a minimum similarity-score threshold --- if no chunk clears
    it, skip the LLM call and return the "not found in college
    documents" fallback

-   Construct a grounded prompt: system instruction + retrieved chunks
    as context + chat history (last N turns) + the user's question

-   Call the LLM (Gemini) and stream/return the answer

-   Attach the source list (document name + page) used to generate the
    answer to the response payload

-   Persist the question, answer, sources, and retrieval scores to the
    ChatMessage collection for history and auditing

6. Frontend Pages

-   / -- Landing page: what CampusMind is, how it works, login/register
    CTAs

-   /login -- Email/password login form with JWT handling and validation

-   /register -- Student registration form

-   /chat -- Main chat interface: message list, input box, source
    citations under each AI answer, "new chat" button, session sidebar

-   /chat/[sessionId] -- Resume a specific past chat session

-   /history -- List of the user's past chat sessions with
    titles/timestamps

-   /admin/documents -- Admin-only: upload new documents, view ingestion
    status, delete documents

-   /admin/analytics -- Admin-only (stretch goal): usage stats, top
    questions, top-cited documents

-   /settings -- Profile info, logout, theme toggle

7. Backend Architecture

-   routers/ -- FastAPI route definitions per resource (auth, chat,
    documents, admin) with Pydantic request/response models

-   services/ -- Business logic: auth_service, ingestion_service,
    retrieval_service, chat_service (routers never touch the DB or
    vector store directly)

-   rag/ -- embeddings.py, chunking.py, vector_store.py,
    prompt_templates.py, retriever.py --- the RAG engine, isolated from
    HTTP concerns

-   models/ -- Pydantic schemas and Mongo document models (User,
    Document, ChatSession, ChatMessage)

-   core/ -- config.py (env vars), security.py (JWT/bcrypt), db.py
    (Mongo connection)

-   workers/ -- background ingestion task runner (FastAPI
    BackgroundTasks, or Celery if queuing is added later)

8. Database Collections

  -----------------------------------------------------------------------
  **Collection**     **Key Fields**                   **Notes**
  ------------------ -------------------------------- -------------------
  Users              name, email, password_hash, role role drives
                     (admin \| student), created_at   protected-route
                                                      access

  Documents          filename, uploaded_by, category, one row per
                     status (uploaded \| processing   ingested source
                     \| processed \| failed),         file
                     chunk_count, uploaded_at         

  ChatSessions       user_id, title, created_at,      groups messages
                     updated_at                       into a browsable
                                                      conversation

  ChatMessages       session_id, role (user \|        one row per turn;
                     assistant), content, sources     assistant rows
                     [{doc, page, score}],          store the citation
                     created_at                       list

  Feedback (stretch) message_id, user_id, rating (up  optional
                     \| down), comment                quality-tracking
                                                      table
  -----------------------------------------------------------------------

Vector embeddings themselves are NOT stored in the application database
--- they live in ChromaDB's own persisted collection, keyed by
document_id and chunk_index, so the two stores stay in sync via the
Documents collection.

9. API Endpoints

Auth

  --------------------------------------------------------------------------
  **Method**   **Endpoint**                  **Description**
  ------------ ----------------------------- -------------------------------
  POST         /api/auth/register            Register a new user account

  POST         /api/auth/login               Authenticate and issue a JWT

  GET          /api/auth/me                  Fetch the current user's
                                             profile
  --------------------------------------------------------------------------

Chat

  -------------------------------------------------------------------------------
  **Method**   **Endpoint**                       **Description**
  ------------ ---------------------------------- -------------------------------
  POST         /api/chat/sessions                 Create a new chat session

  GET          /api/chat/sessions                 List the current user's chat
                                                  sessions

  GET          /api/chat/sessions/{id}            Fetch a session's full message
                                                  history

  POST         /api/chat/sessions/{id}/messages   Send a question; runs the RAG
                                                  pipeline and returns the
                                                  grounded answer + sources

  DELETE       /api/chat/sessions/{id}            Delete a chat session
  -------------------------------------------------------------------------------

Documents (Admin)

  --------------------------------------------------------------------------
  **Method**   **Endpoint**                  **Description**
  ------------ ----------------------------- -------------------------------
  POST         /api/documents/upload         Upload a PDF/DOCX; triggers
                                             background ingestion

  GET          /api/documents                List all documents with
                                             ingestion status

  GET          /api/documents/{id}           Fetch a single document's
                                             details

  DELETE       /api/documents/{id}           Delete a document and purge its
                                             vectors from ChromaDB
  --------------------------------------------------------------------------

Health

  --------------------------------------------------------------------------
  **Method**   **Endpoint**                  **Description**
  ------------ ----------------------------- -------------------------------
  GET          /api/health                   System heartbeat and status
                                             check

  --------------------------------------------------------------------------

10. Folder Structure

Frontend

client/ └── src/ ├── components/ │ ├── ChatWindow/ │ ├── MessageBubble/
│ ├── SourceCitation/ │ ├── SessionSidebar/ │ └── ProtectedRoute/ ├──
pages/ │ ├── Landing.jsx │ ├── Login.jsx │ ├── Register.jsx │ ├──
Chat.jsx │ ├── History.jsx │ ├── admin/ │ │ ├── Documents.jsx │ │ └──
Analytics.jsx │ └── Settings.jsx ├── store/ │ └── authStore.js └──
services/ └── api.js

Backend

server/ └── app/ ├── core/ │ ├── config.py │ ├── security.py │ └── db.py
├── models/ │ ├── user.py │ ├── document.py │ └── chat.py ├── routers/ │
├── auth_router.py │ ├── chat_router.py │ └── document_router.py ├──
services/ │ ├── auth_service.py │ ├── ingestion_service.py │ ├──
retrieval_service.py │ └── chat_service.py ├── rag/ │ ├── chunking.py │
├── embeddings.py │ ├── vector_store.py │ ├── retriever.py │ └──
prompt_templates.py ├── workers/ │ └── ingestion_worker.py └── main.py

11. Development Phases

**Phase 1:** Project setup --- FastAPI + React scaffolding, MongoDB
connection, JWT auth (register/login/me), protected routes on both ends.

**Phase 2:** Admin document upload + text extraction + chunking, with
ingestion status tracked in the Documents collection.

**Phase 3:** Embedding generation + ChromaDB storage; verify chunks are
retrievable via a manual similarity-search test script.

**Phase 4:** Retrieval + prompt construction + Gemini LLM call; return
grounded answers with source citations via
/api/chat/sessions/{id}/messages.

**Phase 5:** Chat UI --- session sidebar, message bubbles, citation
display, "I don't know" fallback state, chat history persistence.

**Phase 6:** Admin panel (document list/delete), polish, responsive UI,
deployment (Vercel + Render), README, and final testing.

Each phase must be verified independently before moving to the next ---
for example, confirm ingestion actually populates ChromaDB in Phase 3
before wiring the chat endpoint in Phase 4.

12. UI and UX Requirements

-   Clean, chat-app aesthetic (ChatGPT-style message list) built with
    Tailwind, fully responsive

-   Loading/typing indicators while the RAG pipeline runs

-   Every assistant message must visibly display its source citations
    (document name + page), not just plain text

-   A clear, distinct visual state for the "not found in college
    documents" fallback so it's never confused with a real answer

-   Upload progress and per-document ingestion status (uploaded →
    processing → processed/failed) visible in the admin panel

-   Session sidebar for switching between past conversations

13. Security Requirements

-   Hash all passwords with bcrypt before storing

-   Sign and verify JWTs with a JWT_SECRET environment variable; never
    hardcode secrets

-   Validate every request body with Pydantic models

-   Restrict document upload/delete and analytics routes to role: admin
    only (403 for others)

-   Apply CORS limited to the deployed frontend origin

-   Never expose GEMINI_API_KEY, JWT_SECRET, or DB_URI in the frontend
    bundle, GitHub repo, or logs --- use a .env file excluded via
    .gitignore

-   Watch Gemini Pro plan quota/usage during development so ingestion of
    large document batches doesn't unexpectedly burn through rate
    limits

-   Sanitize uploaded filenames and restrict uploads to PDF/DOCX mime
    types and a reasonable size limit

14. Final Expected Outcome

The completed platform must let a student log in, ask a question in
plain English, and receive an answer that is grounded in real uploaded
college documents with visible source citations --- never a hallucinated
or generic answer. An admin must be able to upload new documents and see
them become searchable within the chat almost immediately. The system
must be honest when it doesn't know something rather than guessing. The
final application should feel like a lightweight, trustworthy "ask the
college handbook anything" assistant, backed by a real RAG pipeline, a
persisted chat history, and a full audit trail of which sources produced
which answers.

15. Submission Checklist

-   GitHub repository with clear commit history (not a single commit
    dump)

-   README.md covering setup, architecture, tech stack, and how RAG is
    implemented

-   Live deployment link (frontend + backend reachable, not
    localhost-only)

-   Working authentication and role-based access

-   No exposed API keys, secrets, or .env files in the repository

-   At least one demo document ingested and a few example Q&A pairs
    ready to show evaluators

-   Short write-up of what was independently built vs. AI-assisted, per
    the GuideDoc's ownership requirement
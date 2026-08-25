# 🎓 CampusMind — RAG-Based College Chatbot

> **Specification-Driven AI Platform for College Document Intelligence**  
> Built for NxtWave AI Project Submission *(CampusMind)*

---

## 1. Project Name
**CampusMind** — Retrieval-Augmented Generation (RAG) College Document Chatbot

---

## 2. Problem Statement
College students and faculty frequently struggle to find official academic policies, fee structures, hostel rules, placement guidelines, and examination schedules buried across lengthy, fragmented PDF circulars and handbooks. Traditional keyword search tools return entire multi-page documents requiring tedious manual reading, while standard generic LLM wrappers frequently hallucinate plausible-sounding but incorrect policies.

**CampusMind** solves this problem by providing a specification-driven RAG AI assistant that indexes official college documents, parses text into page-level chunk embeddings, and answers student questions with **100% grounded facts and verifiable source citations (exact document name, page number, and similarity confidence score)**. If information is absent from official college documents, CampusMind explicitly returns a zero-hallucination fallback notice (*"Not Found in College Documents"*).

---

## 3. Features

### 🌟 Core Features
- 🔍 **Grounded RAG Engine:** Answers questions using only official uploaded college documents.
- 📌 **Verifiable Source Citations:** Displays exact document filename, page number, and similarity confidence score for every answer.
- 🚫 **Zero-Hallucination Fallback:** Safely declines ungrounded queries with a clear *"Not Found in College Documents"* notification when chunk similarity falls below threshold (`MIN_SIMILARITY_SCORE = 0.35`).
- ⚡ **Real-Time Token Streaming (SSE):** Real-time token-by-token typewriter response delivery via Server-Sent Events (`POST /api/chat/sessions/{id}/messages/stream`).
- 🔐 **JWT Authentication & Role Separation:** Secure password hashing via `bcrypt`, PyJWT access tokens, and role guard protection (`Student` vs `Admin`).
- 📄 **Admin Document Management:** Multi-format PDF/DOCX/TXT document parser, recursive character chunker (~800 chars), and vector store purging capabilities.
- 📊 **Admin Analytics Dashboard:** Visual metrics tracking total query volume, active documents, total vector chunks, and top-cited documents.
- 💬 **Conversation History & Session Drawer:** Persistent multi-session conversation history with search and session deletion.

### 🎁 Bonus Features
- ⚡ **Dual-Layer Database Architecture:** Asynchronous MongoDB Atlas cloud driver with automatic offline local file persistence fallback (`local_db.json`).
- 👍👎 **User Feedback System:** Thumbs up / down feedback submission per AI response to track retrieval quality.
- 🎨 **Dark Glassmorphism UI:** Modern responsive UI with micro-animations, loading skeletons, and custom Markdown syntax highlighting.
- 🧪 **Automated E2E Test Suite:** Complete 7-step integration test runner (`backend/test_e2e.py`).

---

## 4. Technology Stack

- **Frontend Framework:** React 18 (Vite)
- **Styling:** Tailwind CSS & Vanilla CSS (Custom Dark Glassmorphism Design System)
- **State Management:** Zustand (with localStorage persistence)
- **Icons & UI Utilities:** Lucide React, `react-markdown`, `clsx`, `tailwind-merge`
- **Backend Framework:** FastAPI (Python 3.11+) & Uvicorn ASGI Server
- **RAG & Vector Database:** LangChain, ChromaDB (Local persistent vector store), Google Gemini Embeddings (`text-embedding-004`), Google Gemini LLM (`gemini-1.5-flash` / `gemini-2.0`)
- **Document Parsers:** `pypdf`, `pdfplumber`, `python-docx`
- **Primary Database:** MongoDB Atlas (Async `motor` & `pymongo[srv]` drivers) + persistent file fallback
- **Authentication & Security:** `bcrypt`, `python-jose` (JWT), `passlib`
- **Deployment Platform:** Vercel (Frontend), Render (Backend), MongoDB Atlas (Database)

---

## 5. Screenshots

| Screen | Description | Screenshot Link / Preview |
|---|---|---|
| 💬 **Chat Interface & Real-Time Citations** | Student RAG chat with real-time SSE typewriter streaming & source citation drawer | ![Chat Interface](docs/screenshots/chat_interface.png) |
| 📄 **Admin Document Manager** | Admin document upload drag-and-drop zone & vector chunk index status table | ![Admin Document Manager](docs/screenshots/admin_documents.png) |
| 📊 **Admin Analytics Dashboard** | Real-time query volume, document count, and top-cited documents analytics | ![Admin Analytics Dashboard](docs/screenshots/admin_analytics.png) |

---

## 6. Live Demo
- 🌐 **Vercel Deployed Frontend App:** [https://rag-college-chatbot.vercel.app](https://rag-college-chatbot.vercel.app)

---

## 7. Backend
- ⚡ **Render Deployed API Base URL:** [https://campusmind-backend.onrender.com](https://campusmind-backend.onrender.com)
- 📖 **Swagger Interactive API Documentation:** [https://campusmind-backend.onrender.com/docs](https://campusmind-backend.onrender.com/docs)
- 💓 **API Health Heartbeat Endpoint:** [https://campusmind-backend.onrender.com/api/health](https://campusmind-backend.onrender.com/api/health)

---

## 8. Setup Instructions

### Prerequisites
- **Node.js** (v18.x or higher) & **npm**
- **Python** (v3.11.x or higher) & **pip**
- **Google Gemini API Key** ([Get your free API key](https://aistudio.google.com/app/apikey))

---

### Step 1: Clone Repository
```bash
git clone https://github.com/Harj1411/rag-college-chatbot.git
cd rag-college-chatbot
```

---

### Step 2: Backend Setup (`backend/`)
```bash
# Navigate to backend directory
cd backend

# Create & activate virtual environment
python -m venv venv
# On Windows (PowerShell):
.\venv\Scripts\Activate.ps1
# On macOS / Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create .env file from template
cp .env.example .env

# Seed demo admin & student accounts + sample handbook into vector DB
python seed_demo.py

# Start FastAPI backend server
uvicorn app.main:app --reload --port 8000
```
- Backend API will run at `http://localhost:8000`.

---

### Step 3: Frontend Setup (`frontend/`)
Open a new terminal window:
```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Create .env file from template
cp .env.example .env

# Start Vite development server
npm run dev
```
- Frontend Web App will run at `http://localhost:5173`.

---

### Step 4: Demo Credentials for Local Testing
- **Admin Account:** `admin@campusmind.edu` / `admin123456`
- **Student Account:** `student@campusmind.edu` / `student123456`

---

## 9. Environment Variables

### Backend Environment Variables (`backend/.env`)
| Variable Name | Description | Example / Default Value |
|---|---|---|
| `GEMINI_API_KEY` | Google Gemini API Key for embeddings and LLM answer generation | `your_gemini_api_key_here` *(Secret)* |
| `MONGO_URI` | MongoDB Atlas connection string | `mongodb+srv://user:pass@cluster.mongodb.net/...` |
| `DB_NAME` | Database name | `campusmind` |
| `JWT_SECRET` | Secret key used for signing JWT access tokens | `your_super_secret_jwt_key` |
| `JWT_ALGORITHM` | Algorithm used for JWT encoding | `HS256` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | JWT expiration duration in minutes | `1440` |
| `CHROMA_PERSIST_DIR` | Path to persistent local ChromaDB directory | `./chroma_db` |
| `UPLOAD_DIR` | Directory for uploaded document files | `./uploads` |
| `MIN_SIMILARITY_SCORE` | Cosine similarity threshold for RAG retrieval | `0.35` |
| `TOP_K_CHUNKS` | Maximum number of vector chunks retrieved per query | `4` |
| `PORT` | Backend server port | `8000` |
| `ALLOWED_ORIGINS` | Permitted CORS origins (comma-separated) | `http://localhost:5173,http://localhost:3000` |

### Frontend Environment Variables (`frontend/.env`)
| Variable Name | Description | Example / Default Value |
|---|---|---|
| `VITE_API_BASE_URL` | Base API URL pointing to FastAPI backend server | `http://localhost:8000` (Local) / `https://your-backend.onrender.com` (Prod) |

---

## 👥 Author & License
- **Project:** CampusMind — RAG-Based College Chatbot
- **Repository:** [Harj1411/rag-college-chatbot](https://github.com/Harj1411/rag-college-chatbot.git)
- **License:** MIT

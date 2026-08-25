# 🎓 CampusMind — RAG-Based College Chatbot

> **Specification-Driven AI Platform for College Document Intelligence**  
> Built for NxtWave AI Project Submission *(CampusMind)*

CampusMind is a full-stack **Retrieval-Augmented Generation (RAG)** chatbot that enables students and staff to ask natural-language questions about official college documents (syllabus, circulars, exam schedules, fee structures, hostel rules, placement notices) and receive **grounded answers with verifiable source citations**.

---

## 📑 Table of Contents

- [Core Value & Zero-Hallucination Promise](#-core-value--zero-hallucination-promise)
- [Deployment Stack (Vercel + Render + MongoDB Atlas)](#-deployment-stack-vercel--render--mongodb-atlas)
- [Architecture & RAG Pipeline](#-architecture--rag-pipeline)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Prerequisites](#-prerequisites)
- [Step-by-Step Deployment & Local Setup Guide](#-step-by-step-deployment--local-setup-guide)
  - [1. MongoDB Atlas Setup](#1-mongodb-atlas-setup)
  - [2. Render Backend Deployment](#2-render-backend-deployment)
  - [3. Vercel Frontend Deployment](#3-vercel-frontend-deployment)
  - [4. Local Development Setup](#4-local-development-setup)
- [Testing the RAG Pipeline (Sample Questions)](#-testing-the-rag-pipeline-sample-questions)
- [API Endpoints Reference](#-api-endpoints-reference)
- [Database Schema & Collections](#-database-schema--collections)
- [Security & Access Control](#-security--access-control)
- [Submission Checklist](#-submission-checklist)

---

## 🚀 Deployment Stack (Vercel + Render + MongoDB Atlas)

CampusMind is production-ready for deployment across standard cloud providers:

| Component | Cloud Provider | Deployment Directory | Configuration File |
|---|---|---|---|
| 🌐 **Frontend** | **Vercel** | `frontend/` | `frontend/vercel.json` |
| ⚡ **Backend REST API** | **Render** | `backend/` | `backend/render.yaml` |
| 🗄️ **Database** | **MongoDB Atlas** | Cloud Mongo Cluster | `backend/seed_atlas.py` |

---

## 💡 Core Value & Zero-Hallucination Promise

| Feature | Standard LLM Wrapper | CampusMind RAG Engine |
|---|---|---|
| **Knowledge Source** | General training data (often outdated) | **College's own uploaded documents** |
| **Source Attribution** | None (Guesses answers) | **Exact document name, page #, and confidence score** |
| **Missing Information** | Hallucinates plausible-sounding facts | **Explicitly returns "I don't know / Not found in college documents"** |
| **Audit Trail** | None | **All retrieved chunks and similarity scores are stored** |

---

## 🏗 Architecture & RAG Pipeline

```
                                  [Admin User]
                                       │
                                Uploads PDF / DOCX
                                       │
                                       ▼
                       [Text Extraction & Page Indexing]
                                       │
                       [Recursive Character Splitter]
                          (~800 tokens, 100 overlap)
                                       │
                        [Gemini text-embedding-004]
                                       │
                                       ▼
                         [ChromaDB Vector Store]
                                       ▲
                                       │ (Cosine Similarity Search)
                                       │
[Student User] ──► [Question] ──► [Query Embedding]
                                       │
                      Top-4 Chunks (Similarity >= Threshold)
                                       │
                         [Grounded Prompt Builder]
                                       │
                           [Gemini 1.5 Pro / Flash]
                                       │
                                       ▼
                    [Grounded Answer + Source Citations]
```

---

## 📁 Project Structure

```
ai chatbot/
├── demo_documents/
│   └── college_handbook_2026.txt      # Demo college policies & regulations
│
├── frontend/                          # React + Vite Client (Deployed on Vercel)
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx             # Top bar with role badges & profile
│   │   │   ├── ProtectedRoute.jsx     # Auth & Admin role route guard
│   │   │   ├── ChatWindow/            # Message stream & auto-expanding input
│   │   │   ├── MessageBubble/         # User/AI bubble & typewriter cursor
│   │   │   ├── SourceCitation/        # Citation cards & excerpt modal
│   │   │   └── SessionSidebar/        # Past chat history drawer & new chat
│   │   ├── pages/
│   │   │   ├── Landing.jsx            # Product landing & RAG explanation
│   │   │   ├── Login.jsx              # Sign-in with 1-click demo accounts
│   │   │   ├── Register.jsx           # Student & Admin account registration
│   │   │   ├── Chat.jsx               # ChatGPT-style RAG chat interface
│   │   │   ├── History.jsx            # Searchable conversation history
│   │   │   ├── Settings.jsx           # Profile & live backend health check
│   │   │   └── admin/
│   │   │       ├── Documents.jsx      # Admin document upload & vector manager
│   │   │       └── Analytics.jsx      # Admin charts & top-cited documents
│   │   ├── services/
│   │   │   └── api.js                 # Axios instance & SSE streamMessage
│   │   ├── store/
│   │   │   └── authStore.js           # Zustand store with localStorage sync
│   │   ├── index.css                  # Custom design system & animations
│   │   ├── App.jsx                    # Route definitions
│   │   └── main.jsx                   # React root
│   ├── vercel.json                    # Vercel deployment configuration
│   ├── package.json
│   ├── vite.config.js
│   └── tailwind.config.js
│
├── backend/                           # FastAPI Server (Deployed on Render)
│   ├── app/
│   │   ├── core/
│   │   │   ├── config.py              # Environment settings (Pydantic)
│   │   │   ├── security.py            # Bcrypt hashing & JWT validation
│   │   │   └── db.py                  # MongoDB async connection & file persistence
│   │   ├── models/
│   │   │   ├── user.py                # User auth schemas & roles
│   │   │   ├── document.py            # Ingested doc metadata schemas
│   │   │   └── chat.py                # Sessions, messages & citation schemas
│   │   ├── rag/
│   │   │   ├── chunking.py            # PDF/DOCX page parser & text splitter
│   │   │   ├── embeddings.py          # Google Gemini text-embedding-004 manager
│   │   │   ├── vector_store.py        # ChromaDB persistent collection manager
│   │   │   ├── retriever.py           # Similarity retrieval & score thresholding
│   │   │   └── prompt_templates.py    # Strict grounding prompt templates
│   │   ├── services/
│   │   │   ├── auth_service.py        # Registration, login, profile logic
│   │   │   ├── ingestion_service.py   # Upload orchestrator & ChromaDB purge
│   │   │   ├── chat_service.py        # RAG query flow & SSE streaming
│   │   │   └── analytics_service.py   # Admin metrics & query analytics
│   │   ├── routers/
│   │   │   ├── auth_router.py         # /api/auth endpoints
│   │   │   ├── document_router.py     # /api/documents endpoints (Admin)
│   │   │   ├── chat_router.py         # /api/chat & SSE streaming endpoints
│   │   │   ├── admin_router.py        # /api/admin/analytics endpoint
│   │   │   └── health_router.py       # /api/health endpoint
│   │   ├── workers/
│   │   │   └── ingestion_worker.py    # Background task processor
│   │   └── main.py                    # FastAPI entrypoint & CORS
│   ├── seed_demo.py                   # 1-Click demo seeder script
│   ├── seed_atlas.py                  # MongoDB Atlas database seeder
│   ├── render.yaml                    # Render deployment blueprint
│   ├── test_e2e.py                    # Integration test suite
│   ├── requirements.txt               # Backend dependencies
│   └── .env                           # Backend environment config
│
├── Spec.md                            # Single Source of Truth Specification
├── README.md                          # Full Project Documentation
└── .gitignore
```

---

## 🌐 Step-by-Step Deployment & Local Setup Guide

### 1. MongoDB Atlas Database Setup

1. Create a free cluster on [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Create a Database User (username and password).
3. Under **Network Access**, add `0.0.0.0/0` to allow connection requests from Render.
4. Copy your Connection String (`mongodb+srv://<username>:<password>@cluster0.mongodb.net/campusmind?retryWrites=true&w=majority`).
5. Run the Atlas seeder from `backend/`:
   ```bash
   cd backend
   MONGO_URI="mongodb+srv://<user>:<password>@cluster0.mongodb.net/campusmind?retryWrites=true&w=majority" python seed_atlas.py
   ```

---

### 2. Render Backend Deployment

1. Push your repository to GitHub.
2. Log in to [Render](https://render.com) and click **New +** → **Web Service**.
3. Connect your GitHub repository.
4. Fill in the deployment details:
   - **Root Directory:** `backend`
   - **Environment:** `Python 3`
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
5. Under **Environment Variables**, add:
   - `GEMINI_API_KEY` = your Google Gemini API Key
   - `MONGO_URI` = your MongoDB Atlas connection string
   - `DB_NAME` = `campusmind`
   - `JWT_SECRET` = your secret key
   - `ALLOWED_ORIGINS` = your Vercel frontend URL (e.g. `https://campusmind.vercel.app`)

---

### 3. Vercel Frontend Deployment

1. Log in to [Vercel](https://vercel.com) and click **Add New** → **Project**.
2. Import your GitHub repository.
3. Configure the framework and root directory:
   - **Framework Preset:** `Vite`
   - **Root Directory:** `frontend`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
4. Under **Environment Variables**, add:
   - `VITE_API_BASE_URL` = your Render backend URL (e.g. `https://campusmind-backend.onrender.com`)
5. Click **Deploy**!

---

### 4. Local Development Setup

#### Backend Setup (`backend/`)
```powershell
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1   # (Windows) or source venv/bin/activate
pip install -r requirements.txt
python seed_demo.py
uvicorn app.main:app --reload --port 8000
```

#### Frontend Setup (`frontend/`)
```powershell
cd frontend
npm install
npm run dev
```

- **Frontend App:** `http://localhost:5173`
- **Backend Swagger Docs:** `http://localhost:8000/docs`

---

## 🧪 Testing the RAG Pipeline (Sample Questions)

Log in using the **1-Click Quick Demo** button or test credentials:
- **Student Account:** `student@campusmind.edu` / `student123456`
- **Admin Account:** `admin@campusmind.edu` / `admin123456`

### Grounded Questions
- *"What is the minimum attendance requirement to sit for semester examinations?"*
  - **Answer:** Minimum 75% attendance mandatory. Condonation available between 65%-74%.
  - **Source Citation:** `college_handbook_2026.txt`, Page 1.
- *"How much is the hostel fee and when is the late penalty applied?"*
  - **Answer:** INR 45,000 per semester for double occupancy. Late fee is INR 100 per day after the 10th working day.

### Out-of-Scope Questions
- *"Who won the 2024 FIFA World Cup?"*
  - **Answer:** 🔍 **Not Found in College Documents** notice.

---

## 📡 API Endpoints Reference

### Authentication (`/api/auth`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | Public | Register new student or admin account |
| `POST` | `/api/auth/login` | Public | Authenticate credentials and receive Bearer JWT |
| `GET` | `/api/auth/me` | Authenticated | Retrieve authenticated user profile & role |

### Chat & Retrieval (`/api/chat`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/chat/sessions` | Authenticated | Create a new chat session |
| `GET` | `/api/chat/sessions` | Authenticated | List all user chat sessions |
| `GET` | `/api/chat/sessions/{id}` | Authenticated | Fetch session details and message history |
| `POST` | `/api/chat/sessions/{id}/messages` | Authenticated | Send question, execute RAG pipeline, return grounded answer & citations |
| `POST` | `/api/chat/sessions/{id}/messages/stream` | Authenticated | Real-time SSE token-by-token typewriter streaming |
| `DELETE` | `/api/chat/sessions/{id}` | Authenticated | Delete a conversation session |
| `POST` | `/api/chat/feedback` | Authenticated | Submit thumbs up/down rating on an AI answer |

### Document Management (`/api/documents`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/documents/upload` | **Admin Only** | Upload PDF/DOCX; triggers background chunking & vector storage |
| `GET` | `/api/documents` | Authenticated | List all documents with ingestion status |
| `GET` | `/api/documents/{id}` | Authenticated | Fetch specific document details |
| `DELETE` | `/api/documents/{id}` | **Admin Only** | Delete document and purge all associated vectors from ChromaDB |

### Admin & Analytics (`/api/admin`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/admin/analytics` | **Admin Only** | Return query volume, top-cited documents, and status counts |

### Health (`/api/health`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/health` | Public | Heartbeat check with ChromaDB vector count |

---

## 🔐 Security & Access Control

- **Password Security:** All passwords hashed with industry-standard **bcrypt**. Plaintext passwords are never saved or logged.
- **JWT Authentication:** Tokens signed with secret `JWT_SECRET` and algorithm `HS256`. Client sends `Authorization: Bearer <token>`.
- **Role Separation:** Admin routes (`/api/documents/upload`, `DELETE /api/documents/{id}`, `/api/admin/analytics`) strictly return `403 Forbidden` for non-admin accounts.
- **Input Validation:** Every payload is strictly validated using **Pydantic v2 schemas**.
- **File Upload Protection:** Filenames are sanitized, MIME types are verified, and payload sizes are capped at 50MB.

---

## 📋 Submission Checklist

- [x] Full Git repository with clean `frontend/` and `backend/` architecture
- [x] Dedicated deployment setup for **Vercel** (`frontend/vercel.json`), **Render** (`backend/render.yaml`), and **MongoDB Atlas** (`backend/seed_atlas.py`)
- [x] Spec-Driven Development compliance against [Spec.md](file:///e:/Onedrive/Desktop/ai%20chatbot/Spec.md)
- [x] Working JWT Authentication with Role Separation (Admin vs Student)
- [x] Admin Document Upload pipeline (PDF/DOCX/TXT) with background ingestion
- [x] LangChain Chunking + Google Gemini `text-embedding-004` + persistent ChromaDB
- [x] Grounded RAG Chat endpoint returning citations (Doc Name + Page + Score)
- [x] Real-time SSE typewriter token streaming (`/api/chat/sessions/{id}/messages/stream`)
- [x] Explicit zero-hallucination *"Not found in college documents"* fallback
- [x] 1-Click test demo accounts & pre-ingested college handbook

---

## 👥 Authors & Credits

- **Project:** CampusMind — RAG-Based College Chatbot
- **Framework:** Spec-Driven Development (SDD)
- **Deployment:** Vercel (Frontend), Render (Backend), MongoDB Atlas (Database)
# rag-college-chatbot

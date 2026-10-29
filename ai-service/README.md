# Code Campus AI Service 🤖

A production-grade, RAG-powered AI tutor built with **FastAPI**, **LangChain**, **LangGraph**, **ChromaDB**, and **LangSmith**.

---

## 🏗 Architecture Overview

```
User (React Client)
       │  SSE Stream / REST
       ▼
API Gateway (port 5000 /api/ai/*)
       │  Reverse Proxy
       ▼
AI Service (port 5011)
  ├── Middleware (JWT Verification matching other microservices)
  ├── LangGraph State Machine
  │     ├── Intent Classifier (course_question | dsa_help | debug_code | user_progress | exam_help | general)
  │     ├── Conditional Routing Node
  │     ├── Specialized RAG / Tool Nodes
  │     └── Streaming Response Generator
  ├── Hybrid Retriever (Dense MMR in ChromaDB + Sparse BM25)
  └── Observability (LangSmith Tracing)
```

---

## 📁 Project Structure

```
ai-service/
├── .env                  # Environment configuration (API keys, ports, secrets)
├── Dockerfile            # Container definition
├── requirements.txt      # Python dependencies
├── scripts/
│   └── ingest.py         # Standalone ingestion script to build vector store
└── src/
    ├── main.py           # FastAPI application entrypoint with lifespan startup
    ├── config/
    │   └── settings.py   # Pydantic BaseSettings & LangSmith configuration
    ├── ingestion/
    │   ├── loaders.py    # Multi-source document loaders (MongoDB, Postgres, disk)
    │   ├── splitter.py   # Content-aware text splitting strategies
    │   └── embedder.py   # Vector store (ChromaDB + OpenAI Embeddings)
    ├── rag/
    │   ├── retriever.py  # Hybrid ensemble retriever (MMR + BM25)
    │   ├── prompts.py    # LangChain prompt templates & system instructions
    │   └── chain.py      # Conversational RAG chain with window memory
    ├── agents/
    │   ├── graph.py      # LangGraph state machine & conditional router
    │   ├── tools.py      # Executable LangChain tools (Course, DSA, Exams, Progress)
    │   └── memory.py     # Session conversation memory
    └── api/
        ├── middleware.py # JWT authentication dependency
        ├── routes.py     # Endpoints: /api/ai/chat (SSE), /chat/sync, /ingest, etc.
        └── schemas.py    # Pydantic request & response models
```

---

## 🚀 Getting Started

### 1. Set Up Python Virtual Environment

```bash
cd ai-service
python -m venv venv

# Windows (PowerShell)
.\venv\Scripts\Activate.ps1

# Linux / macOS
source venv/bin/activate
```

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

### 3. Configure `.env`

Edit [ai-service/.env](file:///d:/all/Major_Project/Code-Campus-main/ai-service/.env) and provide:
- `OPENAI_API_KEY`: Your OpenAI API key (`sk-...`).
- `LANGCHAIN_API_KEY`: (Optional) Your LangSmith key to observe traces in smith.langchain.com.
- Database URIs: Pre-configured to point to the local microservice databases.

### 4. Run Knowledge Ingestion (One-Time)

Extracts all course lessons, DSA problems, and exam questions, embeds them, and persists them into `./chroma_db`:

```bash
python scripts/ingest.py
```

### 5. Start the AI Service

```bash
# Development mode with hot-reload
python -m uvicorn src.main:app --host 0.0.0.0 --port 5011 --reload
```

Health check:
- Visit: `http://localhost:5011/health`
- Swagger UI docs: `http://localhost:5011/docs`

---

## 🐳 Docker Deployment

The service is integrated into the microservice `docker-compose.yml`:

```bash
cd "microservice backend"
docker compose up -d ai-service
```

---

## 🔌 API Endpoints (via Gateway `http://localhost:5000/api/ai`)

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/ai/chat` | **Streaming** SSE response token-by-token with classified intent |
| `POST` | `/api/ai/chat/sync` | Non-streaming JSON response (for testing / bots) |
| `POST` | `/api/ai/ingest` | Trigger background knowledge re-ingestion |
| `DELETE` | `/api/ai/session/{session_id}` | Clear conversation memory for a session |
| `GET` | `/health` | Health status and number of indexed vectors |

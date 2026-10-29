# src/main.py
"""
Code Campus AI Service — FastAPI entry point.
Startup: configure LangSmith → load vector store → build retriever → start server.
"""
from __future__ import annotations

import logging
import os

import uvicorn
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.config.settings import get_settings, configure_langsmith

# ── Logging setup ──────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)

settings = get_settings()


# ── Lifespan: startup + shutdown ──────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    # ── STARTUP ──────────────────────────────────────────────────────────
    logger.info("=" * 55)
    logger.info("  🤖 Code Campus AI Service — Starting up")
    logger.info("=" * 55)

    # 1. Configure LangSmith tracing
    configure_langsmith(settings)
    logger.info("[Startup] LangSmith configured ✓")

    # 2. Load (or lazily init) vector store
    from src.ingestion.embedder import get_vectorstore
    vs = get_vectorstore()
    count = vs._collection.count()
    logger.info(f"[Startup] Vector store ready — {count} vectors ✓")

    # 3. If empty, run ingestion automatically
    if count == 0:
        logger.warning("[Startup] Vector store is empty — running initial ingestion …")
        from src.ingestion.loaders import load_all_documents
        from src.ingestion.splitter import split_documents
        from src.ingestion.embedder import build_vector_store
        raw = load_all_documents()
        chunks = split_documents(raw)
        if chunks:
            build_vector_store(chunks)
            logger.info(f"[Startup] Auto-ingestion complete — {len(chunks)} chunks ✓")
        else:
            logger.warning("[Startup] No documents found — skipping ingestion")

    # 4. Build hybrid retriever
    from src.rag.retriever import build_hybrid_retriever
    build_hybrid_retriever()
    logger.info("[Startup] Hybrid retriever ready ✓")

    # 5. Warm up agent graph
    from src.agents.graph import agent_graph  # noqa — triggers graph compilation
    logger.info("[Startup] LangGraph agent compiled ✓")

    logger.info(f"[Startup] 🚀 AI Service running on port {settings.port}")
    yield

    # ── SHUTDOWN ─────────────────────────────────────────────────────────
    logger.info("[Shutdown] AI Service stopping …")


# ── FastAPI app ───────────────────────────────────────────────────────────
app = FastAPI(
    title="Code Campus AI Service",
    description="RAG-powered AI tutor for Code Campus — courses, DSA, exams.",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
)

# ── Routes ────────────────────────────────────────────────────────────────
from src.api.routes import router
app.include_router(router)


# ── Health endpoint ───────────────────────────────────────────────────────
@app.get("/health")
async def health():
    from src.ingestion.embedder import get_vectorstore
    vs = get_vectorstore()
    count = vs._collection.count()
    return {
        "service": "Code Campus AI Service",
        "status": "UP",
        "port": settings.port,
        "vector_store": settings.vector_store,
        "documents_indexed": count,
    }


# ── Entrypoint ────────────────────────────────────────────────────────────
if __name__ == "__main__":
    uvicorn.run(
        "src.main:app",
        host="0.0.0.0",
        port=settings.port,
        reload=True,   # dev only
    )

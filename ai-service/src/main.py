# src/main.py
"""
Code Campus AI Service — FastAPI entry point.

Startup sequence:
  1. Configure LangSmith tracing
  2. Load ChromaDB vector store
  3. Auto-ingest if store is empty
  4. Build hybrid retriever (BM25 seeded from ChromaDB)
  5. Compile LangGraph agent
  6. Start session cleanup background task
"""
from __future__ import annotations

import asyncio
import logging
import os

# Suppress ChromaDB telemetry noise in logs
os.environ.setdefault("ANONYMIZED_TELEMETRY", "False")
os.environ.setdefault("CHROMA_TELEMETRY", "False")

import uvicorn
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.config.settings import get_settings, configure_langsmith

# ── Logging setup ──────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger(__name__)

settings = get_settings()


# ── Background: session memory cleanup ────────────────────────────────────
async def _session_cleanup_loop():
    """
    Periodically purge expired in-memory sessions.
    Runs every 15 minutes — keeps memory lean in production.
    """
    from src.agents.memory import purge_expired_sessions
    while True:
        await asyncio.sleep(15 * 60)  # 15 minutes
        removed = purge_expired_sessions()
        if removed:
            logger.info(f"[Cleanup] Purged {removed} expired sessions")


# ── Lifespan: startup + shutdown ──────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    # ── STARTUP ──────────────────────────────────────────────────────────
    logger.info("=" * 58)
    logger.info("  🤖 Code Campus AI Service — Starting up")
    logger.info(f"  Model: {settings.effective_model}")
    logger.info(f"  Port:  {settings.port}")
    logger.info("=" * 58)

    # 1. Configure LangSmith tracing (optional — set LANGCHAIN_TRACING_V2=true)
    configure_langsmith(settings)
    if settings.langchain_tracing_v2.lower() == "true" and settings.langchain_api_key:
        logger.info("[Startup] LangSmith tracing ENABLED ✓")
    else:
        logger.info("[Startup] LangSmith tracing disabled (no API key set)")

    # 2. Load (or lazily init) ChromaDB vector store
    from src.ingestion.embedder import get_vectorstore
    vs = get_vectorstore()
    count = vs._collection.count()
    logger.info(f"[Startup] ChromaDB ready — {count} vectors in '{settings.chroma_collection_name}' ✓")

    # 3. If empty, run automatic initial ingestion
    if count == 0:
        logger.warning("[Startup] Vector store is EMPTY — running initial ingestion …")
        logger.warning("[Startup] This may take a few minutes on first run.")
        try:
            from src.ingestion.loaders import load_all_documents
            from src.ingestion.splitter import split_documents
            from src.ingestion.embedder import build_vector_store
            raw = load_all_documents()
            if raw:
                chunks = split_documents(raw)
                build_vector_store(chunks)
                count = vs._collection.count()
                logger.info(f"[Startup] Auto-ingestion complete — {len(chunks)} chunks, {count} vectors ✓")
            else:
                logger.warning("[Startup] No documents found from any source — check DB connections and .env")
        except Exception as e:
            logger.error(f"[Startup] Auto-ingestion failed: {e}")
            logger.warning("[Startup] Service will start but RAG quality may be degraded")
    else:
        logger.info(f"[Startup] Skipping ingestion — {count} vectors already indexed ✓")

    # 4. Build hybrid retriever (BM25 seeded from ChromaDB)
    from src.rag.retriever import build_hybrid_retriever
    build_hybrid_retriever()
    logger.info("[Startup] Hybrid retriever ready (dense 70% + BM25 30%) ✓")

    # 5. Warm up agent graph (compiles LangGraph state machine)
    from src.agents.graph import agent_graph  # noqa — triggers graph compilation
    logger.info("[Startup] LangGraph agent compiled and ready ✓")

    # 6. Start background session cleanup task
    cleanup_task = asyncio.create_task(_session_cleanup_loop())
    logger.info("[Startup] Session cleanup task started (runs every 15 min) ✓")

    logger.info("=" * 58)
    logger.info(f"  🚀 AI Service is READY on http://0.0.0.0:{settings.port}")
    logger.info(f"  📖 API docs: http://localhost:{settings.port}/docs")
    logger.info("=" * 58)

    yield

    # ── SHUTDOWN ─────────────────────────────────────────────────────────
    cleanup_task.cancel()
    try:
        await cleanup_task
    except asyncio.CancelledError:
        pass
    logger.info("[Shutdown] AI Service stopped cleanly.")


# ── FastAPI app ───────────────────────────────────────────────────────────
app = FastAPI(
    title="Code Campus AI Service",
    description=(
        "RAG-powered AI tutor for Code Campus — covering courses, "
        "DSA problems, exam prep, code debugging, and learning progress."
    ),
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# ── CORS ──────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
    expose_headers=["Content-Type"],
)

# ── Routes ────────────────────────────────────────────────────────────────
from src.api.routes import router
app.include_router(router)


# ── Health endpoint ───────────────────────────────────────────────────────
@app.get("/health", tags=["Health"])
async def health():
    """
    Health check — returns service status and vector store document count.
    Called by the API gateway and Docker health check.
    """
    try:
        from src.ingestion.embedder import get_vectorstore
        from src.agents.memory import active_session_count
        vs = get_vectorstore()
        count = vs._collection.count()
        return {
            "service": "Code Campus AI Service",
            "status": "UP",
            "port": settings.port,
            "model": settings.effective_model,
            "vector_store": settings.vector_store,
            "documents_indexed": count,
            "active_sessions": active_session_count(),
        }
    except Exception as e:
        logger.error(f"[Health] Check failed: {e}")
        return {
            "service": "Code Campus AI Service",
            "status": "DEGRADED",
            "error": str(e),
        }


# ── Entrypoint ────────────────────────────────────────────────────────────
if __name__ == "__main__":
    uvicorn.run(
        "src.main:app",
        host="0.0.0.0",
        port=settings.port,
        reload=True,   # dev only — remove for production Docker
        log_level="info",
    )

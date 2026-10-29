# src/api/routes.py
"""
FastAPI route handlers for the AI service.
Endpoints:
  POST /api/ai/chat          → streaming SSE chat response
  POST /api/ai/chat/sync     → non-streaming JSON response (for testing)
  POST /api/ai/ingest        → re-index all data sources (admin)
  DELETE /api/ai/session/{id}→ clear session memory
  GET  /health               → health check
"""
from __future__ import annotations

import json
import logging
import asyncio
from typing import AsyncGenerator

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from langchain_core.messages import HumanMessage

from src.api.schemas import ChatRequest, ChatResponse, IngestResponse
from src.api.middleware import verify_jwt, verify_admin
from src.agents.graph import agent_graph
from src.agents.memory import append_message, clear_session
from src.rag.chain import ask, clear_session as clear_chain_session
from src.config.settings import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()
router = APIRouter()


# ─────────────────────────────────────────────────
# POST /api/ai/chat  → Streaming SSE
# ─────────────────────────────────────────────────
@router.post("/api/ai/chat")
async def chat_stream(
    request: ChatRequest,
    user: dict = Depends(verify_jwt),
):
    """
    Streaming chat endpoint.
    Returns Server-Sent Events (SSE) with tokens as they are generated.
    Frontend reads via EventSource or fetch + ReadableStream.
    """
    user_id = str(user.get("id") or user.get("sub") or user.get("userId") or "")
    session_id = request.session_id
    message = request.message.strip()

    if not message:
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    # Persist user message
    append_message(session_id, "user", message)

    async def event_generator() -> AsyncGenerator[str, None]:
        full_answer = ""
        sources: list[dict] = []
        intent = "general"

        try:
            # Run LangGraph agent
            async for chunk in agent_graph.astream(
                input={
                    "messages": [HumanMessage(content=message)],
                    "user_id": user_id,
                    "session_id": session_id,
                    "intent": "",
                    "retrieved_context": "",
                    "final_answer": "",
                    "sources": [],
                },
                config={"configurable": {"thread_id": session_id}},
            ):
                # Emit intent when classified
                if "intent_classifier" in chunk:
                    intent = chunk["intent_classifier"].get("intent", "general")
                    yield f"data: {json.dumps({'type': 'intent', 'intent': intent})}\n\n"

                # Emit final answer (stream token by token)
                if "response_generator" in chunk:
                    answer = chunk["response_generator"].get("final_answer", "")
                    if answer and answer != full_answer:
                        # Emit only the new portion
                        new_part = answer[len(full_answer):]
                        full_answer = answer
                        for token in new_part:
                            yield f"data: {json.dumps({'type': 'token', 'token': token})}\n\n"
                            await asyncio.sleep(0)  # yield control for streaming

            # Persist assistant response
            if full_answer:
                append_message(session_id, "assistant", full_answer)

            # Done event
            yield f"data: {json.dumps({'type': 'done', 'session_id': session_id, 'intent': intent})}\n\n"

        except Exception as e:
            logger.error(f"[Chat] Stream error: {e}", exc_info=True)
            yield f"data: {json.dumps({'type': 'error', 'message': 'An error occurred. Please try again.'})}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",   # Important for nginx
        },
    )


# ─────────────────────────────────────────────────
# POST /api/ai/chat/sync  → Non-streaming JSON
# ─────────────────────────────────────────────────
@router.post("/api/ai/chat/sync", response_model=ChatResponse)
async def chat_sync(
    request: ChatRequest,
    user: dict = Depends(verify_jwt),
):
    """Non-streaming chat — useful for testing or simple clients."""
    user_id = str(user.get("id") or user.get("sub") or user.get("userId") or "")
    session_id = request.session_id
    message = request.message.strip()

    append_message(session_id, "user", message)

    result = await ask(session_id, message)

    append_message(session_id, "assistant", result["answer"])

    return ChatResponse(
        answer=result["answer"],
        session_id=session_id,
        sources=result.get("sources", []),
    )


# ─────────────────────────────────────────────────
# POST /api/ai/ingest  → Re-index all data sources
# ─────────────────────────────────────────────────
@router.post("/api/ai/ingest", response_model=IngestResponse)
async def trigger_ingestion(admin: dict = Depends(verify_admin)):
    """Trigger a full re-ingestion of all platform content into the vector store."""
    from src.ingestion.loaders import load_all_documents
    from src.ingestion.splitter import split_documents
    from src.ingestion.embedder import build_vector_store
    from src.rag.retriever import build_hybrid_retriever

    logger.info("[Ingest] Starting triggered ingestion …")

    raw_docs = load_all_documents()
    chunks = split_documents(raw_docs)
    build_vector_store(chunks)
    build_hybrid_retriever(all_docs=chunks)

    logger.info(f"[Ingest] Done — {len(raw_docs)} docs → {len(chunks)} chunks")
    return IngestResponse(
        status="success",
        documents_loaded=len(raw_docs),
        chunks_created=len(chunks),
    )


# ─────────────────────────────────────────────────
# DELETE /api/ai/session/{session_id}
# ─────────────────────────────────────────────────
@router.delete("/api/ai/session/{session_id}")
async def delete_session(
    session_id: str,
    user: dict = Depends(verify_jwt),
):
    """Clear conversation memory for a session."""
    clear_session(session_id)
    clear_chain_session(session_id)
    return {"status": "session cleared", "session_id": session_id}

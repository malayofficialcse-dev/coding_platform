# src/rag/chain.py
"""
Conversational RAG chain using LCEL (LangChain Expression Language).
Used by the /chat/sync endpoint (non-streaming fallback).

Replaces the deprecated ConversationalRetrievalChain with a modern
LCEL pipeline: condense_question | retriever | generate_with_context
"""
from __future__ import annotations

import logging
from langchain_openai import ChatOpenAI
from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables import RunnableLambda, RunnablePassthrough
from langchain_core.messages import HumanMessage, AIMessage

from src.config.settings import get_settings
from src.rag.prompts import RAG_PROMPT, CONDENSE_QUESTION_PROMPT
from src.rag.retriever import get_retriever

logger = logging.getLogger(__name__)
settings = get_settings()

# ── LLM singleton ──────────────────────────────────────────────────────────
_llm = ChatOpenAI(
    model=settings.effective_model,
    temperature=0.1,
    streaming=False,   # sync endpoint — no streaming needed
    openai_api_key=settings.openai_api_key,
    base_url=settings.effective_base_url,
)

_condense_llm = ChatOpenAI(
    model=settings.effective_model,
    temperature=0,
    streaming=False,
    openai_api_key=settings.openai_api_key,
    base_url=settings.effective_base_url,
)

# ── Per-session chat history cache ─────────────────────────────────────────
# Maps session_id → list of (HumanMessage, AIMessage) pairs
_session_histories: dict[str, list] = {}

MAX_HISTORY_TURNS = 10  # Keep last N turns to avoid token overflow


def _get_history(session_id: str) -> list:
    return _session_histories.get(session_id, [])


def _save_to_history(session_id: str, human_msg: str, ai_msg: str) -> None:
    if session_id not in _session_histories:
        _session_histories[session_id] = []
    history = _session_histories[session_id]
    history.append(HumanMessage(content=human_msg))
    history.append(AIMessage(content=ai_msg))
    # Trim to last MAX_HISTORY_TURNS turns (2 messages per turn)
    if len(history) > MAX_HISTORY_TURNS * 2:
        _session_histories[session_id] = history[-(MAX_HISTORY_TURNS * 2):]


def clear_session(session_id: str) -> None:
    """Remove a session's chat history."""
    _session_histories.pop(session_id, None)
    logger.info(f"[Chain] Cleared chain history for session: {session_id}")


async def ask(session_id: str, question: str) -> dict:
    """
    Run the conversational RAG chain for the given session and question.

    Pipeline:
      1. Condense: if there's chat history, rephrase the follow-up as a standalone question
      2. Retrieve: run hybrid retriever on the (possibly condensed) question
      3. Generate: pass retrieved context + history to LLM for final answer

    Returns: {"answer": str, "sources": list[dict]}
    """
    history = _get_history(session_id)

    # ── Step 1: Condense follow-up question ──────────────────────────────
    if history:
        condense_chain = CONDENSE_QUESTION_PROMPT | _condense_llm | StrOutputParser()
        standalone_question = await condense_chain.ainvoke({
            "question": question,
            "chat_history": history,
        })
        logger.debug(f"[Chain] Condensed: '{question}' → '{standalone_question}'")
    else:
        standalone_question = question

    # ── Step 2: Retrieve relevant documents ──────────────────────────────
    retriever = get_retriever()
    docs = retriever.invoke(standalone_question)

    if docs:
        context = "\n\n---\n\n".join(
            f"[{d.metadata.get('source', '?').upper()}] "
            f"{d.metadata.get('course_title', d.metadata.get('title', ''))}\n"
            f"{d.page_content}"
            for d in docs
        )
    else:
        context = "No relevant content found in the knowledge base for this query."

    # ── Step 3: Generate answer ───────────────────────────────────────────
    generate_chain = RAG_PROMPT | _llm | StrOutputParser()
    answer = await generate_chain.ainvoke({
        "context": context,
        "question": question,
    })

    # ── Step 4: Persist history ───────────────────────────────────────────
    _save_to_history(session_id, question, answer)

    # ── Step 5: Format sources ────────────────────────────────────────────
    sources = []
    for doc in docs:
        meta = doc.metadata.copy()
        meta["source"] = meta.get("source") or "knowledge_base"
        meta["preview"] = doc.page_content[:200]
        sources.append(meta)

    return {
        "answer": answer,
        "sources": sources,
    }

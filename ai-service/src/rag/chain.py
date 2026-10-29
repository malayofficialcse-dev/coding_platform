# src/rag/chain.py
"""
Conversational RAG chain using LangChain's ConversationalRetrievalChain.
Supports streaming, source tracking, and LangSmith tracing.
"""
from __future__ import annotations

import logging
from langchain_openai import ChatOpenAI
from langchain.chains import ConversationalRetrievalChain
from langchain.memory import ConversationBufferWindowMemory

from src.config.settings import get_settings
from src.rag.prompts import RAG_PROMPT, CONDENSE_QUESTION_PROMPT
from src.rag.retriever import get_retriever

logger = logging.getLogger(__name__)
settings = get_settings()

# ── LLM singleton ──────────────────────────────────────────────────────────
_llm = ChatOpenAI(
    model=settings.openai_model,
    temperature=0.1,
    streaming=True,
    openai_api_key=settings.openai_api_key,
)

# ── Per-session chain cache ────────────────────────────────────────────────
_chain_cache: dict[str, ConversationalRetrievalChain] = {}


def get_or_create_chain(session_id: str) -> ConversationalRetrievalChain:
    """
    Return (or lazily create) a ConversationalRetrievalChain
    for this session. Each session gets its own memory buffer.
    """
    if session_id in _chain_cache:
        return _chain_cache[session_id]

    memory = ConversationBufferWindowMemory(
        k=10,                       # Remember last 10 turns
        memory_key="chat_history",
        return_messages=True,
        output_key="answer",
    )

    chain = ConversationalRetrievalChain.from_llm(
        llm=_llm,
        retriever=get_retriever(),
        memory=memory,
        return_source_documents=True,
        verbose=False,
        combine_docs_chain_kwargs={"prompt": RAG_PROMPT},
        condense_question_prompt=CONDENSE_QUESTION_PROMPT,
        condense_question_llm=ChatOpenAI(
            model="gpt-4o-mini",
            temperature=0,
            openai_api_key=settings.openai_api_key,
        ),
    )

    _chain_cache[session_id] = chain
    logger.info(f"[Chain] Created new chain for session: {session_id}")
    return chain


def clear_session(session_id: str) -> None:
    """Remove a session's chain (clears conversation memory)."""
    _chain_cache.pop(session_id, None)


async def ask(session_id: str, question: str) -> dict:
    """
    Run the RAG chain for the given session and question.
    Returns: {"answer": str, "sources": list[dict]}
    """
    chain = get_or_create_chain(session_id)

    result = await chain.ainvoke({"question": question})

    # Extract source document metadata
    sources = []
    for doc in result.get("source_documents", []):
        meta = doc.metadata.copy()
        meta["preview"] = doc.page_content[:200]
        sources.append(meta)

    return {
        "answer": result.get("answer", ""),
        "sources": sources,
    }

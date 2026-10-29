# src/rag/retriever.py
"""
Hybrid retriever: dense semantic search (ChromaDB MMR) + sparse BM25.
The EnsembleRetriever combines both for best recall + precision.
"""
from __future__ import annotations

import logging
from langchain_core.documents import Document
from langchain.retrievers import EnsembleRetriever
from langchain_community.retrievers import BM25Retriever

from src.ingestion.embedder import get_vectorstore

logger = logging.getLogger(__name__)

# Cache
_hybrid_retriever: EnsembleRetriever | None = None
_bm25_docs: list[Document] = []


def build_hybrid_retriever(
    all_docs: list[Document] | None = None,
    k_dense: int = 6,
    k_sparse: int = 4,
    dense_weight: float = 0.7,
) -> EnsembleRetriever:
    """
    Build and cache the hybrid retriever.
    Call once at startup (or after re-ingestion) passing all_docs.
    Subsequent calls with no args return the cached instance.
    """
    global _hybrid_retriever, _bm25_docs

    if _hybrid_retriever is not None and all_docs is None:
        return _hybrid_retriever

    vectorstore = get_vectorstore()

    # ── Dense retriever (Chroma MMR) ───────────────────────────────────────
    dense_retriever = vectorstore.as_retriever(
        search_type="mmr",
        search_kwargs={
            "k": k_dense,
            "fetch_k": k_dense * 4,   # over-fetch then re-rank
            "lambda_mult": 0.7,        # diversity vs relevance balance
        },
    )

    # ── Sparse retriever (BM25) ────────────────────────────────────────────
    # Fall back gracefully if no docs available yet
    docs_for_bm25 = all_docs or _bm25_docs
    if docs_for_bm25:
        _bm25_docs = docs_for_bm25
        bm25_retriever = BM25Retriever.from_documents(docs_for_bm25, k=k_sparse)
    else:
        # Minimal stub — BM25 will return nothing but won't crash
        logger.warning("[Retriever] BM25 has no documents — using dense only")
        bm25_retriever = BM25Retriever.from_texts(["placeholder"], k=k_sparse)

    # ── Ensemble ───────────────────────────────────────────────────────────
    _hybrid_retriever = EnsembleRetriever(
        retrievers=[dense_retriever, bm25_retriever],
        weights=[dense_weight, 1.0 - dense_weight],
    )

    logger.info(
        f"[Retriever] Hybrid retriever ready "
        f"(dense {int(dense_weight*100)}% / BM25 {int((1-dense_weight)*100)}%)"
    )
    return _hybrid_retriever


def get_retriever() -> EnsembleRetriever:
    """Return cached retriever (must call build_hybrid_retriever first)."""
    if _hybrid_retriever is None:
        return build_hybrid_retriever()
    return _hybrid_retriever


def get_filtered_retriever(source_filter: str, k: int = 6):
    """
    Return a source-filtered dense-only retriever for targeted searches.
    e.g. source_filter='dsa_problem' → only DSA docs
    """
    vectorstore = get_vectorstore()
    return vectorstore.as_retriever(
        search_type="mmr",
        search_kwargs={
            "k": k,
            "fetch_k": k * 4,
            "filter": {"source": source_filter},
        },
    )

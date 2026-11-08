# src/rag/retriever.py
"""
Hybrid retriever: dense semantic search (Pinecone MMR / ChromaDB) + sparse BM25.
The EnsembleRetriever combines both for best recall + precision.

BM25 is seeded from the existing vector store at startup when no docs are passed.
For Pinecone (production), BM25 uses a placeholder until documents are explicitly loaded.
"""
from __future__ import annotations

import logging
from langchain_core.documents import Document

try:
    from langchain.retrievers import EnsembleRetriever
except ImportError:
    try:
        from langchain_classic.retrievers import EnsembleRetriever
    except ImportError:
        from langchain_community.retrievers import EnsembleRetriever

from langchain_community.retrievers import BM25Retriever

from src.ingestion.embedder import get_vectorstore
from src.config.settings import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

# Singleton cache
_hybrid_retriever: EnsembleRetriever | None = None
_bm25_docs: list[Document] = []


def _load_docs_from_store() -> list[Document]:
    """
    Fetch documents from VectorStore to seed BM25.
    - ChromaDB: fetches all stored docs directly.
    - Pinecone: returns empty (Pinecone doesn't support bulk fetch cheaply).
      BM25 will run in fallback placeholder mode and dense-only retrieval is used.
    """
    try:
        vs = get_vectorstore()
        # ChromaDB supports direct collection access
        if hasattr(vs, "_collection"):
            collection = vs._collection
            total = collection.count()
            if total == 0:
                return []
            result = collection.get(include=["documents", "metadatas"])
            docs = []
            for content, meta in zip(result["documents"], result["metadatas"]):
                docs.append(Document(page_content=content, metadata=meta or {}))
            logger.info(f"[Retriever] Loaded {len(docs)} docs from ChromaDB for BM25 seeding")
            return docs
        # Pinecone — no cheap bulk fetch, skip BM25 seeding
        logger.info("[Retriever] Pinecone active — BM25 running in dense-fallback mode (expected)")
    except Exception as e:
        logger.warning(f"[Retriever] Could not load docs for BM25: {e}")
    return []


def build_hybrid_retriever(
    all_docs: list[Document] | None = None,
    k_dense: int = 6,
    k_sparse: int = 4,
    dense_weight: float = 0.7,
) -> EnsembleRetriever:
    """
    Build and cache the hybrid retriever.

    - At startup: BM25 is seeded from vector store (ChromaDB) or runs in placeholder mode (Pinecone)
    - After re-ingestion: pass all_docs=new_chunks to rebuild BM25 with fresh data
    - Subsequent calls with no args: returns the cached instance
    """
    global _hybrid_retriever, _bm25_docs

    if _hybrid_retriever is not None and all_docs is None:
        return _hybrid_retriever

    vectorstore = get_vectorstore()

    # ── Dense retriever ───────────────────────────────────────────────────
    dense_retriever = vectorstore.as_retriever(
        search_type="mmr",
        search_kwargs={
            "k": k_dense,
            "fetch_k": k_dense * 4,   # over-fetch then re-rank for diversity
            "lambda_mult": 0.7,        # 0=max diversity, 1=max relevance
        },
    )

    # ── Sparse retriever (BM25) ────────────────────────────────────────────
    if all_docs is not None:
        # Fresh ingestion: use the newly ingested docs
        _bm25_docs = all_docs
    elif not _bm25_docs:
        # Startup: seed BM25 from existing collection (ChromaDB only)
        _bm25_docs = _load_docs_from_store()

    if _bm25_docs:
        bm25_retriever = BM25Retriever.from_documents(_bm25_docs, k=k_sparse)
    else:
        # Empty / Pinecone — BM25 runs in placeholder mode (dense retrieval carries the load)
        logger.warning("[Retriever] BM25 has no documents — using dense-only mode (normal for Pinecone)")
        bm25_retriever = BM25Retriever.from_texts(
            ["Code Campus is an AI-powered coding and learning platform."], k=k_sparse
        )

    # ── Ensemble ───────────────────────────────────────────────────────────
    _hybrid_retriever = EnsembleRetriever(
        retrievers=[dense_retriever, bm25_retriever],
        weights=[dense_weight, 1.0 - dense_weight],
    )

    doc_count = len(_bm25_docs)
    logger.info(
        f"[Retriever] Hybrid retriever ready — "
        f"{doc_count} BM25 docs | "
        f"dense {int(dense_weight*100)}% / BM25 {int((1-dense_weight)*100)}%"
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
    e.g. source_filter='dsa_problem' → only retrieves DSA problem docs
         source_filter='course'      → only retrieves course content docs
         source_filter='exam'        → only retrieves exam question docs
    """
    vectorstore = get_vectorstore()
    return vectorstore.as_retriever(
        search_type="mmr",
        search_kwargs={
            "k": k,
            "fetch_k": k * 4,
            "lambda_mult": 0.7,
            "filter": {"source": source_filter},
        },
    )


def invalidate_retriever() -> None:
    """Force rebuild on next call — call after re-ingestion."""
    global _hybrid_retriever, _bm25_docs
    _hybrid_retriever = None
    _bm25_docs = []
    logger.info("[Retriever] Cache invalidated — will rebuild on next request")

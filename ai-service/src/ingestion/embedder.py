# src/ingestion/embedder.py
"""
Builds and persists the ChromaDB vector store from LangChain Documents.
"""
from __future__ import annotations

import logging
from langchain_core.documents import Document
from langchain_openai import OpenAIEmbeddings
from langchain_chroma import Chroma

from src.config.settings import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

# ── Singleton embedding model ──────────────────────────────────────────────
embeddings = OpenAIEmbeddings(
    model=settings.openai_embedding_model,
    openai_api_key=settings.openai_api_key,
)

# ── Cached vectorstore instance ────────────────────────────────────────────
_vectorstore: Chroma | None = None


def get_vectorstore() -> Chroma:
    """Return (or lazily create) the ChromaDB vectorstore singleton."""
    global _vectorstore
    if _vectorstore is None:
        _vectorstore = Chroma(
            collection_name=settings.chroma_collection_name,
            embedding_function=embeddings,
            persist_directory=settings.chroma_persist_dir,
        )
        count = _vectorstore._collection.count()
        logger.info(
            f"[VectorStore] Loaded ChromaDB — "
            f"{count} embeddings in '{settings.chroma_collection_name}'"
        )
    return _vectorstore


def build_vector_store(documents: list[Document]) -> Chroma:
    """
    Embed and persist all documents into ChromaDB.
    Called during ingestion. Replaces any existing collection.
    """
    global _vectorstore

    logger.info(f"[Embedder] Embedding {len(documents)} documents …")

    # Drop existing collection and rebuild
    _vectorstore = Chroma.from_documents(
        documents=documents,
        embedding=embeddings,
        persist_directory=settings.chroma_persist_dir,
        collection_name=settings.chroma_collection_name,
    )

    count = _vectorstore._collection.count()
    logger.info(f"[Embedder] Done — {count} vectors stored in ChromaDB")
    return _vectorstore

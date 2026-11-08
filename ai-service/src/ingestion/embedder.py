# src/ingestion/embedder.py
"""
Builds and manages the Vector Store (Pinecone or ChromaDB) from LangChain Documents.
"""
from __future__ import annotations

import logging
from typing import Any
from langchain_core.documents import Document
from langchain_openai import OpenAIEmbeddings

from src.config.settings import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


def _get_embedding_function():
    if settings.is_groq or settings.openai_embedding_model == "fastembed":
        try:
            from langchain_community.embeddings.fastembed import FastEmbedEmbeddings
            logger.info("[Embedder] Using free local FastEmbed (BAAI/bge-small-en-v1.5, dim=384) ✓")
            return FastEmbedEmbeddings(model_name="BAAI/bge-small-en-v1.5")
        except Exception as e:
            logger.warning(f"[Embedder] FastEmbed not available ({e}), falling back to OpenAI")

    return OpenAIEmbeddings(
        model=settings.openai_embedding_model,
        openai_api_key=settings.openai_api_key,
    )


embeddings = _get_embedding_function()

# ── Cached vectorstore instance ────────────────────────────────────────────
_vectorstore: Any | None = None


def get_vectorstore():
    """Return (or lazily create) the VectorStore singleton (Pinecone or Chroma)."""
    global _vectorstore
    if _vectorstore is not None:
        return _vectorstore

    if settings.vector_store.lower() == "pinecone":
        try:
            from langchain_pinecone import PineconeVectorStore
            from pinecone import Pinecone

            api_key = settings.pinecone_api_key or None
            pc = Pinecone(api_key=api_key)
            index = pc.Index(settings.pinecone_index_name)

            _vectorstore = PineconeVectorStore(
                index=index,
                embedding=embeddings,
            )
            stats = index.describe_index_stats()
            total_vector_count = stats.get("total_vector_count", 0)
            logger.info(
                f"[VectorStore] Connected to Pinecone Index '{settings.pinecone_index_name}' "
                f"({total_vector_count} vectors, dim={stats.get('dimension')}) ✓"
            )
            return _vectorstore
        except Exception as e:
            logger.error(f"[VectorStore] Failed to connect to Pinecone: {e}. Falling back to ChromaDB.")

    # ChromaDB fallback
    from langchain_chroma import Chroma
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


def get_vector_count() -> int:
    """Return count of vectors in the current store."""
    try:
        vs = get_vectorstore()
        if settings.vector_store.lower() == "pinecone" and hasattr(vs, "_index"):
            stats = vs._index.describe_index_stats()
            return stats.get("total_vector_count", 0)
        elif hasattr(vs, "_collection"):
            return vs._collection.count()
    except Exception as e:
        logger.warning(f"[VectorStore] Could not get vector count: {e}")
    return 0


def build_vector_store(documents: list[Document]):
    """
    Embed and upload all documents into the vector store (Pinecone or ChromaDB).
    """
    global _vectorstore

    logger.info(f"[Embedder] Embedding and storing {len(documents)} documents …")

    if settings.vector_store.lower() == "pinecone":
        try:
            from langchain_pinecone import PineconeVectorStore
            from pinecone import Pinecone

            api_key = settings.pinecone_api_key or None
            pc = Pinecone(api_key=api_key)
            index = pc.Index(settings.pinecone_index_name)

            # Upload documents in batches
            _vectorstore = PineconeVectorStore.from_documents(
                documents=documents,
                embedding=embeddings,
                index_name=settings.pinecone_index_name,
            )
            stats = index.describe_index_stats()
            count = stats.get("total_vector_count", len(documents))
            logger.info(f"[Embedder] Done — {count} vectors stored in Pinecone Index '{settings.pinecone_index_name}' ✓")
            return _vectorstore
        except Exception as e:
            logger.error(f"[Embedder] Pinecone ingestion failed: {e}. Falling back to ChromaDB.")

    # ChromaDB fallback
    from langchain_chroma import Chroma
    _vectorstore = Chroma.from_documents(
        documents=documents,
        embedding=embeddings,
        persist_directory=settings.chroma_persist_dir,
        collection_name=settings.chroma_collection_name,
    )
    count = _vectorstore._collection.count()
    logger.info(f"[Embedder] Done — {count} vectors stored in ChromaDB")
    return _vectorstore

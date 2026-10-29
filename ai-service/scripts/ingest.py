#!/usr/bin/env python3
"""
scripts/ingest.py — One-time ingestion script.
Run this BEFORE starting the AI service for the first time,
or whenever course content is updated.

Usage:
    cd ai-service
    python scripts/ingest.py
"""
import sys
import os
import logging

# Ensure project root is in path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger(__name__)


def main():
    from src.ingestion.loaders import load_all_documents
    from src.ingestion.splitter import split_documents
    from src.ingestion.embedder import build_vector_store
    from src.rag.retriever import build_hybrid_retriever

    logger.info("=" * 50)
    logger.info("  Code Campus — RAG Ingestion Pipeline")
    logger.info("=" * 50)

    # Step 1: Load from all sources
    logger.info("\n[Step 1] Loading documents from all sources …")
    raw_docs = load_all_documents()
    logger.info(f"  → Loaded {len(raw_docs)} raw documents")

    if not raw_docs:
        logger.error("No documents loaded! Check your DB connections and .env file.")
        sys.exit(1)

    # Step 2: Split into chunks
    logger.info("\n[Step 2] Splitting documents into chunks …")
    chunks = split_documents(raw_docs)
    logger.info(f"  → Created {len(chunks)} chunks")

    # Step 3: Embed and store
    logger.info("\n[Step 3] Embedding and storing in ChromaDB …")
    vs = build_vector_store(chunks)
    logger.info(f"  → {vs._collection.count()} vectors stored")

    # Step 4: Build retriever
    logger.info("\n[Step 4] Building hybrid retriever …")
    build_hybrid_retriever(all_docs=chunks)

    logger.info("\n" + "=" * 50)
    logger.info("  ✅ Ingestion complete! Start the AI service now.")
    logger.info("=" * 50)


if __name__ == "__main__":
    main()

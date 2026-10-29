# src/ingestion/splitter.py
"""
Text splitting strategies per content type.
"""
from __future__ import annotations

import logging
from langchain_core.documents import Document
from langchain_text_splitters import RecursiveCharacterTextSplitter

logger = logging.getLogger(__name__)

# ── Splitters ──────────────────────────────────────────────────────────────

# Course content: rich markdown-style text
course_splitter = RecursiveCharacterTextSplitter(
    chunk_size=1000,
    chunk_overlap=200,
    separators=["\n\n", "\n", ". ", " ", ""],
    length_function=len,
)

# DSA problems: keep editorial blocks together (larger chunks)
problem_splitter = RecursiveCharacterTextSplitter(
    chunk_size=2000,
    chunk_overlap=400,
    separators=["\n\n", "\n", ". "],
    length_function=len,
)

# Exam MCQs: each question is self-contained (small chunks)
exam_splitter = RecursiveCharacterTextSplitter(
    chunk_size=600,
    chunk_overlap=50,
    separators=["\n\n", "\n"],
    length_function=len,
)


def split_documents(documents: list[Document]) -> list[Document]:
    """
    Route each document to the correct splitter based on source metadata.
    Returns the full list of split chunks.
    """
    course_docs = [d for d in documents if d.metadata.get("source") == "course"]
    problem_docs = [d for d in documents if d.metadata.get("source") == "dsa_problem"]
    exam_docs    = [d for d in documents if d.metadata.get("source") == "exam"]

    split_courses  = course_splitter.split_documents(course_docs)
    split_problems = problem_splitter.split_documents(problem_docs)
    split_exams    = exam_splitter.split_documents(exam_docs)

    all_chunks = split_courses + split_problems + split_exams

    logger.info(
        f"[Splitter] Chunks — "
        f"courses: {len(split_courses)}, "
        f"problems: {len(split_problems)}, "
        f"exams: {len(split_exams)} "
        f"| total: {len(all_chunks)}"
    )
    return all_chunks

# src/ingestion/loaders.py
"""
Document loaders for all Code Campus data sources.
Pulls course content, DSA problems, and exam questions
and converts them into LangChain Document objects.
"""
from __future__ import annotations

import logging
from typing import Optional

from pymongo import MongoClient
from sqlalchemy import create_engine, text
from langchain_core.documents import Document

from src.config.settings import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


# ─────────────────────────────────────────────────
# Helper
# ─────────────────────────────────────────────────
def _format_code_blocks(code_blocks: list[dict]) -> str:
    if not code_blocks:
        return ""
    parts = []
    for cb in code_blocks:
        lang = cb.get("language", "")
        code = cb.get("code", "").strip()
        if code:
            parts.append(f"```{lang}\n{code}\n```")
    return "\n\n".join(parts)


# ─────────────────────────────────────────────────
# Course Loader  →  MongoDB course_db
# ─────────────────────────────────────────────────
class CourseLoader:
    """
    Loads every subtopic from every course in MongoDB course_db.
    Each subtopic becomes one Document with rich metadata.
    """

    def __init__(self, mongo_uri: Optional[str] = None):
        self.mongo_uri = mongo_uri or settings.course_mongo_uri

    def load(self) -> list[Document]:
        docs: list[Document] = []
        try:
            client = MongoClient(self.mongo_uri, serverSelectionTimeoutMS=5000)
            db = client.get_database()          # uses DB from URI
            courses = list(db.courses.find({}))
            logger.info(f"[CourseLoader] Found {len(courses)} courses")

            for course in courses:
                course_title = course.get("title", "Untitled Course")
                course_id = str(course.get("_id", ""))

                for topic in course.get("topics", []):
                    topic_title = topic.get("title", "")

                    for subtopic in topic.get("subtopics", []):
                        subtopic_title = subtopic.get("title", "")
                        body = subtopic.get("body", "").strip()
                        code_section = _format_code_blocks(
                            subtopic.get("codeBlocks", [])
                        )

                        content = (
                            f"Course: {course_title}\n"
                            f"Topic: {topic_title}\n"
                            f"Subtopic: {subtopic_title}\n\n"
                            f"{body}"
                        )
                        if code_section:
                            content += f"\n\nCode Examples:\n{code_section}"

                        docs.append(
                            Document(
                                page_content=content.strip(),
                                metadata={
                                    "source": "course",
                                    "course_id": course_id,
                                    "course_title": course_title,
                                    "topic": topic_title,
                                    "subtopic": subtopic_title,
                                },
                            )
                        )

            client.close()
            logger.info(f"[CourseLoader] Loaded {len(docs)} documents")
        except Exception as e:
            logger.error(f"[CourseLoader] Failed: {e}")
        return docs


# ─────────────────────────────────────────────────
# Coding Problem Loader  →  MongoDB coding_problems_db
# ─────────────────────────────────────────────────
class CodingProblemLoader:
    """
    Loads DSA problems from MongoDB coding_problems_db.
    Each problem is split into two documents:
      - problem statement (title + description + constraints + hints)
      - editorial (solution explanation)
    """

    def __init__(self, mongo_uri: Optional[str] = None):
        self.mongo_uri = mongo_uri or settings.coding_mongo_uri

    def load(self) -> list[Document]:
        docs: list[Document] = []
        try:
            client = MongoClient(self.mongo_uri, serverSelectionTimeoutMS=5000)
            db = client.get_database()
            problems = list(db.codingproblems.find({}))
            logger.info(f"[CodingLoader] Found {len(problems)} problems")

            for prob in problems:
                title = prob.get("title", "")
                description = prob.get("description", "").strip()
                difficulty = prob.get("difficulty", "Easy")
                dsa_topic = prob.get("dsaTopic", "General")
                tags = prob.get("tags", [])
                constraints = prob.get("constraints", "").strip()
                hints = prob.get("hints", [])
                editorial = prob.get("editorial", "").strip()
                time_limit = prob.get("timeLimit", "2.0s")
                memory_limit = prob.get("memoryLimit", "256 MB")
                prob_id = str(prob.get("_id", ""))

                base_meta = {
                    "source": "dsa_problem",
                    "problem_id": prob_id,
                    "title": title,
                    "difficulty": difficulty,
                    "dsa_topic": dsa_topic,
                    "tags": ", ".join(tags),
                }

                # ── Document 1: Problem statement ──
                hints_text = "\n".join(
                    f"Hint {i+1}: {h}" for i, h in enumerate(hints)
                )
                problem_content = (
                    f"DSA Problem: {title}\n"
                    f"Difficulty: {difficulty} | Topic: {dsa_topic} | Tags: {', '.join(tags)}\n"
                    f"Time Limit: {time_limit} | Memory Limit: {memory_limit}\n\n"
                    f"Description:\n{description}\n\n"
                    f"Constraints:\n{constraints}\n\n"
                    f"Hints:\n{hints_text}"
                )
                docs.append(
                    Document(
                        page_content=problem_content.strip(),
                        metadata={**base_meta, "doc_type": "problem_statement"},
                    )
                )

                # ── Document 2: Editorial ──
                if editorial:
                    editorial_content = (
                        f"Editorial for: {title} (Difficulty: {difficulty})\n\n"
                        f"{editorial}"
                    )
                    docs.append(
                        Document(
                            page_content=editorial_content.strip(),
                            metadata={**base_meta, "doc_type": "editorial"},
                        )
                    )

            client.close()
            logger.info(f"[CodingLoader] Loaded {len(docs)} documents")
        except Exception as e:
            logger.error(f"[CodingLoader] Failed: {e}")
        return docs


# ─────────────────────────────────────────────────
# Exam Loader  →  PostgreSQL exam_db
# ─────────────────────────────────────────────────
class ExamLoader:
    """
    Loads MCQ exam questions from PostgreSQL exam_db.
    questions is a JSONB column: list of {question, options, answer, explanation}.
    Each exam becomes one document per question.
    """

    def __init__(self, db_url: Optional[str] = None):
        self.db_url = db_url or settings.exam_database_url

    def load(self) -> list[Document]:
        docs: list[Document] = []
        if not self.db_url:
            logger.warning("[ExamLoader] No EXAM_DATABASE_URL set — skipping")
            return docs
        try:
            engine = create_engine(self.db_url)
            with engine.connect() as conn:
                rows = conn.execute(
                    text('SELECT id, title, description, questions FROM exams')
                ).fetchall()
            logger.info(f"[ExamLoader] Found {len(rows)} exams")

            for row in rows:
                exam_id, exam_title, exam_desc, questions = row
                questions = questions or []

                for i, q in enumerate(questions):
                    question_text = q.get("question", "")
                    options = q.get("options", [])
                    answer = q.get("answer", "")
                    explanation = q.get("explanation", "")

                    options_text = "\n".join(
                        f"  {chr(65+j)}) {opt}" for j, opt in enumerate(options)
                    )
                    content = (
                        f"Exam: {exam_title}\n"
                        f"Question {i+1}: {question_text}\n\n"
                        f"Options:\n{options_text}\n\n"
                        f"Correct Answer: {answer}"
                    )
                    if explanation:
                        content += f"\n\nExplanation: {explanation}"

                    docs.append(
                        Document(
                            page_content=content.strip(),
                            metadata={
                                "source": "exam",
                                "exam_id": str(exam_id),
                                "exam_title": exam_title,
                                "question_index": i,
                            },
                        )
                    )

            logger.info(f"[ExamLoader] Loaded {len(docs)} documents")
        except Exception as e:
            logger.error(f"[ExamLoader] Failed: {e}")
        return docs


# ─────────────────────────────────────────────────
# Aggregate: load all sources
# ─────────────────────────────────────────────────
def load_all_documents() -> list[Document]:
    """Load documents from all data sources."""
    all_docs: list[Document] = []

    logger.info("=== Starting document ingestion from all sources ===")
    all_docs.extend(CourseLoader().load())
    all_docs.extend(CodingProblemLoader().load())
    all_docs.extend(ExamLoader().load())
    logger.info(f"=== Total documents loaded: {len(all_docs)} ===")

    return all_docs

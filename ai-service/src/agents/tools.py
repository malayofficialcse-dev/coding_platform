# src/agents/tools.py
"""
LangChain tool functions used by the LangGraph agent.

Tools:
  1. search_course_content     → filtered dense retrieval on course docs
  2. search_dsa_problems       → filtered dense retrieval on DSA problem docs
  3. get_user_progress         → fetches real user data from internal services (uses JWT)
  4. explain_code              → passes code to LLM for debug/explain
  5. search_exam_questions     → filtered dense retrieval on exam MCQ docs
  6. recommend_next_topic      → hybrid retrieval for next steps recommendation
"""
from __future__ import annotations

import logging
import httpx
from langchain_core.tools import tool

from src.rag.retriever import get_retriever, get_filtered_retriever
from src.config.settings import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

# ── Thread-local token store ───────────────────────────────────────────────
# The graph sets this before running tools so tools can forward the user JWT
_current_user_token: str = ""
_current_user_id:    str = ""


def set_request_context(user_id: str, token: str) -> None:
    """Called by the route handler before running the graph."""
    global _current_user_token, _current_user_id
    _current_user_token = token or ""
    _current_user_id    = user_id or ""


def get_request_context() -> tuple[str, str]:
    return _current_user_id, _current_user_token


# ── Helper: format retrieved docs ─────────────────────────────────────────
def _format_docs(docs) -> str:
    if not docs:
        return "No relevant content found."
    return "\n\n---\n\n".join(
        f"[{d.metadata.get('source', '?').upper()}] "
        f"{d.metadata.get('course_title', d.metadata.get('title', ''))}\n"
        f"{d.page_content}"
        for d in docs
    )


# ─────────────────────────────────────────────────
# Tool 1: Search Course Content
# ─────────────────────────────────────────────────
@tool
def search_course_content(query: str) -> str:
    """
    Search course materials including DevOps, Data Analysis,
    Web Development topics, subtopics, and code examples.
    Use this for course-related questions.
    """
    retriever = get_filtered_retriever(source_filter="course", k=6)
    docs = retriever.invoke(query)
    return _format_docs(docs)


# ─────────────────────────────────────────────────
# Tool 2: Search DSA Problems
# ─────────────────────────────────────────────────
@tool
def search_dsa_problems(query: str) -> str:
    """
    Find DSA problems, hints, constraints, and editorial explanations.
    Use this for algorithm, data structure, or coding problem questions.
    """
    retriever = get_filtered_retriever(source_filter="dsa_problem", k=6)
    docs = retriever.invoke(query)
    return _format_docs(docs)


# ─────────────────────────────────────────────────
# Tool 3: Get User Progress (fetches real live data)
# ─────────────────────────────────────────────────
@tool
def get_user_progress(user_id: str) -> str:
    """
    Fetch the user's complete learning progress: enrolled courses with progress %,
    solved DSA problems count by difficulty, exam scores, and completion status.
    Use for personalized recommendations and progress-related questions.
    """
    import asyncio
    from src.agents.profile_fetcher import build_user_context, format_user_context_for_prompt

    uid, token = get_request_context()
    if not uid:
        uid = user_id
    if not token:
        return "User is not authenticated. Ask them to log in for personalized progress data."

    try:
        # Run async fetch synchronously (we're inside a sync tool)
        loop = asyncio.new_event_loop()
        ctx = loop.run_until_complete(build_user_context(uid, token))
        loop.close()
        return format_user_context_for_prompt(ctx)
    except Exception as e:
        logger.error(f"[Tool:get_user_progress] {e}")
        return "Unable to fetch user progress at this time. Please try again."


# ─────────────────────────────────────────────────
# Tool 4: Explain / Debug Code
# ─────────────────────────────────────────────────
@tool
def explain_code(code_snippet: str) -> str:
    """
    Explain what a code snippet does, identify bugs, or suggest improvements.
    Pass the raw code as input. The LLM will then explain and debug it.
    """
    return f"[Code to analyze]\n```\n{code_snippet}\n```"


# ─────────────────────────────────────────────────
# Tool 5: Search Exam Questions
# ─────────────────────────────────────────────────
@tool
def search_exam_questions(query: str) -> str:
    """
    Find MCQ practice questions from exams on Computer Networks,
    Operating Systems, DSA, Web Dev, SQL, Python, and more.
    """
    retriever = get_filtered_retriever(source_filter="exam", k=5)
    docs = retriever.invoke(query)
    return _format_docs(docs)


# ─────────────────────────────────────────────────
# ─────────────────────────────────────────────────
# Tool 6: Recommend Next Topic
# ─────────────────────────────────────────────────
@tool
def recommend_next_topic(user_context: str) -> str:
    """
    Recommend the next topic or problem to study based on user progress.
    Pass user context (enrolled courses, solved problems count) as input.
    """
    query = f"beginner next steps for: {user_context}"
    retriever = get_retriever()
    docs = retriever.invoke(query)
    return _format_docs(docs)


# ─────────────────────────────────────────────────
# Tool 7: Get Platform & Database Statistics
# ─────────────────────────────────────────────────
@tool
def get_platform_stats(query: str = "") -> str:
    """
    Get real-time platform statistics from Code Campus databases:
    Total registered users (breakdown by students, mentors, admins, super_admins, colleges),
    total courses available, total exams and attempts, total coding problems
    (by difficulty: Easy, Medium, Hard), total submissions, enrollments, and community posts.
    Use whenever the user asks about the site statistics, total users, database data, platform metrics, or site overview.
    """
    try:
        from src.database.db_manager import get_platform_statistics, format_platform_stats_for_prompt
        stats = get_platform_statistics()
        return format_platform_stats_for_prompt(stats)
    except Exception as e:
        logger.error(f"[Tool:get_platform_stats] {e}")
        return "Unable to query platform database statistics at this time."


# ── Export list ───────────────────────────────────────────────────────────
ALL_TOOLS = [
    search_course_content,
    search_dsa_problems,
    get_user_progress,
    explain_code,
    search_exam_questions,
    recommend_next_topic,
    get_platform_stats,
]

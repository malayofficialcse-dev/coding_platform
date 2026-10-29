# src/agents/tools.py
"""
LangChain tool functions used by the LangGraph agent.
Each tool calls either the vector store or an internal microservice.
"""
from __future__ import annotations

import logging
import httpx
from langchain_core.tools import tool

from src.rag.retriever import get_retriever, get_filtered_retriever
from src.config.settings import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


# ── Helper: format retrieved docs ─────────────────────────────────────────
def _format_docs(docs) -> str:
    if not docs:
        return "No relevant content found."
    return "\n\n---\n\n".join(
        f"[{d.metadata.get('source','?').upper()}] "
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
# Tool 3: Get User Progress
# ─────────────────────────────────────────────────
@tool
def get_user_progress(user_id: str) -> str:
    """
    Fetch the user's learning progress: enrolled courses, solved problems,
    exam scores, and completed lessons. Use for personalized recommendations.
    """
    try:
        headers = {
            "x-internal-token": settings.internal_service_token,
        }
        with httpx.Client(timeout=5.0) as client:
            # Get user profile
            r = client.get(
                f"{settings.user_service_url}/api/users/{user_id}",
                headers=headers,
            )
            if r.status_code != 200:
                return f"Could not fetch user data (status {r.status_code})"

            user = r.json().get("user", {})
            username = user.get("username", "the user")

            return (
                f"User: {username}\n"
                f"Role: {user.get('role', 'student')}\n"
                f"Joined: {user.get('createdAt', 'N/A')}"
            )
    except Exception as e:
        logger.error(f"[Tool:get_user_progress] {e}")
        return "Unable to fetch user progress at this time."


# ─────────────────────────────────────────────────
# Tool 4: Explain / Debug Code
# ─────────────────────────────────────────────────
@tool
def explain_code(code_snippet: str) -> str:
    """
    Explain what a code snippet does, identify bugs, or suggest improvements.
    Pass the raw code as input. Returns a detailed explanation.
    """
    # This tool is handled directly by the LLM — the agent routes here
    # and the response_generator node applies the code-specific prompt.
    return f"[Code to explain]\n```\n{code_snippet}\n```"


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
# Tool 6: Recommend Next Topic
# ─────────────────────────────────────────────────
@tool
def recommend_next_topic(user_context: str) -> str:
    """
    Recommend the next topic or problem to study based on user progress.
    Pass user context (enrolled courses, solved problems count) as input.
    Uses the knowledge base to suggest relevant next steps.
    """
    query = f"beginner next steps for: {user_context}"
    retriever = get_retriever()
    docs = retriever.invoke(query)
    return _format_docs(docs)


# ── Export list ───────────────────────────────────────────────────────────
ALL_TOOLS = [
    search_course_content,
    search_dsa_problems,
    get_user_progress,
    explain_code,
    search_exam_questions,
    recommend_next_topic,
]

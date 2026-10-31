# src/agents/graph.py
"""
LangGraph agent — intent classification + tool routing + response generation.

Graph flow:
  [START] → intent_classifier → (route by intent) → [tool node] → response_generator → [END]

The graph is compiled once as a singleton (agent_graph) and reused for all requests.
True token streaming is done via astream_events() in routes.py.
"""
from __future__ import annotations

import logging
import operator
from typing import TypedDict, Annotated, Literal

from langchain_core.messages import BaseMessage, HumanMessage, AIMessage
from langchain_openai import ChatOpenAI
from langgraph.graph import StateGraph, END

from src.config.settings import get_settings
from src.agents.tools import (
    search_course_content,
    search_dsa_problems,
    search_exam_questions,
    get_user_progress,
    explain_code,
    recommend_next_topic,
    set_request_context,
)
from src.rag.prompts import INTENT_PROMPT

logger = logging.getLogger(__name__)
settings = get_settings()

# ── LLMs ──────────────────────────────────────────────────────────────────
# Main LLM — used for response generation (streaming enabled)
_llm = ChatOpenAI(
    model=settings.effective_model,
    temperature=0.1,
    streaming=True,
    openai_api_key=settings.openai_api_key,
    base_url=settings.effective_base_url,
)

# Intent classifier LLM — deterministic (temp=0), no streaming needed
_intent_llm = ChatOpenAI(
    model=settings.effective_model,
    temperature=0,
    streaming=False,
    openai_api_key=settings.openai_api_key,
    base_url=settings.effective_base_url,
)


# ── Agent State ───────────────────────────────────────────────────────────
class AgentState(TypedDict):
    messages: Annotated[list[BaseMessage], operator.add]
    user_id: str
    session_id: str
    user_token: str          # User's JWT token — forwarded to internal services
    intent: str
    retrieved_context: str
    final_answer: str
    sources: list[dict]


# ── Node 1: Intent Classifier ─────────────────────────────────────────────
async def classify_intent(state: AgentState) -> dict:
    """Classify user message into one of 7 intents using heuristics + LLM."""
    last_msg = state["messages"][-1].content if state["messages"] else ""
    msg_lower = last_msg.lower().strip()

    # Set request context so tools can access the user's JWT token
    set_request_context(
        user_id=state.get("user_id", ""),
        token=state.get("user_token", ""),
    )

    # ── Fast Keyword Heuristics for Instant High-Confidence Matches ─────────
    if any(k in msg_lower for k in [
        "how many user", "how many student", "total user", "count of user",
        "site stat", "platform stat", "database stat", "database data",
        "who is on this site", "users on the site", "users on this site",
        "how many course", "how many exam", "how many problem"
    ]):
        intent = "platform_stats"
    elif any(k in msg_lower for k in [
        "tell me about myself", "tell me about my self", "who am i",
        "my profile", "my account", "my status", "what is my role",
        "my progress", "my learning"
    ]):
        intent = "user_progress"
    else:
        chain = INTENT_PROMPT | _intent_llm
        result = await chain.ainvoke({"message": last_msg})
        intent = result.content.strip().lower()

    valid_intents = {
        "course_question", "dsa_help", "debug_code",
        "user_progress", "exam_help", "platform_stats", "general"
    }
    if intent not in valid_intents:
        intent = "general"

    logger.info(f"[Graph] Intent: '{intent}' for session '{state['session_id']}'")
    return {"intent": intent}


# ── Node 2: Domain-Specific RAG Nodes ────────────────────────────────────
async def course_rag_node(state: AgentState) -> dict:
    """Retrieve course content for course-related questions."""
    query = state["messages"][-1].content
    context = await search_course_content.ainvoke({"query": query})
    return {"retrieved_context": context, "sources": _extract_sources(context, "course")}


async def dsa_rag_node(state: AgentState) -> dict:
    """Retrieve DSA problems, hints, and editorials, personalized with student's coding profile."""
    query = state["messages"][-1].content
    context = await search_dsa_problems.ainvoke({"query": query})
    token = state.get("user_token", "")
    if token:
        try:
            from src.agents.profile_fetcher import fetch_coding_submissions
            coding_data = await fetch_coding_submissions(token)
            if coding_data:
                total = coding_data.get("total_solved", 0)
                diff = coding_data.get("difficulty_breakdown", {})
                topics = coding_data.get("topics_done", [])
                solved = coding_data.get("solved_problems", [])
                solved_titles = [p.get("title", "") for p in solved[:8] if p.get("title")]
                profile_summary = [
                    f"• Problems Solved: {total}",
                    f"• Difficulty Breakdown: {diff}",
                    f"• Topics Practiced: {', '.join(topics) if topics else 'None yet'}",
                ]
                if solved_titles:
                    profile_summary.append(f"• Recently Solved: {', '.join(solved_titles)}")
                context = (
                    f"## Student's Personal Coding Profile\n"
                    + "\n".join(profile_summary)
                    + "\n\n## Retrieved DSA Problems & Editorials\n"
                    + context
                )
        except Exception as e:
            logger.warning(f"[Graph:dsa_rag_node] Failed to fetch coding profile: {e}")
    return {"retrieved_context": context, "sources": _extract_sources(context, "dsa_problem")}


async def code_debug_node(state: AgentState) -> dict:
    """Handle code debugging and explanation requests."""
    query = state["messages"][-1].content
    context = await explain_code.ainvoke({"code_snippet": query})
    return {"retrieved_context": context, "sources": []}


async def progress_node(state: AgentState) -> dict:
    """Fetch user's learning progress from user-service."""
    context = await get_user_progress.ainvoke({"user_id": state["user_id"]})
    return {"retrieved_context": context, "sources": []}


async def exam_rag_node(state: AgentState) -> dict:
    """Retrieve exam MCQ questions and explanations, personalized with student's past attempts."""
    query = state["messages"][-1].content
    context = await search_exam_questions.ainvoke({"query": query})
    token = state.get("user_token", "")
    if token:
        try:
            from src.agents.profile_fetcher import fetch_exam_attempts, fetch_enrollments
            attempts = await fetch_exam_attempts(token)
            enrollments = await fetch_enrollments(token)
            profile_lines = []
            if enrollments:
                profile_lines.append(
                    "• Enrolled Courses: " + ", ".join(e["course_title"] for e in enrollments)
                )
            if attempts:
                profile_lines.append(f"• Past Exam Attempts ({len(attempts)}):")
                for a in attempts[:4]:
                    status_str = "Passed" if a.get("passed") else "Needs Improvement"
                    profile_lines.append(
                        f"  - {a['exam_title']}: score {a['score']}/{a['total']} ({a['percentage']}%) [{status_str}]"
                    )
            if profile_lines:
                context = (
                    f"## Student's Personal Exam & Academic History\n"
                    + "\n".join(profile_lines)
                    + "\n\n## Retrieved Exam Questions & Practice Material\n"
                    + context
                )
        except Exception as e:
            logger.warning(f"[Graph:exam_rag_node] Failed to fetch exam profile: {e}")
    return {"retrieved_context": context, "sources": _extract_sources(context, "exam")}


async def platform_stats_node(state: AgentState) -> dict:
    """Retrieve live real-time statistics from all platform databases."""
    from src.database.db_manager import get_platform_statistics, format_platform_stats_for_prompt
    stats = get_platform_statistics()
    context = format_platform_stats_for_prompt(stats)
    return {
        "retrieved_context": context,
        "sources": [{"source": "database_stats", "preview": "Live Code Campus database metrics"}],
    }


async def general_rag_node(state: AgentState) -> dict:
    """Fallback - hybrid search across all knowledge base sources with database awareness."""
    from src.rag.retriever import get_retriever
    from src.database.db_manager import get_platform_statistics, format_platform_stats_for_prompt
    query = state["messages"][-1].content
    q_lower = query.lower()

    # If the general query asks about platform, database, or site metrics, inject live stats
    db_context = ""
    if any(k in q_lower for k in ["user", "users", "site", "platform", "database", "stats", "count", "student", "mentor", "admin"]):
        stats = get_platform_statistics()
        db_context = format_platform_stats_for_prompt(stats) + "\n\n"

    retriever = get_retriever()
    docs = retriever.invoke(query)
    doc_context = "\n\n---\n\n".join(d.page_content for d in docs) if docs else ""
    context = (db_context + doc_context).strip()

    sources = []
    if db_context:
        sources.append({"source": "database_stats", "preview": "Live Code Campus database metrics"})
    sources.extend([
        {
            "source": d.metadata.get("source", "knowledge_base"),
            "title": d.metadata.get("title", d.metadata.get("course_title", "")),
            "preview": d.page_content[:200],
        }
        for d in docs
    ])
    return {"retrieved_context": context, "sources": sources}


def _extract_sources(context: str, source_type: str) -> list[dict]:
    """Extract basic source metadata from formatted context string."""
    if not context or context == "No relevant content found.":
        return []
    return [{"source": source_type, "preview": context[:200]}]


# ── Node 3: Response Generator ────────────────────────────────────────────
async def generate_response(state: AgentState) -> dict:
    """
    Generate the final answer using the LLM + retrieved context.
    Uses a structured system prompt with strict anti-hallucination rules.
    """
    question = state["messages"][-1].content
    context = state.get("retrieved_context", "")
    intent = state.get("intent", "general")

    # Build intent-specific guidance
    intent_guidance = {
        "platform_stats": (
            "## INTENT: Platform Statistics & Database Data\n"
            "- Answer directly using the exact numbers from the database statistics in the context.\n"
            "- Explicitly state the exact registered user count (e.g. 22 users), the role breakdown (Super Admin: 1, Admin: 1, Mentor: 1, Student: 19), courses (2 courses), exams (29 exams), and coding problems (170 problems).\n"
            "- Present the data clearly with bullet points."
        ),
        "user_progress": (
            "## INTENT: User Profile & Learning Status\n"
            "- If the user is Super Admin or Admin: clearly state their administrator role and full system permissions across courses, exams, coding problems, and users. Summarize the platform database overview.\n"
            "- If the user is a student: summarize their enrolled courses, exam attempts, and coding progress clearly.\n"
            "- Be respectful, encouraging, and provide tailored next steps."
        ),
        "dsa_help": (
            "## INTENT: DSA & Coding Help\n"
            "- If the student's coding profile is available in the context, tailor your answer and recommendations directly to their skill level and practice history.\n"
            "- Acknowledge problems they have already solved, and suggest next problems/topics suited to their level.\n"
            "- Give algorithmic intuition, hints, and time/space complexity first before full code unless they explicitly ask for the full solution."
        ),
        "debug_code": (
            "## INTENT: Code Debug\n"
            "Identify the exact bug(s), explain why they're wrong, "
            "then provide the corrected version with explanation."
        ),
        "exam_help": (
            "## INTENT: Exam Help & Assessment\n"
            "- If the student's past exam attempts are available, personalize your answer to reinforce areas where they struggled.\n"
            "- If the student asks for practice questions or to test them, generate relevant MCQs matching their enrolled courses and target topic.\n"
            "- For questions, state the correct answer clearly, explain why it is correct, and explain why other options are wrong."
        ),
        "course_question": (
            "## INTENT: Course Content\n"
            "Reference the specific course, topic, and subtopic from context."
        ),
    }.get(intent, "")

    system_msg = (
        "You are **CodeBot** — the official AI tutor for **Code Campus**.\n\n"
        f"{intent_guidance}\n\n"
        "## Retrieved Knowledge\n"
        f"{context if context else 'No specific context retrieved for this query.'}\n\n"
        "## Rules\n"
        "1. Answer ONLY from the retrieved knowledge above — do NOT hallucinate facts.\n"
        "2. If retrieved knowledge doesn't cover the question, say so honestly and suggest alternatives.\n"
        "3. Use markdown formatting with proper code blocks (```python, ```bash, etc.).\n"
        "4. Be concise and technically accurate.\n"
        "5. Start your response directly — no 'Sure!', 'Great question!', or similar filler.\n"
    )

    # Build message history (last 10 turns max to avoid token overflow)
    history_messages = state["messages"][:-1]
    if len(history_messages) > 20:
        history_messages = history_messages[-20:]

    messages_payload = [
        {"role": "system", "content": system_msg},
        *[
            {
                "role": "user" if isinstance(m, HumanMessage) else "assistant",
                "content": m.content,
            }
            for m in history_messages
        ],
        {"role": "user", "content": question},
    ]

    response = await _llm.ainvoke(messages_payload)
    answer = response.content

    return {
        "final_answer": answer,
        "messages": [AIMessage(content=answer)],
    }


# ── Edge: route by intent ─────────────────────────────────────────────────
def route_by_intent(state: AgentState) -> Literal[
    "course_rag", "dsa_rag", "code_debug", "progress", "exam_rag", "platform_stats", "general_rag"
]:
    mapping = {
        "course_question": "course_rag",
        "dsa_help":        "dsa_rag",
        "debug_code":      "code_debug",
        "user_progress":   "progress",
        "exam_help":       "exam_rag",
        "platform_stats":  "platform_stats",
        "general":         "general_rag",
    }
    return mapping.get(state.get("intent", "general"), "general_rag")


# ── Build Graph ───────────────────────────────────────────────────────────
def build_graph() -> StateGraph:
    graph = StateGraph(AgentState)

    # Add all nodes
    graph.add_node("intent_classifier",  classify_intent)
    graph.add_node("course_rag",         course_rag_node)
    graph.add_node("dsa_rag",            dsa_rag_node)
    graph.add_node("code_debug",         code_debug_node)
    graph.add_node("progress",           progress_node)
    graph.add_node("exam_rag",           exam_rag_node)
    graph.add_node("platform_stats",     platform_stats_node)
    graph.add_node("general_rag",        general_rag_node)
    graph.add_node("response_generator", generate_response)

    # Entry point
    graph.set_entry_point("intent_classifier")

    # Intent → tool routing (conditional edges)
    graph.add_conditional_edges("intent_classifier", route_by_intent, {
        "course_rag":     "course_rag",
        "dsa_rag":        "dsa_rag",
        "code_debug":     "code_debug",
        "progress":       "progress",
        "exam_rag":       "exam_rag",
        "platform_stats": "platform_stats",
        "general_rag":    "general_rag",
    })

    # All RAG nodes → response_generator → END
    for node in ["course_rag", "dsa_rag", "code_debug", "progress", "exam_rag", "platform_stats", "general_rag"]:
        graph.add_edge(node, "response_generator")

    graph.add_edge("response_generator", END)

    compiled = graph.compile()
    logger.info("[Graph] LangGraph agent compiled successfully ✓")
    return compiled


# ── Singleton compiled graph ──────────────────────────────────────────────
agent_graph = build_graph()

# src/agents/graph.py
"""
LangGraph agent — intent classification + tool routing + response generation.
State machine: classify → route → tool node → generate response.
"""
from __future__ import annotations

import json
import logging
import operator
from typing import TypedDict, Annotated, Literal

from langchain_core.messages import BaseMessage, HumanMessage, AIMessage
from langchain_openai import ChatOpenAI
from langgraph.graph import StateGraph, END
from langgraph.prebuilt import ToolNode

from src.config.settings import get_settings
from src.agents.tools import (
    ALL_TOOLS,
    search_course_content,
    search_dsa_problems,
    search_exam_questions,
    get_user_progress,
    explain_code,
    recommend_next_topic,
)
from src.rag.prompts import INTENT_PROMPT

logger = logging.getLogger(__name__)
settings = get_settings()

# ── LLM ───────────────────────────────────────────────────────────────────
_llm = ChatOpenAI(
    model=settings.openai_model,
    temperature=0.1,
    streaming=True,
    openai_api_key=settings.openai_api_key,
)
_llm_with_tools = _llm.bind_tools(ALL_TOOLS)
_intent_llm = ChatOpenAI(
    model="gpt-4o-mini",
    temperature=0,
    openai_api_key=settings.openai_api_key,
)


# ── Agent State ───────────────────────────────────────────────────────────
class AgentState(TypedDict):
    messages: Annotated[list[BaseMessage], operator.add]
    user_id: str
    session_id: str
    intent: str
    retrieved_context: str
    final_answer: str
    sources: list[dict]


# ── Node 1: Intent Classifier ─────────────────────────────────────────────
async def classify_intent(state: AgentState) -> dict:
    """Classify user message into one of 6 intents."""
    last_msg = state["messages"][-1].content if state["messages"] else ""

    chain = INTENT_PROMPT | _intent_llm
    result = await chain.ainvoke({"message": last_msg})
    intent = result.content.strip().lower()

    valid_intents = {
        "course_question", "dsa_help", "debug_code",
        "user_progress", "exam_help", "general"
    }
    if intent not in valid_intents:
        intent = "general"

    logger.info(f"[Graph] Intent: '{intent}' for session {state['session_id']}")
    return {"intent": intent}


# ── Node 2: Tool Router Nodes ─────────────────────────────────────────────
async def course_rag_node(state: AgentState) -> dict:
    query = state["messages"][-1].content
    context = await search_course_content.ainvoke({"query": query})
    return {"retrieved_context": context}


async def dsa_rag_node(state: AgentState) -> dict:
    query = state["messages"][-1].content
    context = await search_dsa_problems.ainvoke({"query": query})
    return {"retrieved_context": context}


async def code_debug_node(state: AgentState) -> dict:
    query = state["messages"][-1].content
    context = await explain_code.ainvoke({"code_snippet": query})
    return {"retrieved_context": context}


async def progress_node(state: AgentState) -> dict:
    context = await get_user_progress.ainvoke({"user_id": state["user_id"]})
    return {"retrieved_context": context}


async def exam_rag_node(state: AgentState) -> dict:
    query = state["messages"][-1].content
    context = await search_exam_questions.ainvoke({"query": query})
    return {"retrieved_context": context}


async def general_rag_node(state: AgentState) -> dict:
    """Fallback — search across all sources."""
    from src.rag.retriever import get_retriever
    query = state["messages"][-1].content
    retriever = get_retriever()
    docs = retriever.invoke(query)
    context = "\n\n---\n\n".join(d.page_content for d in docs) if docs else ""
    return {"retrieved_context": context}


# ── Node 3: Response Generator ────────────────────────────────────────────
async def generate_response(state: AgentState) -> dict:
    """Generate the final answer using LLM + retrieved context."""
    question = state["messages"][-1].content
    context = state.get("retrieved_context", "")

    system_msg = (
        "You are CodeBot — the AI tutor for Code Campus, a coding education platform.\n\n"
        "## Retrieved Knowledge\n"
        f"{context}\n\n"
        "## Guidelines\n"
        "- Be concise, friendly, and technically accurate.\n"
        "- For DSA problems: give hints first, not full solutions.\n"
        "- Include code examples with proper syntax highlighting.\n"
        "- If the context doesn't answer the question, say so honestly."
    )

    response = await _llm.ainvoke([
        {"role": "system", "content": system_msg},
        *[{"role": "user" if isinstance(m, HumanMessage) else "assistant",
           "content": m.content}
          for m in state["messages"][:-1]],
        {"role": "user", "content": question},
    ])

    answer = response.content
    return {
        "final_answer": answer,
        "messages": [AIMessage(content=answer)],
    }


# ── Edge: route by intent ─────────────────────────────────────────────────
def route_by_intent(state: AgentState) -> Literal[
    "course_rag", "dsa_rag", "code_debug", "progress", "exam_rag", "general_rag"
]:
    mapping = {
        "course_question": "course_rag",
        "dsa_help":        "dsa_rag",
        "debug_code":      "code_debug",
        "user_progress":   "progress",
        "exam_help":       "exam_rag",
        "general":         "general_rag",
    }
    return mapping.get(state.get("intent", "general"), "general_rag")


# ── Build Graph ───────────────────────────────────────────────────────────
def build_graph() -> StateGraph:
    graph = StateGraph(AgentState)

    # Add nodes
    graph.add_node("intent_classifier", classify_intent)
    graph.add_node("course_rag",    course_rag_node)
    graph.add_node("dsa_rag",       dsa_rag_node)
    graph.add_node("code_debug",    code_debug_node)
    graph.add_node("progress",      progress_node)
    graph.add_node("exam_rag",      exam_rag_node)
    graph.add_node("general_rag",   general_rag_node)
    graph.add_node("response_generator", generate_response)

    # Entry point
    graph.set_entry_point("intent_classifier")

    # Intent → tool routing
    graph.add_conditional_edges("intent_classifier", route_by_intent, {
        "course_rag":  "course_rag",
        "dsa_rag":     "dsa_rag",
        "code_debug":  "code_debug",
        "progress":    "progress",
        "exam_rag":    "exam_rag",
        "general_rag": "general_rag",
    })

    # All tool nodes → response_generator → END
    for node in ["course_rag", "dsa_rag", "code_debug", "progress", "exam_rag", "general_rag"]:
        graph.add_edge(node, "response_generator")

    graph.add_edge("response_generator", END)

    return graph.compile()


# ── Singleton compiled graph ──────────────────────────────────────────────
agent_graph = build_graph()

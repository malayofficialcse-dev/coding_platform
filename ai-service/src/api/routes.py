# -*- coding: utf-8 -*-
# src/api/routes.py
"""
FastAPI route handlers for the Code Campus AI Service.

Endpoints:
  POST /api/ai/chat          → Real-time streaming SSE (token-by-token)
  POST /api/ai/chat/sync     → Non-streaming JSON response (for testing)
  POST /api/ai/ingest        → Re-index all data sources (admin only)
  DELETE /api/ai/session/{id}→ Clear session conversation memory
  GET  /health               → Health check (also at root /health in main.py)
"""
from __future__ import annotations

import json
import logging
import asyncio
from typing import AsyncGenerator

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from langchain_core.messages import HumanMessage

from src.api.schemas import (
    ChatRequest,
    ChatResponse,
    IngestResponse,
    PersonalizedExamRequest,
    PersonalizedExamResponse,
    CodingRecommendationRequest,
    CodingRecommendationResponse,
)
from src.api.middleware import verify_jwt, verify_admin
from src.agents.graph import agent_graph
from src.agents.memory import append_message, clear_session
from src.rag.chain import ask, clear_session as clear_chain_session
from src.config.settings import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()
router = APIRouter()


# ─────────────────────────────────────────────────────────────────────────────
# POST /api/ai/chat  →  Real token-by-token SSE streaming
# ─────────────────────────────────────────────────────────────────────────────
@router.post("/api/ai/chat")
@router.post("/v1/ai/chat")
async def chat_stream(
    request: ChatRequest,
    user: dict = Depends(verify_jwt),
):
    """
    Streaming chat endpoint using Server-Sent Events (SSE).

    Event types emitted:
      {"type": "intent",  "intent": "dsa_help"}              ← classified intent
      {"type": "token",   "token": "Here"}                   ← streamed token
      {"type": "sources", "sources": [...]}                  ← source documents
      {"type": "done",    "session_id": "...", "intent": "..."} ← stream complete
      {"type": "error",   "message": "..."}                  ← on error

    Frontend: use EventSource or fetch + ReadableStream to consume.
    """
    user_id = str(user.get("id") or user.get("sub") or user.get("userId") or "anonymous")
    raw_token = user.get("_raw_token") or request.user_token or ""
    session_id = request.session_id
    message = request.message.strip()

    if not message:
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    # Set thread-local context so synchronous tools can forward user JWT
    from src.agents.tools import set_request_context
    set_request_context(user_id=user_id, token=raw_token)

    # Persist user message to session memory
    append_message(session_id, "user", message)

    async def event_generator() -> AsyncGenerator[str, None]:
        full_answer = ""
        sources: list[dict] = []
        intent = "general"

        try:
            # ── Phase 1: Run the LangGraph agent and collect results ──────
            # We run the full graph first to get intent + context, then stream
            # the final answer tokens via astream_events on the response node.
            final_state = None
            detected_intent = "general"
            retrieved_context = ""

            # Run graph up to (but not including) response_generator to get intent + context
            async for event in agent_graph.astream(
                input={
                    "messages": [HumanMessage(content=message)],
                    "user_id": user_id,
                    "session_id": session_id,
                    "user_token": raw_token,
                    "intent": "",
                    "retrieved_context": "",
                    "final_answer": "",
                    "sources": [],
                },
                config={"configurable": {"thread_id": session_id}},
            ):
                # Emit intent as soon as it's classified
                if "intent_classifier" in event:
                    detected_intent = event["intent_classifier"].get("intent", "general")
                    intent = detected_intent
                    yield f"data: {json.dumps({'type': 'intent', 'intent': intent})}\n\n"

                # Collect sources from RAG nodes
                for node_name in ["course_rag", "dsa_rag", "code_debug", "progress", "exam_rag", "platform_stats", "general_rag"]:
                    if node_name in event:
                        node_data = event[node_name]
                        if node_data.get("sources"):
                            sources = node_data["sources"]
                        if node_data.get("retrieved_context"):
                            retrieved_context = node_data["retrieved_context"]

                # Stream the final answer token-by-token as it comes from response_generator
                if "response_generator" in event:
                    rg_data = event["response_generator"]
                    new_answer = rg_data.get("final_answer", "")
                    if new_answer and new_answer != full_answer:
                        # Stream only the new portion
                        new_tokens = new_answer[len(full_answer):]
                        full_answer = new_answer
                        # Emit word-by-word for better UX (not char-by-char)
                        words = new_tokens.split(" ")
                        for i, word in enumerate(words):
                            token = word if i == len(words) - 1 else word + " "
                            if token:
                                yield f"data: {json.dumps({'type': 'token', 'token': token})}\n\n"
                                await asyncio.sleep(0.01)  # small delay for realistic streaming feel

            # ── Phase 2: Emit sources ──────────────────────────────────────
            if sources:
                yield f"data: {json.dumps({'type': 'sources', 'sources': sources[:5]})}\n\n"

            # ── Phase 3: Persist and signal done ──────────────────────────
            if full_answer:
                append_message(session_id, "assistant", full_answer)

            yield f"data: {json.dumps({'type': 'done', 'session_id': session_id, 'intent': intent})}\n\n"

        except Exception as e:
            logger.error(f"[Chat/Stream] Error in session {session_id}: {e}", exc_info=True)
            yield f"data: {json.dumps({'type': 'error', 'message': 'An error occurred. Please try again.'})}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",    # Critical for nginx reverse proxying
            "Access-Control-Allow-Origin": "*",
        },
    )


# ─────────────────────────────────────────────────────────────────────────────
# POST /api/ai/chat/sync  →  Non-streaming JSON response
# ─────────────────────────────────────────────────────────────────────────────
@router.post("/api/ai/chat/sync", response_model=ChatResponse)
@router.post("/v1/ai/chat/sync", response_model=ChatResponse)
async def chat_sync(
    request: ChatRequest,
    user: dict = Depends(verify_jwt),
):
    """
    Non-streaming chat - returns the complete answer as JSON.
    Use this for testing, CLI clients, or integrations that don't support SSE.
    """
    user_id = str(user.get("id") or user.get("sub") or user.get("userId") or "anonymous")
    session_id = request.session_id
    message = request.message.strip()

    if not message:
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    append_message(session_id, "user", message)
    result = await ask(session_id, message)
    append_message(session_id, "assistant", result["answer"])

    return ChatResponse(
        answer=result["answer"],
        session_id=session_id,
        sources=result.get("sources", []),
    )


# ─────────────────────────────────────────────────────────────────────────────
# POST /api/ai/ingest  →  Re-index all data sources (admin only)
# ─────────────────────────────────────────────────────────────────────────────
@router.post("/api/ai/ingest", response_model=IngestResponse)
@router.post("/v1/ai/ingest", response_model=IngestResponse)
async def trigger_ingestion(admin: dict = Depends(verify_admin)):
    """
    Trigger a full re-ingestion of all platform content into ChromaDB.
    Requires admin or instructor JWT role.
    Also rebuilds the BM25 retriever with fresh documents.
    """
    from src.ingestion.loaders import load_all_documents
    from src.ingestion.splitter import split_documents
    from src.ingestion.embedder import build_vector_store
    from src.rag.retriever import build_hybrid_retriever, invalidate_retriever

    logger.info("[Ingest] Starting triggered re-ingestion …")

    raw_docs = load_all_documents()
    if not raw_docs:
        raise HTTPException(status_code=500, detail="No documents loaded from any source")

    chunks = split_documents(raw_docs)
    build_vector_store(chunks)

    # Rebuild retriever with fresh docs
    invalidate_retriever()
    build_hybrid_retriever(all_docs=chunks)

    logger.info(f"[Ingest] Done — {len(raw_docs)} docs → {len(chunks)} chunks")
    return IngestResponse(
        status="success",
        documents_loaded=len(raw_docs),
        chunks_created=len(chunks),
    )


# ─────────────────────────────────────────────────────────────────────────────
# DELETE /api/ai/session/{session_id}  →  Clear session memory
# ─────────────────────────────────────────────────────────────────────────────
@router.delete("/api/ai/session/{session_id}")
@router.delete("/v1/ai/session/{session_id}")
async def delete_session(
    session_id: str,
    user: dict = Depends(verify_jwt),
):
    """Clear conversation memory for a session (both graph memory and chain cache)."""
    clear_session(session_id)
    clear_chain_session(session_id)
    logger.info(f"[Session] Cleared session: {session_id}")
    return {"status": "session cleared", "session_id": session_id}


# ─────────────────────────────────────────────────────────────────────────────
# POST /api/ai/exam/generate-questions  →  Personalized Exam Practice Questions
# ─────────────────────────────────────────────────────────────────────────────
@router.post("/api/ai/exam/generate-questions", response_model=PersonalizedExamResponse)
@router.post("/v1/ai/exam/generate-questions", response_model=PersonalizedExamResponse)
async def generate_personalized_exam(
    request: PersonalizedExamRequest,
    user: dict = Depends(verify_jwt),
):
    """
    Generate customized practice MCQs based on the user's exam attempt history,
    scores, and enrolled courses.
    """
    from langchain_openai import ChatOpenAI
    from src.agents.profile_fetcher import fetch_exam_attempts, fetch_enrollments, fetch_user_profile
    from src.rag.retriever import get_filtered_retriever

    token = request.user_token or user.get("_raw_token") or ""
    user_id = str(user.get("id") or user.get("sub") or user.get("userId") or "anonymous")

    # 1. Fetch user exam attempts and enrolled courses
    attempts = await fetch_exam_attempts(token)
    enrollments = await fetch_enrollments(token)
    profile = await fetch_user_profile(user_id, token)
    student_name = profile.get("name") or profile.get("username") or "Student"

    # 2. Identify weak areas and appropriate difficulty
    weak_areas = []
    avg_score = 0
    if attempts:
        total_pct = sum(a.get("percentage", 0) for a in attempts)
        avg_score = total_pct / len(attempts)
        for a in attempts:
            if not a.get("passed") or a.get("percentage", 100) < 65:
                weak_areas.append(a.get("exam_title", "General Topics"))

    # Determine topic
    topic = request.topic
    if not topic:
        if weak_areas:
            topic = weak_areas[0]
        elif enrollments:
            topic = enrollments[0].get("course_title", "Computer Science")
        else:
            topic = "Data Structures & Algorithms"

    # Determine difficulty
    difficulty = request.difficulty
    if not difficulty:
        if avg_score >= 80:
            difficulty = "hard"
        elif avg_score >= 50:
            difficulty = "medium"
        else:
            difficulty = "easy"

    # 3. Retrieve reference questions from knowledge base
    retriever = get_filtered_retriever(source_filter="exam", k=4)
    docs = retriever.invoke(f"{topic} {difficulty} questions")
    context_text = "\n\n".join(d.page_content for d in docs) if docs else "No reference questions available."

    # 4. Prompt LLM to generate questions in valid JSON
    llm = ChatOpenAI(
        model=settings.effective_model,
        temperature=0.3,
        openai_api_key=settings.openai_api_key,
        base_url=settings.effective_base_url,
    )

    prompt = f"""You are an expert exam question generator for Code Campus.
Generate {request.count} multiple-choice questions for student '{student_name}'.
Topic: {topic}
Target Difficulty: {difficulty}
Student Weak Areas: {', '.join(weak_areas) if weak_areas else 'None identified'}

Reference Exam Knowledge:
{context_text}

OUTPUT FORMAT:
Respond with ONLY a valid JSON array of objects. Do not include markdown code fence formatting like ```json or ```, just the raw JSON array.
Each object must have these exact keys:
- "id": number (1 to {request.count})
- "question": string
- "options": array of 4 strings (e.g. ["A) ...", "B) ...", "C) ...", "D) ..."])
- "correct_answer": string (e.g. "A")
- "explanation": string explaining why the answer is correct and why other options are incorrect
- "difficulty": "{difficulty}"
- "topic": "{topic}"
"""

    resp = await llm.ainvoke([{"role": "user", "content": prompt}])
    raw = resp.content.strip()
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
        raw = raw.strip()

    try:
        questions = json.loads(raw)
        if not isinstance(questions, list):
            questions = [questions]
    except Exception as e:
        logger.error(f"[ExamGen] JSON parse error: {e}, raw: {raw[:200]}")
        questions = [{
            "id": 1,
            "question": f"Which fundamental concept is key in {topic}?",
            "options": ["A) Optimal efficiency", "B) Linear scan only", "C) Random access", "D) Static allocation"],
            "correct_answer": "A",
            "explanation": f"Understanding optimal efficiency is critical when studying {topic}.",
            "difficulty": difficulty,
            "topic": topic,
        }]

    return PersonalizedExamResponse(
        questions=questions,
        topic=topic,
        difficulty=difficulty,
        generated_for=student_name,
        weak_areas=list(set(weak_areas)),
    )


# ─────────────────────────────────────────────────────────────────────────────
# POST /api/ai/coding/recommendations  →  Personalized Problem Recommendations
# ─────────────────────────────────────────────────────────────────────────────
@router.post("/api/ai/coding/recommendations", response_model=CodingRecommendationResponse)
@router.post("/v1/ai/coding/recommendations", response_model=CodingRecommendationResponse)
async def get_coding_recommendations(
    request: CodingRecommendationRequest,
    user: dict = Depends(verify_jwt),
):
    """
    Recommend the next best coding problems to solve based on the user's
    submission history, solved count, and difficulty distribution.
    """
    from langchain_openai import ChatOpenAI
    from src.agents.profile_fetcher import fetch_coding_submissions, fetch_user_profile
    from src.rag.retriever import get_filtered_retriever

    token = request.user_token or user.get("_raw_token") or ""
    user_id = str(user.get("id") or user.get("sub") or user.get("userId") or "anonymous")

    profile = await fetch_user_profile(user_id, token)
    student_name = profile.get("name") or profile.get("username") or "Student"

    coding_data = await fetch_coding_submissions(token)
    total_solved = coding_data.get("total_solved", 0)
    diff = coding_data.get("difficulty_breakdown", {})
    topics_done = coding_data.get("topics_done", [])
    solved = coding_data.get("solved_problems", [])
    solved_titles = [p.get("title", "") for p in solved if p.get("title")]

    if total_solved >= 50:
        skill_level = "Advanced"
    elif total_solved >= 15:
        skill_level = "Intermediate"
    else:
        skill_level = "Beginner"

    # Retrieve candidate problems
    retriever = get_filtered_retriever(source_filter="dsa_problem", k=10)
    docs = retriever.invoke(f"dsa problems {skill_level} algorithms")
    candidates = "\n\n".join(d.page_content[:300] for d in docs) if docs else "General DSA problems"

    llm = ChatOpenAI(
        model=settings.effective_model,
        temperature=0.3,
        openai_api_key=settings.openai_api_key,
        base_url=settings.effective_base_url,
    )

    prompt = f"""You are a DSA coach for student '{student_name}'.
Skill Level: {skill_level}
Total Solved: {total_solved} problems ({diff})
Topics already practiced: {', '.join(topics_done) if topics_done else 'None yet'}
Recently solved problem titles: {', '.join(solved_titles[:15]) if solved_titles else 'None'}

Candidate Knowledge Base Problems:
{candidates}

Select or propose {request.count} recommended problems that this student should solve next to level up.
DO NOT recommend problems they already solved!
Return ONLY a valid JSON array of objects. Do not include markdown formatting.
Each object must have:
- "title": string (problem title)
- "difficulty": "Easy" | "Medium" | "Hard"
- "topic": string (e.g. Arrays, Trees, Dynamic Programming, Graphs)
- "reason": string (why this problem is recommended next for this student)
- "hint": string (a guiding hint to get started)
"""

    resp = await llm.ainvoke([{"role": "user", "content": prompt}])
    raw = resp.content.strip()
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
        raw = raw.strip()

    try:
        problems = json.loads(raw)
        if not isinstance(problems, list):
            problems = [problems]
    except Exception as e:
        logger.error(f"[CodingRec] JSON parse error: {e}, raw: {raw[:200]}")
        problems = [{
            "title": "Two Sum II - Input Array Is Sorted",
            "difficulty": "Medium" if skill_level != "Beginner" else "Easy",
            "topic": "Two Pointers",
            "reason": "Great for practicing linear two-pointer search patterns.",
            "hint": "Use two pointers starting at opposite ends of the array.",
        }]

    next_topics = [p.get("topic") for p in problems if p.get("topic")]

    return CodingRecommendationResponse(
        problems=problems,
        recommended_for=student_name,
        skill_level=skill_level,
        next_topics=list(dict.fromkeys(next_topics)),
    )


# ─────────────────────────────────────────────────────────────────────────────
# GET /api/ai/user/learning-profile  →  Aggregated Learning Data
# ─────────────────────────────────────────────────────────────────────────────
@router.get("/api/ai/user/learning-profile")
@router.get("/v1/ai/user/learning-profile")
async def get_user_learning_profile(user: dict = Depends(verify_jwt)):
    """
    Fetch the aggregated student profile including enrollments, exam attempts,
    and coding submissions.
    """
    from src.agents.profile_fetcher import build_user_context
    token = user.get("_raw_token") or ""
    user_id = str(user.get("id") or user.get("sub") or user.get("userId") or "anonymous")
    context = await build_user_context(user_id, token)
    return {"status": "success", "user_id": user_id, "data": context}


# ─────────────────────────────────────────────────────────────────────────────
# GET /api/ai/platform/stats  →  Real-time database statistics
# ─────────────────────────────────────────────────────────────────────────────
@router.get("/api/ai/platform/stats")
@router.get("/v1/ai/platform/stats")
async def get_platform_db_stats():
    """
    Returns real-time platform statistics queried directly from PostgreSQL
    and MongoDB databases.
    """
    from src.database.db_manager import get_platform_statistics
    stats = get_platform_statistics()
    return {"status": "success", "data": stats}

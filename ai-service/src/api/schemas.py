# src/api/schemas.py
"""
Pydantic request/response models for the AI service API.
"""
from __future__ import annotations

from pydantic import BaseModel, Field
from typing import Optional, List


class ChatRequest(BaseModel):
    message:    str = Field(..., min_length=1, max_length=4000, description="User's message")
    session_id: str = Field(..., min_length=1, max_length=100,  description="Unique session/conversation ID")
    # Optional — passed by frontend to enable personalized responses.
    # The AI service forwards this token when calling user/exam/coding services.
    user_token: Optional[str] = Field(None, description="User's JWT access token (for personalized features)")


class SourceDoc(BaseModel):
    source:      str = "knowledge_base"
    preview:     str
    course_title: Optional[str] = None
    title:        Optional[str] = None
    topic:        Optional[str] = None
    difficulty:   Optional[str] = None
    exam_title:   Optional[str] = None


class ChatResponse(BaseModel):
    answer:     str
    session_id: str
    sources:    List[SourceDoc] = []
    intent:     Optional[str] = None


class IngestResponse(BaseModel):
    status:           str
    documents_loaded: int
    chunks_created:   int


class HealthResponse(BaseModel):
    service:           str
    status:            str
    port:              int
    vector_store:      str
    documents_indexed: int


# ── Personalized endpoints ─────────────────────────────────────────────────

class PersonalizedExamRequest(BaseModel):
    topic:      Optional[str] = Field(None, description="Topic to focus on (e.g. 'DSA', 'OS'). If null, auto-selected from weak areas.")
    count:      int           = Field(5, ge=1, le=20, description="Number of questions to generate")
    difficulty: Optional[str] = Field(None, description="easy | medium | hard. If null, auto-selected based on past scores.")
    user_token: str           = Field(..., description="User's JWT token to fetch their profile data")


class PersonalizedExamResponse(BaseModel):
    questions:    list
    topic:        str
    difficulty:   str
    generated_for: str   # username or "Student"
    weak_areas:   List[str] = []


class CodingRecommendationRequest(BaseModel):
    count:      int           = Field(5, ge=1, le=10, description="Number of problems to recommend")
    user_token: str           = Field(..., description="User's JWT token to fetch profile data")


class CodingRecommendationResponse(BaseModel):
    problems:      list
    recommended_for: str
    skill_level:   str
    next_topics:   List[str] = []

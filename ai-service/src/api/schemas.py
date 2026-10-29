# src/api/schemas.py
"""
Pydantic request/response models for the AI service API.
"""
from __future__ import annotations

from pydantic import BaseModel, Field
from typing import Optional


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=4000, description="User's message")
    session_id: str = Field(..., min_length=1, max_length=100, description="Unique session/conversation ID")


class SourceDoc(BaseModel):
    source: str
    preview: str
    course_title: Optional[str] = None
    title: Optional[str] = None
    topic: Optional[str] = None
    difficulty: Optional[str] = None
    exam_title: Optional[str] = None


class ChatResponse(BaseModel):
    answer: str
    session_id: str
    sources: list[SourceDoc] = []
    intent: Optional[str] = None


class IngestResponse(BaseModel):
    status: str
    documents_loaded: int
    chunks_created: int


class HealthResponse(BaseModel):
    service: str
    status: str
    port: int
    vector_store: str
    documents_indexed: int

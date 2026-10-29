# src/agents/memory.py
"""
Conversation memory management using an in-memory dictionary.
In production, swap this for a Redis-backed checkpointer.
"""
from __future__ import annotations

import logging
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)

# session_id → {"history": list[dict], "last_active": datetime}
_sessions: dict[str, dict] = {}

SESSION_TTL_MINUTES = 60


def get_history(session_id: str) -> list[dict]:
    """Return the message history for a session."""
    session = _sessions.get(session_id)
    if session is None:
        return []
    session["last_active"] = datetime.utcnow()
    return session["history"]


def append_message(session_id: str, role: str, content: str) -> None:
    """Append a message to session history."""
    if session_id not in _sessions:
        _sessions[session_id] = {"history": [], "last_active": datetime.utcnow()}
    _sessions[session_id]["history"].append({
        "role": role,
        "content": content,
        "timestamp": datetime.utcnow().isoformat(),
    })
    _sessions[session_id]["last_active"] = datetime.utcnow()


def clear_session(session_id: str) -> None:
    """Clear session history."""
    _sessions.pop(session_id, None)
    logger.info(f"[Memory] Cleared session: {session_id}")


def purge_expired_sessions() -> int:
    """Remove sessions inactive for more than SESSION_TTL_MINUTES. Returns count removed."""
    cutoff = datetime.utcnow() - timedelta(minutes=SESSION_TTL_MINUTES)
    expired = [
        sid for sid, data in _sessions.items()
        if data["last_active"] < cutoff
    ]
    for sid in expired:
        _sessions.pop(sid, None)
    if expired:
        logger.info(f"[Memory] Purged {len(expired)} expired sessions")
    return len(expired)


def active_session_count() -> int:
    return len(_sessions)

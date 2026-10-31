# src/api/middleware.py
"""
JWT verification middleware — validates same JWT secret as all other services.
"""
from __future__ import annotations

import logging
from typing import Optional
from fastapi import HTTPException, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError

from src.config.settings import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

_bearer = HTTPBearer(auto_error=False)


async def verify_jwt(
    credentials: Optional[HTTPAuthorizationCredentials] = Security(_bearer),
) -> dict:
    """
    FastAPI dependency — validates the Bearer JWT token.
    Returns the decoded payload dict (contains user id, role, etc.).
    Allows guest access for general questions if no token is sent.
    """
    if not credentials or not credentials.credentials:
        return {"id": "anonymous", "role": "guest", "name": "Guest"}

    token = credentials.credentials
    try:
        payload = jwt.decode(
            token,
            settings.jwt_secret,
            algorithms=["HS256"],
            options={"verify_aud": False, "verify_iss": False},
        )
        payload["_raw_token"] = token
        return payload
    except JWTError as e:
        logger.warning(f"[Auth] Invalid JWT: {e}")
        raise HTTPException(status_code=401, detail="Invalid or expired token")


async def verify_admin(
    credentials: HTTPAuthorizationCredentials = Security(_bearer),
) -> dict:
    """Requires admin or instructor role."""
    payload = await verify_jwt(credentials)
    role = payload.get("role", "")
    if role not in ("admin", "instructor"):
        raise HTTPException(status_code=403, detail="Admin access required")
    return payload

# src/agents/profile_fetcher.py
"""
Fetches user profile data from internal microservices using the user's JWT token.

Data fetched:
  - User profile (name, role, username) from user-service:5002
  - Enrollments + course progress from enrollment-service:5006
  - My exam attempts + scores from exam-service:5004  (via gateway :5100)
  - My coding submissions (solved problems) from coding-service:5007 (via gateway :5100)

The user's own Bearer JWT token is forwarded so each service authenticates
the request as the actual user (no internal service token needed).
"""
from __future__ import annotations

import logging
import httpx
from src.config.settings import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

# Service base URLs (direct — bypassing the gateway for performance)
USER_SERVICE_URL       = settings.user_service_url          # http://localhost:5002
ENROLLMENT_SERVICE_URL = settings.enrollment_service_url    # http://localhost:5006
EXAM_SERVICE_URL       = "http://localhost:5004"
CODING_SERVICE_URL     = "http://localhost:5007"

TIMEOUT = 6.0  # seconds per call


def _auth_headers(token: str) -> dict:
    """Build Bearer auth headers from the user's own JWT token."""
    return {"Authorization": f"Bearer {token}"}


async def fetch_user_profile(user_id: str, token: str) -> dict:
    """
    Fetch basic user profile from user-service.
    Returns dict with: username, name, email, role, createdAt
    """
    if not token or token == "anonymous":
        return {}
    try:
        async with httpx.AsyncClient(timeout=TIMEOUT) as client:
            r = await client.get(
                f"{USER_SERVICE_URL}/api/users/{user_id}",
                headers=_auth_headers(token),
            )
            if r.status_code == 200:
                data = r.json()
                user = data.get("user", data)
                return {
                    "username": user.get("username", ""),
                    "name":     user.get("name", ""),
                    "email":    user.get("email", ""),
                    "role":     user.get("role", "student"),
                    "joined":   user.get("createdAt", ""),
                }
            logger.warning(f"[Profile] user-service {r.status_code} for user {user_id}")
    except Exception as e:
        logger.error(f"[Profile] fetch_user_profile error: {e}")
    return {}


async def fetch_enrollments(token: str) -> list[dict]:
    """
    Fetch user's enrolled courses + progress from enrollment-service.
    Returns list of: {course_title, progress, completed, enrolledAt}
    """
    if not token or token == "anonymous":
        return []
    try:
        async with httpx.AsyncClient(timeout=TIMEOUT) as client:
            r = await client.get(
                f"{ENROLLMENT_SERVICE_URL}/api/enrollments/my",
                headers=_auth_headers(token),
            )
            if r.status_code == 200:
                data = r.json()
                enrollments = data if isinstance(data, list) else data.get("enrollments", [])
                result = []
                for e in enrollments:
                    course = e.get("courseId", {}) if isinstance(e.get("courseId"), dict) else {}
                    result.append({
                        "course_title": course.get("title", e.get("courseTitle", "Unknown Course")),
                        "progress":     e.get("progress", 0),
                        "completed":    e.get("completed", False),
                        "enrolled_at":  e.get("enrolledAt", e.get("createdAt", "")),
                    })
                return result
            logger.warning(f"[Profile] enrollment-service {r.status_code}")
    except Exception as e:
        logger.error(f"[Profile] fetch_enrollments error: {e}")
    return []


async def fetch_exam_attempts(token: str) -> list[dict]:
    """
    Fetch user's past exam attempts + scores from exam-service.
    Returns list of: {exam_title, score, total, percentage, passed, date}
    """
    if not token or token == "anonymous":
        return []
    try:
        async with httpx.AsyncClient(timeout=TIMEOUT) as client:
            r = await client.get(
                f"{EXAM_SERVICE_URL}/api/attempts/my",
                headers=_auth_headers(token),
            )
            if r.status_code == 200:
                data = r.json()
                attempts = data if isinstance(data, list) else data.get("attempts", [])
                result = []
                for a in attempts:
                    exam = a.get("examId", {}) if isinstance(a.get("examId"), dict) else {}
                    score = a.get("score", 0)
                    total = a.get("totalQuestions", a.get("total", 1))
                    pct   = round((score / total) * 100, 1) if total else 0
                    result.append({
                        "exam_title":  exam.get("title", a.get("examTitle", "Unknown Exam")),
                        "score":       score,
                        "total":       total,
                        "percentage":  pct,
                        "passed":      a.get("passed", pct >= 60),
                        "date":        a.get("submittedAt", a.get("createdAt", "")),
                        "wrong_topics": a.get("wrongTopics", []),
                    })
                return sorted(result, key=lambda x: x["date"], reverse=True)
            logger.warning(f"[Profile] exam-service {r.status_code}")
    except Exception as e:
        logger.error(f"[Profile] fetch_exam_attempts error: {e}")
    return []


async def fetch_coding_submissions(token: str) -> dict:
    """
    Fetch user's coding submissions from coding-service.
    Returns: {solved_problems: list, total_solved: int, difficulty_breakdown: dict, topics_done: list}
    """
    if not token or token == "anonymous":
        return {}
    try:
        async with httpx.AsyncClient(timeout=TIMEOUT) as client:
            r = await client.get(
                f"{CODING_SERVICE_URL}/api/submissions/my",
                headers=_auth_headers(token),
            )
            if r.status_code == 200:
                data = r.json()
                subs = data if isinstance(data, list) else data.get("submissions", [])

                # Deduplicate — keep only AC submissions, one per problem
                solved: dict[str, dict] = {}
                for s in subs:
                    if s.get("status") in ("Accepted", "AC", "accepted"):
                        prob = s.get("problemId", {})
                        pid  = prob.get("_id", s.get("problemId", str(s.get("_id", ""))))
                        if pid not in solved:
                            solved[pid] = {
                                "title":      prob.get("title", s.get("problemTitle", "Unknown")),
                                "difficulty": prob.get("difficulty", s.get("difficulty", "Easy")),
                                "topic":      prob.get("dsaTopic", s.get("dsaTopic", "General")),
                                "tags":       prob.get("tags", []),
                            }

                solved_list = list(solved.values())

                # Count by difficulty
                diff_counts: dict[str, int] = {}
                topics_done: set[str] = set()
                for p in solved_list:
                    d = p.get("difficulty", "Easy")
                    diff_counts[d] = diff_counts.get(d, 0) + 1
                    if p.get("topic"):
                        topics_done.add(p["topic"])

                return {
                    "solved_problems":      solved_list,
                    "total_solved":         len(solved_list),
                    "difficulty_breakdown": diff_counts,
                    "topics_done":          sorted(topics_done),
                }
            logger.warning(f"[Profile] coding-service {r.status_code}")
    except Exception as e:
        logger.error(f"[Profile] fetch_coding_submissions error: {e}")
    return {}


async def build_user_context(user_id: str, token: str) -> dict:
    """
    Aggregate ALL user data into a single context dict.
    Used by personalized exam and coding tools.
    """
    import asyncio
    profile, enrollments, attempts, coding = await asyncio.gather(
        fetch_user_profile(user_id, token),
        fetch_enrollments(token),
        fetch_exam_attempts(token),
        fetch_coding_submissions(token),
        return_exceptions=True,
    )

    # Handle exceptions from gather
    if isinstance(profile,     Exception): profile     = {}
    if isinstance(enrollments, Exception): enrollments = []
    if isinstance(attempts,    Exception): attempts    = []
    if isinstance(coding,      Exception): coding      = {}

    return {
        "profile":      profile,
        "enrollments":  enrollments,
        "exam_attempts": attempts,
        "coding":       coding,
    }


def format_user_context_for_prompt(ctx: dict) -> str:
    """
    Convert user context dict into a clean text block for the LLM prompt.
    Adapts intelligently for students, mentors, admins, and super_admins.
    """
    lines = []
    p = ctx.get("profile", {})
    role = p.get("role", "student").lower() if p else "student"
    name = p.get("name") or p.get("username", "User")
    username = p.get("username", "")

    if role in ("super_admin", "admin"):
        lines.append(f"👑 **User Profile: {name}** (@{username})")
        lines.append(f"• **Role**: {role.upper()} (Platform Administrator)")
        lines.append(f"• **Permissions**: Full administrative privileges across all courses, exams, coding problems, user accounts, and system analytics.")
        lines.append("\n📊 **Platform Oversight & Database Overview**:")
        try:
            from src.database.db_manager import get_platform_statistics, format_platform_stats_for_prompt
            stats = get_platform_statistics()
            lines.append(format_platform_stats_for_prompt(stats))
        except Exception as e:
            logger.warning(f"[Profile] Failed to embed platform stats for admin: {e}")
    elif role == "mentor":
        lines.append(f"🧑‍🏫 **User Profile: {name}** (@{username})")
        lines.append(f"• **Role**: Mentor / Instructor")
    else:
        lines.append(f"👤 **Student Profile: {name}** (@{username})")
        lines.append(f"• **Role**: Student / Learner")

    enrollments = ctx.get("enrollments", [])
    if enrollments:
        lines.append(f"\n📚 **Enrolled Courses ({len(enrollments)})**:")
        for e in enrollments:
            status = "✅ Completed" if e.get("completed") else f"{e.get('progress', 0)}% done"
            lines.append(f"  • {e['course_title']} - {status}")

    attempts = ctx.get("exam_attempts", [])
    if attempts:
        lines.append(f"\n📝 **Recent Exam Attempts ({len(attempts)})**:")
        for a in attempts[:5]:
            passed_str = "✅ Passed" if a.get("passed") else "❌ Failed"
            lines.append(
                f"  • {a['exam_title']}: {a['score']}/{a['total']} ({a['percentage']}%) - {passed_str}"
            )

    coding = ctx.get("coding", {})
    if coding:
        total = coding.get("total_solved", 0)
        diff  = coding.get("difficulty_breakdown", {})
        topics = coding.get("topics_done", [])
        if total > 0 or diff or topics:
            lines.append(f"\n💻 **Coding Progress**:")
            lines.append(f"  • Problems solved: {total}")
            if diff:
                parts = [f"{k}: {v}" for k, v in diff.items()]
                lines.append(f"  • Breakdown: {', '.join(parts)}")
            if topics:
                lines.append(f"  • Topics covered: {', '.join(topics[:10])}")

    if not enrollments and not attempts and not coding and role not in ("super_admin", "admin"):
        lines.append("\nℹ️ Status: New learner account. No course enrollments or exam attempts recorded yet.")

    return "\n".join(lines) if lines else "No user profile data available."

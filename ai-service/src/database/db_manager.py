# src/database/db_manager.py
"""
Central Database & Platform Intelligence Manager.
Directly connects to PostgreSQL databases (user_db, auth_db, exam_db, enrollment_db, coding_db)
and MongoDB Atlas (courses, coding problems, community posts).

Provides real-time platform statistics, user analytics, and database introspection.
"""
from __future__ import annotations

import logging
from typing import Any
import psycopg2
from pymongo import MongoClient

from src.config.settings import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


def _get_pg_conn(db_url: str):
    """Create a short-lived PostgreSQL connection with a 3s timeout."""
    return psycopg2.connect(db_url, connect_timeout=3)


def get_platform_statistics() -> dict[str, Any]:
    """
    Query all platform databases to get accurate real-time statistics:
    - User counts (total, role breakdown, colleges)
    - Exam counts & attempt metrics
    - Enrollment counts & progress
    - Coding problems & submission counts
    - Course counts & categories
    - Community post & comment counts
    """
    stats: dict[str, Any] = {
        "users": {"total": 0, "by_role": {}, "recent": [], "colleges": []},
        "exams": {"total_exams": 0, "total_attempts": 0, "avg_score": 0.0, "sample_titles": []},
        "enrollments": {"total_enrollments": 0, "completed_count": 0},
        "coding": {"total_problems": 0, "total_submissions": 0, "by_difficulty": {}},
        "courses": {"total_courses": 0, "course_titles": []},
        "community": {"total_posts": 0, "total_comments": 0},
    }

    # ── 1. User DB ────────────────────────────────────────────────────────
    try:
        conn = _get_pg_conn(settings.user_database_url)
        cur = conn.cursor()
        cur.execute("SELECT COUNT(*) FROM users")
        stats["users"]["total"] = cur.fetchone()[0]

        cur.execute("SELECT role, COUNT(*) FROM users GROUP BY role")
        stats["users"]["by_role"] = dict(cur.fetchall())

        cur.execute("SELECT name, username, role, college, \"createdAt\" FROM users ORDER BY \"createdAt\" DESC LIMIT 8")
        stats["users"]["recent"] = [
            {"name": r[0], "username": r[1], "role": r[2], "college": r[3], "joined": str(r[4])}
            for r in cur.fetchall()
        ]

        cur.execute("SELECT DISTINCT college FROM users WHERE college IS NOT NULL AND college != '' LIMIT 10")
        stats["users"]["colleges"] = [r[0] for r in cur.fetchall()]
        conn.close()
    except Exception as e:
        logger.warning(f"[DBManager] Failed to query user_db: {e}")

    # ── 2. Exam DB ────────────────────────────────────────────────────────
    try:
        conn = _get_pg_conn(settings.exam_database_url)
        cur = conn.cursor()
        cur.execute("SELECT COUNT(*) FROM exams")
        stats["exams"]["total_exams"] = cur.fetchone()[0]

        cur.execute("SELECT title FROM exams LIMIT 6")
        stats["exams"]["sample_titles"] = [r[0] for r in cur.fetchall()]

        cur.execute("SELECT COUNT(*), AVG(score) FROM attempts")
        row = cur.fetchone()
        stats["exams"]["total_attempts"] = row[0]
        stats["exams"]["avg_score"] = round(float(row[1]), 2) if row[1] is not None else 0.0
        conn.close()
    except Exception as e:
        logger.warning(f"[DBManager] Failed to query exam_db: {e}")

    # ── 3. Enrollment DB ──────────────────────────────────────────────────
    try:
        conn = _get_pg_conn(settings.enrollment_database_url)
        cur = conn.cursor()
        cur.execute("SELECT COUNT(*) FROM enrollments")
        stats["enrollments"]["total_enrollments"] = cur.fetchone()[0]

        cur.execute("SELECT COUNT(*) FROM enrollments WHERE \"completedAt\" IS NOT NULL OR progress = 100")
        stats["enrollments"]["completed_count"] = cur.fetchone()[0]
        conn.close()
    except Exception as e:
        logger.warning(f"[DBManager] Failed to query enrollment_db: {e}")

    # ── 4. Coding DB ──────────────────────────────────────────────────────
    try:
        conn = _get_pg_conn(settings.coding_database_url)
        cur = conn.cursor()
        cur.execute("SELECT COUNT(*) FROM coding_submissions")
        stats["coding"]["total_submissions"] = cur.fetchone()[0]
        conn.close()
    except Exception as e:
        logger.warning(f"[DBManager] Failed to query coding_db: {e}")

    # ── 5. MongoDB Atlas (courses, coding problems, community) ─────────────
    mongo_uri = settings.mongo_uri or settings.course_mongo_uri
    if mongo_uri:
        try:
            m_client = MongoClient(mongo_uri, serverSelectionTimeoutMS=3000)

            # Courses
            try:
                course_coll = m_client["course_db"]["courses"]
                courses = list(course_coll.find({}, {"title": 1, "category": 1}).limit(20))
                stats["courses"]["total_courses"] = len(courses)
                stats["courses"]["course_titles"] = [c.get("title", "") for c in courses if c.get("title")]
            except Exception:
                pass

            # Coding Problems
            try:
                prob_coll = m_client["coding_problems_db"]["codingproblems"]
                stats["coding"]["total_problems"] = prob_coll.count_documents({})
                easy_cnt = prob_coll.count_documents({"difficulty": {"$regex": "^easy$", "$options": "i"}})
                med_cnt  = prob_coll.count_documents({"difficulty": {"$regex": "^medium$", "$options": "i"}})
                hard_cnt = prob_coll.count_documents({"difficulty": {"$regex": "^hard$", "$options": "i"}})
                stats["coding"]["by_difficulty"] = {"Easy": easy_cnt, "Medium": med_cnt, "Hard": hard_cnt}
            except Exception:
                pass

            # Community (Posts & Comments)
            try:
                post_coll = m_client["post_db"]["posts"]
                comment_coll = m_client["post_db"]["comments"]
                stats["community"]["total_posts"] = post_coll.count_documents({})
                stats["community"]["total_comments"] = comment_coll.count_documents({})
            except Exception:
                pass

        except Exception as e:
            logger.warning(f"[DBManager] Failed to query MongoDB Atlas: {e}")

    return stats


def format_platform_stats_for_prompt(stats: dict[str, Any]) -> str:
    """Format platform statistics into a clean markdown document for LLM injection."""
    u = stats.get("users", {})
    e = stats.get("exams", {})
    en = stats.get("enrollments", {})
    c = stats.get("coding", {})
    co = stats.get("courses", {})
    comm = stats.get("community", {})

    roles_str = ", ".join(f"{k}: {v}" for k, v in u.get("by_role", {}).items()) if u.get("by_role") else "N/A"
    diff_str = ", ".join(f"{k}: {v}" for k, v in c.get("by_difficulty", {}).items()) if c.get("by_difficulty") else "N/A"

    lines = [
        "## Real-Time Code Campus Database & Platform Statistics",
        f"• **Registered Users**: {u.get('total', 0)} total ({roles_str})",
    ]
    if u.get("colleges"):
        lines.append(f"  - Represented Colleges: {', '.join(u['colleges'][:6])}")
    if u.get("recent"):
        recent_names = [f"{r['name']} (@{r['username']}, {r['role']})" for r in u["recent"][:4] if r.get("name")]
        lines.append(f"  - Sample Recent Members: {', '.join(recent_names)}")

    lines.extend([
        f"• **Courses**: {co.get('total_courses', 0)} available ({', '.join(co.get('course_titles', [])[:4])})",
        f"• **Exams & Tests**: {e.get('total_exams', 0)} exams in system, {e.get('total_attempts', 0)} student attempts (Avg score: {e.get('avg_score', 0)})",
        f"• **Coding & DSA**: {c.get('total_problems', 0)} coding problems ({diff_str}), {c.get('total_submissions', 0)} student submissions logged",
        f"• **Course Enrollments**: {en.get('total_enrollments', 0)} student enrollments ({en.get('completed_count', 0)} completed)",
        f"• **Community**: {comm.get('total_posts', 0)} discussion posts, {comm.get('total_comments', 0)} comments",
    ])

    return "\n".join(lines)

# src/database/db_manager.py
"""
Central Database & Platform Intelligence Manager.
Directly connects to PostgreSQL (Neon cloud or local) and MongoDB Atlas.

Automatically probes both service schemas (user_schema, exam_schema, etc.)
and public schema for resilient queries.
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
    """Create a short-lived PostgreSQL connection with a 5s timeout."""
    if not db_url:
        raise ValueError("Database URL is not configured")
    sslmode = "require" if "neon.tech" in db_url else "prefer"
    return psycopg2.connect(db_url, connect_timeout=5, sslmode=sslmode)


def _try_query(cur, query_fn, table_candidates: list[str]):
    """Execute query_fn with the first candidate table name that exists."""
    for tbl in table_candidates:
        try:
            return query_fn(tbl)
        except Exception:
            cur.connection.rollback()
    return None


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
    db_url = settings.user_database_url
    if db_url:
        try:
            conn = _get_pg_conn(db_url)
            cur = conn.cursor()

            def _query_users(tbl):
                cur.execute(f"SELECT COUNT(*) FROM {tbl}")
                stats["users"]["total"] = cur.fetchone()[0]

                cur.execute(f"SELECT role, COUNT(*) FROM {tbl} GROUP BY role")
                stats["users"]["by_role"] = dict(cur.fetchall())

                cur.execute(
                    f'SELECT name, username, role, college, "createdAt" '
                    f'FROM {tbl} ORDER BY "createdAt" DESC LIMIT 8'
                )
                stats["users"]["recent"] = [
                    {"name": r[0], "username": r[1], "role": r[2], "college": r[3], "joined": str(r[4])}
                    for r in cur.fetchall()
                ]

                cur.execute(
                    f"SELECT DISTINCT college FROM {tbl} "
                    f"WHERE college IS NOT NULL AND college != '' LIMIT 10"
                )
                stats["users"]["colleges"] = [r[0] for r in cur.fetchall()]
                return True

            _try_query(cur, _query_users, ["user_schema.users", "public.users", "users"])
            conn.close()
        except Exception as e:
            logger.warning(f"[DBManager] Failed to query user_db: {e}")

    # ── 2. Exam DB ────────────────────────────────────────────────────────
    db_url = settings.exam_database_url
    if db_url:
        try:
            conn = _get_pg_conn(db_url)
            cur = conn.cursor()

            def _query_exams(tbl):
                cur.execute(f"SELECT COUNT(*) FROM {tbl}")
                stats["exams"]["total_exams"] = cur.fetchone()[0]

                cur.execute(f"SELECT title FROM {tbl} LIMIT 6")
                stats["exams"]["sample_titles"] = [r[0] for r in cur.fetchall()]
                return True

            _try_query(cur, _query_exams, ["exam_schema.exams", "public.exams", "exams"])

            def _query_attempts(tbl):
                cur.execute(f"SELECT COUNT(*), AVG(score) FROM {tbl}")
                row = cur.fetchone()
                stats["exams"]["total_attempts"] = row[0] or 0
                stats["exams"]["avg_score"] = round(float(row[1]), 2) if row[1] is not None else 0.0
                return True

            _try_query(cur, _query_attempts, ["exam_schema.attempts", "public.attempts", "attempts"])
            conn.close()
        except Exception as e:
            logger.warning(f"[DBManager] Failed to query exam_db: {e}")

    # ── 3. Enrollment DB ──────────────────────────────────────────────────
    db_url = settings.enrollment_database_url
    if db_url:
        try:
            conn = _get_pg_conn(db_url)
            cur = conn.cursor()

            def _query_enrollments(tbl):
                cur.execute(f"SELECT COUNT(*) FROM {tbl}")
                stats["enrollments"]["total_enrollments"] = cur.fetchone()[0]

                cur.execute(
                    f'SELECT COUNT(*) FROM {tbl} '
                    f'WHERE "completedAt" IS NOT NULL OR progress = 100'
                )
                stats["enrollments"]["completed_count"] = cur.fetchone()[0]
                return True

            _try_query(cur, _query_enrollments, ["enrollment_schema.enrollments", "public.enrollments", "enrollments"])
            conn.close()
        except Exception as e:
            logger.warning(f"[DBManager] Failed to query enrollment_db: {e}")

    # ── 4. Coding DB (submissions) ────────────────────────────────────────
    db_url = settings.coding_database_url
    if db_url:
        try:
            conn = _get_pg_conn(db_url)
            cur = conn.cursor()

            def _query_submissions(tbl):
                cur.execute(f"SELECT COUNT(*) FROM {tbl}")
                stats["coding"]["total_submissions"] = cur.fetchone()[0]
                return True

            _try_query(cur, _query_submissions, ["coding_schema.coding_submissions", "public.coding_submissions", "coding_submissions"])
            conn.close()
        except Exception as e:
            logger.warning(f"[DBManager] Failed to query coding_db: {e}")

    # ── 5. MongoDB Atlas (courses, coding problems, community) ─────────────
    mongo_uri = settings.mongo_uri or settings.course_mongo_uri
    if mongo_uri:
        try:
            m_client = MongoClient(mongo_uri, serverSelectionTimeoutMS=5000)

            # Courses
            try:
                course_coll = m_client["course_db"]["courses"]
                courses = list(course_coll.find({}, {"title": 1, "category": 1}).limit(20))
                stats["courses"]["total_courses"] = len(courses)
                stats["courses"]["course_titles"] = [c.get("title", "") for c in courses if c.get("title")]
            except Exception:
                pass

            # Coding Problems (MongoDB)
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

            m_client.close()
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
        f"• **Exams & Tests**: {e.get('total_exams', 0)} exams, {e.get('total_attempts', 0)} student attempts (Avg score: {e.get('avg_score', 0)})",
        f"• **Coding & DSA**: {c.get('total_problems', 0)} problems ({diff_str}), {c.get('total_submissions', 0)} submissions",
        f"• **Course Enrollments**: {en.get('total_enrollments', 0)} total ({en.get('completed_count', 0)} completed)",
        f"• **Community**: {comm.get('total_posts', 0)} discussion posts, {comm.get('total_comments', 0)} comments",
    ])

    return "\n".join(lines)

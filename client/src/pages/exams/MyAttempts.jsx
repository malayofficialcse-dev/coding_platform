import React, { useEffect, useState, useMemo } from "react";
import api from "../../api/api";
import { Link } from "react-router-dom";
import {
  FaClipboardList,
  FaCheckCircle,
  FaTimesCircle,
  FaSearch,
  FaEye,
  FaExclamationTriangle,
  FaShieldAlt,
  FaClock,
} from "react-icons/fa";
import "../admin/AdminExamList.css";

export default function MyAttempts() {
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    api
      .get("/attempts/my")
      .then((res) => setAttempts(res.data || []))
      .catch(() => setAttempts([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return attempts;
    return attempts.filter((a) => {
      const title = a.exam?.title || "";
      return title.toLowerCase().includes(term);
    });
  }, [attempts, search]);

  const stats = useMemo(() => {
    const total = attempts.length;
    let passed = 0;
    let totalScore = 0;
    attempts.forEach((a) => {
      totalScore += a.score || 0;
      // standard passing benchmark: 12 marks
      if ((a.score || 0) >= 12) {
        passed++;
      }
    });
    const failed = total - passed;
    const avgScore = total > 0 ? (totalScore / total).toFixed(1) : 0;
    return { total, passed, failed, avgScore };
  }, [attempts]);

  return (
    <div className="ael-shell">
      {/* Header */}
      <div className="ael-heading">
        <div>
          <div className="ael-eyebrow">Academic Records &amp; History</div>
          <h1>My Assessment Attempts</h1>
          <p>
            Review all completed assessments, scorecard results, and proctoring status records.
          </p>
        </div>
        <div className="ael-header-actions">
          <Link to="/exams" className="ael-action-btn-primary">
            Browse All Assessments
          </Link>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="ael-stat-grid">
        <div className="ael-stat-card">
          <span className="ael-stat-card-icon">
            <FaClipboardList />
          </span>
          <small>Total Taken</small>
          <strong>{stats.total}</strong>
          <span>Completed tests</span>
        </div>

        <div className="ael-stat-card green">
          <span className="ael-stat-card-icon">
            <FaCheckCircle />
          </span>
          <small>Passed</small>
          <strong>{stats.passed}</strong>
          <span>Qualified exams</span>
        </div>

        <div className="ael-stat-card orange">
          <span className="ael-stat-card-icon">
            <FaTimesCircle style={{ color: "#b91c1c" }} />
          </span>
          <small>Failed</small>
          <strong style={{ color: "#b91c1c" }}>{stats.failed}</strong>
          <span>Under threshold</span>
        </div>

        <div className="ael-stat-card purple">
          <span className="ael-stat-card-icon">
            <FaClock />
          </span>
          <small>Average Score</small>
          <strong>
            {stats.avgScore} <span style={{ fontSize: 13, fontWeight: 500 }}>pts</span>
          </strong>
          <span>Overall performance</span>
        </div>
      </div>

      {/* Search Bar Card */}
      <div className="ael-controls-card">
        <div className="ael-search-wrap">
          <FaSearch />
          <input
            type="text"
            className="ael-search-input"
            placeholder="Search your attempts by exam title…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="ael-counter-label">
          Showing {filtered.length} of {attempts.length} attempts
        </div>
      </div>

      {/* Attempts Table Card */}
      <div className="ael-table-card">
        <div className="ael-table-wrap">
          <table className="ael-table">
            <thead>
              <tr>
                <th style={{ width: "35%" }}>Assessment</th>
                <th style={{ width: "15%" }}>Score</th>
                <th style={{ width: "18%" }}>Result Status</th>
                <th style={{ width: "18%" }}>Proctoring Flag</th>
                <th style={{ width: "14%", textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5}>
                    <div className="ael-empty-box">
                      <div className="ael-empty-title">Loading your attempts…</div>
                      <div className="ael-empty-sub">Fetching past evaluation records</div>
                    </div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5}>
                    <div className="ael-empty-box">
                      <FaSearch />
                      <div className="ael-empty-title">No attempts recorded</div>
                      <div className="ael-empty-sub">
                        {search
                          ? `No attempts match "${search}".`
                          : "You have not completed any assessments yet."}
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((att) => {
                  const score = Number(att.score) || 0;
                  const isPass = score >= 12; // 40% benchmark
                  const dateStr = att.createdAt
                    ? new Date(att.createdAt).toLocaleDateString()
                    : "Recently";

                  return (
                    <tr key={att._id}>
                      <td>
                        <div className="ael-title-flex">
                          <div className="ael-avatar-icon">
                            <FaClipboardList />
                          </div>
                          <div>
                            <div className="ael-title-name">
                              {att.exam?.title || "Assessment"}
                            </div>
                            <div className="ael-meta-text">Submitted: {dateStr}</div>
                          </div>
                        </div>
                      </td>

                      <td>
                        <span className="ael-pill ael-pill-questions">
                          {score} Points
                        </span>
                      </td>

                      <td>
                        <span
                          className={`ael-pill ${
                            isPass ? "ael-pill-questions" : "ael-pill-duration"
                          }`}
                          style={
                            !isPass
                              ? { background: "#fee2e2", color: "#b91c1c", borderColor: "#fecaca" }
                              : {}
                          }
                        >
                          {isPass ? <FaCheckCircle size={10} /> : <FaTimesCircle size={10} />}
                          {isPass ? "QUALIFIED" : "NOT QUALIFIED"}
                        </span>
                      </td>

                      <td>
                        {att.cheatingLogged ? (
                          <span
                            className="ael-pill"
                            style={{ background: "#fee2e2", color: "#b91c1c", borderColor: "#fecaca" }}
                          >
                            <FaExclamationTriangle size={10} /> Flagged
                          </span>
                        ) : att.autoSubmitted ? (
                          <span
                            className="ael-pill"
                            style={{ background: "#fef3c7", color: "#92400e", borderColor: "#fde68a" }}
                          >
                            Auto-Submitted
                          </span>
                        ) : (
                          <span
                            className="ael-pill"
                            style={{ background: "#f0fdf4", color: "#166534", borderColor: "#bbf7d0" }}
                          >
                            <FaShieldAlt size={10} /> Verified
                          </span>
                        )}
                      </td>

                      <td>
                        <div className="ael-action-row">
                          <Link
                            to={`/result/${att._id}`}
                            className="ael-btn-sm edit"
                            title="View complete scorecard and question review"
                          >
                            <FaEye size={11} /> Scorecard
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

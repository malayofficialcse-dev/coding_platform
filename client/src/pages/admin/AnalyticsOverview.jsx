import React, { useEffect, useState, useMemo } from "react";
import api from "../../api/api";
import { Link } from "react-router-dom";
import { exportToExcel } from "../../utils/excelExport";
import {
  FaClipboardList,
  FaFileExcel,
  FaChartBar,
  FaQuestionCircle,
  FaClock,
  FaCheckCircle,
  FaSearch,
  FaUsers,
} from "react-icons/fa";
import "./AdminExamList.css";

export default function AnalyticsOverview() {
  const [exams, setExams] = useState([]);
  const [examStats, setExamStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await api.get("/exams");
        const examList = res.data || [];
        setExams(examList);

        // Fetch stats for each exam in parallel
        const statsMap = {};
        await Promise.all(
          examList.map(async (e) => {
            try {
              const sRes = await api.get(`/exams/${e._id}/analytics`);
              statsMap[e._id] = sRes.data;
            } catch {
              statsMap[e._id] = null;
            }
          })
        );
        setExamStats(statsMap);
      } catch (err) {
        console.error("Failed to load exams", err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleExport = () => {
    setExporting(true);
    try {
      const rows = exams.map((e, idx) => {
        const s = examStats[e._id];
        return {
          "S.No": idx + 1,
          "Exam Title": e.title || "N/A",
          "Total Questions": e.questions?.length || 0,
          "Duration (Minutes)": e.duration || 30,
          "Total Candidate Attempts": s?.totalAttempts ?? 0,
          "Average Score": s?.averageScore ?? 0,
          "Pass Count": s?.passCount ?? 0,
          "Fail Count": s?.failCount ?? 0,
          "Pass Percentage": `${s?.passPercentage ?? 0}%`,
          "Exam ID": e._id,
        };
      });

      exportToExcel({
        filename: "Assessments_Analytics_Overview",
        sheetName: "Overview",
        data: rows,
      });
    } catch (err) {
      alert("Export failed: " + err.message);
    } finally {
      setExporting(false);
    }
  };

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return exams;
    return exams.filter((e) => e.title?.toLowerCase().includes(term));
  }, [exams, search]);

  const globalStats = useMemo(() => {
    const totalExams = exams.length;
    let totalAttempts = 0;
    let totalPass = 0;
    let totalQuestions = 0;

    exams.forEach((e) => {
      totalQuestions += e.questions?.length || 0;
      const s = examStats[e._id];
      if (s) {
        totalAttempts += s.totalAttempts || 0;
        totalPass += s.passCount || 0;
      }
    });

    const passRate = totalAttempts > 0 ? ((totalPass / totalAttempts) * 100).toFixed(1) : 0;
    return { totalExams, totalAttempts, totalQuestions, passRate };
  }, [exams, examStats]);

  return (
    <div className="ael-shell">
      {/* Header */}
      <div className="ael-heading">
        <div>
          <div className="ael-eyebrow">Academic Reports &amp; Intelligence</div>
          <h1>All Exam Analytics Overview</h1>
          <p>
            Holistic assessment metrics, candidate attempt volume, and passing rates across all questionnaires.
          </p>
        </div>
        <div className="ael-header-actions">
          <button
            type="button"
            className="ael-action-btn-excel"
            onClick={handleExport}
            disabled={exporting || exams.length === 0}
          >
            <FaFileExcel />
            {exporting ? "Exporting…" : "Export Overview to Excel"}
          </button>
          <Link to="/admin/exams" className="ael-action-btn-primary">
            Manage Exams
          </Link>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="ael-stat-grid">
        <div className="ael-stat-card">
          <span className="ael-stat-card-icon">
            <FaClipboardList />
          </span>
          <small>Total Exams</small>
          <strong>{globalStats.totalExams}</strong>
          <span>Configured</span>
        </div>

        <div className="ael-stat-card purple">
          <span className="ael-stat-card-icon">
            <FaQuestionCircle />
          </span>
          <small>Total Questions</small>
          <strong>{globalStats.totalQuestions}</strong>
          <span>Question bank</span>
        </div>

        <div className="ael-stat-card">
          <span className="ael-stat-card-icon">
            <FaUsers />
          </span>
          <small>Total Submissions</small>
          <strong>{globalStats.totalAttempts}</strong>
          <span>Candidate attempts</span>
        </div>

        <div className="ael-stat-card green">
          <span className="ael-stat-card-icon">
            <FaCheckCircle />
          </span>
          <small>Overall Pass Rate</small>
          <strong style={{ color: "#15803d" }}>{globalStats.passRate}%</strong>
          <span>Across all tests</span>
        </div>
      </div>

      {/* Search Controls Card */}
      <div className="ael-controls-card">
        <div className="ael-search-wrap">
          <FaSearch />
          <input
            type="text"
            className="ael-search-input"
            placeholder="Search analytics by exam title…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="ael-counter-label">
          Showing {filtered.length} of {exams.length} assessments
        </div>
      </div>

      {/* Main Table Card */}
      <div className="ael-table-card">
        <div className="ael-table-wrap">
          <table className="ael-table">
            <thead>
              <tr>
                <th style={{ width: "32%" }}>Assessment</th>
                <th style={{ width: "12%" }}>Questions</th>
                <th style={{ width: "12%" }}>Duration</th>
                <th style={{ width: "14%" }}>Submissions</th>
                <th style={{ width: "16%" }}>Pass Rate</th>
                <th style={{ width: "14%", textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6}>
                    <div className="ael-empty-box">
                      <div className="ael-empty-title">Loading analytics…</div>
                      <div className="ael-empty-sub">Aggregating candidate records</div>
                    </div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <div className="ael-empty-box">
                      <FaSearch />
                      <div className="ael-empty-title">No assessments found</div>
                      <div className="ael-empty-sub">Try searching for another topic.</div>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((e) => {
                  const s = examStats[e._id];
                  const qCount = e.questions?.length || 0;
                  const durationMins = e.duration || 30;
                  const attemptsCount = s?.totalAttempts ?? 0;
                  const passPct = s?.passPercentage ?? 0;

                  return (
                    <tr key={e._id}>
                      <td>
                        <div className="ael-title-flex">
                          <div className="ael-avatar-icon">
                            <FaClipboardList />
                          </div>
                          <div>
                            <div className="ael-title-name">{e.title}</div>
                            <div className="ael-meta-text">ID: {e._id.slice(-6)}</div>
                          </div>
                        </div>
                      </td>

                      <td>
                        <span className="ael-pill ael-pill-questions">
                          <FaQuestionCircle size={10} />
                          {qCount} Qs
                        </span>
                      </td>

                      <td>
                        <span className="ael-pill ael-pill-duration">
                          <FaClock size={10} />
                          {durationMins}m
                        </span>
                      </td>

                      <td>
                        <strong style={{ fontSize: 13, color: "#172033" }}>
                          {attemptsCount}
                        </strong>{" "}
                        <span style={{ fontSize: 11, color: "#697687" }}>attempts</span>
                      </td>

                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span
                            className="ael-pill"
                            style={{
                              background: passPct >= 60 ? "#dcfce7" : "#fee2e2",
                              color: passPct >= 60 ? "#15803d" : "#b91c1c",
                              borderColor: passPct >= 60 ? "#bbf7d0" : "#fecaca",
                            }}
                          >
                            {passPct}% Pass
                          </span>
                        </div>
                      </td>

                      <td>
                        <div className="ael-action-row">
                          <Link
                            to={`/admin/exams/analytics/${e._id}`}
                            className="ael-btn-sm analytics"
                            title="View candidate breakdown, charts & score distribution"
                          >
                            <FaChartBar size={11} /> Analytics
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

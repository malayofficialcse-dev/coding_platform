import React, { useEffect, useState, useMemo } from "react";
import api from "../../api/api";
import { Link } from "react-router-dom";
import { exportToExcel } from "../../utils/excelExport";
import {
  FaFileExcel,
  FaPlus,
  FaEdit,
  FaChartBar,
  FaTrashAlt,
  FaSearch,
  FaClipboardList,
  FaQuestionCircle,
  FaClock,
  FaCheckCircle,
} from "react-icons/fa";
import "./AdminExamList.css";

export default function AdminExamList() {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [exporting, setExporting] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchExams = async () => {
    setLoading(true);
    try {
      const res = await api.get("/admin/exams");
      setExams(res.data || []);
    } catch (err) {
      showToast("Failed to load exams", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExams();
  }, []);

  const remove = async (id, title) => {
    if (!window.confirm(`Are you sure you want to delete the exam "${title}"?`)) return;
    try {
      await api.delete(`/admin/exams/${id}`);
      setExams((prev) => prev.filter((x) => x._id !== id));
      showToast(`Exam "${title}" deleted successfully.`);
    } catch (err) {
      showToast("Delete failed. Please try again.", "error");
    }
  };

  const handleExport = () => {
    setExporting(true);
    try {
      const data = exams.map((e, idx) => ({
        "S.No": idx + 1,
        "Title": e.title || "N/A",
        "Description": e.description || "N/A",
        "Total Questions": Array.isArray(e.questions) ? e.questions.length : 0,
        "Duration (Minutes)": e.duration || 30,
        "Status": "Active",
        "Created At": e.createdAt ? new Date(e.createdAt).toLocaleString() : "N/A",
        "Exam ID": e._id,
      }));

      exportToExcel({
        filename: "All_Exams_List",
        sheetName: "All Exams",
        data,
      });

      showToast(`Exported ${exams.length} exams to Excel!`);
    } catch (err) {
      showToast("Failed to export exams: " + err.message, "error");
    } finally {
      setExporting(false);
    }
  };

  // Filtered exams
  const filtered = useMemo(() => {
    return exams.filter((e) => {
      const term = search.trim().toLowerCase();
      if (!term) return true;
      return (
        (e.title && e.title.toLowerCase().includes(term)) ||
        (e.description && e.description.toLowerCase().includes(term))
      );
    });
  }, [exams, search]);

  // Summary Metrics
  const stats = useMemo(() => {
    const total = exams.length;
    const totalQuestions = exams.reduce((acc, curr) => acc + (curr.questions?.length || 0), 0);
    const avgDuration = total > 0 ? Math.round(exams.reduce((acc, curr) => acc + (curr.duration || 30), 0) / total) : 0;
    return {
      total,
      totalQuestions,
      avgDuration,
    };
  }, [exams]);

  return (
    <div className="ael-shell">
      {/* Toast Notification */}
      {toast && (
        <div className={`ael-toast ael-toast-${toast.type}`}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="ael-heading">
        <div>
          <div className="ael-eyebrow">Assessments &amp; Testing</div>
          <h1>All Exams</h1>
          <p>
            Manage assessment questionnaires, configure test timings, and inspect performance analytics.
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
            {exporting ? "Exporting…" : "Export to Excel"}
          </button>
          <Link to="/admin/create" className="ael-action-btn-primary">
            <FaPlus /> Create New Exam
          </Link>
        </div>
      </div>

      {/* Stats Overview Grid (Matching Profile.css Stat Grid) */}
      <div className="ael-stat-grid">
        <div className="ael-stat-card">
          <span className="ael-stat-card-icon"><FaClipboardList /></span>
          <small>Total Exams</small>
          <strong>{stats.total}</strong>
          <span>Configured</span>
        </div>

        <div className="ael-stat-card purple">
          <span className="ael-stat-card-icon"><FaQuestionCircle /></span>
          <small>Total Questions</small>
          <strong>{stats.totalQuestions}</strong>
          <span>Question bank</span>
        </div>

        <div className="ael-stat-card orange">
          <span className="ael-stat-card-icon"><FaClock /></span>
          <small>Avg Duration</small>
          <strong>{stats.avgDuration} <span style={{ fontSize: "13px", fontWeight: 600 }}>min</span></strong>
          <span>Standard session</span>
        </div>

        <div className="ael-stat-card green">
          <span className="ael-stat-card-icon"><FaCheckCircle /></span>
          <small>System Status</small>
          <strong style={{ color: "#15803d" }}>Active</strong>
          <span>Proctoring ready</span>
        </div>
      </div>

      {/* Search & Counter Controls Card */}
      <div className="ael-controls-card">
        <div className="ael-search-wrap">
          <FaSearch />
          <input
            type="text"
            className="ael-search-input"
            placeholder="Search exams by title or description…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="ael-counter-label">
          Showing {filtered.length} of {exams.length} exams
        </div>
      </div>

      {/* Main Table Card */}
      <div className="ael-table-card">
        <div className="ael-table-wrap">
          <table className="ael-table">
            <thead>
              <tr>
                <th style={{ width: "34%" }}>Exam</th>
                <th style={{ width: "32%" }}>Description</th>
                <th style={{ width: "12%" }}>Questions</th>
                <th style={{ width: "10%" }}>Duration</th>
                <th style={{ width: "12%", textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5}>
                    <div className="ael-empty-box">
                      <div className="ael-empty-title">Loading Exams…</div>
                      <div className="ael-empty-sub">Fetching assessment catalog from database</div>
                    </div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5}>
                    <div className="ael-empty-box">
                      <FaSearch />
                      <div className="ael-empty-title">No exams found</div>
                      <div className="ael-empty-sub">
                        {search ? `No exams match "${search}". Try searching for another topic.` : "No exams are currently available."}
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((e) => {
                  const questionCount = e.questions?.length || 0;
                  const durationMins = e.duration || 30;

                  return (
                    <tr key={e._id}>
                      <td>
                        <div className="ael-title-flex">
                          <div className="ael-avatar-icon">
                            <FaClipboardList />
                          </div>
                          <div>
                            <div className="ael-title-name">{e.title}</div>
                            <div className="ael-meta-text">
                              ID: {e._id.slice(-6)}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td>
                        <div className="ael-desc-text" title={e.description}>
                          {e.description || "No description provided for this assessment."}
                        </div>
                      </td>

                      <td>
                        <span className="ael-pill ael-pill-questions">
                          <FaQuestionCircle size={11} />
                          {questionCount} Qs
                        </span>
                      </td>

                      <td>
                        <span className="ael-pill ael-pill-duration">
                          <FaClock size={11} />
                          {durationMins}m
                        </span>
                      </td>

                      <td>
                        <div className="ael-action-row">
                          <Link
                            to={`/admin/exams/${e._id}`}
                            className="ael-btn-sm edit"
                            title="Edit questions and exam settings"
                          >
                            <FaEdit size={11} />
                            Edit
                          </Link>
                          <Link
                            to={`/admin/exams/analytics/${e._id}`}
                            className="ael-btn-sm analytics"
                            title="View student attempts and score analytics"
                          >
                            <FaChartBar size={11} />
                            Analytics
                          </Link>
                          <button
                            type="button"
                            className="ael-btn-sm delete"
                            title="Delete this exam"
                            onClick={() => remove(e._id, e.title)}
                          >
                            <FaTrashAlt size={11} />
                            Delete
                          </button>
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

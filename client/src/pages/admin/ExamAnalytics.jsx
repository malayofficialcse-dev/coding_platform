import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../../api/api";
import { Bar, Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  BarElement,
  ArcElement,
  CategoryScale,
  LinearScale,
} from "chart.js";
import {
  FaArrowLeft,
  FaFileExcel,
  FaUsers,
  FaChartLine,
  FaCheckCircle,
  FaAward,
  FaSpinner,
} from "react-icons/fa";
import { exportToExcel } from "../../utils/excelExport";
import "./ExamAnalytics.css";

ChartJS.register(
  Title,
  Tooltip,
  Legend,
  BarElement,
  ArcElement,
  CategoryScale,
  LinearScale
);

export default function ExamAnalytics() {
  const { id } = useParams();
  const [analytics, setAnalytics] = useState(null);
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [resAnalytics, resAttempts] = await Promise.allSettled([
          api.get(`/exams/${id}/analytics`),
          api.get(`/attempts/exam/${id}`),
        ]);

        if (resAnalytics.status === "fulfilled") {
          setAnalytics(resAnalytics.value.data);
        } else {
          setAnalytics(null);
        }

        if (resAttempts.status === "fulfilled" && Array.isArray(resAttempts.value.data)) {
          setAttempts(resAttempts.value.data);
        } else {
          setAttempts([]);
        }
      } catch (err) {
        setAnalytics(null);
        setAttempts([]);
      }
      setLoading(false);
    };
    fetchData();
  }, [id]);

  const handleExport = () => {
    if (!analytics) return;
    setExporting(true);
    try {
      const summaryData = [
        {
          "Exam Title": analytics.title || "N/A",
          "Total Attempts": analytics.totalAttempts ?? 0,
          "Average Score": analytics.averageScore ?? 0,
          "Highest Score": analytics.highestScore ?? 0,
          "Lowest Score": analytics.lowestScore ?? 0,
          "Pass Percentage": `${analytics.passPercentage ?? 0}%`,
          "Passed Candidates": analytics.passCount ?? 0,
          "Failed Candidates": analytics.failCount ?? 0,
          "Passing Marks": analytics.passingMarks ?? 0,
          "Total Questions": analytics.totalQuestions ?? 0,
          "Exam ID": id,
        },
      ];

      const attemptsData = attempts.map((a, idx) => {
        const studentScore = a.score ?? 0;
        const totalQ = analytics.totalQuestions || 1;
        const pct = ((studentScore / totalQ) * 100).toFixed(1);
        const isPass = studentScore >= (analytics.passingMarks || 0);

        return {
          "S.No": idx + 1,
          "Student Name": a.user?.name || a.user?.username || "N/A",
          "Student Email": a.user?.email || "N/A",
          "Score": studentScore,
          "Out of": analytics.totalQuestions,
          "Percentage": `${pct}%`,
          "Result": isPass ? "PASS" : "FAIL",
          "Warnings Count": a.warningsCount || 0,
          "Auto Submitted": a.autoSubmitted ? "Yes" : "No",
          "Cheating Flagged": a.cheatingLogged ? "Yes" : "No",
          "Submitted On": a.createdAt ? new Date(a.createdAt).toLocaleString() : "N/A",
          "Attempt ID": a._id,
        };
      });

      const sanitizedTitle = (analytics.title || "Exam").replace(/\s+/g, "_");

      exportToExcel({
        filename: `${sanitizedTitle}_Full_Analytics`,
        sheets: [
          { sheetName: "Analytics Summary", data: summaryData },
          {
            sheetName: "Candidate Results",
            data: attemptsData.length > 0 ? attemptsData : [{ "Notice": "No candidate attempts recorded yet" }],
          },
        ],
      });
    } catch (err) {
      alert("Failed to export analytics to Excel: " + err.message);
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="exa-shell">
        <div style={{ textAlign: "center", padding: "60px 20px" }}>
          <FaSpinner className="spin" size={24} style={{ color: "#0078d4", marginBottom: 12 }} />
          <div style={{ fontWeight: 600 }}>Loading analytics…</div>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="exa-shell">
        <div className="exa-heading">
          <div>
            <div className="exa-eyebrow">Assessments &amp; Testing</div>
            <h1>Exam Analytics</h1>
          </div>
          <Link to="/admin/exams" className="exa-back-link">
            <FaArrowLeft /> Back to All Exams
          </Link>
        </div>
        <div className="exa-chart-card" style={{ textAlign: "center", padding: "40px 20px" }}>
          <div style={{ fontWeight: 600, color: "#697687" }}>
            No analytics data found for this assessment.
          </div>
        </div>
      </div>
    );
  }

  const scoreData = {
    labels: ["Average", "Highest", "Lowest"],
    datasets: [
      {
        label: "Scores",
        data: [
          Number(analytics.averageScore) || 0,
          Number(analytics.highestScore) || 0,
          Number(analytics.lowestScore) || 0,
        ],
        backgroundColor: ["#0078d4", "#15803d", "#b91c1c"],
        borderRadius: 4,
      },
    ],
  };

  const passFailData = {
    labels: ["Pass", "Fail"],
    datasets: [
      {
        data: [analytics.passCount || 0, analytics.failCount || 0],
        backgroundColor: ["#15803d", "#b91c1c"],
      },
    ],
  };

  return (
    <div className="exa-shell">
      {/* Header */}
      <div className="exa-heading">
        <div>
          <div className="exa-eyebrow">Assessments &amp; Performance</div>
          <h1>{analytics.title}</h1>
          <p>
            Detailed performance breakdown, candidate distribution, and assessment outcome metrics.
          </p>
        </div>
        <div className="exa-header-actions">
          <Link to="/admin/exams" className="exa-back-link">
            <FaArrowLeft /> Back to Exams
          </Link>
          <button
            type="button"
            className="ael-action-btn-excel"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              minHeight: 34,
              padding: "0 14px",
              border: "1px solid #b7e4c7",
              borderRadius: 4,
              background: "#e8f5ec",
              color: "#166534",
              fontSize: 12,
              fontWeight: 700,
              cursor: "pointer",
            }}
            onClick={handleExport}
            disabled={exporting}
          >
            <FaFileExcel />
            {exporting ? "Exporting…" : "Export to Excel"}
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="exa-stat-grid">
        <div className="exa-stat-card">
          <span className="exa-stat-icon"><FaUsers /></span>
          <small>Total Attempts</small>
          <strong>{analytics.totalAttempts}</strong>
          <span>Recorded submissions</span>
        </div>

        <div className="exa-stat-card purple">
          <span className="exa-stat-icon"><FaChartLine /></span>
          <small>Average Score</small>
          <strong>
            {analytics.averageScore} <span style={{ fontSize: 13, fontWeight: 500 }}>/ {analytics.totalQuestions}</span>
          </strong>
          <span>Across all candidates</span>
        </div>

        <div className="exa-stat-card green">
          <span className="exa-stat-icon"><FaCheckCircle /></span>
          <small>Pass Percentage</small>
          <strong>{analytics.passPercentage}%</strong>
          <span>Passing mark: {analytics.passingMarks}</span>
        </div>

        <div className="exa-stat-card orange">
          <span className="exa-stat-icon"><FaAward /></span>
          <small>High / Low</small>
          <strong>
            {analytics.highestScore} <span style={{ fontSize: 13, fontWeight: 500 }}>/ {analytics.lowestScore}</span>
          </strong>
          <span>Peak vs minimum</span>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="exa-charts-grid">
        <div className="exa-chart-card">
          <div className="exa-card-title">
            <span>Score Distribution</span>
            <span style={{ fontSize: 11, color: "#697687", fontWeight: 500 }}>Overview</span>
          </div>
          <div style={{ height: 260 }}>
            <Bar data={scoreData} options={{ responsive: true, maintainAspectRatio: false }} />
          </div>
        </div>

        <div className="exa-chart-card">
          <div className="exa-card-title">
            <span>Pass vs Fail Candidates</span>
            <span style={{ fontSize: 11, color: "#697687", fontWeight: 500 }}>
              {analytics.passCount} passed &bull; {analytics.failCount} failed
            </span>
          </div>
          <div style={{ height: 260, display: "flex", justifyContent: "center" }}>
            <Doughnut data={passFailData} options={{ responsive: true, maintainAspectRatio: false }} />
          </div>
        </div>
      </div>

      {/* Student Submissions Table Card */}
      {attempts.length > 0 && (
        <div className="exa-table-card">
          <div className="exa-table-header">
            <h3>Candidate Submissions ({attempts.length})</h3>
            <span style={{ fontSize: 11, color: "#697687", fontWeight: 600 }}>
              Chronological log
            </span>
          </div>
          <div className="exa-table-wrap">
            <table className="exa-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Email</th>
                  <th>Score</th>
                  <th>Result</th>
                  <th>Warnings</th>
                  <th>Submitted At</th>
                </tr>
              </thead>
              <tbody>
                {attempts.map((att) => {
                  const isPass = att.score >= (analytics.passingMarks || 0);
                  return (
                    <tr key={att._id}>
                      <td style={{ fontWeight: 600 }}>
                        {att.user?.name || att.user?.username || "N/A"}
                      </td>
                      <td>{att.user?.email || "N/A"}</td>
                      <td>
                        <span className="exa-badge-score">
                          {att.score} / {analytics.totalQuestions}
                        </span>
                      </td>
                      <td>
                        <span className={isPass ? "exa-badge-pass" : "exa-badge-fail"}>
                          {isPass ? "Pass" : "Fail"}
                        </span>
                      </td>
                      <td>{att.warningsCount || 0}</td>
                      <td style={{ color: "#697687", fontSize: 12 }}>
                        {att.createdAt ? new Date(att.createdAt).toLocaleString() : "N/A"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

import React, { useEffect, useState, useMemo } from "react";
import api from "../../api/api";
import { Link } from "react-router-dom";
import ExportExcelButton from "../../components/ExportExcelButton";
import * as XLSX from "xlsx";
import { Bar, Pie, Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
} from "chart.js";
import {
  FaArrowLeft,
  FaCheckCircle,
  FaTimesCircle,
  FaChartPie,
  FaCode,
  FaCalendarAlt,
  FaTrophy,
} from "react-icons/fa";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  PointElement,
  LineElement,
  Tooltip,
  Legend
);

const PIE_COLORS = [
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
  "#06b6d4",
  "#14b8a6",
  "#f97316",
  "#6366f1",
  "#84cc16",
  "#eab308",
];

export default function CodingAnalytics() {
  const [submissions, setSubmissions] = useState([]);
  const [problems, setProblems] = useState([]);
  const [topics, setTopics] = useState({});
  const [statusFilter, setStatusFilter] = useState("all");
  const [exporting, setExporting] = useState(false);
  const [searchFilter, setSearchFilter] = useState("");

  useEffect(() => {
    api
      .get("/coding/submissions/my")
      .then((res) => setSubmissions(res.data || []))
      .catch((err) => console.error(err));

    api
      .get("/coding/problems")
      .then((res) => {
        const list = res.data || [];
        setProblems(list);
        const topicMap = {};
        list.forEach((p) => {
          topicMap[p._id] = p.dsaTopic || "General";
        });
        setTopics(topicMap);
      })
      .catch((err) => console.error(err));
  }, []);

  // Solved and wrong stats
  const solved = useMemo(() => submissions.filter((s) => s.result === "Accepted"), [submissions]);
  const wrong = useMemo(() => submissions.filter((s) => s.result !== "Accepted"), [submissions]);
  const uniqueSolvedProblems = useMemo(() => {
    return new Set(solved.map((s) => (s.problem?._id || s.problem))).size;
  }, [solved]);

  const acceptanceRate = useMemo(() => {
    if (submissions.length === 0) return 0;
    return Math.round((solved.length / submissions.length) * 100);
  }, [solved, submissions]);

  // Topic distribution
  const solvedTopics = useMemo(() => {
    const counts = {};
    solved.forEach((s) => {
      const pId = s.problem?._id || s.problem;
      const topic = s.problem?.dsaTopic || topics[pId] || "General";
      counts[topic] = (counts[topic] || 0) + 1;
    });
    return counts;
  }, [solved, topics]);

  const pieLabels = Object.keys(solvedTopics);
  const pieData = {
    labels: pieLabels.length ? pieLabels : ["No Solved Topics"],
    datasets: [
      {
        data: pieLabels.length ? Object.values(solvedTopics) : [1],
        backgroundColor: pieLabels.length ? PIE_COLORS.slice(0, pieLabels.length) : ["#64748b"],
        borderWidth: 2,
        borderColor: "rgba(255, 255, 255, 0.1)",
      },
    ],
  };

  const barData = {
    labels: Object.keys(solvedTopics),
    datasets: [
      {
        label: "Accepted Submissions",
        data: Object.values(solvedTopics),
        backgroundColor: "#3b82f6",
        borderRadius: 6,
      },
    ],
  };

  // Progression timeline
  const sortedSubs = useMemo(() => {
    return [...submissions].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  }, [submissions]);

  const lineLabels = sortedSubs.map((s) => new Date(s.createdAt).toLocaleDateString());
  const lineSolved = [];
  let solvedCount = 0;
  sortedSubs.forEach((s) => {
    if (s.result === "Accepted") solvedCount++;
    lineSolved.push(solvedCount);
  });

  const lineData = {
    labels: lineLabels,
    datasets: [
      {
        label: "Cumulative Solved",
        data: lineSolved,
        fill: true,
        borderColor: "#10b981",
        backgroundColor: "rgba(16, 185, 129, 0.12)",
        tension: 0.3,
        pointRadius: 4,
        pointBackgroundColor: "#10b981",
      },
    ],
  };

  // Filtered submissions
  const filteredSubmissions = useMemo(() => {
    return submissions.filter((s) => {
      const pTitle = s.problem?.title || problems.find((p) => p._id === s.problem)?.title || "Problem";
      const matchesSearch = !searchFilter || pTitle.toLowerCase().includes(searchFilter.toLowerCase());
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "accepted" && s.result === "Accepted") ||
        (statusFilter === "failed" && s.result !== "Accepted");
      return matchesSearch && matchesStatus;
    });
  }, [submissions, problems, searchFilter, statusFilter]);

  const handleExportExcel = () => {
    try {
      setExporting(true);
      const rows = filteredSubmissions.map((s, idx) => {
        const pTitle = s.problem?.title || problems.find((p) => p._id === s.problem)?.title || s.problem;
        return {
          "SL No": idx + 1,
          "Problem Title": pTitle,
          "Language": s.language || "Unknown",
          "Result Status": s.result || "Unknown",
          "Passed Test Cases": s.passedCount ?? 0,
          "Total Test Cases": s.totalCount ?? 0,
          "Plagiarism Score": s.plagiarism ? `${s.plagiarism}%` : "0%",
          "Submission Date": new Date(s.createdAt).toLocaleString(),
        };
      });

      const worksheet = XLSX.utils.json_to_sheet(rows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Submissions History");
      XLSX.writeFile(workbook, `coding_submissions_${Date.now()}.xlsx`);
    } catch (err) {
      console.error(err);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="container py-4 cc-list-page" style={{ maxWidth: "1280px" }}>
      {/* Top Header */}
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
        <div>
          <Link to="/coding" className="text-decoration-none text-muted d-inline-flex align-items-center gap-2 mb-2">
            <FaArrowLeft /> Back to Coding Problems
          </Link>
          <h1 className="fw-bold mb-1" style={{ fontSize: "2rem" }}>
            My Coding Analytics
          </h1>
          <p className="text-muted mb-0">
            Track your submission history, problem solving performance, and topic distribution.
          </p>
        </div>

        <div className="d-flex align-items-center gap-2">
          <ExportExcelButton
            onClick={handleExportExcel}
            loading={exporting}
            label="Export Submissions"
            variant="dark-excel"
          />
        </div>
      </div>

      {/* KPI Cards */}
      <div className="row g-3 mb-4">
        <div className="col-md-3 col-6">
          <div className="card h-100 p-3 shadow-sm border" style={{ background: "var(--cc-surface, #1e293b)" }}>
            <span className="text-muted text-uppercase fw-semibold" style={{ fontSize: "0.75rem" }}>
              Total Submissions
            </span>
            <div className="fs-3 fw-bold my-1 text-primary">{submissions.length}</div>
            <span className="text-muted" style={{ fontSize: "0.8rem" }}>
              Code runs & submissions
            </span>
          </div>
        </div>

        <div className="col-md-3 col-6">
          <div className="card h-100 p-3 shadow-sm border" style={{ background: "var(--cc-surface, #1e293b)" }}>
            <span className="text-muted text-uppercase fw-semibold" style={{ fontSize: "0.75rem" }}>
              Problems Solved
            </span>
            <div className="fs-3 fw-bold my-1 text-success">{uniqueSolvedProblems}</div>
            <span className="text-muted" style={{ fontSize: "0.8rem" }}>
              Unique challenges completed
            </span>
          </div>
        </div>

        <div className="col-md-3 col-6">
          <div className="card h-100 p-3 shadow-sm border" style={{ background: "var(--cc-surface, #1e293b)" }}>
            <span className="text-muted text-uppercase fw-semibold" style={{ fontSize: "0.75rem" }}>
              Acceptance Rate
            </span>
            <div className="fs-3 fw-bold my-1 text-info">{acceptanceRate}%</div>
            <span className="text-muted" style={{ fontSize: "0.8rem" }}>
              {solved.length} accepted of {submissions.length} total
            </span>
          </div>
        </div>

        <div className="col-md-3 col-6">
          <div className="card h-100 p-3 shadow-sm border" style={{ background: "var(--cc-surface, #1e293b)" }}>
            <span className="text-muted text-uppercase fw-semibold" style={{ fontSize: "0.75rem" }}>
              Top DSA Topic
            </span>
            <div className="fs-4 fw-bold my-1 text-warning text-truncate">
              {pieLabels[0] || "—"}
            </div>
            <span className="text-muted" style={{ fontSize: "0.8rem" }}>
              Most practiced category
            </span>
          </div>
        </div>
      </div>

      {/* Visual Charts */}
      <div className="row g-4 mb-4">
        <div className="col-lg-5">
          <div className="card p-3 shadow-sm border h-100" style={{ background: "var(--cc-surface, #1e293b)" }}>
            <h5 className="fw-bold mb-3 d-flex align-items-center gap-2">
              <FaChartPie className="text-primary" />
              <span>Solved Topics Distribution</span>
            </h5>
            <div style={{ height: "300px", display: "grid", placeItems: "center" }}>
              <Pie
                data={pieData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: "bottom",
                      labels: { color: "var(--cc-text, #f1f5f9)", font: { size: 12 } },
                    },
                  },
                }}
              />
            </div>
          </div>
        </div>

        <div className="col-lg-7">
          <div className="card p-3 shadow-sm border h-100" style={{ background: "var(--cc-surface, #1e293b)" }}>
            <h5 className="fw-bold mb-3 d-flex align-items-center gap-2">
              <FaCode className="text-success" />
              <span>Accepted Solutions by Topic</span>
            </h5>
            <div style={{ height: "300px" }}>
              <Bar
                data={barData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { display: false },
                  },
                  scales: {
                    x: { ticks: { color: "var(--cc-muted, #94a3b8)" } },
                    y: { ticks: { color: "var(--cc-muted, #94a3b8)" }, beginAtZero: true },
                  },
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Timeline Chart */}
      <div className="card p-3 shadow-sm border mb-4" style={{ background: "var(--cc-surface, #1e293b)" }}>
        <h5 className="fw-bold mb-3 d-flex align-items-center gap-2">
          <FaCalendarAlt className="text-info" />
          <span>Cumulative Progress Over Time</span>
        </h5>
        <div style={{ height: "260px" }}>
          <Line
            data={lineData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  labels: { color: "var(--cc-text, #f1f5f9)" },
                },
              },
              scales: {
                x: { ticks: { color: "var(--cc-muted, #94a3b8)" } },
                y: { ticks: { color: "var(--cc-muted, #94a3b8)" }, beginAtZero: true },
              },
            }}
          />
        </div>
      </div>

      {/* Submissions History Table */}
      <div className="card p-3 shadow-sm border" style={{ background: "var(--cc-surface, #1e293b)" }}>
        <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
          <h5 className="fw-bold mb-0">All Submissions ({filteredSubmissions.length})</h5>
          <div className="d-flex gap-2">
            <input
              type="text"
              placeholder="Search by problem..."
              className="form-control form-control-sm"
              style={{ width: "200px" }}
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
            />
            <select
              className="form-select form-select-sm w-auto"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Results</option>
              <option value="accepted">Accepted Only</option>
              <option value="failed">Errors / Wrong Only</option>
            </select>
          </div>
        </div>

        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead>
              <tr>
                <th>Problem</th>
                <th>Language</th>
                <th>Status</th>
                <th>Passed</th>
                <th>Date</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredSubmissions.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-4 text-muted">
                    No submissions found matching criteria.
                  </td>
                </tr>
              ) : (
                filteredSubmissions.map((s) => {
                  const pTitle =
                    s.problem?.title ||
                    problems.find((p) => p._id === s.problem)?.title ||
                    "Challenge";
                  const pId = s.problem?._id || s.problem;
                  return (
                    <tr key={s._id}>
                      <td className="fw-semibold">{pTitle}</td>
                      <td>{s.language}</td>
                      <td>
                        <span
                          className={`badge ${
                            s.result === "Accepted" ? "bg-success" : "bg-danger"
                          }`}
                        >
                          {s.result}
                        </span>
                      </td>
                      <td>
                        {s.passedCount ?? 0} / {s.totalCount ?? 0}
                      </td>
                      <td>{new Date(s.createdAt).toLocaleString()}</td>
                      <td>
                        <Link
                          to={`/coding/problems/${pId}`}
                          className="btn btn-sm btn-outline-primary"
                        >
                          Solve
                        </Link>
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

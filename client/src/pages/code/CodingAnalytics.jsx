import React, { useEffect, useState, useMemo, useContext } from "react";
import api from "../../api/api";
import { Link } from "react-router-dom";
import { AuthContext } from "../../contexts/AuthContext";
import ExportExcelButton from "../../components/ExportExcelButton";
import * as XLSX from "xlsx";
import { Bar, Pie, Doughnut, Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import {
  FaArrowLeft,
  FaCheckCircle,
  FaTimesCircle,
  FaClock,
  FaChartPie,
  FaChartBar,
  FaCode,
  FaCalendarAlt,
  FaTrophy,
  FaFire,
  FaUserGraduate,
  FaTimes,
  FaCopy,
  FaExternalLinkAlt,
  FaFilter,
} from "react-icons/fa";
import "./CodingAnalytics.css";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const DIFFICULTY_CONFIG = {
  Basic: { color: "#38bdf8", bg: "rgba(56, 189, 248, 0.2)", label: "Basic" },
  Easy: { color: "#10b981", bg: "rgba(16, 185, 129, 0.2)", label: "Easy" },
  Medium: { color: "#f59e0b", bg: "rgba(245, 158, 11, 0.2)", label: "Medium" },
  Hard: { color: "#ef4444", bg: "rgba(239, 68, 68, 0.2)", label: "Hard" },
};

const VERDICT_COLORS = {
  Accepted: "#10b981",
  "Wrong Answer": "#ef4444",
  "Time Limit Exceeded": "#f59e0b",
  "Runtime Error": "#8b5cf6",
  "Compilation Error": "#64748b",
};

const LANGUAGE_COLORS = {
  javascript: "#f7df1e",
  python: "#38bdf8",
  cpp: "#6366f1",
  c: "#93c5fd",
  java: "#f97316",
  go: "#06b6d4",
  ruby: "#ec4899",
  other: "#a855f7",
};

export default function CodingAnalytics() {
  const { user: currentUser } = useContext(AuthContext);

  const [problems, setProblems] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [studentsList, setStudentsList] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  // Filters for Submissions Table
  const [searchFilter, setSearchFilter] = useState("");
  const [diffFilter, setDiffFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [langFilter, setLangFilter] = useState("all");

  // Code inspection modal state
  const [inspectModalSub, setInspectModalSub] = useState(null);
  const [copiedCode, setCopiedCode] = useState(false);

  // 1. Initial Load: Fetch Problems & Students Leaderboard
  useEffect(() => {
    // Problems
    api
      .get("/coding/problems")
      .then((res) => setProblems(res.data || []))
      .catch((err) => console.error("Error loading problems:", err));

    // Leaderboard / Student list
    api
      .get("/coding/submissions/leaderboard")
      .then((res) => {
        const list = res.data || [];
        setStudentsList(list);
      })
      .catch((err) => {
        console.warn("Leaderboard not accessible or empty:", err);
      });
  }, []);

  // Set default student ID to current user once currentUser is ready
  useEffect(() => {
    if (currentUser && !selectedStudentId) {
      setSelectedStudentId(currentUser._id || currentUser.id || "");
    }
  }, [currentUser, selectedStudentId]);

  // 2. Fetch submissions for the selected student
  useEffect(() => {
    if (!selectedStudentId && !currentUser) return;

    setLoading(true);
    const isSelf =
      currentUser &&
      (selectedStudentId === currentUser._id ||
        selectedStudentId === currentUser.id ||
        !selectedStudentId);

    const endpoint = isSelf
      ? "/coding/submissions/my"
      : `/coding/submissions/user/${selectedStudentId}`;

    api
      .get(endpoint)
      .then((res) => {
        setSubmissions(res.data || []);
      })
      .catch((err) => {
        console.error("Failed to load submissions for user:", err);
        // Fallback to my submissions if user endpoint fails
        if (!isSelf) {
          api
            .get("/coding/submissions/my")
            .then((res) => setSubmissions(res.data || []))
            .catch(() => {});
        }
      })
      .finally(() => setLoading(false));
  }, [selectedStudentId, currentUser]);

  // Selected student metadata
  const selectedStudentMeta = useMemo(() => {
    if (
      currentUser &&
      (selectedStudentId === currentUser._id ||
        selectedStudentId === currentUser.id ||
        !selectedStudentId)
    ) {
      return {
        name: currentUser.name || "My Account",
        email: currentUser.email || "",
        role: currentUser.role || "student",
        isSelf: true,
      };
    }
    const found = studentsList.find((s) => s._id === selectedStudentId);
    if (found) {
      return {
        name: found.name,
        email: found.email,
        role: "student",
        isSelf: false,
      };
    }
    return {
      name: "Selected Student",
      email: "",
      role: "student",
      isSelf: false,
    };
  }, [selectedStudentId, currentUser, studentsList]);

  // Map problems by ID for quick lookup
  const problemMap = useMemo(() => {
    const map = {};
    problems.forEach((p) => {
      map[String(p._id)] = p;
    });
    return map;
  }, [problems]);

  // Solved Submissions & Solved Unique Problems
  const solvedSubmissions = useMemo(
    () => submissions.filter((s) => s.result === "Accepted"),
    [submissions]
  );

  const solvedProblemIds = useMemo(() => {
    const set = new Set();
    solvedSubmissions.forEach((s) => {
      const pId = s.problem?._id || s.problem;
      if (pId) set.add(String(pId));
    });
    return set;
  }, [solvedSubmissions]);

  // Difficulty Solved vs Total Breakdown
  const diffStats = useMemo(() => {
    const totalByDiff = { Basic: 0, Easy: 0, Medium: 0, Hard: 0 };
    const solvedByDiff = { Basic: 0, Easy: 0, Medium: 0, Hard: 0 };

    problems.forEach((p) => {
      const raw = (p.difficulty || "Easy").trim();
      const diff =
        raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase();
      if (totalByDiff[diff] !== undefined) {
        totalByDiff[diff]++;
        if (solvedProblemIds.has(String(p._id))) {
          solvedByDiff[diff]++;
        }
      }
    });

    return { totalByDiff, solvedByDiff };
  }, [problems, solvedProblemIds]);

  // Acceptance Rate
  const acceptanceRate = useMemo(() => {
    if (submissions.length === 0) return 0;
    return Math.round((solvedSubmissions.length / submissions.length) * 100);
  }, [solvedSubmissions, submissions]);

  // Streak Calculation
  const streakInfo = useMemo(() => {
    if (submissions.length === 0) return { current: 0, max: 0 };
    const dates = [
      ...new Set(
        submissions.map((s) =>
          new Date(s.createdAt).toISOString().split("T")[0]
        )
      ),
    ].sort();

    let maxStreak = 1;
    let curStreak = 1;
    for (let i = 1; i < dates.length; i++) {
      const prev = new Date(dates[i - 1]);
      const curr = new Date(dates[i]);
      const diffDays = Math.round((curr - prev) / (1000 * 3600 * 24));
      if (diffDays === 1) {
        curStreak++;
        if (curStreak > maxStreak) maxStreak = curStreak;
      } else if (diffDays > 1) {
        curStreak = 1;
      }
    }
    return { current: curStreak, max: maxStreak };
  }, [submissions]);

  // Verdict Breakdown
  const verdictCounts = useMemo(() => {
    const counts = {};
    submissions.forEach((s) => {
      const res = s.result || "Unknown";
      counts[res] = (counts[res] || 0) + 1;
    });
    return counts;
  }, [submissions]);

  // Language Breakdown
  const langCounts = useMemo(() => {
    const counts = {};
    submissions.forEach((s) => {
      const lang = (s.language || "other").toLowerCase();
      counts[lang] = (counts[lang] || 0) + 1;
    });
    return counts;
  }, [submissions]);

  // DSA Topic Breakdown
  const topicCounts = useMemo(() => {
    const counts = {};
    solvedSubmissions.forEach((s) => {
      const pId = String(s.problem?._id || s.problem);
      const prob = problemMap[pId] || s.problem;
      const topic = prob?.dsaTopic || "General";
      counts[topic] = (counts[topic] || 0) + 1;
    });
    return counts;
  }, [solvedSubmissions, problemMap]);

  // Top DSA topics sorted
  const sortedTopics = useMemo(() => {
    return Object.entries(topicCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
  }, [topicCounts]);

  // Progression Line Data
  const progressionData = useMemo(() => {
    const sorted = [...submissions].sort(
      (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
    );
    const labels = [];
    const cumulative = [];
    const solvedSet = new Set();

    sorted.forEach((s) => {
      const dateStr = new Date(s.createdAt).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      });
      if (s.result === "Accepted") {
        const pId = String(s.problem?._id || s.problem);
        solvedSet.add(pId);
      }
      labels.push(dateStr);
      cumulative.push(solvedSet.size);
    });

    return { labels, cumulative };
  }, [submissions]);

  // Filtered Submissions for History Table
  const filteredSubmissions = useMemo(() => {
    return submissions.filter((s) => {
      const pId = String(s.problem?._id || s.problem);
      const prob = problemMap[pId] || s.problem;
      const title = prob?.title || "Challenge";
      const diff = (prob?.difficulty || "Easy").toLowerCase();
      const lang = (s.language || "").toLowerCase();

      // Search
      const matchesSearch =
        !searchFilter ||
        title.toLowerCase().includes(searchFilter.toLowerCase());

      // Difficulty
      const matchesDiff =
        diffFilter === "all" || diff === diffFilter.toLowerCase();

      // Status
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "accepted" && s.result === "Accepted") ||
        (statusFilter === "failed" && s.result !== "Accepted");

      // Language
      const matchesLang =
        langFilter === "all" || lang === langFilter.toLowerCase();

      return matchesSearch && matchesDiff && matchesStatus && matchesLang;
    });
  }, [submissions, problemMap, searchFilter, diffFilter, statusFilter, langFilter]);

  // ==========================================
  // CHART CONFIGURATIONS
  // ==========================================

  // 1. Difficulty Donut Chart
  const diffDonutData = {
    labels: ["Basic", "Easy", "Medium", "Hard"],
    datasets: [
      {
        data: [
          diffStats.solvedByDiff.Basic,
          diffStats.solvedByDiff.Easy,
          diffStats.solvedByDiff.Medium,
          diffStats.solvedByDiff.Hard,
        ],
        backgroundColor: [
          DIFFICULTY_CONFIG.Basic.color,
          DIFFICULTY_CONFIG.Easy.color,
          DIFFICULTY_CONFIG.Medium.color,
          DIFFICULTY_CONFIG.Hard.color,
        ],
        borderColor: "#090d16",
        borderWidth: 3,
        hoverOffset: 6,
      },
    ],
  };

  // 2. Difficulty Solved vs Remaining Grouped Bar Chart
  const diffBarData = {
    labels: ["Basic", "Easy", "Medium", "Hard"],
    datasets: [
      {
        label: "Solved",
        data: [
          diffStats.solvedByDiff.Basic,
          diffStats.solvedByDiff.Easy,
          diffStats.solvedByDiff.Medium,
          diffStats.solvedByDiff.Hard,
        ],
        backgroundColor: "#10b981",
        borderRadius: 6,
      },
      {
        label: "Remaining",
        data: [
          Math.max(0, diffStats.totalByDiff.Basic - diffStats.solvedByDiff.Basic),
          Math.max(0, diffStats.totalByDiff.Easy - diffStats.solvedByDiff.Easy),
          Math.max(0, diffStats.totalByDiff.Medium - diffStats.solvedByDiff.Medium),
          Math.max(0, diffStats.totalByDiff.Hard - diffStats.solvedByDiff.Hard),
        ],
        backgroundColor: "rgba(255, 255, 255, 0.12)",
        borderRadius: 6,
      },
    ],
  };

  // 3. Verdicts Pie Chart
  const verdictLabels = Object.keys(verdictCounts);
  const verdictPieData = {
    labels: verdictLabels.length ? verdictLabels : ["No Submissions"],
    datasets: [
      {
        data: verdictLabels.length ? Object.values(verdictCounts) : [1],
        backgroundColor: verdictLabels.length
          ? verdictLabels.map(
              (label) => VERDICT_COLORS[label] || "#64748b"
            )
          : ["#64748b"],
        borderColor: "#090d16",
        borderWidth: 2,
      },
    ],
  };

  // 4. Languages Pie Chart
  const langLabels = Object.keys(langCounts);
  const langPieData = {
    labels: langLabels.length ? langLabels.map((l) => l.toUpperCase()) : ["N/A"],
    datasets: [
      {
        data: langLabels.length ? Object.values(langCounts) : [1],
        backgroundColor: langLabels.length
          ? langLabels.map(
              (l) => LANGUAGE_COLORS[l.toLowerCase()] || "#8b5cf6"
            )
          : ["#64748b"],
        borderColor: "#090d16",
        borderWidth: 2,
      },
    ],
  };

  // 5. DSA Topics Horizontal Bar Chart
  const topicBarData = {
    labels: sortedTopics.map((t) => t[0]),
    datasets: [
      {
        label: "Solved Problems",
        data: sortedTopics.map((t) => t[1]),
        backgroundColor: "rgba(56, 189, 248, 0.8)",
        hoverBackgroundColor: "#38bdf8",
        borderRadius: 6,
      },
    ],
  };

  // 6. Cumulative Progress Line Chart
  const lineChartData = {
    labels: progressionData.labels,
    datasets: [
      {
        label: "Cumulative Problems Solved",
        data: progressionData.cumulative,
        fill: true,
        borderColor: "#38bdf8",
        backgroundColor: "rgba(56, 189, 248, 0.15)",
        tension: 0.35,
        pointRadius: progressionData.labels.length > 50 ? 0 : 3,
        pointHoverRadius: 6,
        pointBackgroundColor: "#38bdf8",
      },
    ],
  };

  // Export to Excel handler
  const handleExportExcel = () => {
    try {
      setExporting(true);
      const rows = filteredSubmissions.map((s, idx) => {
        const pId = String(s.problem?._id || s.problem);
        const prob = problemMap[pId] || s.problem;
        return {
          "SL No": idx + 1,
          "Problem Title": prob?.title || "Challenge",
          Difficulty: prob?.difficulty || "Easy",
          Topic: prob?.dsaTopic || "General",
          Language: s.language || "Unknown",
          Result: s.result || "Unknown",
          "Passed Cases": s.passedCount ?? 0,
          "Total Cases": s.totalCount ?? 0,
          "Plagiarism Score": s.plagiarism ? `${s.plagiarism}%` : "0%",
          "Submitted At": new Date(s.createdAt).toLocaleString(),
        };
      });

      const worksheet = XLSX.utils.json_to_sheet(rows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Coding Analytics");
      XLSX.writeFile(
        workbook,
        `${selectedStudentMeta.name.replace(/\s+/g, "_")}_coding_analytics_${Date.now()}.xlsx`
      );
    } catch (err) {
      console.error(err);
    } finally {
      setExporting(false);
    }
  };

  const handleCopyCode = () => {
    if (inspectModalSub?.code) {
      navigator.clipboard.writeText(inspectModalSub.code);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  return (
    <div className="cc-analytics-container">
      <div className="cc-analytics-wrapper">
        {/* Top Header */}
        <div className="cc-analytics-header">
          <div>
            <Link to="/coding" className="cc-back-link">
              <FaArrowLeft /> Back to Problem Practice
            </Link>
            <h1 className="cc-analytics-title">
              <FaTrophy className="cc-analytics-title-icon" />
              <span>Coding Performance Analytics</span>
            </h1>
            <p className="cc-analytics-subtitle">
              Deep analytical insights into challenges solved, difficulty
              distribution, accuracy verdicts, and learning velocity.
            </p>
          </div>

          {/* Student Switcher & Excel Export */}
          <div className="d-flex align-items-center gap-3 flex-wrap">
            {studentsList.length > 0 && (
              <div className="cc-student-selector-box">
                <span className="cc-student-select-label">
                  <FaUserGraduate className="me-1 text-primary" /> Student:
                </span>
                <select
                  className="cc-student-select"
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                >
                  {currentUser && (
                    <option value={currentUser._id || currentUser.id}>
                      ★ {currentUser.name} (You)
                    </option>
                  )}
                  {studentsList
                    .filter(
                      (s) =>
                        !currentUser ||
                        s._id !== (currentUser._id || currentUser.id)
                    )
                    .map((st) => (
                      <option key={st._id} value={st._id}>
                        {st.name} ({st.acceptedCount} Solved)
                      </option>
                    ))}
                </select>
                {!selectedStudentMeta.isSelf && currentUser && (
                  <button
                    className="cc-my-profile-btn"
                    onClick={() =>
                      setSelectedStudentId(currentUser._id || currentUser.id)
                    }
                  >
                    View My Stats
                  </button>
                )}
              </div>
            )}

            <ExportExcelButton
              onClick={handleExportExcel}
              loading={exporting}
              label="Export Analytics"
              variant="dark-excel"
            />
          </div>
        </div>

        {/* Selected Student Profile Banner */}
        <div className="cc-user-profile-banner">
          <div className="cc-user-profile-left">
            <div className="cc-user-avatar">
              {selectedStudentMeta.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="cc-user-name">
                {selectedStudentMeta.name}
                {selectedStudentMeta.isSelf && (
                  <span
                    className="badge bg-primary ms-2"
                    style={{ fontSize: "11px" }}
                  >
                    You
                  </span>
                )}
              </h2>
              <p className="cc-user-email">
                {selectedStudentMeta.email || "Active Code Campus Programmer"}
              </p>
              <div className="cc-user-tags">
                <span className="cc-user-tag">
                  {selectedStudentMeta.role.toUpperCase()}
                </span>
                <span className="cc-user-tag rank">
                  Rank: #{solvedProblemIds.size > 100 ? "1 Top Coder" : "Active Challenger"}
                </span>
                <span className="cc-user-tag">
                  Total Solved: {solvedProblemIds.size} / {problems.length}
                </span>
              </div>
            </div>
          </div>

          <div className="d-flex align-items-center gap-4 flex-wrap">
            <div className="text-end">
              <span className="text-muted text-uppercase" style={{ fontSize: "11px", fontWeight: "700" }}>
                Solve Completion
              </span>
              <div className="fs-3 fw-bold text-success">
                {problems.length > 0
                  ? Math.round((solvedProblemIds.size / problems.length) * 100)
                  : 0}
                %
              </div>
            </div>
          </div>
        </div>

        {/* KPI Cards Grid */}
        <div className="cc-kpi-grid">
          {/* Card 1: Problems Solved */}
          <div className="cc-kpi-card" style={{ "--card-accent": "#10b981" }}>
            <div className="cc-kpi-top">
              <span className="cc-kpi-label">Challenges Solved</span>
              <div
                className="cc-kpi-icon-wrap"
                style={{
                  "--icon-bg": "rgba(16, 185, 129, 0.15)",
                  "--icon-color": "#10b981",
                }}
              >
                <FaCheckCircle />
              </div>
            </div>
            <div className="cc-kpi-val text-success">
              {solvedProblemIds.size}{" "}
              <span className="fs-6 text-muted fw-normal">
                / {problems.length}
              </span>
            </div>
            <div className="cc-kpi-sub">
              {problems.length > 0
                ? Math.round((solvedProblemIds.size / problems.length) * 100)
                : 0}
              % of total curriculum complete
            </div>
          </div>

          {/* Card 2: Total Submissions */}
          <div className="cc-kpi-card" style={{ "--card-accent": "#38bdf8" }}>
            <div className="cc-kpi-top">
              <span className="cc-kpi-label">Total Submissions</span>
              <div
                className="cc-kpi-icon-wrap"
                style={{
                  "--icon-bg": "rgba(56, 189, 248, 0.15)",
                  "--icon-color": "#38bdf8",
                }}
              >
                <FaCode />
              </div>
            </div>
            <div className="cc-kpi-val text-primary">{submissions.length}</div>
            <div className="cc-kpi-sub">
              {solvedSubmissions.length} accepted solutions recorded
            </div>
          </div>

          {/* Card 3: Acceptance Rate */}
          <div className="cc-kpi-card" style={{ "--card-accent": "#f59e0b" }}>
            <div className="cc-kpi-top">
              <span className="cc-kpi-label">Acceptance Rate</span>
              <div
                className="cc-kpi-icon-wrap"
                style={{
                  "--icon-bg": "rgba(245, 158, 11, 0.15)",
                  "--icon-color": "#f59e0b",
                }}
              >
                <FaTrophy />
              </div>
            </div>
            <div className="cc-kpi-val text-warning">{acceptanceRate}%</div>
            <div className="cc-kpi-sub">
              Submission success across all test cases
            </div>
          </div>

          {/* Card 4: Daily Streak */}
          <div className="cc-kpi-card" style={{ "--card-accent": "#ef4444" }}>
            <div className="cc-kpi-top">
              <span className="cc-kpi-label">Coding Streak</span>
              <div
                className="cc-kpi-icon-wrap"
                style={{
                  "--icon-bg": "rgba(239, 68, 68, 0.15)",
                  "--icon-color": "#ef4444",
                }}
              >
                <FaFire />
              </div>
            </div>
            <div className="cc-kpi-val text-danger">
              {streakInfo.max}{" "}
              <span className="fs-6 text-muted fw-normal">Days</span>
            </div>
            <div className="cc-kpi-sub">
              Consecutive problem practice activity
            </div>
          </div>
        </div>

        {/* Charts Row 1: Difficulty Breakdown & Solved vs Remaining */}
        <div className="cc-charts-row">
          {/* Difficulty Gauge & Meters */}
          <div className="cc-col-5">
            <div className="cc-chart-card h-100">
              <div className="cc-chart-card-header">
                <h3 className="cc-chart-title">
                  <FaChartPie className="text-primary" />
                  <span>Difficulty Breakdown</span>
                </h3>
                <span className="cc-chart-badge">All 4 Tiers</span>
              </div>

              <div className="cc-difficulty-overview">
                {/* Donut Chart */}
                <div className="cc-donut-container">
                  <Doughnut
                    data={diffDonutData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      cutout: "75%",
                      plugins: {
                        legend: { display: false },
                        tooltip: {
                          callbacks: {
                            label: (ctx) => ` ${ctx.label}: ${ctx.raw} Solved`,
                          },
                        },
                      },
                    }}
                  />
                  <div className="cc-donut-center-text">
                    <div className="cc-donut-center-val">
                      {solvedProblemIds.size}
                    </div>
                    <div className="cc-donut-center-sub">Solved</div>
                  </div>
                </div>

                {/* Bars List */}
                <div className="cc-diff-bars-list">
                  {/* Basic */}
                  <div className="cc-diff-bar-item">
                    <div className="cc-diff-bar-label-row">
                      <span className="cc-diff-name">
                        <span
                          className="cc-diff-dot"
                          style={{ background: DIFFICULTY_CONFIG.Basic.color }}
                        />
                        Basic
                      </span>
                      <span className="cc-diff-counts">
                        <strong>{diffStats.solvedByDiff.Basic}</strong> /{" "}
                        {diffStats.totalByDiff.Basic}
                      </span>
                    </div>
                    <div className="cc-diff-progress-track">
                      <div
                        className="cc-diff-progress-fill"
                        style={{
                          width: `${
                            diffStats.totalByDiff.Basic > 0
                              ? (diffStats.solvedByDiff.Basic /
                                  diffStats.totalByDiff.Basic) *
                                100
                              : 0
                          }%`,
                          background: DIFFICULTY_CONFIG.Basic.color,
                        }}
                      />
                    </div>
                  </div>

                  {/* Easy */}
                  <div className="cc-diff-bar-item">
                    <div className="cc-diff-bar-label-row">
                      <span className="cc-diff-name">
                        <span
                          className="cc-diff-dot"
                          style={{ background: DIFFICULTY_CONFIG.Easy.color }}
                        />
                        Easy
                      </span>
                      <span className="cc-diff-counts">
                        <strong>{diffStats.solvedByDiff.Easy}</strong> /{" "}
                        {diffStats.totalByDiff.Easy}
                      </span>
                    </div>
                    <div className="cc-diff-progress-track">
                      <div
                        className="cc-diff-progress-fill"
                        style={{
                          width: `${
                            diffStats.totalByDiff.Easy > 0
                              ? (diffStats.solvedByDiff.Easy /
                                  diffStats.totalByDiff.Easy) *
                                100
                              : 0
                          }%`,
                          background: DIFFICULTY_CONFIG.Easy.color,
                        }}
                      />
                    </div>
                  </div>

                  {/* Medium */}
                  <div className="cc-diff-bar-item">
                    <div className="cc-diff-bar-label-row">
                      <span className="cc-diff-name">
                        <span
                          className="cc-diff-dot"
                          style={{ background: DIFFICULTY_CONFIG.Medium.color }}
                        />
                        Medium
                      </span>
                      <span className="cc-diff-counts">
                        <strong>{diffStats.solvedByDiff.Medium}</strong> /{" "}
                        {diffStats.totalByDiff.Medium}
                      </span>
                    </div>
                    <div className="cc-diff-progress-track">
                      <div
                        className="cc-diff-progress-fill"
                        style={{
                          width: `${
                            diffStats.totalByDiff.Medium > 0
                              ? (diffStats.solvedByDiff.Medium /
                                  diffStats.totalByDiff.Medium) *
                                100
                              : 0
                          }%`,
                          background: DIFFICULTY_CONFIG.Medium.color,
                        }}
                      />
                    </div>
                  </div>

                  {/* Hard */}
                  <div className="cc-diff-bar-item">
                    <div className="cc-diff-bar-label-row">
                      <span className="cc-diff-name">
                        <span
                          className="cc-diff-dot"
                          style={{ background: DIFFICULTY_CONFIG.Hard.color }}
                        />
                        Hard
                      </span>
                      <span className="cc-diff-counts">
                        <strong>{diffStats.solvedByDiff.Hard}</strong> /{" "}
                        {diffStats.totalByDiff.Hard}
                      </span>
                    </div>
                    <div className="cc-diff-progress-track">
                      <div
                        className="cc-diff-progress-fill"
                        style={{
                          width: `${
                            diffStats.totalByDiff.Hard > 0
                              ? (diffStats.solvedByDiff.Hard /
                                  diffStats.totalByDiff.Hard) *
                                100
                              : 0
                          }%`,
                          background: DIFFICULTY_CONFIG.Hard.color,
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Grouped Bar Chart: Solved vs Remaining */}
          <div className="cc-col-7">
            <div className="cc-chart-card h-100">
              <div className="cc-chart-card-header">
                <h3 className="cc-chart-title">
                  <FaChartBar className="text-success" />
                  <span>Solved vs Remaining by Difficulty</span>
                </h3>
                <span className="cc-chart-badge">Distribution</span>
              </div>
              <div style={{ height: "240px" }}>
                <Bar
                  data={diffBarData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: "top",
                        labels: { color: "#94a3b8", font: { size: 12 } },
                      },
                    },
                    scales: {
                      x: {
                        stacked: true,
                        ticks: { color: "#94a3b8" },
                        grid: { color: "rgba(255,255,255,0.05)" },
                      },
                      y: {
                        stacked: true,
                        ticks: { color: "#94a3b8" },
                        grid: { color: "rgba(255,255,255,0.05)" },
                        beginAtZero: true,
                      },
                    },
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Charts Row 2: Submission Verdicts & Languages Distribution & Top Topics */}
        <div className="cc-charts-row">
          {/* Submission Verdicts Pie */}
          <div className="cc-col-4">
            <div className="cc-chart-card h-100">
              <div className="cc-chart-card-header">
                <h3 className="cc-chart-title">
                  <FaCheckCircle className="text-info" />
                  <span>Verdicts & Accuracy</span>
                </h3>
                <span className="cc-chart-badge">{submissions.length} Runs</span>
              </div>
              <div style={{ height: "230px" }}>
                <Pie
                  data={verdictPieData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: "bottom",
                        labels: { color: "#94a3b8", font: { size: 11 } },
                      },
                    },
                  }}
                />
              </div>
            </div>
          </div>

          {/* Language Breakdown */}
          <div className="cc-col-4">
            <div className="cc-chart-card h-100">
              <div className="cc-chart-card-header">
                <h3 className="cc-chart-title">
                  <FaCode className="text-warning" />
                  <span>Programming Languages</span>
                </h3>
                <span className="cc-chart-badge">Polyglot</span>
              </div>
              <div style={{ height: "230px" }}>
                <Pie
                  data={langPieData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: "bottom",
                        labels: { color: "#94a3b8", font: { size: 11 } },
                      },
                    },
                  }}
                />
              </div>
            </div>
          </div>

          {/* Top DSA Topics */}
          <div className="cc-col-4">
            <div className="cc-chart-card h-100">
              <div className="cc-chart-card-header">
                <h3 className="cc-chart-title">
                  <FaChartBar className="text-primary" />
                  <span>Top DSA Categories</span>
                </h3>
                <span className="cc-chart-badge">Top Topics</span>
              </div>
              <div style={{ height: "230px" }}>
                {sortedTopics.length === 0 ? (
                  <div className="cc-empty-state">No topic data available.</div>
                ) : (
                  <Bar
                    data={topicBarData}
                    options={{
                      indexAxis: "y",
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: { display: false },
                      },
                      scales: {
                        x: {
                          ticks: { color: "#94a3b8" },
                          grid: { color: "rgba(255,255,255,0.05)" },
                          beginAtZero: true,
                        },
                        y: {
                          ticks: { color: "#94a3b8" },
                          grid: { color: "rgba(255,255,255,0.05)" },
                        },
                      },
                    }}
                  />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Charts Row 3: Cumulative Solving Velocity Timeline */}
        <div className="cc-charts-row">
          <div className="cc-col-12">
            <div className="cc-chart-card">
              <div className="cc-chart-card-header">
                <h3 className="cc-chart-title">
                  <FaCalendarAlt className="text-info" />
                  <span>Cumulative Problem Solving Progression</span>
                </h3>
                <span className="cc-chart-badge">Learning Curve</span>
              </div>
              <div style={{ height: "260px" }}>
                {progressionData.labels.length === 0 ? (
                  <div className="cc-empty-state">
                    No progression data available yet.
                  </div>
                ) : (
                  <Line
                    data={lineChartData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          labels: { color: "#94a3b8" },
                        },
                      },
                      scales: {
                        x: {
                          ticks: { color: "#94a3b8" },
                          grid: { color: "rgba(255,255,255,0.05)" },
                        },
                        y: {
                          ticks: { color: "#94a3b8" },
                          grid: { color: "rgba(255,255,255,0.05)" },
                          beginAtZero: true,
                        },
                      },
                    }}
                  />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Submissions History Table Section */}
        <div className="cc-table-section">
          <div className="cc-table-filter-bar">
            <div>
              <h3 className="cc-chart-title mb-1">
                <span>Detailed Submissions Log</span>
                <span className="badge bg-secondary ms-2" style={{ fontSize: "11px" }}>
                  {filteredSubmissions.length} of {submissions.length}
                </span>
              </h3>
              <p className="text-muted mb-0" style={{ fontSize: "0.85rem" }}>
                Inspect source code, passed test cases, execution verdicts, and timestamps.
              </p>
            </div>

            {/* Filter Controls */}
            <div className="cc-filter-controls-group">
              <input
                type="text"
                className="cc-filter-input"
                placeholder="Search problem title..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
              />

              <select
                className="cc-filter-select"
                value={diffFilter}
                onChange={(e) => setDiffFilter(e.target.value)}
              >
                <option value="all">All Difficulties</option>
                <option value="basic">Basic</option>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>

              <select
                className="cc-filter-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Verdicts</option>
                <option value="accepted">Accepted Only</option>
                <option value="failed">Errors / Wrong Only</option>
              </select>

              <select
                className="cc-filter-select"
                value={langFilter}
                onChange={(e) => setLangFilter(e.target.value)}
              >
                <option value="all">All Languages</option>
                <option value="javascript">JavaScript</option>
                <option value="python">Python</option>
                <option value="cpp">C++</option>
                <option value="java">Java</option>
              </select>
            </div>
          </div>

          <div className="table-responsive">
            <table className="cc-analytics-table">
              <thead>
                <tr>
                  <th>Status</th>
                  <th>Challenge Title</th>
                  <th>Difficulty</th>
                  <th>Topic</th>
                  <th>Language</th>
                  <th>Test Cases</th>
                  <th>Date & Time</th>
                  <th style={{ textAlign: "right" }}>Code Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="8" className="text-center py-5 text-muted">
                      <div className="spinner-border spinner-border-sm text-primary me-2" />
                      Loading submissions data...
                    </td>
                  </tr>
                ) : filteredSubmissions.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="text-center py-5 text-muted">
                      No matching submission records found for this user.
                    </td>
                  </tr>
                ) : (
                  filteredSubmissions.map((s) => {
                    const pId = String(s.problem?._id || s.problem);
                    const prob = problemMap[pId] || s.problem;
                    const title = prob?.title || "Challenge";
                    const diff = prob?.difficulty || "Easy";
                    const isAccepted = s.result === "Accepted";
                    const isTle = s.result === "Time Limit Exceeded";

                    return (
                      <tr key={s._id}>
                        <td>
                          <span
                            className={`cc-verdict-chip ${
                              isAccepted
                                ? "accepted"
                                : isTle
                                ? "tle"
                                : "wrong"
                            }`}
                          >
                            {isAccepted ? (
                              <FaCheckCircle />
                            ) : isTle ? (
                              <FaClock />
                            ) : (
                              <FaTimesCircle />
                            )}
                            {s.result || "Submitted"}
                          </span>
                        </td>
                        <td>
                          <Link
                            to={`/coding/problems/${pId}`}
                            className="text-decoration-none fw-semibold"
                            style={{ color: "#f8fafc" }}
                          >
                            {title}
                          </Link>
                        </td>
                        <td>
                          <span
                            style={{
                              color:
                                DIFFICULTY_CONFIG[diff]?.color || "#94a3b8",
                              fontWeight: "700",
                              fontSize: "0.82rem",
                            }}
                          >
                            {diff}
                          </span>
                        </td>
                        <td>
                          <span className="badge bg-dark text-muted border border-secondary" style={{ fontSize: "11px" }}>
                            {prob?.dsaTopic || "General"}
                          </span>
                        </td>
                        <td>
                          <span className="cc-lang-chip">
                            {s.language || "code"}
                          </span>
                        </td>
                        <td>
                          <span style={{ fontWeight: "600" }}>
                            {s.passedCount ?? 0} / {s.totalCount ?? 0}
                          </span>
                        </td>
                        <td style={{ color: "#94a3b8", fontSize: "0.82rem" }}>
                          {new Date(s.createdAt).toLocaleString(undefined, {
                            dateStyle: "short",
                            timeStyle: "short",
                          })}
                        </td>
                        <td style={{ textAlign: "right" }}>
                          <button
                            className="cc-view-code-btn"
                            onClick={() => setInspectModalSub(s)}
                          >
                            <FaCode /> View Code
                          </button>
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

      {/* Code Inspector Modal */}
      {inspectModalSub && (
        <div
          className="cc-code-modal-backdrop"
          onClick={() => setInspectModalSub(null)}
        >
          <div
            className="cc-code-modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="cc-code-modal-header">
              <div>
                <h3 className="cc-code-modal-title">
                  Submission Code:{" "}
                  {problemMap[
                    String(
                      inspectModalSub.problem?._id || inspectModalSub.problem
                    )
                  ]?.title || "Challenge"}
                </h3>
                <span className="text-muted" style={{ fontSize: "0.8rem" }}>
                  Language: {inspectModalSub.language} | Result:{" "}
                  <strong
                    style={{
                      color:
                        inspectModalSub.result === "Accepted"
                          ? "#10b981"
                          : "#ef4444",
                    }}
                  >
                    {inspectModalSub.result}
                  </strong>{" "}
                  ({inspectModalSub.passedCount ?? 0}/
                  {inspectModalSub.totalCount ?? 0} Test Cases Passed)
                </span>
              </div>
              <div className="d-flex align-items-center gap-2">
                <button
                  className="btn btn-sm btn-outline-info d-flex align-items-center gap-1"
                  onClick={handleCopyCode}
                >
                  <FaCopy /> {copiedCode ? "Copied!" : "Copy Code"}
                </button>
                <button
                  className="cc-code-modal-close-btn"
                  onClick={() => setInspectModalSub(null)}
                >
                  <FaTimes />
                </button>
              </div>
            </div>

            <div className="cc-code-modal-body">
              <pre className="cc-code-block-pre">
                {inspectModalSub.code || "// No code available for this submission"}
              </pre>

              {inspectModalSub.details && inspectModalSub.details.length > 0 && (
                <div className="mt-3">
                  <h6 className="text-muted text-uppercase mb-2" style={{ fontSize: "11px", fontWeight: "700" }}>
                    Test Case Results
                  </h6>
                  <div className="d-flex flex-wrap gap-2">
                    {inspectModalSub.details.map((tc, i) => (
                      <span
                        key={i}
                        className={`badge ${
                          tc.passed ? "bg-success" : "bg-danger"
                        }`}
                        style={{ fontSize: "11px" }}
                      >
                        Case {i + 1}: {tc.verdict || (tc.passed ? "Passed" : "Failed")}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

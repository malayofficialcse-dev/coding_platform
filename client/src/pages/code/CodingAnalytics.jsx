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
  FaGlobe,
  FaUser,
  FaMedal,
  FaSearch,
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

  // Mode: "overall" | "student"
  const [viewMode, setViewMode] = useState("student");

  const [problems, setProblems] = useState([]);
  const [studentsList, setStudentsList] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState("");

  // Submissions data
  const [studentSubmissions, setStudentSubmissions] = useState([]);
  const [allSubmissions, setAllSubmissions] = useState([]);
  const [overallSummary, setOverallSummary] = useState(null);

  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  // Filters for Submissions Table
  const [searchFilter, setSearchFilter] = useState("");
  const [studentFilter, setStudentFilter] = useState("all");
  const [diffFilter, setDiffFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [langFilter, setLangFilter] = useState("all");

  // Code inspection modal state
  const [inspectModalSub, setInspectModalSub] = useState(null);
  const [copiedCode, setCopiedCode] = useState(false);

  // 1. Initial Load: Fetch Problems, Leaderboard, Overall Stats & All Submissions
  useEffect(() => {
    // Problems
    api
      .get("/coding/problems")
      .then((res) => setProblems(res.data || []))
      .catch((err) => console.error("Error loading problems:", err));

    // Leaderboard
    api
      .get("/coding/submissions/leaderboard")
      .then((res) => setStudentsList(res.data || []))
      .catch((err) => console.warn("Leaderboard error:", err));

    // Overall analytics summary
    api
      .get("/coding/submissions/overall")
      .then((res) => setOverallSummary(res.data || null))
      .catch((err) => console.warn("Overall stats error:", err));

    // All submissions (for overall table and metrics)
    api
      .get("/coding/submissions/all?limit=3000")
      .then((res) => setAllSubmissions(res.data || []))
      .catch((err) => console.warn("All submissions error:", err));
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
        setStudentSubmissions(res.data || []);
      })
      .catch((err) => {
        console.error("Failed to load submissions for user:", err);
        if (!isSelf) {
          api
            .get("/coding/submissions/my")
            .then((res) => setStudentSubmissions(res.data || []))
            .catch(() => {});
        }
      })
      .finally(() => setLoading(false));
  }, [selectedStudentId, currentUser]);

  // Handle Switch to Individual Student
  const handleSelectStudent = (studentId) => {
    if (studentId === "overall") {
      setViewMode("overall");
    } else {
      setSelectedStudentId(studentId);
      setViewMode("student");
    }
  };

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

  // Active dataset depends on viewMode
  const activeSubmissions = useMemo(() => {
    return viewMode === "overall" ? allSubmissions : studentSubmissions;
  }, [viewMode, allSubmissions, studentSubmissions]);

  // Solved Submissions
  const solvedSubmissions = useMemo(
    () => activeSubmissions.filter((s) => s.result === "Accepted"),
    [activeSubmissions]
  );

  // Distinct Solved Problem IDs
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
    if (activeSubmissions.length === 0) return 0;
    return Math.round((solvedSubmissions.length / activeSubmissions.length) * 100);
  }, [solvedSubmissions, activeSubmissions]);

  // Streak Calculation (for single student)
  const streakInfo = useMemo(() => {
    if (studentSubmissions.length === 0) return { current: 0, max: 0 };
    const dates = [
      ...new Set(
        studentSubmissions.map((s) =>
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
  }, [studentSubmissions]);

  // Verdict Breakdown
  const verdictCounts = useMemo(() => {
    const counts = {};
    activeSubmissions.forEach((s) => {
      const res = s.result || "Unknown";
      counts[res] = (counts[res] || 0) + 1;
    });
    return counts;
  }, [activeSubmissions]);

  // Language Breakdown
  const langCounts = useMemo(() => {
    const counts = {};
    activeSubmissions.forEach((s) => {
      const lang = (s.language || "other").toLowerCase();
      counts[lang] = (counts[lang] || 0) + 1;
    });
    return counts;
  }, [activeSubmissions]);

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
    const sorted = [...activeSubmissions].sort(
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
  }, [activeSubmissions]);

  // Top Students Chart Data (for Overall Analysis)
  const topStudentsChartData = useMemo(() => {
    const sorted = [...studentsList]
      .sort((a, b) => (b.acceptedCount || 0) - (a.acceptedCount || 0))
      .slice(0, 10);

    return {
      labels: sorted.map((s) => s.name),
      datasets: [
        {
          label: "Challenges Solved",
          data: sorted.map((s) => s.acceptedCount || 0),
          backgroundColor: "rgba(16, 185, 129, 0.8)",
          hoverBackgroundColor: "#10b981",
          borderRadius: 6,
        },
      ],
    };
  }, [studentsList]);

  // Filtered Submissions for Table
  const filteredSubmissions = useMemo(() => {
    return activeSubmissions.filter((s) => {
      const pId = String(s.problem?._id || s.problem);
      const prob = problemMap[pId] || s.problem;
      const title = prob?.title || "Challenge";
      const diff = (prob?.difficulty || "Easy").toLowerCase();
      const lang = (s.language || "").toLowerCase();
      const studentName = s.user?.name || "";
      const studentId = String(s.user?._id || s.user || "");

      // Search (problem title or student name)
      const q = searchFilter.toLowerCase();
      const matchesSearch =
        !searchFilter ||
        title.toLowerCase().includes(q) ||
        studentName.toLowerCase().includes(q);

      // Student filter (only in overall mode)
      const matchesStudent =
        viewMode !== "overall" ||
        studentFilter === "all" ||
        studentId === studentFilter;

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

      return (
        matchesSearch &&
        matchesStudent &&
        matchesDiff &&
        matchesStatus &&
        matchesLang
      );
    });
  }, [
    activeSubmissions,
    problemMap,
    searchFilter,
    studentFilter,
    diffFilter,
    statusFilter,
    langFilter,
    viewMode,
  ]);

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
        label:
          viewMode === "overall"
            ? "Platform Cumulative Unique Solved"
            : "Cumulative Problems Solved",
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
          Student: s.user?.name || selectedStudentMeta.name || "N/A",
          "Student Email": s.user?.email || selectedStudentMeta.email || "N/A",
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
      const sheetName =
        viewMode === "overall" ? "Overall Platform" : selectedStudentMeta.name;
      XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
      XLSX.writeFile(
        workbook,
        `Coding_Analytics_${viewMode}_${Date.now()}.xlsx`
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
              <span>
                {viewMode === "overall"
                  ? "Overall Platform Coding Analytics"
                  : "Student Coding Performance Analytics"}
              </span>
            </h1>
            <p className="cc-analytics-subtitle">
              {viewMode === "overall"
                ? "Aggregated cohort analytics, leaderboard rankings, difficulty coverage, and submission metrics across all students."
                : "Deep individual analytical insights into challenges solved, difficulty distribution, accuracy verdicts, and learning velocity."}
            </p>
          </div>

          {/* Student / Mode Switcher & Excel Export */}
          <div className="d-flex align-items-center gap-3 flex-wrap">
            <div className="cc-student-selector-box">
              <span className="cc-student-select-label">
                {viewMode === "overall" ? (
                  <FaGlobe className="me-1 text-primary" />
                ) : (
                  <FaUserGraduate className="me-1 text-primary" />
                )}
                Scope:
              </span>
              <select
                className="cc-student-select"
                value={viewMode === "overall" ? "overall" : selectedStudentId}
                onChange={(e) => handleSelectStudent(e.target.value)}
              >
                <option value="overall">
                  🌐 Overall Analysis (All Students)
                </option>
                <optgroup label="Individual Students">
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
                        👤 {st.name} ({st.acceptedCount} Solved)
                      </option>
                    ))}
                </optgroup>
              </select>

              {viewMode === "overall" ? (
                <button
                  className="cc-my-profile-btn"
                  onClick={() => {
                    setViewMode("student");
                    if (currentUser) {
                      setSelectedStudentId(currentUser._id || currentUser.id);
                    }
                  }}
                >
                  <FaUser className="me-1" /> View My Stats
                </button>
              ) : (
                <button
                  className="cc-my-profile-btn"
                  onClick={() => setViewMode("overall")}
                >
                  <FaGlobe className="me-1" /> View Overall
                </button>
              )}
            </div>

            <ExportExcelButton
              onClick={handleExportExcel}
              loading={exporting}
              label={
                viewMode === "overall"
                  ? "Export All Analytics"
                  : "Export Student Analytics"
              }
              variant="dark-excel"
            />
          </div>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="cc-analytics-mode-tabs">
          <button
            className={`cc-analytics-mode-tab ${
              viewMode === "overall" ? "active" : ""
            }`}
            onClick={() => setViewMode("overall")}
          >
            <FaGlobe />
            <span>Overall Platform Analysis</span>
            <span className="cc-mode-tab-badge">
              {studentsList.length || "11"} Students
            </span>
          </button>
          <button
            className={`cc-analytics-mode-tab ${
              viewMode === "student" ? "active" : ""
            }`}
            onClick={() => setViewMode("student")}
          >
            <FaUser />
            <span>Individual Student Analysis</span>
            <span className="cc-mode-tab-badge">
              {selectedStudentMeta.isSelf ? "You" : selectedStudentMeta.name}
            </span>
          </button>
        </div>

        {/* Banner: Overall vs Individual */}
        {viewMode === "overall" ? (
          <div className="cc-user-profile-banner">
            <div className="cc-user-profile-left">
              <div
                className="cc-user-avatar"
                style={{
                  background:
                    "linear-gradient(135deg, #38bdf8 0%, #2563eb 100%)",
                }}
              >
                <FaGlobe />
              </div>
              <div>
                <h2 className="cc-user-name">Code Campus Overall Platform Analytics</h2>
                <p className="cc-user-email">
                  Aggregated statistics across all enrolled student coders and challenge attempts
                </p>
                <div className="cc-user-tags">
                  <span className="cc-user-tag">COHORT SUMMARY</span>
                  <span className="cc-user-tag rank">
                    Active Coders: {studentsList.length} Students
                  </span>
                  <span className="cc-user-tag">
                    Total Submissions: {allSubmissions.length || "1,462"}
                  </span>
                  <span className="cc-user-tag">
                    Challenges Covered: {solvedProblemIds.size} / {problems.length}
                  </span>
                </div>
              </div>
            </div>

            <div className="d-flex align-items-center gap-4 flex-wrap">
              <div className="text-end">
                <span
                  className="text-muted text-uppercase"
                  style={{ fontSize: "11px", fontWeight: "700" }}
                >
                  Platform Problem Coverage
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
        ) : (
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
                  {selectedStudentMeta.email ||
                    "Active Code Campus Programmer"}
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
                <span
                  className="text-muted text-uppercase"
                  style={{ fontSize: "11px", fontWeight: "700" }}
                >
                  Solve Completion
                </span>
                <div className="fs-3 fw-bold text-success">
                  {problems.length > 0
                    ? Math.round(
                        (solvedProblemIds.size / problems.length) * 100
                      )
                    : 0}
                  %
                </div>
              </div>
            </div>
          </div>
        )}

        {/* KPI Cards Grid */}
        <div className="cc-kpi-grid">
          {/* Card 1 */}
          <div className="cc-kpi-card" style={{ "--card-accent": "#10b981" }}>
            <div className="cc-kpi-top">
              <span className="cc-kpi-label">
                {viewMode === "overall" ? "Platform Challenges Solved" : "Challenges Solved"}
              </span>
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
              % {viewMode === "overall" ? "platform catalog solved" : "curriculum completed"}
            </div>
          </div>

          {/* Card 2 */}
          <div className="cc-kpi-card" style={{ "--card-accent": "#38bdf8" }}>
            <div className="cc-kpi-top">
              <span className="cc-kpi-label">
                {viewMode === "overall" ? "Total Platform Submissions" : "Total Submissions"}
              </span>
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
            <div className="cc-kpi-val text-primary">
              {activeSubmissions.length}
            </div>
            <div className="cc-kpi-sub">
              {solvedSubmissions.length} accepted solutions recorded
            </div>
          </div>

          {/* Card 3 */}
          <div className="cc-kpi-card" style={{ "--card-accent": "#f59e0b" }}>
            <div className="cc-kpi-top">
              <span className="cc-kpi-label">
                {viewMode === "overall" ? "Overall Acceptance Rate" : "Acceptance Rate"}
              </span>
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
              {viewMode === "overall"
                ? "Cohort accuracy across all tests"
                : "Submission success across all test cases"}
            </div>
          </div>

          {/* Card 4 */}
          <div className="cc-kpi-card" style={{ "--card-accent": "#ef4444" }}>
            <div className="cc-kpi-top">
              <span className="cc-kpi-label">
                {viewMode === "overall" ? "Active Student Coders" : "Coding Streak"}
              </span>
              <div
                className="cc-kpi-icon-wrap"
                style={{
                  "--icon-bg": "rgba(239, 68, 68, 0.15)",
                  "--icon-color": "#ef4444",
                }}
              >
                {viewMode === "overall" ? <FaUserGraduate /> : <FaFire />}
              </div>
            </div>
            <div className="cc-kpi-val text-danger">
              {viewMode === "overall" ? (
                <>
                  {studentsList.length}{" "}
                  <span className="fs-6 text-muted fw-normal">Students</span>
                </>
              ) : (
                <>
                  {streakInfo.max}{" "}
                  <span className="fs-6 text-muted fw-normal">Days</span>
                </>
              )}
            </div>
            <div className="cc-kpi-sub">
              {viewMode === "overall"
                ? "Enrolled students with submissions"
                : "Consecutive problem practice activity"}
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
                  <span>
                    {viewMode === "overall"
                      ? "Platform Difficulty Distribution"
                      : "Difficulty Breakdown"}
                  </span>
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
                  <span>
                    {viewMode === "overall"
                      ? "Platform Solved vs Remaining by Difficulty"
                      : "Solved vs Remaining by Difficulty"}
                  </span>
                </h3>
                <span className="cc-chart-badge">Catalog Comparison</span>
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

        {/* OVERALL ONLY: Top Students Ranking Leaderboard & Comparison Bar Chart */}
        {viewMode === "overall" && (
          <div className="cc-charts-row">
            {/* Horizontal Bar Chart: Top Students */}
            <div className="cc-col-5">
              <div className="cc-chart-card h-100">
                <div className="cc-chart-card-header">
                  <h3 className="cc-chart-title">
                    <FaMedal className="text-warning" />
                    <span>Top Students Solved Ranking</span>
                  </h3>
                  <span className="cc-chart-badge">Top 10 Coders</span>
                </div>
                <div style={{ height: "300px" }}>
                  <Bar
                    data={topStudentsChartData}
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
                </div>
              </div>
            </div>

            {/* Leaderboard Table */}
            <div className="cc-col-7">
              <div className="cc-chart-card h-100">
                <div className="cc-chart-card-header">
                  <h3 className="cc-chart-title">
                    <FaTrophy className="text-warning" />
                    <span>Student Coding Leaderboard ({studentsList.length})</span>
                  </h3>
                  <span className="cc-chart-badge">Ranked by Solved</span>
                </div>
                <div className="table-responsive" style={{ maxHeight: "300px", overflowY: "auto" }}>
                  <table className="cc-analytics-table">
                    <thead>
                      <tr>
                        <th style={{ width: "45px" }}>Rank</th>
                        <th>Student</th>
                        <th>Difficulty (B/E/M/H)</th>
                        <th>Solved</th>
                        <th>Acc.</th>
                        <th style={{ textAlign: "right" }}>Inspect</th>
                      </tr>
                    </thead>
                    <tbody>
                      {studentsList.map((st, idx) => {
                        const isSelf =
                          currentUser &&
                          (st._id === currentUser._id ||
                            st._id === currentUser.id);
                        const rate =
                          st.totalSubmissions > 0
                            ? Math.round(
                                (st.acceptedCount / st.totalSubmissions) * 100
                              )
                            : 0;

                        return (
                          <tr key={st._id}>
                            <td>
                              <span
                                className={`cc-rank-badge ${
                                  idx === 0
                                    ? "rank-1"
                                    : idx === 1
                                    ? "rank-2"
                                    : idx === 2
                                    ? "rank-3"
                                    : "rank-other"
                                }`}
                              >
                                {idx + 1}
                              </span>
                            </td>
                            <td>
                              <div className="fw-semibold text-light">
                                {st.name} {isSelf && <span className="badge bg-primary ms-1">You</span>}
                              </div>
                              <div className="text-muted" style={{ fontSize: "11px" }}>
                                {st.email}
                              </div>
                            </td>
                            <td>
                              <span style={{ fontSize: "12px", fontFamily: "monospace" }}>
                                <span style={{ color: "#38bdf8" }}>{st.basicSolved ?? 0}</span>/
                                <span style={{ color: "#10b981" }}>{st.easySolved ?? 0}</span>/
                                <span style={{ color: "#f59e0b" }}>{st.mediumSolved ?? 0}</span>/
                                <span style={{ color: "#ef4444" }}>{st.hardSolved ?? 0}</span>
                              </span>
                            </td>
                            <td>
                              <span className="fw-bold text-success">
                                {st.acceptedCount}
                              </span>
                            </td>
                            <td>
                              <span className="text-info" style={{ fontSize: "12px" }}>
                                {rate}%
                              </span>
                            </td>
                            <td style={{ textAlign: "right" }}>
                              <button
                                className="cc-inspect-student-btn"
                                onClick={() => handleSelectStudent(st._id)}
                              >
                                View Stats →
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Charts Row 2: Submission Verdicts & Languages Distribution & Top Topics */}
        <div className="cc-charts-row">
          {/* Submission Verdicts Pie */}
          <div className="cc-col-4">
            <div className="cc-chart-card h-100">
              <div className="cc-chart-card-header">
                <h3 className="cc-chart-title">
                  <FaCheckCircle className="text-info" />
                  <span>
                    {viewMode === "overall"
                      ? "Platform Verdicts & Accuracy"
                      : "Verdicts & Accuracy"}
                  </span>
                </h3>
                <span className="cc-chart-badge">{activeSubmissions.length} Runs</span>
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
                  <span>
                    {viewMode === "overall"
                      ? "Platform Languages Adoption"
                      : "Programming Languages"}
                  </span>
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
                  <span>
                    {viewMode === "overall"
                      ? "Most Solved DSA Categories"
                      : "Top DSA Categories"}
                  </span>
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
                  <span>
                    {viewMode === "overall"
                      ? "Platform Cumulative Solving Velocity Timeline"
                      : "Cumulative Problem Solving Progression"}
                  </span>
                </h3>
                <span className="cc-chart-badge">Velocity Curve</span>
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
                <span>
                  {viewMode === "overall"
                    ? "Platform Submissions Log"
                    : "Student Submissions Log"}
                </span>
                <span className="badge bg-secondary ms-2" style={{ fontSize: "11px" }}>
                  {filteredSubmissions.length} of {activeSubmissions.length}
                </span>
              </h3>
              <p className="text-muted mb-0" style={{ fontSize: "0.85rem" }}>
                {viewMode === "overall"
                  ? "Audit source code, participating student, test cases passed, and execution outcomes."
                  : "Inspect source code, passed test cases, execution verdicts, and timestamps."}
              </p>
            </div>

            {/* Filter Controls */}
            <div className="cc-filter-controls-group">
              <input
                type="text"
                className="cc-filter-input"
                placeholder={
                  viewMode === "overall"
                    ? "Search challenge or student..."
                    : "Search challenge title..."
                }
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
              />

              {viewMode === "overall" && (
                <select
                  className="cc-filter-select"
                  value={studentFilter}
                  onChange={(e) => setStudentFilter(e.target.value)}
                >
                  <option value="all">All Students</option>
                  {studentsList.map((st) => (
                    <option key={st._id} value={st._id}>
                      {st.name}
                    </option>
                  ))}
                </select>
              )}

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
                  {viewMode === "overall" && <th>Student</th>}
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
                    <td colSpan={viewMode === "overall" ? 9 : 8} className="text-center py-5 text-muted">
                      <div className="spinner-border spinner-border-sm text-primary me-2" />
                      Loading submissions data...
                    </td>
                  </tr>
                ) : filteredSubmissions.length === 0 ? (
                  <tr>
                    <td colSpan={viewMode === "overall" ? 9 : 8} className="text-center py-5 text-muted">
                      No matching submission records found.
                    </td>
                  </tr>
                ) : (
                  filteredSubmissions.slice(0, 300).map((s) => {
                    const pId = String(s.problem?._id || s.problem);
                    const prob = problemMap[pId] || s.problem;
                    const title = prob?.title || "Challenge";
                    const diff = prob?.difficulty || "Easy";
                    const isAccepted = s.result === "Accepted";
                    const isTle = s.result === "Time Limit Exceeded";
                    const studentName = s.user?.name || selectedStudentMeta.name || "Student";

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
                        {viewMode === "overall" && (
                          <td>
                            <div className="fw-semibold text-light">{studentName}</div>
                            {s.user?.email && (
                              <div className="text-muted" style={{ fontSize: "11px" }}>
                                {s.user.email}
                              </div>
                            )}
                          </td>
                        )}
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
                  Student:{" "}
                  <strong className="text-light">
                    {inspectModalSub.user?.name || selectedStudentMeta.name}
                  </strong>{" "}
                  | Language: {inspectModalSub.language} | Result:{" "}
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

import React, { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import api from "../../api/api";
import { useTheme } from "../../contexts/ThemeContext";
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
  FaCode,
  FaChartBar,
  FaChartPie,
  FaTrophy,
  FaFire,
  FaCheckCircle,
  FaTimesCircle,
  FaUsers,
  FaSearch,
  FaArrowLeft,
  FaMedal,
  FaGlobe,
  FaFileExcel,
  FaBolt,
  FaUniversity,
  FaGraduationCap,
  FaCalendarAlt,
  FaFilter,
  FaUndo,
} from "react-icons/fa";
import "./AdminCodingAnalytics.css";
import * as XLSX from "xlsx";

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

const DIFF_CONFIG = {
  Basic:  { color: "#0284c7", bg: "rgba(2, 132, 199, 0.12)",  label: "Basic"  },
  Easy:   { color: "#15803d", bg: "rgba(21, 128, 61, 0.12)",   label: "Easy"   },
  Medium: { color: "#b45309", bg: "rgba(180, 83, 9, 0.12)",    label: "Medium" },
  Hard:   { color: "#b91c1c", bg: "rgba(185, 28, 28, 0.12)",   label: "Hard"   },
};

const LANG_COLORS = {
  javascript: "#eab308",
  python:     "#0284c7",
  cpp:        "#7c3aed",
  c:          "#3b82f6",
  java:       "#ea580c",
  go:         "#06b6d4",
  ruby:       "#e11d48",
  other:      "#64748b",
};

export default function AdminCodingAnalytics() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const [problems,       setProblems]       = useState([]);
  const [leaderboard,    setLeaderboard]    = useState([]);
  const [allSubmissions, setAllSubmissions] = useState([]);
  const [academicData,   setAcademicData]   = useState({
    colleges: [],
    departments: [],
    batches: [],
    collegeStats: [],
    batchStats: [],
    departmentStats: []
  });

  const [loading,        setLoading]        = useState(true);
  const [search,         setSearch]         = useState("");
  const [exporting,      setExporting]      = useState(false);

  /* ── Filter States ───────────────────────────────────────── */
  const [selectedCollege,    setSelectedCollege]    = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [selectedBatch,      setSelectedBatch]      = useState("");
  const [startDate,          setStartDate]          = useState("");
  const [endDate,            setEndDate]            = useState("");
  const [datePreset,         setDatePreset]         = useState("all");
  const [comparisonMode,     setComparisonMode]     = useState("colleges"); // 'colleges' | 'batches' | 'departments'

  // Quick date preset helper
  const applyDatePreset = (preset) => {
    setDatePreset(preset);
    const today = new Date();
    const toStr = today.toISOString().split("T")[0];

    if (preset === "today") {
      setStartDate(toStr);
      setEndDate(toStr);
    } else if (preset === "7days") {
      const past = new Date(today);
      past.setDate(past.getDate() - 7);
      setStartDate(past.toISOString().split("T")[0]);
      setEndDate(toStr);
    } else if (preset === "30days") {
      const past = new Date(today);
      past.setDate(past.getDate() - 30);
      setStartDate(past.toISOString().split("T")[0]);
      setEndDate(toStr);
    } else if (preset === "month") {
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      setStartDate(firstDay.toISOString().split("T")[0]);
      setEndDate(toStr);
    } else {
      setStartDate("");
      setEndDate("");
    }
  };

  /* ── Fetch all data from backend ─────────────────────────── */
  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        const [probRes, lbRes, subRes, acadRes] = await Promise.allSettled([
          api.get("/coding/problems"),
          api.get("/coding/submissions/leaderboard"),
          api.get("/coding/submissions/all?limit=5000"),
          api.get("/coding/submissions/academic-analytics"),
        ]);
        if (probRes.status === "fulfilled") setProblems(probRes.value.data || []);
        if (lbRes.status   === "fulfilled") setLeaderboard(lbRes.value.data || []);
        if (subRes.status  === "fulfilled") setAllSubmissions(subRes.value.data || []);
        if (acadRes.status === "fulfilled") setAcademicData(acadRes.value.data || {});
      } catch (err) {
        console.error("AdminCodingAnalytics load error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  /* ── Academic & Date filtering for submissions ───────────── */
  const filteredSubmissions = useMemo(() => {
    return allSubmissions.filter((s) => {
      const uCollege = (s.user?.college || "").trim();
      const uDegree  = (s.user?.degree  || "").trim();
      const uBatch   = (s.user?.yearOfPassing || "").trim();

      if (selectedCollege && uCollege.toLowerCase() !== selectedCollege.toLowerCase()) return false;
      if (selectedDepartment && uDegree.toLowerCase() !== selectedDepartment.toLowerCase()) return false;
      if (selectedBatch && uBatch !== selectedBatch) return false;

      if (startDate) {
        const from = new Date(startDate);
        from.setHours(0, 0, 0, 0);
        if (new Date(s.createdAt) < from) return false;
      }
      if (endDate) {
        const to = new Date(endDate);
        to.setHours(23, 59, 59, 999);
        if (new Date(s.createdAt) > to) return false;
      }

      return true;
    });
  }, [allSubmissions, selectedCollege, selectedDepartment, selectedBatch, startDate, endDate]);

  /* ── Academic filtering for leaderboard ──────────────────── */
  const filteredLeaderboardData = useMemo(() => {
    let list = leaderboard.filter((s) => {
      const uCollege = (s.college || "").trim();
      const uDegree  = (s.degree  || "").trim();
      const uBatch   = (s.yearOfPassing || "").trim();

      if (selectedCollege && uCollege.toLowerCase() !== selectedCollege.toLowerCase()) return false;
      if (selectedDepartment && uDegree.toLowerCase() !== selectedDepartment.toLowerCase()) return false;
      if (selectedBatch && uBatch !== selectedBatch) return false;
      return true;
    });

    const term = search.trim().toLowerCase();
    if (term) {
      list = list.filter((s) =>
        (s.name || "").toLowerCase().includes(term) ||
        (s.email || "").toLowerCase().includes(term) ||
        (s.college || "").toLowerCase().includes(term) ||
        (s.degree || "").toLowerCase().includes(term)
      );
    }
    return list;
  }, [leaderboard, selectedCollege, selectedDepartment, selectedBatch, search]);

  /* ── Cohort Derived Statistics ───────────────────────────── */
  const accepted     = useMemo(() => filteredSubmissions.filter(s => s.result === "Accepted"), [filteredSubmissions]);
  const rejected     = useMemo(() => filteredSubmissions.filter(s => s.result !== "Accepted"), [filteredSubmissions]);
  const acceptRate   = useMemo(() => filteredSubmissions.length ? Math.round((accepted.length / filteredSubmissions.length) * 100) : 0, [accepted, filteredSubmissions]);

  const uniqueSolvers = useMemo(() => new Set(accepted.map(s => s.user?._id || s.user || "")).size, [accepted]);

  // Difficulty breakdown (total problems vs solved in this cohort)
  const diffStats = useMemo(() => {
    const totals  = { Basic: 0, Easy: 0, Medium: 0, Hard: 0 };
    const solved  = { Basic: 0, Easy: 0, Medium: 0, Hard: 0 };
    const solvedIds = new Set(accepted.map(s => String(s.problem?._id || s.problem)));
    problems.forEach(p => {
      const d = (p.difficulty || "Easy").trim();
      const key = d.charAt(0).toUpperCase() + d.slice(1).toLowerCase();
      if (totals[key] !== undefined) {
        totals[key]++;
        if (solvedIds.has(String(p._id))) solved[key]++;
      }
    });
    return { totals, solved };
  }, [problems, accepted]);

  // Verdict breakdown
  const verdictMap = useMemo(() => {
    const m = {};
    filteredSubmissions.forEach(s => {
      const v = s.result || "Unknown";
      m[v] = (m[v] || 0) + 1;
    });
    return m;
  }, [filteredSubmissions]);

  // Language breakdown
  const langMap = useMemo(() => {
    const m = {};
    filteredSubmissions.forEach(s => {
      const l = (s.language || "other").toLowerCase();
      m[l] = (m[l] || 0) + 1;
    });
    return m;
  }, [filteredSubmissions]);

  // Submissions per day (last 30 days)
  const submissionsPerDay = useMemo(() => {
    const today = new Date();
    const days  = Array.from({ length: 30 }, (_, i) => {
      const d = new Date(today);
      d.setDate(d.getDate() - (29 - i));
      return d.toISOString().split("T")[0];
    });
    const counts = {};
    const acCounts = {};
    days.forEach(d => { counts[d] = 0; acCounts[d] = 0; });
    filteredSubmissions.forEach(s => {
      const d = new Date(s.createdAt).toISOString().split("T")[0];
      if (counts[d] !== undefined) {
        counts[d]++;
        if (s.result === "Accepted") acCounts[d]++;
      }
    });
    return { labels: days.map(d => d.slice(5)), counts: days.map(d => counts[d]), accepted: days.map(d => acCounts[d]) };
  }, [filteredSubmissions]);

  // Top 10 most-attempted problems in cohort
  const topProblems = useMemo(() => {
    const m = {};
    filteredSubmissions.forEach(s => {
      const pid   = s.problem?._id || s.problem;
      const title = s.problem?.title || "Unknown";
      if (!pid) return;
      if (!m[pid]) m[pid] = { title, attempts: 0, accepted: 0 };
      m[pid].attempts++;
      if (s.result === "Accepted") m[pid].accepted++;
    });
    return Object.values(m)
      .sort((a, b) => b.attempts - a.attempts)
      .slice(0, 10);
  }, [filteredSubmissions]);

  /* ── Dynamic Chart Colors & Options based on day/night mode ── */
  const chartTextColor   = isDark ? "#c0cad6" : "#697687";
  const chartGridColor   = isDark ? "rgba(255, 255, 255, 0.08)" : "#e6e9ed";
  const chartTooltipBg   = isDark ? "#1e293b" : "#ffffff";
  const chartTooltipBorder = isDark ? "#334155" : "#d6dbe1";
  const chartTooltipTitle = isDark ? "#f8fafc" : "#172033";
  const chartTooltipBody  = isDark ? "#c0cad6" : "#465364";
  const sliceBorderColor = isDark ? "#1e293b" : "#ffffff";

  const baseChartOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: chartTextColor,
          font: { size: 12, family: "Segoe UI, Inter, system-ui, sans-serif" },
        },
      },
      tooltip: {
        backgroundColor: chartTooltipBg,
        borderColor: chartTooltipBorder,
        borderWidth: 1,
        titleColor: chartTooltipTitle,
        bodyColor: chartTooltipBody,
        padding: 10,
        boxPadding: 4,
      },
    },
  }), [chartTextColor, chartTooltipBg, chartTooltipBorder, chartTooltipTitle, chartTooltipBody]);

  const cartesianScales = useMemo(() => ({
    x: {
      ticks: { color: chartTextColor, font: { size: 11 } },
      grid: { color: chartGridColor },
    },
    y: {
      ticks: { color: chartTextColor, font: { size: 11 } },
      grid: { color: chartGridColor },
      beginAtZero: true,
    },
  }), [chartTextColor, chartGridColor]);

  /* ── Comparison Bar Chart Data (Colleges / Batches / Depts) ── */
  const comparisonData = useMemo(() => {
    let source = [];
    let labelKey = "";
    if (comparisonMode === "colleges") {
      source = academicData.collegeStats || [];
      labelKey = "college";
    } else if (comparisonMode === "batches") {
      source = academicData.batchStats || [];
      labelKey = "batch";
    } else {
      source = academicData.departmentStats || [];
      labelKey = "department";
    }

    const labels = source.map(item => {
      const val = item[labelKey] || "Unknown";
      if (comparisonMode === "batches") return `Batch ${val}`;
      return val.length > 20 ? val.slice(0, 18) + "…" : val;
    });

    const totalSubs = source.map(item => item.totalSubmissions || 0);
    const acceptedSubs = source.map(item => item.acceptedSubmissions || 0);

    return {
      labels,
      datasets: [
        {
          label: "Total Submissions",
          data: totalSubs,
          backgroundColor: isDark ? "rgba(80, 181, 242, 0.3)" : "rgba(0, 120, 212, 0.25)",
          borderColor: isDark ? "#50b5f2" : "#0078d4",
          borderWidth: 1.5,
          borderRadius: 4,
        },
        {
          label: "Accepted Solutions",
          data: acceptedSubs,
          backgroundColor: isDark ? "rgba(74, 222, 128, 0.7)" : "rgba(21, 128, 61, 0.75)",
          borderColor: isDark ? "#4ade80" : "#15803d",
          borderWidth: 1.5,
          borderRadius: 4,
        },
      ],
      rawItems: source,
    };
  }, [comparisonMode, academicData, isDark]);

  /* ── Chart datasets ──────────────────────────────────────── */
  const diffBarData = {
    labels: ["Basic", "Easy", "Medium", "Hard"],
    datasets: [
      {
        label: "Total Problems",
        data: [diffStats.totals.Basic, diffStats.totals.Easy, diffStats.totals.Medium, diffStats.totals.Hard],
        backgroundColor: ["rgba(2,132,199,0.25)", "rgba(21,128,61,0.25)", "rgba(180,83,9,0.25)", "rgba(185,28,28,0.25)"],
        borderColor:     ["#0284c7", "#15803d", "#b45309", "#b91c1c"],
        borderWidth: 1.5,
        borderRadius: 4,
      },
      {
        label: "Solved (Accepted)",
        data: [diffStats.solved.Basic, diffStats.solved.Easy, diffStats.solved.Medium, diffStats.solved.Hard],
        backgroundColor: ["#0284c7", "#15803d", "#b45309", "#b91c1c"],
        borderColor:     ["#0284c7", "#15803d", "#b45309", "#b91c1c"],
        borderWidth: 1.5,
        borderRadius: 4,
      },
    ],
  };

  const verdictPieData = {
    labels: Object.keys(verdictMap),
    datasets: [{
      data: Object.values(verdictMap),
      backgroundColor: Object.keys(verdictMap).map(v => ({
        "Accepted":            "#15803d",
        "Wrong Answer":        "#b91c1c",
        "Time Limit Exceeded": "#b45309",
        "Runtime Error":       "#7c3aed",
        "Compilation Error":   "#64748b",
      }[v] || "#7a8694")),
      borderColor: sliceBorderColor,
      borderWidth: 2,
    }],
  };

  const langPieData = {
    labels: Object.keys(langMap),
    datasets: [{
      data: Object.values(langMap),
      backgroundColor: Object.keys(langMap).map(l => LANG_COLORS[l] || LANG_COLORS.other),
      borderColor: sliceBorderColor,
      borderWidth: 2,
    }],
  };

  const topProblemsBarData = {
    labels: topProblems.map(p => p.title.length > 20 ? p.title.slice(0, 18) + "…" : p.title),
    datasets: [
      {
        label: "Total Attempts",
        data: topProblems.map(p => p.attempts),
        backgroundColor: "rgba(0, 120, 212, 0.25)",
        borderColor: "#0078d4",
        borderWidth: 1.5,
        borderRadius: 4,
      },
      {
        label: "Accepted",
        data: topProblems.map(p => p.accepted),
        backgroundColor: "#15803d",
        borderColor: "#15803d",
        borderWidth: 1.5,
        borderRadius: 4,
      },
    ],
  };

  const lineData = {
    labels: submissionsPerDay.labels,
    datasets: [
      {
        label: "Total Submissions",
        data: submissionsPerDay.counts,
        borderColor: "#0078d4",
        backgroundColor: "rgba(0, 120, 212, 0.08)",
        borderWidth: 2,
        fill: true,
        tension: 0.3,
        pointRadius: 2,
        pointHoverRadius: 5,
        pointBackgroundColor: "#0078d4",
      },
      {
        label: "Accepted",
        data: submissionsPerDay.accepted,
        borderColor: "#15803d",
        backgroundColor: "rgba(21, 128, 61, 0.08)",
        borderWidth: 2,
        fill: true,
        tension: 0.3,
        pointRadius: 2,
        pointHoverRadius: 5,
        pointBackgroundColor: "#15803d",
      },
    ],
  };

  /* ── Export to Excel (with Academic Columns) ─────────────── */
  const handleExport = () => {
    setExporting(true);
    try {
      const lbRows = filteredLeaderboardData.map((s, i) => ({
        "Rank":            i + 1,
        "Name":            s.name || "N/A",
        "Email":           s.email || "N/A",
        "College":         s.college || "N/A",
        "Department":      s.degree || "N/A",
        "Graduating Batch":s.yearOfPassing || "N/A",
        "Problems Solved": s.solvedCount || 0,
        "Total Submissions": s.totalSubmissions || 0,
        "Acceptance Rate": s.acceptanceRate ? `${s.acceptanceRate}%` : "N/A",
      }));

      const wb = XLSX.utils.book_new();
      const ws1 = XLSX.utils.json_to_sheet(lbRows);
      XLSX.utils.book_append_sheet(wb, ws1, "Cohort Leaderboard");

      const subRows = filteredSubmissions.map((s, i) => ({
        "#": i + 1,
        "Student":         s.user?.name || "N/A",
        "Email":           s.user?.email || "N/A",
        "College":         s.user?.college || "N/A",
        "Department":      s.user?.degree || "N/A",
        "Graduating Batch":s.user?.yearOfPassing || "N/A",
        "Problem":         s.problem?.title || "N/A",
        "Difficulty":      s.problem?.difficulty || "N/A",
        "Language":        s.language || "N/A",
        "Verdict":         s.result || "N/A",
        "Date":            s.createdAt ? new Date(s.createdAt).toLocaleString() : "N/A",
      }));
      const ws2 = XLSX.utils.json_to_sheet(subRows);
      XLSX.utils.book_append_sheet(wb, ws2, "Cohort Submissions");

      // Sheet 3: College & Batch Comparison Table
      if (academicData.collegeStats?.length) {
        const collegeRows = academicData.collegeStats.map((c, i) => ({
          "Rank": i + 1,
          "College": c.college || "N/A",
          "Active Students": c.totalStudents || 0,
          "Unique Solvers": c.uniqueSolvers || 0,
          "Total Submissions": c.totalSubmissions || 0,
          "Accepted Solutions": c.acceptedSubmissions || 0,
          "Acceptance Rate": `${c.acceptanceRate || 0}%`,
        }));
        const ws3 = XLSX.utils.json_to_sheet(collegeRows);
        XLSX.utils.book_append_sheet(wb, ws3, "Colleges Benchmarking");
      }

      let fileName = "Coding_Analytics_Overview.xlsx";
      if (selectedCollege) fileName = `Coding_Analytics_${selectedCollege.replace(/[^a-zA-Z0-9]/g, "_")}.xlsx`;
      XLSX.writeFile(wb, fileName);
    } catch (e) {
      alert("Export failed: " + e.message);
    } finally {
      setExporting(false);
    }
  };

  const hasActiveFilters = Boolean(
    selectedCollege || selectedDepartment || selectedBatch || startDate || endDate
  );

  /* ── Render ──────────────────────────────────────────────── */
  return (
    <div className="aca-shell">
      {/* ── Page Heading ────────────────────────────────────── */}
      <div className="aca-heading">
        <div>
          <div className="aca-eyebrow">
            <FaGlobe size={11} /> Academic Coding Intelligence &amp; Analytics
          </div>
          <h1>Coding Analytics Overview</h1>
          <p>
            Cross-college benchmarking, batch performance analytics, difficulty trends, and academic student leaderboards.
          </p>
        </div>
        <div className="aca-header-actions">
          <Link to="/admin" className="aca-btn-back">
            <FaArrowLeft /> Back to Dashboard
          </Link>
          <button
            type="button"
            className="aca-btn-excel"
            onClick={handleExport}
            disabled={exporting || filteredSubmissions.length === 0}
          >
            <FaFileExcel /> {exporting ? "Exporting…" : "Export to Excel"}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="aca-loading-wrap">
          <div className="aca-spinner" />
          <p>Loading academic &amp; platform analytics…</p>
        </div>
      ) : (
        <div className="aca-content">

          {/* ── Academic & College Filter Bar ──────────────── */}
          <div className="aca-card aca-filter-card">
            <div className="aca-filter-header">
              <div className="aca-filter-title">
                <FaFilter /> Academic Cohort &amp; Date Filters
                {hasActiveFilters && (
                  <span className="aca-filter-badge-active">Active Filters</span>
                )}
              </div>
              {hasActiveFilters && (
                <button
                  type="button"
                  className="aca-reset-btn"
                  onClick={() => {
                    setSelectedCollege("");
                    setSelectedDepartment("");
                    setSelectedBatch("");
                    setStartDate("");
                    setEndDate("");
                    setDatePreset("all");
                  }}
                >
                  <FaUndo size={10} /> Reset Filters
                </button>
              )}
            </div>

            <div className="aca-filter-grid">
              {/* College Filter */}
              <div className="aca-filter-group">
                <label>
                  <FaUniversity /> College / Institution
                </label>
                <select
                  value={selectedCollege}
                  onChange={(e) => setSelectedCollege(e.target.value)}
                >
                  <option value="">All Colleges ({academicData.colleges.length})</option>
                  {academicData.colleges.map((col) => (
                    <option key={col} value={col}>
                      {col}
                    </option>
                  ))}
                </select>
              </div>

              {/* Department Filter */}
              <div className="aca-filter-group">
                <label>
                  <FaGraduationCap /> Department / Degree
                </label>
                <select
                  value={selectedDepartment}
                  onChange={(e) => setSelectedDepartment(e.target.value)}
                >
                  <option value="">All Departments ({academicData.departments.length})</option>
                  {academicData.departments.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              </div>

              {/* Batch / Year Filter */}
              <div className="aca-filter-group">
                <label>
                  <FaCalendarAlt /> Graduating Batch
                </label>
                <select
                  value={selectedBatch}
                  onChange={(e) => setSelectedBatch(e.target.value)}
                >
                  <option value="">All Batches ({academicData.batches.length})</option>
                  {academicData.batches.map((b) => (
                    <option key={b} value={b}>
                      Batch {b}
                    </option>
                  ))}
                </select>
              </div>

              {/* From Date Filter */}
              <div className="aca-filter-group">
                <label>
                  <FaCalendarAlt /> From Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    setDatePreset("custom");
                  }}
                />
              </div>

              {/* To Date Filter */}
              <div className="aca-filter-group">
                <label>
                  <FaCalendarAlt /> To Date
                </label>
                <input
                  type="date"
                  value={endDate}
                  min={startDate || undefined}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    setDatePreset("custom");
                  }}
                />
              </div>
            </div>

            {/* Quick Date Presets Bar */}
            <div className="aca-date-presets">
              <span className="aca-preset-label">Date Presets:</span>
              <button
                type="button"
                className={`aca-preset-btn ${datePreset === "today" ? "active" : ""}`}
                onClick={() => applyDatePreset("today")}
              >
                Today
              </button>
              <button
                type="button"
                className={`aca-preset-btn ${datePreset === "7days" ? "active" : ""}`}
                onClick={() => applyDatePreset("7days")}
              >
                Last 7 Days
              </button>
              <button
                type="button"
                className={`aca-preset-btn ${datePreset === "30days" ? "active" : ""}`}
                onClick={() => applyDatePreset("30days")}
              >
                Last 30 Days
              </button>
              <button
                type="button"
                className={`aca-preset-btn ${datePreset === "month" ? "active" : ""}`}
                onClick={() => applyDatePreset("month")}
              >
                This Month
              </button>
              <button
                type="button"
                className={`aca-preset-btn ${datePreset === "all" && !startDate && !endDate ? "active" : ""}`}
                onClick={() => applyDatePreset("all")}
              >
                All Time
              </button>
            </div>

            {/* Active Chips & Cohort Count */}
            {hasActiveFilters && (
              <div className="aca-active-chips">
                <span className="aca-chips-label">Selected:</span>
                {selectedCollege && (
                  <span className="aca-chip">
                    <FaUniversity size={10} /> {selectedCollege}
                    <button type="button" onClick={() => setSelectedCollege("")}>×</button>
                  </span>
                )}
                {selectedDepartment && (
                  <span className="aca-chip">
                    <FaGraduationCap size={10} /> {selectedDepartment}
                    <button type="button" onClick={() => setSelectedDepartment("")}>×</button>
                  </span>
                )}
                {selectedBatch && (
                  <span className="aca-chip">
                    <FaCalendarAlt size={10} /> Batch {selectedBatch}
                    <button type="button" onClick={() => setSelectedBatch("")}>×</button>
                  </span>
                )}
                {(startDate || endDate) && (
                  <span className="aca-chip">
                    <FaCalendarAlt size={10} /> Period: {startDate || "Start"} &rarr; {endDate || "Present"}
                    <button
                      type="button"
                      onClick={() => {
                        setStartDate("");
                        setEndDate("");
                        setDatePreset("all");
                      }}
                    >
                      ×
                    </button>
                  </span>
                )}
                <span className="aca-chip-count">
                  Filtering <strong>{filteredSubmissions.length}</strong> of {allSubmissions.length} submissions ({filteredLeaderboardData.length} students)
                </span>
              </div>
            )}
          </div>

          {/* ── KPI Stat Cards (Reflects Filtered Cohort) ───── */}
          <div className="aca-stat-grid">
            <div className="aca-stat-card">
              <span className="aca-stat-icon"><FaCode /></span>
              <small>Catalog Problems</small>
              <strong>{problems.length}</strong>
              <span>Available to solve</span>
            </div>

            <div className="aca-stat-card cyan">
              <span className="aca-stat-icon"><FaBolt /></span>
              <small>Cohort Submissions</small>
              <strong>{filteredSubmissions.length.toLocaleString()}</strong>
              <span>{hasActiveFilters ? "Filtered volume" : "Across platform"}</span>
            </div>

            <div className="aca-stat-card green">
              <span className="aca-stat-icon"><FaCheckCircle /></span>
              <small>Accepted</small>
              <strong>{accepted.length.toLocaleString()}</strong>
              <span>Passed all tests</span>
            </div>

            <div className="aca-stat-card red">
              <span className="aca-stat-icon"><FaTimesCircle /></span>
              <small>Rejected</small>
              <strong>{rejected.length.toLocaleString()}</strong>
              <span>WA / TLE / Error</span>
            </div>

            <div className="aca-stat-card orange">
              <span className="aca-stat-icon"><FaChartPie /></span>
              <small>Acceptance Rate</small>
              <strong>{acceptRate}%</strong>
              <span>Cohort success</span>
            </div>

            <div className="aca-stat-card purple">
              <span className="aca-stat-icon"><FaUsers /></span>
              <small>Active Students</small>
              <strong>{filteredLeaderboardData.length}</strong>
              <span>In this cohort</span>
            </div>

            <div className="aca-stat-card blue">
              <span className="aca-stat-icon"><FaTrophy /></span>
              <small>Unique Solvers</small>
              <strong>{uniqueSolvers}</strong>
              <span>Solved ≥ 1 problem</span>
            </div>
          </div>

          {/* ── Batch & College Benchmarking Comparison Bar Chart ─ */}
          <div className="aca-card aca-benchmarking-card">
            <div className="aca-card-header">
              <div>
                <h3><FaChartBar /> Academic Cohort Benchmarking (Comparison)</h3>
                <span>Compare submission volume and accepted solution rates across colleges, batches, or degrees</span>
              </div>
              <div className="aca-tab-group">
                <button
                  type="button"
                  className={`aca-tab-btn ${comparisonMode === "colleges" ? "active" : ""}`}
                  onClick={() => setComparisonMode("colleges")}
                >
                  <FaUniversity size={11} /> By College ({academicData.colleges.length})
                </button>
                <button
                  type="button"
                  className={`aca-tab-btn ${comparisonMode === "batches" ? "active" : ""}`}
                  onClick={() => setComparisonMode("batches")}
                >
                  <FaCalendarAlt size={11} /> By Batch Year ({academicData.batches.length})
                </button>
                <button
                  type="button"
                  className={`aca-tab-btn ${comparisonMode === "departments" ? "active" : ""}`}
                  onClick={() => setComparisonMode("departments")}
                >
                  <FaGraduationCap size={11} /> By Department ({academicData.departments.length})
                </button>
              </div>
            </div>

            <div className="aca-benchmarking-body">
              <div className="aca-chart-canvas-wrap comparison-chart-wrap">
                {comparisonData.labels.length > 0 ? (
                  <Bar
                    data={{
                      labels: comparisonData.labels,
                      datasets: comparisonData.datasets,
                    }}
                    options={{
                      ...baseChartOptions,
                      scales: cartesianScales,
                    }}
                  />
                ) : (
                  <div className="aca-empty">No comparison statistics available yet.</div>
                )}
              </div>

              {/* Cohort Leaders Sidebar Cards */}
              <div className="aca-cohort-cards-sidebar">
                <div className="aca-cohort-sidebar-title">
                  <FaMedal /> Top Performing {comparisonMode === "colleges" ? "Colleges" : comparisonMode === "batches" ? "Batches" : "Departments"}
                </div>
                <div className="aca-cohort-mini-list">
                  {(comparisonData.rawItems || []).slice(0, 5).map((item, idx) => {
                    const title = item.college || item.batch || item.department || "Unknown";
                    return (
                      <div key={idx} className="aca-cohort-mini-item">
                        <span className={`aca-cohort-badge-rank rank-${idx + 1}`}>#{idx + 1}</span>
                        <div className="aca-cohort-mini-details">
                          <span className="aca-cohort-mini-name" title={title}>
                            {comparisonMode === "batches" ? `Batch ${title}` : title}
                          </span>
                          <span className="aca-cohort-mini-sub">
                            {item.totalStudents} students • {item.totalSubmissions} submissions
                          </span>
                        </div>
                        <span className="aca-badge-pass">{item.acceptanceRate}% AC</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* ── Difficulty Breakdown Card ───────────────────── */}
          <div className="aca-card aca-diff-card-wrap">
            <div className="aca-card-header">
              <h3><FaFire /> Difficulty Breakdown {hasActiveFilters && "(Filtered Cohort)"}</h3>
              <span>Catalog volume vs accepted solves</span>
            </div>
            <div className="aca-diff-grid">
              {Object.entries(DIFF_CONFIG).map(([key, cfg]) => {
                const total  = diffStats.totals[key] || 0;
                const solved = diffStats.solved[key]  || 0;
                const pct    = total > 0 ? Math.round((solved / total) * 100) : 0;
                return (
                  <div key={key} className="aca-diff-box">
                    <div className="aca-diff-box-top">
                      <span className="aca-diff-tag" style={{ background: cfg.bg, color: cfg.color }}>
                        {cfg.label}
                      </span>
                      <strong style={{ color: cfg.color }}>{solved} <span className="aca-diff-slash">/ {total}</span></strong>
                    </div>
                    <div className="aca-progress-track">
                      <div
                        className="aca-progress-fill"
                        style={{ width: `${pct}%`, background: cfg.color }}
                      />
                    </div>
                    <span className="aca-diff-pct">{pct}% solved</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── Submissions Activity Over Time (Full Width) ─── */}
          <div className="aca-card aca-chart-card">
            <div className="aca-card-header">
              <h3><FaChartBar /> Submissions Activity — Last 30 Days {hasActiveFilters && "(Cohort)"}</h3>
              <span>Daily submission count and accepted answers</span>
            </div>
            <div className="aca-chart-canvas-wrap line-chart-wrap">
              <Line
                data={lineData}
                options={{
                  ...baseChartOptions,
                  scales: {
                    x: {
                      ticks: { color: chartTextColor, maxRotation: 45, font: { size: 10 } },
                      grid: { color: chartGridColor },
                    },
                    y: {
                      ticks: { color: chartTextColor, font: { size: 11 } },
                      grid: { color: chartGridColor },
                      beginAtZero: true,
                    },
                  },
                }}
              />
            </div>
          </div>

          {/* ── 3 Column Charts Grid: Difficulty, Verdict, Lang ─ */}
          <div className="aca-charts-grid-three">
            <div className="aca-card aca-chart-card">
              <div className="aca-card-header">
                <h3><FaChartBar /> Difficulty Comparison</h3>
                <span>Total vs solved</span>
              </div>
              <div className="aca-chart-canvas-wrap">
                <Bar
                  data={diffBarData}
                  options={{
                    ...baseChartOptions,
                    scales: cartesianScales,
                  }}
                />
              </div>
            </div>

            <div className="aca-card aca-chart-card">
              <div className="aca-card-header">
                <h3><FaChartPie /> Verdict Breakdown</h3>
                <span>Result distribution</span>
              </div>
              <div className="aca-chart-canvas-wrap">
                {Object.keys(verdictMap).length > 0 ? (
                  <Doughnut
                    data={verdictPieData}
                    options={{
                      ...baseChartOptions,
                      cutout: "62%",
                      plugins: {
                        ...baseChartOptions.plugins,
                        legend: { position: "bottom", labels: { color: chartTextColor, padding: 10, font: { size: 11 } } },
                      },
                    }}
                  />
                ) : (
                  <div className="aca-empty">No submission records yet.</div>
                )}
              </div>
            </div>

            <div className="aca-card aca-chart-card">
              <div className="aca-card-header">
                <h3><FaCode /> Language Usage</h3>
                <span>Popular runtime languages</span>
              </div>
              <div className="aca-chart-canvas-wrap">
                {Object.keys(langMap).length > 0 ? (
                  <Pie
                    data={langPieData}
                    options={{
                      ...baseChartOptions,
                      plugins: {
                        ...baseChartOptions.plugins,
                        legend: { position: "bottom", labels: { color: chartTextColor, padding: 10, font: { size: 11 } } },
                      },
                    }}
                  />
                ) : (
                  <div className="aca-empty">No language records yet.</div>
                )}
              </div>
            </div>
          </div>

          {/* ── Top 10 Most Attempted Problems ─────────────── */}
          {topProblems.length > 0 && (
            <div className="aca-grid-two">
              <div className="aca-card aca-chart-card">
                <div className="aca-card-header">
                  <h3><FaFire /> Top 10 Attempted Problems {hasActiveFilters && "(Cohort)"}</h3>
                  <span>Total tries vs successful solves</span>
                </div>
                <div className="aca-chart-canvas-wrap tall-chart-wrap">
                  <Bar
                    data={topProblemsBarData}
                    options={{
                      ...baseChartOptions,
                      indexAxis: "y",
                      scales: {
                        x: {
                          ticks: { color: chartTextColor, font: { size: 11 } },
                          grid: { color: chartGridColor },
                          beginAtZero: true,
                        },
                        y: {
                          ticks: { color: chartTextColor, font: { size: 11 } },
                          grid: { color: chartGridColor },
                        },
                      },
                    }}
                  />
                </div>
              </div>

              <div className="aca-card">
                <div className="aca-card-header">
                  <h3><FaMedal /> Top Problems Overview</h3>
                  <span>Ranked by submission volume</span>
                </div>
                <div className="aca-problem-list">
                  {topProblems.map((p, i) => (
                    <div key={i} className="aca-problem-row">
                      <span className="aca-problem-rank">#{i + 1}</span>
                      <div className="aca-problem-info">
                        <span className="aca-problem-name" title={p.title}>{p.title}</span>
                        <span className="aca-problem-sub">{p.attempts} submissions</span>
                      </div>
                      <span className="aca-badge-pass">{p.accepted} AC</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── Student Leaderboard Table with Academic Metadata ─ */}
          <div className="aca-card aca-table-card">
            <div className="aca-table-header">
              <div>
                <h3 className="aca-table-title"><FaTrophy /> Academic Student Leaderboard</h3>
                <span className="aca-table-subtitle">
                  Ranked by accepted solutions • Displays College, Department &amp; Batch
                </span>
              </div>
              <div className="aca-table-actions">
                <div className="aca-search-box">
                  <FaSearch size={12} />
                  <input
                    type="text"
                    placeholder="Search by student, college, degree…"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                  />
                </div>
                <span className="aca-table-count">
                  {filteredLeaderboardData.length} students
                </span>
              </div>
            </div>

            <div className="aca-table-wrap">
              <table className="aca-table">
                <thead>
                  <tr>
                    <th style={{ width: "6%" }}>Rank</th>
                    <th style={{ width: "26%" }}>Student</th>
                    <th style={{ width: "22%" }}>College &amp; Department</th>
                    <th style={{ width: "10%" }}>Batch</th>
                    <th style={{ width: "12%" }}>Solved</th>
                    <th style={{ width: "12%" }}>Submissions</th>
                    <th style={{ width: "12%" }}>Acceptance</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLeaderboardData.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ textAlign: "center", padding: "36px 16px" }}>
                        <div className="aca-empty">
                          No matching students found for the selected academic cohort.
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredLeaderboardData.map((s, i) => {
                      const rankClass = i === 0 ? "rank-1" : i === 1 ? "rank-2" : i === 2 ? "rank-3" : "rank-n";
                      const acRate    = s.totalSubmissions > 0
                        ? Math.round((s.solvedCount / s.totalSubmissions) * 100)
                        : 0;
                      return (
                        <tr key={s._id || i}>
                          <td>
                            <span className={`aca-rank-pill ${rankClass}`}>{i + 1}</span>
                          </td>
                          <td>
                            <div className="aca-user-cell">
                              <div className="aca-user-avatar">
                                {(s.name || "?")[0].toUpperCase()}
                              </div>
                              <div className="aca-user-meta">
                                <span className="aca-user-name">{s.name || "Unknown"}</span>
                                <span className="aca-user-email">{s.email || "—"}</span>
                              </div>
                            </div>
                          </td>
                          <td>
                            <div className="aca-academic-meta">
                              <span className="aca-college-tag" title={s.college}>
                                <FaUniversity size={10} /> {s.college || "No College"}
                              </span>
                              <span className="aca-degree-tag" title={s.degree}>
                                <FaGraduationCap size={10} /> {s.degree || "General"}
                              </span>
                            </div>
                          </td>
                          <td>
                            {s.yearOfPassing ? (
                              <span className="aca-batch-pill">
                                '{String(s.yearOfPassing).slice(-2)}
                              </span>
                            ) : (
                              <span className="aca-muted-dash">—</span>
                            )}
                          </td>
                          <td>
                            <span className="aca-badge-pass">
                              <FaCheckCircle size={10} /> {s.solvedCount || 0}
                            </span>
                          </td>
                          <td>
                            <span className="aca-sub-count">{s.totalSubmissions || 0}</span>
                            <span className="aca-sub-unit"> tries</span>
                          </td>
                          <td>
                            <span className={acRate >= 50 ? "aca-badge-pass" : "aca-badge-fail"}>
                              {acRate}%
                            </span>
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
      )}
    </div>
  );
}

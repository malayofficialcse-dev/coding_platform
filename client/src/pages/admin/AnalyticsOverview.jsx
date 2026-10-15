import React, { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import api from "../../api/api";
import { useTheme } from "../../contexts/ThemeContext";
import { Bar, Doughnut, Line } from "react-chartjs-2";
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
  FaClipboardList,
  FaFileExcel,
  FaChartBar,
  FaQuestionCircle,
  FaClock,
  FaCheckCircle,
  FaTimesCircle,
  FaSearch,
  FaUsers,
  FaUniversity,
  FaGraduationCap,
  FaCalendarAlt,
  FaFilter,
  FaUndo,
  FaTrophy,
  FaFire,
  FaAward,
  FaArrowLeft,
  FaCode,
  FaSort,
  FaSortUp,
  FaSortDown,
} from "react-icons/fa";
import * as XLSX from "xlsx";
import "./AnalyticsOverview.css";

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

export default function AnalyticsOverview() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  // Data states
  const [analyticsData, setAnalyticsData] = useState({
    globalStats: {
      totalExams: 0,
      totalQuestions: 0,
      totalAttempts: 0,
      passCount: 0,
      failCount: 0,
      overallPassRate: 0,
      averageScore: 0,
      highestScore: 0,
      uniqueCandidates: 0,
    },
    exams: [],
    academicStats: {
      colleges: [],
      batches: [],
      departments: [],
    },
    timeline: [],
    filterOptions: {
      colleges: [],
      departments: [],
      batches: [],
      exams: [],
    },
  });

  // Cached filter options so dropdowns remain complete
  const [cachedFilterOptions, setCachedFilterOptions] = useState({
    colleges: [],
    departments: [],
    batches: [],
    exams: [],
  });

  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [search, setSearch] = useState("");

  // Academic & Date Filter states
  const [selectedCollege, setSelectedCollege] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [selectedBatch, setSelectedBatch] = useState("");
  const [selectedExam, setSelectedExam] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [datePreset, setDatePreset] = useState("all");

  // Chart comparison mode: 'colleges' | 'batches' | 'departments' | 'exams'
  const [comparisonMode, setComparisonMode] = useState("colleges");

  // Sorting state for assessments table
  const [sortField, setSortField] = useState("totalAttempts");
  const [sortOrder, setSortOrder] = useState("desc");

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

  // Fetch overview analytics with active query filters
  useEffect(() => {
    let isMounted = true;
    const fetchAnalytics = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (selectedCollege) params.append("college", selectedCollege);
        if (selectedDepartment) params.append("department", selectedDepartment);
        if (selectedBatch) params.append("batch", selectedBatch);
        if (selectedExam) params.append("examId", selectedExam);
        if (startDate) params.append("fromDate", startDate);
        if (endDate) params.append("toDate", endDate);

        const url = `/exams/overview/analytics${params.toString() ? `?${params.toString()}` : ""}`;
        const res = await api.get(url);
        const data = res.data || {};

        if (isMounted) {
          setAnalyticsData(data);
          if (
            data.filterOptions &&
            (!cachedFilterOptions.colleges.length || (!selectedCollege && !selectedDepartment && !selectedBatch))
          ) {
            setCachedFilterOptions(data.filterOptions);
          }
        }
      } catch (err) {
        console.error("Failed to load overall exam analytics:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchAnalytics();
    return () => {
      isMounted = false;
    };
  }, [selectedCollege, selectedDepartment, selectedBatch, selectedExam, startDate, endDate]);

  // Clear all filters
  const handleClearFilters = () => {
    setSelectedCollege("");
    setSelectedDepartment("");
    setSelectedBatch("");
    setSelectedExam("");
    setStartDate("");
    setEndDate("");
    setDatePreset("all");
  };

  const hasActiveFilters = Boolean(
    selectedCollege || selectedDepartment || selectedBatch || selectedExam || startDate || endDate
  );

  /* ── Chart Styling & Theme Configuration ── */
  const chartTextColor = isDark ? "#cbd5e1" : "#64748b";
  const chartGridColor = isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.06)";
  const chartTooltipBg = isDark ? "#1e293b" : "#ffffff";
  const chartTooltipBorder = isDark ? "#334155" : "#e2e8f0";
  const chartTooltipTitle = isDark ? "#f8fafc" : "#0f172a";
  const chartTooltipBody = isDark ? "#cbd5e1" : "#334155";
  const sliceBorderColor = isDark ? "#1e293b" : "#ffffff";

  const baseChartOptions = useMemo(
    () => ({
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
    }),
    [chartTextColor, chartTooltipBg, chartTooltipBorder, chartTooltipTitle, chartTooltipBody]
  );

  const cartesianScales = useMemo(
    () => ({
      x: {
        ticks: {
          color: chartTextColor,
          font: { size: 11 },
          maxRotation: 35,
          minRotation: 0,
        },
        grid: { color: chartGridColor },
      },
      y: {
        ticks: { color: chartTextColor, font: { size: 11 } },
        grid: { color: chartGridColor },
        beginAtZero: true,
      },
    }),
    [chartTextColor, chartGridColor]
  );

  /* ── 1. Cohort Benchmarking Chart ── */
  const cohortChartData = useMemo(() => {
    let source = [];
    let labelKey = "";

    if (comparisonMode === "colleges") {
      source = analyticsData.academicStats?.colleges || [];
      labelKey = "college";
    } else if (comparisonMode === "batches") {
      source = analyticsData.academicStats?.batches || [];
      labelKey = "batch";
    } else if (comparisonMode === "departments") {
      source = analyticsData.academicStats?.departments || [];
      labelKey = "department";
    } else {
      source = analyticsData.exams || [];
      labelKey = "title";
    }

    const items = source.slice(0, 10);
    const labels = items.map((item) => {
      const val = item[labelKey] || "Unknown";
      return val.length > 20 ? `${val.slice(0, 18)}…` : val;
    });

    const attempts = items.map((item) => item.attempts || item.totalAttempts || 0);
    const passRates = items.map((item) => item.passRate || item.passPercentage || 0);

    return {
      labels,
      datasets: [
        {
          label: "Candidate Attempts",
          data: attempts,
          backgroundColor: isDark ? "rgba(56, 189, 248, 0.75)" : "rgba(2, 132, 199, 0.8)",
          borderColor: isDark ? "#38bdf8" : "#0284c7",
          borderWidth: 1,
          borderRadius: 4,
          yAxisID: "y",
        },
        {
          label: "Pass Rate (%)",
          data: passRates,
          backgroundColor: isDark ? "rgba(52, 211, 153, 0.75)" : "rgba(22, 163, 74, 0.8)",
          borderColor: isDark ? "#34d399" : "#16a34a",
          borderWidth: 1,
          borderRadius: 4,
          yAxisID: "y1",
        },
      ],
    };
  }, [comparisonMode, analyticsData, isDark]);

  const cohortChartOptions = useMemo(
    () => ({
      ...baseChartOptions,
      scales: {
        x: cartesianScales.x,
        y: {
          type: "linear",
          display: true,
          position: "left",
          ticks: { color: chartTextColor, font: { size: 11 } },
          grid: { color: chartGridColor },
          beginAtZero: true,
          title: {
            display: true,
            text: "Total Attempts",
            color: chartTextColor,
            font: { size: 11, weight: "bold" },
          },
        },
        y1: {
          type: "linear",
          display: true,
          position: "right",
          max: 100,
          ticks: {
            color: chartTextColor,
            font: { size: 11 },
            callback: (v) => `${v}%`,
          },
          grid: { drawOnChartArea: false },
          beginAtZero: true,
          title: {
            display: true,
            text: "Pass Rate (%)",
            color: chartTextColor,
            font: { size: 11, weight: "bold" },
          },
        },
      },
    }),
    [baseChartOptions, cartesianScales, chartTextColor, chartGridColor]
  );

  /* ── 2. Pass vs Fail Outcome Doughnut ── */
  const doughnutData = useMemo(() => {
    const pass = analyticsData.globalStats?.passCount || 0;
    const fail = analyticsData.globalStats?.failCount || 0;

    return {
      labels: ["Passed Attempts", "Failed Attempts"],
      datasets: [
        {
          data: [pass, fail],
          backgroundColor: ["#16a34a", "#dc2626"],
          borderColor: sliceBorderColor,
          borderWidth: 2,
          hoverOffset: 4,
        },
      ],
    };
  }, [analyticsData.globalStats, sliceBorderColor]);

  /* ── 3. 30-Day Activity & Completion Line Chart ── */
  const lineData = useMemo(() => {
    const rawTimeline = analyticsData.timeline || [];
    const labels = rawTimeline.map((t) => {
      if (!t.date) return "";
      const [, m, d] = t.date.split("-");
      return `${m}/${d}`;
    });

    const attempts = rawTimeline.map((t) => t.attempts || 0);
    const passes = rawTimeline.map((t) => t.passCount || 0);

    return {
      labels,
      datasets: [
        {
          label: "Attempts",
          data: attempts,
          borderColor: "#0284c7",
          backgroundColor: "rgba(2, 132, 199, 0.12)",
          borderWidth: 2,
          fill: true,
          tension: 0.35,
          pointRadius: 2,
          pointHoverRadius: 6,
          pointBackgroundColor: "#0284c7",
        },
        {
          label: "Passed",
          data: passes,
          borderColor: "#16a34a",
          backgroundColor: "rgba(22, 163, 74, 0.12)",
          borderWidth: 2,
          fill: true,
          tension: 0.35,
          pointRadius: 2,
          pointHoverRadius: 6,
          pointBackgroundColor: "#16a34a",
        },
      ],
    };
  }, [analyticsData.timeline]);

  /* ── 4. Spotlight Highlights ── */
  const highlights = useMemo(() => {
    const examList = analyticsData.exams || [];
    if (!examList.length) {
      return {
        topAttempted: null,
        topPassRate: null,
        avgScoreExam: null,
      };
    }

    // Most attempted
    const sortedByAttempts = [...examList].sort(
      (a, b) => (b.totalAttempts || 0) - (a.totalAttempts || 0)
    );
    const topAttempted = sortedByAttempts[0];

    // Highest pass rate (among those with at least 1 attempt)
    const withAttempts = examList.filter((e) => (e.totalAttempts || 0) > 0);
    const sortedByPassRate = [...withAttempts].sort(
      (a, b) => (b.passPercentage || 0) - (a.passPercentage || 0)
    );
    const topPassRate = sortedByPassRate[0] || null;

    // Highest average score
    const sortedByAvgScore = [...withAttempts].sort(
      (a, b) => (b.averageScore || 0) - (a.averageScore || 0)
    );
    const avgScoreExam = sortedByAvgScore[0] || null;

    return { topAttempted, topPassRate, avgScoreExam };
  }, [analyticsData.exams]);

  /* ── 5. Assessment Table Sorting & Filtering ── */
  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
  };

  const filteredExams = useMemo(() => {
    const term = search.trim().toLowerCase();
    let list = (analyticsData.exams || []).filter((e) => {
      if (!term) return true;
      return (
        e.title?.toLowerCase().includes(term) ||
        e._id?.toLowerCase().includes(term)
      );
    });

    list.sort((a, b) => {
      let vA = a[sortField] ?? 0;
      let vB = b[sortField] ?? 0;

      if (typeof vA === "string") {
        vA = vA.toLowerCase();
        vB = (vB || "").toLowerCase();
        return sortOrder === "asc" ? vA.localeCompare(vB) : vB.localeCompare(vA);
      }

      return sortOrder === "asc" ? vA - vB : vB - vA;
    });

    return list;
  }, [analyticsData.exams, search, sortField, sortOrder]);

  /* ── 6. Multi-Sheet Excel Export ── */
  const handleExport = () => {
    setExporting(true);
    try {
      const wb = XLSX.utils.book_new();

      // Sheet 1: Assessments Overview
      const examRows = (analyticsData.exams || []).map((e, idx) => ({
        "S.No": idx + 1,
        "Exam ID": e._id,
        "Exam Title": e.title || "N/A",
        "Question Count": e.questionCount || 0,
        "Passing Marks Cutoff": e.passingMarks || 0,
        "Duration (Mins)": e.duration || 30,
        "Total Attempts": e.totalAttempts || 0,
        "Passed Candidates": e.passCount || 0,
        "Failed Candidates": e.failCount || 0,
        "Pass Percentage": `${e.passPercentage || 0}%`,
        "Average Score": e.averageScore || 0,
        "Highest Score": e.highestScore || 0,
      }));
      const wsExams = XLSX.utils.json_to_sheet(examRows);
      XLSX.utils.book_append_sheet(wb, wsExams, "Assessments Overview");

      // Sheet 2: College Benchmarking
      if (analyticsData.academicStats?.colleges?.length) {
        const colRows = analyticsData.academicStats.colleges.map((c, idx) => ({
          Rank: idx + 1,
          College: c.college,
          "Total Attempts": c.attempts,
          "Unique Candidates": c.uniqueStudents,
          "Passed Attempts": c.passCount,
          "Failed Attempts": c.failCount,
          "Pass Rate": `${c.passRate}%`,
          "Average Score": c.avgScore,
        }));
        const wsCol = XLSX.utils.json_to_sheet(colRows);
        XLSX.utils.book_append_sheet(wb, wsCol, "College Benchmarking");
      }

      // Sheet 3: Batch Benchmarking
      if (analyticsData.academicStats?.batches?.length) {
        const batchRows = analyticsData.academicStats.batches.map((b, idx) => ({
          Rank: idx + 1,
          Batch: b.batch,
          "Total Attempts": b.attempts,
          "Unique Candidates": b.uniqueStudents,
          "Passed Attempts": b.passCount,
          "Failed Attempts": b.failCount,
          "Pass Rate": `${b.passRate}%`,
          "Average Score": b.avgScore,
        }));
        const wsBatch = XLSX.utils.json_to_sheet(batchRows);
        XLSX.utils.book_append_sheet(wb, wsBatch, "Batch Benchmarking");
      }

      // Sheet 4: Department Benchmarking
      if (analyticsData.academicStats?.departments?.length) {
        const deptRows = analyticsData.academicStats.departments.map((d, idx) => ({
          Rank: idx + 1,
          Department: d.department,
          "Total Attempts": d.attempts,
          "Unique Candidates": d.uniqueStudents,
          "Passed Attempts": d.passCount,
          "Failed Attempts": d.failCount,
          "Pass Rate": `${d.passRate}%`,
          "Average Score": d.avgScore,
        }));
        const wsDept = XLSX.utils.json_to_sheet(deptRows);
        XLSX.utils.book_append_sheet(wb, wsDept, "Department Benchmarking");
      }

      XLSX.writeFile(
        wb,
        `All_Assessments_Academic_Analytics_${new Date().toISOString().split("T")[0]}.xlsx`
      );
    } catch (err) {
      alert("Export failed: " + err.message);
    } finally {
      setExporting(false);
    }
  };

  const { globalStats } = analyticsData;

  const renderSortIcon = (field) => {
    if (sortField !== field) return <FaSort style={{ opacity: 0.3 }} />;
    return sortOrder === "asc" ? <FaSortUp color="#0284c7" /> : <FaSortDown color="#0284c7" />;
  };

  return (
    <div className="aeo-shell">
      {/* ── Page Header ── */}
      <div className="aeo-heading">
        <div>
          <div className="aeo-eyebrow">
            <FaAward /> Academic Reports &amp; Assessment Intelligence
          </div>
          <h1>All Exam Analytics Overview</h1>
          <p>
            Holistic assessment metrics, candidate attempt volume, pass/fail ratios, and cohort
            benchmarking across colleges, batches, and academic departments.
          </p>
        </div>
        <div className="aeo-header-actions">
          <Link to="/admin/coding/analytics" className="aeo-btn-outline" title="Coding overview">
            <FaCode /> Coding Analytics
          </Link>
          <button
            type="button"
            className="aeo-btn-excel"
            onClick={handleExport}
            disabled={exporting || (analyticsData.exams || []).length === 0}
          >
            <FaFileExcel />
            {exporting ? "Exporting…" : "Export to Excel"}
          </button>
          <Link to="/admin/exams" className="aeo-btn-primary">
            Manage Exams
          </Link>
        </div>
      </div>

      {/* ── Academic & Cohort Filter Bar ── */}
      <div className="aeo-filter-card">
        <div className="aeo-filter-header">
          <div className="aeo-filter-title">
            <FaFilter /> Academic Cohort &amp; Assessment Filters
          </div>
          {hasActiveFilters && (
            <button
              type="button"
              className="aeo-filter-reset"
              onClick={handleClearFilters}
              title="Reset all filters"
            >
              <FaUndo size={11} /> Reset Filters
            </button>
          )}
        </div>

        <div className="aeo-filter-grid">
          {/* College Filter */}
          <div className="aeo-filter-group">
            <label>
              <FaUniversity /> College / Institute
            </label>
            <select
              className="aeo-filter-select"
              value={selectedCollege}
              onChange={(e) => setSelectedCollege(e.target.value)}
            >
              <option value="">All Colleges &amp; Universities</option>
              {(cachedFilterOptions.colleges || []).map((col) => (
                <option key={col} value={col}>
                  {col}
                </option>
              ))}
            </select>
          </div>

          {/* Department Filter */}
          <div className="aeo-filter-group">
            <label>
              <FaGraduationCap /> Degree / Department
            </label>
            <select
              className="aeo-filter-select"
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
            >
              <option value="">All Academic Departments</option>
              {(cachedFilterOptions.departments || []).map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>

          {/* Batch Filter */}
          <div className="aeo-filter-group">
            <label>
              <FaCalendarAlt /> Graduating Batch
            </label>
            <select
              className="aeo-filter-select"
              value={selectedBatch}
              onChange={(e) => setSelectedBatch(e.target.value)}
            >
              <option value="">All Graduating Years</option>
              {(cachedFilterOptions.batches || []).map((batch) => (
                <option key={batch} value={batch}>
                  Batch {batch}
                </option>
              ))}
            </select>
          </div>

          {/* Specific Exam Filter */}
          <div className="aeo-filter-group">
            <label>
              <FaClipboardList /> Assessment Filter
            </label>
            <select
              className="aeo-filter-select"
              value={selectedExam}
              onChange={(e) => setSelectedExam(e.target.value)}
            >
              <option value="">All Questionnaires</option>
              {(cachedFilterOptions.exams || []).map((exam) => (
                <option key={exam._id} value={exam._id}>
                  {exam.title}
                </option>
              ))}
            </select>
          </div>

          {/* From Date Filter */}
          <div className="aeo-filter-group">
            <label>
              <FaCalendarAlt /> From Date
            </label>
            <input
              type="date"
              className="aeo-filter-input"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setDatePreset("custom");
              }}
            />
          </div>

          {/* To Date Filter */}
          <div className="aeo-filter-group">
            <label>
              <FaCalendarAlt /> To Date
            </label>
            <input
              type="date"
              className="aeo-filter-input"
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
        <div className="aeo-date-presets">
          <span className="aeo-preset-label">Date Presets:</span>
          <button
            type="button"
            className={`aeo-preset-btn ${datePreset === "today" ? "active" : ""}`}
            onClick={() => applyDatePreset("today")}
          >
            Today
          </button>
          <button
            type="button"
            className={`aeo-preset-btn ${datePreset === "7days" ? "active" : ""}`}
            onClick={() => applyDatePreset("7days")}
          >
            Last 7 Days
          </button>
          <button
            type="button"
            className={`aeo-preset-btn ${datePreset === "30days" ? "active" : ""}`}
            onClick={() => applyDatePreset("30days")}
          >
            Last 30 Days
          </button>
          <button
            type="button"
            className={`aeo-preset-btn ${datePreset === "month" ? "active" : ""}`}
            onClick={() => applyDatePreset("month")}
          >
            This Month
          </button>
          <button
            type="button"
            className={`aeo-preset-btn ${datePreset === "all" && !startDate && !endDate ? "active" : ""}`}
            onClick={() => applyDatePreset("all")}
          >
            All Time
          </button>
        </div>

        {hasActiveFilters && (
          <div className="aeo-active-tags">
            <span className="aeo-tag-label">Active Filters:</span>
            {selectedCollege && (
              <span className="aeo-tag-chip">
                College: {selectedCollege}
                <span className="aeo-tag-close" onClick={() => setSelectedCollege("")}>
                  ×
                </span>
              </span>
            )}
            {selectedDepartment && (
              <span className="aeo-tag-chip">
                Department: {selectedDepartment}
                <span className="aeo-tag-close" onClick={() => setSelectedDepartment("")}>
                  ×
                </span>
              </span>
            )}
            {selectedBatch && (
              <span className="aeo-tag-chip">
                Batch: {selectedBatch}
                <span className="aeo-tag-close" onClick={() => setSelectedBatch("")}>
                  ×
                </span>
              </span>
            )}
            {selectedExam && (
              <span className="aeo-tag-chip">
                Exam:{" "}
                {(cachedFilterOptions.exams || []).find((e) => e._id === selectedExam)?.title ||
                  "Selected"}
                <span className="aeo-tag-close" onClick={() => setSelectedExam("")}>
                  ×
                </span>
              </span>
            )}
            {(startDate || endDate) && (
              <span className="aeo-tag-chip">
                Period: {startDate || "Start"} &rarr; {endDate || "Present"}
                <span
                  className="aeo-tag-close"
                  onClick={() => {
                    setStartDate("");
                    setEndDate("");
                    setDatePreset("all");
                  }}
                >
                  ×
                </span>
              </span>
            )}
          </div>
        )}
      </div>

      {/* ── KPI Stat Cards ── */}
      <div className="aeo-stat-grid">
        <div className="aeo-stat-card blue">
          <span className="aeo-stat-card-icon">
            <FaClipboardList />
          </span>
          <small>Configured Exams</small>
          <strong>{globalStats.totalExams || 0}</strong>
          <span>Published assessments</span>
        </div>

        <div className="aeo-stat-card purple">
          <span className="aeo-stat-card-icon">
            <FaQuestionCircle />
          </span>
          <small>Question Bank</small>
          <strong>{globalStats.totalQuestions || 0}</strong>
          <span>Total questions</span>
        </div>

        <div className="aeo-stat-card indigo">
          <span className="aeo-stat-card-icon">
            <FaUsers />
          </span>
          <small>Total Submissions</small>
          <strong>{globalStats.totalAttempts || 0}</strong>
          <span>Candidate attempts</span>
        </div>

        <div className="aeo-stat-card blue">
          <span className="aeo-stat-card-icon">
            <FaAward />
          </span>
          <small>Unique Candidates</small>
          <strong>{globalStats.uniqueCandidates || 0}</strong>
          <span>Distinct students</span>
        </div>

        <div className="aeo-stat-card green">
          <span className="aeo-stat-card-icon">
            <FaCheckCircle />
          </span>
          <small>Passed Candidates</small>
          <strong style={{ color: "#16a34a" }}>{globalStats.passCount || 0}</strong>
          <span>Score &ge; 40%</span>
        </div>

        <div className="aeo-stat-card red">
          <span className="aeo-stat-card-icon">
            <FaTimesCircle />
          </span>
          <small>Failed Candidates</small>
          <strong style={{ color: "#dc2626" }}>{globalStats.failCount || 0}</strong>
          <span>Score &lt; 40%</span>
        </div>

        <div className="aeo-stat-card amber">
          <span className="aeo-stat-card-icon">
            <FaTrophy />
          </span>
          <small>Overall Pass Rate</small>
          <strong style={{ color: globalStats.overallPassRate >= 60 ? "#16a34a" : "#d97706" }}>
            {globalStats.overallPassRate || 0}%
          </strong>
          <span>Across cohort</span>
        </div>

        <div className="aeo-stat-card blue">
          <span className="aeo-stat-card-icon">
            <FaChartBar />
          </span>
          <small>Average Score</small>
          <strong>{globalStats.averageScore || 0}</strong>
          <span>High: {globalStats.highestScore || 0} pts</span>
        </div>
      </div>

      {/* ── Spotlight Highlights ── */}
      <div className="aeo-highlights-row">
        <div className="aeo-highlight-card gold">
          <div className="aeo-highlight-icon">
            <FaFire />
          </div>
          <div className="aeo-highlight-info">
            <div className="aeo-highlight-label">Highest Engagement Assessment</div>
            <div className="aeo-highlight-title" title={highlights.topAttempted?.title || "N/A"}>
              {highlights.topAttempted?.title || "No attempts yet"}
            </div>
            <div className="aeo-highlight-metric">
              {highlights.topAttempted?.totalAttempts || 0} candidate attempts &bull;{" "}
              {highlights.topAttempted?.passPercentage || 0}% pass rate
            </div>
          </div>
        </div>

        <div className="aeo-highlight-card emerald">
          <div className="aeo-highlight-icon">
            <FaTrophy />
          </div>
          <div className="aeo-highlight-info">
            <div className="aeo-highlight-label">Top Academic Pass Rate</div>
            <div className="aeo-highlight-title" title={highlights.topPassRate?.title || "N/A"}>
              {highlights.topPassRate?.title || "No data available"}
            </div>
            <div className="aeo-highlight-metric">
              {highlights.topPassRate?.passPercentage || 0}% passed &bull;{" "}
              {highlights.topPassRate?.passCount || 0} successful candidates
            </div>
          </div>
        </div>

        <div className="aeo-highlight-card sky">
          <div className="aeo-highlight-icon">
            <FaChartBar />
          </div>
          <div className="aeo-highlight-info">
            <div className="aeo-highlight-label">Highest Score Benchmark</div>
            <div className="aeo-highlight-title" title={highlights.avgScoreExam?.title || "N/A"}>
              {highlights.avgScoreExam?.title || "No data available"}
            </div>
            <div className="aeo-highlight-metric">
              Avg: {highlights.avgScoreExam?.averageScore || 0} pts &bull; High:{" "}
              {highlights.avgScoreExam?.highestScore || 0} pts
            </div>
          </div>
        </div>
      </div>

      {/* ── Cohort Benchmarking Bar Chart ── */}
      <div className="aeo-card">
        <div className="aeo-card-header">
          <div className="aeo-card-title-group">
            <h2>
              <FaChartBar color="#0284c7" /> Academic Cohort Benchmarking
            </h2>
            <p>Compare assessment volume and pass rates across colleges, batches, and programs.</p>
          </div>
          <div className="aeo-tab-group">
            <button
              type="button"
              className={`aeo-tab-btn ${comparisonMode === "colleges" ? "active" : ""}`}
              onClick={() => setComparisonMode("colleges")}
            >
              By College
            </button>
            <button
              type="button"
              className={`aeo-tab-btn ${comparisonMode === "batches" ? "active" : ""}`}
              onClick={() => setComparisonMode("batches")}
            >
              By Batch
            </button>
            <button
              type="button"
              className={`aeo-tab-btn ${comparisonMode === "departments" ? "active" : ""}`}
              onClick={() => setComparisonMode("departments")}
            >
              By Department
            </button>
            <button
              type="button"
              className={`aeo-tab-btn ${comparisonMode === "exams" ? "active" : ""}`}
              onClick={() => setComparisonMode("exams")}
            >
              By Assessment
            </button>
          </div>
        </div>
        <div className="aeo-chart-container" style={{ height: 320 }}>
          {loading ? (
            <div className="aeo-empty-box">
              <div className="aeo-loading-spinner" />
              <div className="aeo-empty-title">Loading benchmark analytics…</div>
            </div>
          ) : (
            <Bar data={cohortChartData} options={cohortChartOptions} />
          )}
        </div>
      </div>

      {/* ── Charts Grid: Pass/Fail Outcome & 30-Day Activity Timeline ── */}
      <div className="aeo-charts-grid">
        {/* Pass / Fail Outcome Doughnut */}
        <div className="aeo-card" style={{ marginBottom: 0 }}>
          <div className="aeo-card-header">
            <div className="aeo-card-title-group">
              <h2>
                <FaCheckCircle color="#16a34a" /> Pass vs. Fail Breakdown
              </h2>
              <p>Candidate outcome ratio across filtered assessments</p>
            </div>
          </div>
          <div className="aeo-chart-container" style={{ height: 260 }}>
            {globalStats.totalAttempts === 0 ? (
              <div className="aeo-empty-box">
                <div className="aeo-empty-title">No attempt data</div>
                <div className="aeo-empty-sub">No attempts recorded for this filter</div>
              </div>
            ) : (
              <Doughnut
                data={doughnutData}
                options={{
                  ...baseChartOptions,
                  cutout: "70%",
                  plugins: {
                    ...baseChartOptions.plugins,
                    legend: {
                      position: "bottom",
                      labels: {
                        color: chartTextColor,
                        font: { size: 12 },
                        padding: 14,
                      },
                    },
                  },
                }}
              />
            )}
          </div>
        </div>

        {/* 30-Day Activity Line Chart */}
        <div className="aeo-card" style={{ marginBottom: 0 }}>
          <div className="aeo-card-header">
            <div className="aeo-card-title-group">
              <h2>
                <FaClock color="#0284c7" /> 30-Day Activity &amp; Completion Timeline
              </h2>
              <p>Daily volume of candidate assessment attempts and passes</p>
            </div>
          </div>
          <div className="aeo-chart-container" style={{ height: 260 }}>
            <Line
              data={lineData}
              options={{
                ...baseChartOptions,
                scales: cartesianScales,
              }}
            />
          </div>
        </div>
      </div>

      {/* ── Assessment Intelligence Table Card ── */}
      <div className="aeo-table-card" style={{ marginTop: 24 }}>
        <div className="aeo-table-toolbar">
          <div className="aeo-table-search">
            <FaSearch />
            <input
              type="text"
              placeholder="Search assessments by name or ID…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="aeo-table-count">
            Showing {filteredExams.length} of {(analyticsData.exams || []).length} assessments
          </div>
        </div>

        <div className="aeo-table-wrap">
          <table className="aeo-table">
            <thead>
              <tr>
                <th
                  className="sortable"
                  onClick={() => handleSort("title")}
                  style={{ width: "30%" }}
                >
                  Assessment Title {renderSortIcon("title")}
                </th>
                <th
                  className="sortable"
                  onClick={() => handleSort("questionCount")}
                  style={{ width: "10%" }}
                >
                  Questions {renderSortIcon("questionCount")}
                </th>
                <th
                  className="sortable"
                  onClick={() => handleSort("duration")}
                  style={{ width: "10%" }}
                >
                  Duration {renderSortIcon("duration")}
                </th>
                <th
                  className="sortable"
                  onClick={() => handleSort("totalAttempts")}
                  style={{ width: "12%" }}
                >
                  Attempts {renderSortIcon("totalAttempts")}
                </th>
                <th
                  className="sortable"
                  onClick={() => handleSort("passCount")}
                  style={{ width: "14%" }}
                >
                  Pass / Fail {renderSortIcon("passCount")}
                </th>
                <th
                  className="sortable"
                  onClick={() => handleSort("passPercentage")}
                  style={{ width: "12%" }}
                >
                  Pass Rate {renderSortIcon("passPercentage")}
                </th>
                <th
                  className="sortable"
                  onClick={() => handleSort("averageScore")}
                  style={{ width: "12%" }}
                >
                  Score (Avg / Max) {renderSortIcon("averageScore")}
                </th>
                <th style={{ width: "10%", textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8}>
                    <div className="aeo-empty-box">
                      <div className="aeo-loading-spinner" />
                      <div className="aeo-empty-title">Loading assessments…</div>
                      <div className="aeo-empty-sub">Aggregating candidate records</div>
                    </div>
                  </td>
                </tr>
              ) : filteredExams.length === 0 ? (
                <tr>
                  <td colSpan={8}>
                    <div className="aeo-empty-box">
                      <FaSearch size={22} color="#94a3b8" />
                      <div className="aeo-empty-title">No assessments found</div>
                      <div className="aeo-empty-sub">
                        Try clearing search terms or modifying academic filters.
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredExams.map((exam) => {
                  const qCount = exam.questionCount || 0;
                  const durationMins = exam.duration || 30;
                  const attemptsCount = exam.totalAttempts || 0;
                  const passPct = exam.passPercentage || 0;

                  return (
                    <tr key={exam._id}>
                      {/* Title & ID */}
                      <td>
                        <div className="aeo-exam-flex">
                          <div className="aeo-exam-icon">
                            <FaClipboardList />
                          </div>
                          <div>
                            <div className="aeo-exam-name">{exam.title}</div>
                            <div className="aeo-exam-meta">ID: {exam._id.slice(-6)}</div>
                          </div>
                        </div>
                      </td>

                      {/* Questions */}
                      <td>
                        <span className="aeo-pill aeo-pill-blue">
                          <FaQuestionCircle size={10} /> {qCount} Qs
                        </span>
                      </td>

                      {/* Duration */}
                      <td>
                        <span className="aeo-pill aeo-pill-slate">
                          <FaClock size={10} /> {durationMins}m
                        </span>
                      </td>

                      {/* Attempts */}
                      <td>
                        <strong style={{ fontSize: 13 }}>{attemptsCount}</strong>{" "}
                        <span style={{ fontSize: 11, opacity: 0.7 }}>attempts</span>
                      </td>

                      {/* Pass / Fail */}
                      <td>
                        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                          <span className="aeo-pill aeo-pill-green" title="Passed candidates">
                            {exam.passCount || 0} P
                          </span>
                          <span className="aeo-pill aeo-pill-red" title="Failed candidates">
                            {exam.failCount || 0} F
                          </span>
                        </div>
                      </td>

                      {/* Pass Rate */}
                      <td>
                        <span
                          className={`aeo-pill ${
                            passPct >= 60
                              ? "aeo-pill-green"
                              : passPct >= 40
                              ? "aeo-pill-amber"
                              : "aeo-pill-red"
                          }`}
                        >
                          {passPct}%
                        </span>
                      </td>

                      {/* Score: Avg / Max */}
                      <td>
                        <strong style={{ fontSize: 13 }}>{exam.averageScore || 0}</strong>{" "}
                        <span style={{ fontSize: 11, opacity: 0.7 }}>
                          / {exam.highestScore || 0}
                        </span>
                      </td>

                      {/* Action Deep-Dive Link */}
                      <td style={{ textAlign: "right" }}>
                        <Link
                          to={`/admin/exams/analytics/${exam._id}`}
                          className="aeo-btn-analytics"
                          title="View detailed candidate scores and submission audit"
                        >
                          <FaChartBar size={11} /> Analytics
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

import React, { useEffect, useState, useContext, useMemo, useRef } from "react";
import api from "../../api/api";
import { Link } from "react-router-dom";
import { AuthContext } from "../../contexts/AuthContext";
import ExportExcelButton from "../../components/ExportExcelButton";
import * as XLSX from "xlsx";
import {
  FaCheckCircle,
  FaRegCircle,
  FaCode,
  FaSearch,
  FaChartLine,
  FaChevronDown,
  FaList,
  FaThLarge,
  FaTimes,
  FaFire,
  FaTrophy,
} from "react-icons/fa";
import "./CodingProblems.css";

const DSA_TOPICS = [
  "Basic",
  "Array",
  "Matrix",
  "String",
  "TwoPointers",
  "SlidingWindow",
  "PrefixSum",
  "LinkedList",
  "DoublyLinkedList",
  "CircularLinkedList",
  "Stack",
  "Queue",
  "Deque",
  "PriorityQueue",
  "HashMap",
  "HashSet",
  "Tree",
  "BinaryTree",
  "BST",
  "Trie",
  "SegmentTree",
  "Heap",
  "DisjointSetUnion",
  "Graph",
  "DP",
  "BinarySearch",
  "SearchAlgorithms",
  "Sorting",
  "Recursion",
  "Greedy",
  "Backtracking",
  "DivideAndConquer",
  "BitManipulation",
];

export function CodingProblems() {
  const [problems, setProblems] = useState([]);
  const [solvedIds, setSolvedIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const { user } = useContext(AuthContext);

  // Filter states (all multiple selection!)
  const [selectedDifficulties, setSelectedDifficulties] = useState([]); // ['basic', 'easy', 'medium', 'hard']
  const [selectedStatuses, setSelectedStatuses] = useState([]); // ['solved', 'unsolved']
  const [selectedTopics, setSelectedTopics] = useState([]); // ['Array', 'Stack', ...]
  const [searchQuery, setSearchQuery] = useState("");
  const [topicSearchInDropdown, setTopicSearchInDropdown] = useState("");

  // Dropdown open states
  const [diffDropdownOpen, setDiffDropdownOpen] = useState(false);
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const [topicDropdownOpen, setTopicDropdownOpen] = useState(false);

  // View mode: 'table' (LeetCode default) or 'grid'
  const [viewMode, setViewMode] = useState("table");

  const diffMenuRef = useRef(null);
  const statusMenuRef = useRef(null);
  const topicMenuRef = useRef(null);

  // Close dropdowns on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (diffMenuRef.current && !diffMenuRef.current.contains(event.target)) {
        setDiffDropdownOpen(false);
      }
      if (statusMenuRef.current && !statusMenuRef.current.contains(event.target)) {
        setStatusDropdownOpen(false);
      }
      if (topicMenuRef.current && !topicMenuRef.current.contains(event.target)) {
        setTopicDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    setLoading(true);
    api
      .get("/coding/problems")
      .then((res) => {
        setProblems(res.data || []);
      })
      .catch((err) => console.error("Failed to load problems", err))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (user) {
      api
        .get("/coding/submissions/my")
        .then((res) => {
          const solved = (res.data || [])
            .filter((s) => s.result === "Accepted")
            .map((s) => s.problem?._id || s.problem);
          setSolvedIds([...new Set(solved)]);
        })
        .catch((err) => console.error("Failed to load user submissions", err));
    } else {
      setSolvedIds([]);
    }
  }, [user]);

  // Topic problem counts
  const topicCounts = useMemo(() => {
    const counts = {};
    problems.forEach((p) => {
      const topic = p.dsaTopic || "General";
      counts[topic] = (counts[topic] || 0) + 1;
    });
    return counts;
  }, [problems]);

  // Overall statistics (for LeetCode Donut and Bars)
  const stats = useMemo(() => {
    const total = problems.length;
    const solvedCount = problems.filter((p) => solvedIds.includes(p._id)).length;
    const basicTotal = problems.filter(
      (p) => String(p.difficulty).toLowerCase() === "basic"
    ).length;
    const basicSolved = problems.filter(
      (p) => String(p.difficulty).toLowerCase() === "basic" && solvedIds.includes(p._id)
    ).length;
    const easyTotal = problems.filter(
      (p) => String(p.difficulty).toLowerCase() === "easy"
    ).length;
    const easySolved = problems.filter(
      (p) => String(p.difficulty).toLowerCase() === "easy" && solvedIds.includes(p._id)
    ).length;
    const medTotal = problems.filter(
      (p) => String(p.difficulty).toLowerCase() === "medium"
    ).length;
    const medSolved = problems.filter(
      (p) => String(p.difficulty).toLowerCase() === "medium" && solvedIds.includes(p._id)
    ).length;
    const hardTotal = problems.filter(
      (p) => String(p.difficulty).toLowerCase() === "hard"
    ).length;
    const hardSolved = problems.filter(
      (p) => String(p.difficulty).toLowerCase() === "hard" && solvedIds.includes(p._id)
    ).length;
    const percent = total > 0 ? Math.round((solvedCount / total) * 100) : 0;
    return {
      total,
      solvedCount,
      percent,
      basicTotal,
      basicSolved,
      easyTotal,
      easySolved,
      medTotal,
      medSolved,
      hardTotal,
      hardSolved,
    };
  }, [problems, solvedIds]);

  // Client-side filtering supporting multiple selections
  const filteredProblems = useMemo(() => {
    return problems.filter((p) => {
      // 1. Search Query
      const query = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !query ||
        p.title.toLowerCase().includes(query) ||
        (p.dsaTopic && p.dsaTopic.toLowerCase().includes(query)) ||
        (p.description && p.description.toLowerCase().includes(query));

      // 2. Difficulty Multi-selection
      const pDiff = String(p.difficulty || "easy").toLowerCase();
      const matchesDiff =
        selectedDifficulties.length === 0 || selectedDifficulties.includes(pDiff);

      // 3. Status Multi-selection
      const isSolved = solvedIds.includes(p._id);
      let matchesStatus = true;
      if (selectedStatuses.length > 0) {
        const wantsSolved = selectedStatuses.includes("solved");
        const wantsUnsolved = selectedStatuses.includes("unsolved");
        if (wantsSolved && !wantsUnsolved) matchesStatus = isSolved;
        else if (wantsUnsolved && !wantsSolved) matchesStatus = !isSolved;
      }

      // 4. Topic Multi-selection
      const pTopic = p.dsaTopic || "General";
      const matchesTopic =
        selectedTopics.length === 0 ||
        selectedTopics.some((t) => t.toLowerCase() === pTopic.toLowerCase());

      return matchesSearch && matchesDiff && matchesStatus && matchesTopic;
    });
  }, [problems, searchQuery, selectedDifficulties, selectedStatuses, selectedTopics, solvedIds]);

  // Toggle helpers for multiple selection
  const toggleDifficulty = (diff) => {
    setSelectedDifficulties((prev) =>
      prev.includes(diff) ? prev.filter((d) => d !== diff) : [...prev, diff]
    );
  };

  const toggleStatus = (status) => {
    setSelectedStatuses((prev) =>
      prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status]
    );
  };

  const toggleTopic = (topic) => {
    setSelectedTopics((prev) =>
      prev.includes(topic) ? prev.filter((t) => t !== topic) : [...prev, topic]
    );
  };

  const resetFilters = () => {
    setSelectedDifficulties([]);
    setSelectedStatuses([]);
    setSelectedTopics([]);
    setSearchQuery("");
  };

  const hasActiveFilters =
    selectedDifficulties.length > 0 ||
    selectedStatuses.length > 0 ||
    selectedTopics.length > 0 ||
    searchQuery.trim().length > 0;

  const handleExportExcel = () => {
    try {
      setExporting(true);
      const exportData = filteredProblems.map((p, idx) => ({
        "SL No": idx + 1,
        "Problem Title": p.title,
        "Difficulty": p.difficulty || "Easy",
        "DSA Topic": p.dsaTopic || "General",
        "Status": solvedIds.includes(p._id) ? "Solved" : "Unsolved",
        "Sample Test Cases": p.sampleTestCases?.length || 0,
        "Total Test Cases": p.testCases?.length || p.sampleTestCases?.length || 0,
        "Acceptance Rate": p.acceptanceRate ? `${p.acceptanceRate}%` : "—",
      }));
      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Coding Problems");
      XLSX.writeFile(workbook, `code_campus_problems_${Date.now()}.xlsx`);
    } catch (e) {
      console.error("Export failed", e);
    } finally {
      setExporting(false);
    }
  };

  // SVG Donut Calculations
  const radius = 55;
  const circumference = 2 * Math.PI * radius; // ~345.57
  const total = stats.total || 1;

  // Segment strokeDasharray & strokeDashoffset
  const basicLen = (stats.basicSolved / total) * circumference;
  const easyLen = (stats.easySolved / total) * circumference;
  const medLen = (stats.medSolved / total) * circumference;
  const hardLen = (stats.hardSolved / total) * circumference;

  const filteredTopicsInDropdown = useMemo(() => {
    if (!topicSearchInDropdown.trim()) return DSA_TOPICS;
    return DSA_TOPICS.filter((t) =>
      t.toLowerCase().includes(topicSearchInDropdown.toLowerCase())
    );
  }, [topicSearchInDropdown]);

  return (
    <div className="cc-problems-shell">
      {/* Top Heading */}
      <div className="cc-problems-heading">
        <div>
          <span className="cc-problems-eyebrow">
            <FaCode /> Practice Workspace
          </span>
          <h1>Coding Problems</h1>
          <p>Solve curated DSA challenges, test against test cases, and build engineering fluency.</p>
        </div>

        <div className="cc-problems-header-actions">
          <Link to="/coding/analytics" className="cc-problems-action-btn">
            <FaChartLine />
            <span>My Analytics</span>
          </Link>
          <ExportExcelButton
            onClick={handleExportExcel}
            loading={exporting}
            label="Export Problems"
            variant="dark-excel"
          />
        </div>
      </div>

      {/* LeetCode Style Progress & Donut Chart Card */}
      <div className="cc-problems-card">
        <div className="cc-problems-section-title">
          <h2>
            <FaTrophy style={{ color: "#f59e0b" }} /> Session Progress & Solved Distribution
          </h2>
          <span className="cc-problems-section-meta">
            {stats.solvedCount} of {stats.total} Solved ({stats.percent}%)
          </span>
        </div>

        <div className="cc-leetcode-progress-widget">
          {/* 1. Circular Donut Chart */}
          <div className="cc-donut-container">
            <svg className="cc-donut-svg" viewBox="0 0 140 140">
              {/* Background ring */}
              <circle
                className="cc-donut-bg-ring"
                cx="70"
                cy="70"
                r={radius}
              />

              {/* Basic arc (Purple) */}
              <circle
                className="cc-donut-segment basic"
                cx="70"
                cy="70"
                r={radius}
                strokeDasharray={`${basicLen} ${circumference - basicLen}`}
                strokeDashoffset={0}
              />

              {/* Easy arc (Teal/Green) */}
              <circle
                className="cc-donut-segment easy"
                cx="70"
                cy="70"
                r={radius}
                strokeDasharray={`${easyLen} ${circumference - easyLen}`}
                strokeDashoffset={-basicLen}
              />

              {/* Medium arc (Yellow/Amber) */}
              <circle
                className="cc-donut-segment medium"
                cx="70"
                cy="70"
                r={radius}
                strokeDasharray={`${medLen} ${circumference - medLen}`}
                strokeDashoffset={-(basicLen + easyLen)}
              />

              {/* Hard arc (Red) */}
              <circle
                className="cc-donut-segment hard"
                cx="70"
                cy="70"
                r={radius}
                strokeDasharray={`${hardLen} ${circumference - hardLen}`}
                strokeDashoffset={-(basicLen + easyLen + medLen)}
              />
            </svg>

            {/* Center Label */}
            <div className="cc-donut-center-text">
              <span className="cc-donut-solved-num">{stats.solvedCount}</span>
              <span className="cc-donut-total-num">/ {stats.total}</span>
              <span className="cc-donut-label">Solved</span>
            </div>
          </div>

          {/* 2. Difficulty Breakdown Bars (LeetCode style) */}
          <div className="cc-diff-progress-list">
            {/* Basic */}
            <div className="cc-diff-row">
              <span className="cc-diff-name basic">● Basic</span>
              <div className="cc-diff-track">
                <div
                  className="cc-diff-fill basic"
                  style={{
                    width: stats.basicTotal > 0 ? `${(stats.basicSolved / stats.basicTotal) * 100}%` : "0%",
                  }}
                />
              </div>
              <span className="cc-diff-counts">
                {stats.basicSolved} <span>/ {stats.basicTotal}</span>
              </span>
            </div>

            {/* Easy */}
            <div className="cc-diff-row">
              <span className="cc-diff-name easy">● Easy</span>
              <div className="cc-diff-track">
                <div
                  className="cc-diff-fill easy"
                  style={{
                    width: stats.easyTotal > 0 ? `${(stats.easySolved / stats.easyTotal) * 100}%` : "0%",
                  }}
                />
              </div>
              <span className="cc-diff-counts">
                {stats.easySolved} <span>/ {stats.easyTotal}</span>
              </span>
            </div>

            {/* Medium */}
            <div className="cc-diff-row">
              <span className="cc-diff-name medium">● Medium</span>
              <div className="cc-diff-track">
                <div
                  className="cc-diff-fill medium"
                  style={{
                    width: stats.medTotal > 0 ? `${(stats.medSolved / stats.medTotal) * 100}%` : "0%",
                  }}
                />
              </div>
              <span className="cc-diff-counts">
                {stats.medSolved} <span>/ {stats.medTotal}</span>
              </span>
            </div>

            {/* Hard */}
            <div className="cc-diff-row">
              <span className="cc-diff-name hard">● Hard</span>
              <div className="cc-diff-track">
                <div
                  className="cc-diff-fill hard"
                  style={{
                    width: stats.hardTotal > 0 ? `${(stats.hardSolved / stats.hardTotal) * 100}%` : "0%",
                  }}
                />
              </div>
              <span className="cc-diff-counts">
                {stats.hardSolved} <span>/ {stats.hardTotal}</span>
              </span>
            </div>
          </div>

          {/* 3. Session & Quick Analytics Panel */}
          <div className="cc-leetcode-session-panel">
            <div className="cc-session-stat-item">
              <span className="cc-session-stat-label">Total Challenges</span>
              <span className="cc-session-stat-val">{stats.total}</span>
            </div>
            <div className="cc-session-stat-item">
              <span className="cc-session-stat-label">Solved Ratio</span>
              <span className="cc-session-stat-val">{stats.percent}%</span>
            </div>
            <div className="cc-session-stat-item">
              <span className="cc-session-stat-label">Platform Rank</span>
              <span className="cc-session-stat-val">Active Learner</span>
            </div>
            <Link to="/coding/analytics" className="cc-session-analytics-link">
              View Detailed Analytics →
            </Link>
          </div>
        </div>
      </div>

      {/* Multi-Select Filters Bar Card */}
      <div className="cc-problems-card">
        <div className="cc-filter-bar-card">
          {/* Keyword Search */}
          <div className="cc-search-input-wrap">
            <FaSearch className="cc-search-icon" />
            <input
              type="text"
              placeholder="Search problems by title, topic, or keyword..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* 1. Multi-Select Difficulty Dropdown */}
          <div className="cc-multiselect-dropdown" ref={diffMenuRef}>
            <button
              className={`cc-multiselect-trigger ${
                selectedDifficulties.length > 0 ? "active-filter" : ""
              } ${diffDropdownOpen ? "open" : ""}`}
              onClick={() => setDiffDropdownOpen((o) => !o)}
            >
              <span>
                Difficulty{" "}
                {selectedDifficulties.length > 0 && (
                  <span className="cc-selected-badge">{selectedDifficulties.length}</span>
                )}
              </span>
              <FaChevronDown style={{ fontSize: "10px", opacity: 0.7 }} />
            </button>

            {diffDropdownOpen && (
              <div className="cc-multiselect-menu">
                <div className="cc-multiselect-menu-header">
                  <span>Select Difficulty</span>
                  {selectedDifficulties.length > 0 && (
                    <button
                      className="cc-multiselect-clear-btn"
                      onClick={() => setSelectedDifficulties([])}
                    >
                      Clear
                    </button>
                  )}
                </div>
                {[
                  { key: "basic", label: "Basic", count: stats.basicTotal },
                  { key: "easy", label: "Easy", count: stats.easyTotal },
                  { key: "medium", label: "Medium", count: stats.medTotal },
                  { key: "hard", label: "Hard", count: stats.hardTotal },
                ].map(({ key, label, count }) => (
                  <label key={key} className="cc-multiselect-item">
                    <input
                      type="checkbox"
                      checked={selectedDifficulties.includes(key)}
                      onChange={() => toggleDifficulty(key)}
                    />
                    <span>{label}</span>
                    <span className="ms-auto text-muted" style={{ fontSize: "10px" }}>
                      ({count})
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* 2. Multi-Select Status Dropdown */}
          <div className="cc-multiselect-dropdown" ref={statusMenuRef}>
            <button
              className={`cc-multiselect-trigger ${
                selectedStatuses.length > 0 ? "active-filter" : ""
              } ${statusDropdownOpen ? "open" : ""}`}
              onClick={() => setStatusDropdownOpen((o) => !o)}
            >
              <span>
                Status{" "}
                {selectedStatuses.length > 0 && (
                  <span className="cc-selected-badge">{selectedStatuses.length}</span>
                )}
              </span>
              <FaChevronDown style={{ fontSize: "10px", opacity: 0.7 }} />
            </button>

            {statusDropdownOpen && (
              <div className="cc-multiselect-menu">
                <div className="cc-multiselect-menu-header">
                  <span>Select Status</span>
                  {selectedStatuses.length > 0 && (
                    <button
                      className="cc-multiselect-clear-btn"
                      onClick={() => setSelectedStatuses([])}
                    >
                      Clear
                    </button>
                  )}
                </div>
                <label className="cc-multiselect-item">
                  <input
                    type="checkbox"
                    checked={selectedStatuses.includes("solved")}
                    onChange={() => toggleStatus("solved")}
                  />
                  <span>Solved ({stats.solvedCount})</span>
                </label>
                <label className="cc-multiselect-item">
                  <input
                    type="checkbox"
                    checked={selectedStatuses.includes("unsolved")}
                    onChange={() => toggleStatus("unsolved")}
                  />
                  <span>Unsolved ({stats.total - stats.solvedCount})</span>
                </label>
              </div>
            )}
          </div>

          {/* 3. Multi-Select Topics Dropdown */}
          <div className="cc-multiselect-dropdown" ref={topicMenuRef}>
            <button
              className={`cc-multiselect-trigger ${
                selectedTopics.length > 0 ? "active-filter" : ""
              } ${topicDropdownOpen ? "open" : ""}`}
              onClick={() => setTopicDropdownOpen((o) => !o)}
            >
              <span>
                Topics{" "}
                {selectedTopics.length > 0 && (
                  <span className="cc-selected-badge">{selectedTopics.length}</span>
                )}
              </span>
              <FaChevronDown style={{ fontSize: "10px", opacity: 0.7 }} />
            </button>

            {topicDropdownOpen && (
              <div className="cc-multiselect-menu" style={{ width: "240px" }}>
                <div className="cc-multiselect-menu-header">
                  <span>Filter Topics</span>
                  {selectedTopics.length > 0 && (
                    <button
                      className="cc-multiselect-clear-btn"
                      onClick={() => setSelectedTopics([])}
                    >
                      Clear ({selectedTopics.length})
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  placeholder="Find topic..."
                  value={topicSearchInDropdown}
                  onChange={(e) => setTopicSearchInDropdown(e.target.value)}
                  style={{
                    width: "100%",
                    fontSize: "11px",
                    padding: "4px 8px",
                    borderRadius: "4px",
                    border: "1px solid #d6dbe1",
                    marginBottom: "4px",
                  }}
                />
                <div style={{ maxHeight: "180px", overflowY: "auto" }}>
                  {filteredTopicsInDropdown.map((topic) => (
                    <label key={topic} className="cc-multiselect-item">
                      <input
                        type="checkbox"
                        checked={selectedTopics.includes(topic)}
                        onChange={() => toggleTopic(topic)}
                      />
                      <span>{topic}</span>
                      {topicCounts[topic] > 0 && (
                        <span className="ms-auto text-muted" style={{ fontSize: "10px" }}>
                          ({topicCounts[topic]})
                        </span>
                      )}
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* View Switcher (Table vs Grid) */}
          <div className="cc-view-switcher ms-auto">
            <button
              className={`cc-view-toggle-btn ${viewMode === "table" ? "active" : ""}`}
              onClick={() => setViewMode("table")}
              title="LeetCode Table View"
            >
              <FaList /> Table
            </button>
            <button
              className={`cc-view-toggle-btn ${viewMode === "grid" ? "active" : ""}`}
              onClick={() => setViewMode("grid")}
              title="Card Grid View"
            >
              <FaThLarge /> Cards
            </button>
          </div>

          {/* Clear All Filters */}
          {hasActiveFilters && (
            <button className="cc-reset-btn" onClick={resetFilters}>
              <FaTimes /> Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* DSA Topic Multi-Select Pills */}
      <div className="cc-problems-card">
        <div className="cc-problems-section-title">
          <h2>
            <span>Explore by DSA Topic</span>
            {selectedTopics.length > 0 && (
              <span className="badge bg-primary text-white" style={{ fontSize: "10px" }}>
                {selectedTopics.length} selected
              </span>
            )}
          </h2>
          <span className="cc-problems-section-meta">
            Showing {filteredProblems.length} matching challenges
          </span>
        </div>

        <div className="cc-topics-pills-wrap">
          <button
            className={`cc-topic-pill-btn ${selectedTopics.length === 0 ? "active" : ""}`}
            onClick={() => setSelectedTopics([])}
          >
            All Topics <span className="cc-topic-count-chip">{problems.length}</span>
          </button>
          {DSA_TOPICS.map((topic) => {
            const count = topicCounts[topic] || 0;
            const isSelected = selectedTopics.includes(topic);
            return (
              <button
                key={topic}
                className={`cc-topic-pill-btn ${isSelected ? "active" : ""}`}
                onClick={() => toggleTopic(topic)}
              >
                {isSelected && "✓ "}
                {topic} {count > 0 && <span className="cc-topic-count-chip">{count}</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* Problems Display (Table View OR Grid View) */}
      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status" />
          <p className="text-muted mt-2">Loading practice workspace challenges…</p>
        </div>
      ) : filteredProblems.length === 0 ? (
        <div className="cc-problems-empty-box">
          <div style={{ fontSize: "2rem" }}>🔍</div>
          <h3>No challenges match your filters</h3>
          <p>Try clearing some filters or searching for another keyword.</p>
          <button className="cc-problems-action-btn" onClick={resetFilters}>
            Reset All Filters
          </button>
        </div>
      ) : viewMode === "table" ? (
        /* LEETCODE TABLE VIEW */
        <div className="cc-leetcode-table-card">
          <table className="cc-leetcode-table">
            <thead>
              <tr>
                <th style={{ width: "48px" }}>Status</th>
                <th>Title</th>
                <th style={{ width: "120px" }}>Solution</th>
                <th style={{ width: "130px" }}>Acceptance</th>
                <th style={{ width: "120px" }}>Difficulty</th>
                <th style={{ width: "100px", textAlign: "right" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredProblems.map((p, index) => {
                const isSolved = solvedIds.includes(p._id);
                const diff = String(p.difficulty || "Easy").toLowerCase();
                const totalCases = p.testCases?.length || p.sampleTestCases?.length || 0;
                return (
                  <tr key={p._id}>
                    <td className="cc-table-status-cell">
                      {isSolved ? (
                        <FaCheckCircle className="cc-table-status-icon solved" title="Solved" />
                      ) : (
                        <FaRegCircle className="cc-table-status-icon unsolved" title="Unsolved" />
                      )}
                    </td>
                    <td className="cc-table-title-cell">
                      <Link to={`/coding/problems/${p._id}`} className="cc-table-problem-link">
                        {index + 1}. {p.title}
                      </Link>
                      <span className="cc-table-topic-tag">{p.dsaTopic || "General"}</span>
                    </td>
                    <td>
                      <span className="badge bg-secondary text-white" style={{ fontSize: "11px" }}>
                        Editorial
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: "13px", fontWeight: "600" }}>
                        {p.acceptanceRate ? `${p.acceptanceRate}%` : `${totalCases} Cases`}
                      </span>
                    </td>
                    <td>
                      <span className={`cc-diff-text ${diff}`}>{p.difficulty || "Easy"}</span>
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <Link
                        to={`/coding/problems/${p._id}`}
                        className={`cc-table-solve-btn ${isSolved ? "solved" : ""}`}
                      >
                        {isSolved ? "Review" : "Solve"}
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        /* GRID / CARDS VIEW */
        <div className="cc-problems-grid">
          {filteredProblems.map((p) => {
            const isSolved = solvedIds.includes(p._id);
            const diff = String(p.difficulty || "Easy").toLowerCase();
            const totalCases = p.testCases?.length || p.sampleTestCases?.length || 0;

            return (
              <div className="cc-problem-item-card" key={p._id}>
                <div>
                  <h3 className="cc-problem-item-title">{p.title}</h3>

                  <div className="cc-problem-item-badges">
                    <span className={`cc-chip-badge ${diff}`}>{p.difficulty || "Easy"}</span>
                    <span className="cc-chip-topic">{p.dsaTopic || "General"}</span>
                    {isSolved && (
                      <span className="cc-chip-solved">
                        <FaCheckCircle /> Solved
                      </span>
                    )}
                  </div>

                  <p className="cc-problem-item-desc">
                    {p.description ||
                      "Solve this challenge by processing standard I/O and passing all verified test cases."}
                  </p>
                </div>

                <div className="cc-problem-item-footer">
                  <div className="cc-problem-item-meta">
                    <span>{totalCases} Cases</span>
                    {p.acceptanceRate ? <span>• {p.acceptanceRate}% Acc.</span> : null}
                  </div>
                  <Link
                    to={`/coding/problems/${p._id}`}
                    className={`cc-problem-item-solve-btn ${isSolved ? "solved" : ""}`}
                  >
                    {isSolved ? "Solve Again →" : "Solve Challenge →"}
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default CodingProblems;

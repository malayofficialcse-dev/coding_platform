import React, { useEffect, useState } from "react";
import api from "../../api/api";
import { Link } from "react-router-dom";
import {
  FaClipboardList,
  FaSearch,
  FaQuestionCircle,
  FaClock,
  FaArrowRight,
} from "react-icons/fa";
import "./ExamList.css";

export default function ExamList() {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    setLoading(true);
    api
      .get("/exams")
      .then((res) => setExams(res.data || []))
      .catch(() => setExams([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = exams.filter(
    (e) =>
      (e.title && e.title.toLowerCase().includes(search.toLowerCase())) ||
      (e.description && e.description.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="exl-shell">
      {/* Header */}
      <div className="exl-heading">
        <div>
          <div className="exl-eyebrow">Assessments &amp; Testing</div>
          <h1>Exams</h1>
          <p>
            Evaluate your skills with timed assessments, test your knowledge, and monitor your progress.
          </p>
        </div>
        <div className="exl-header-count">
          {filtered.length} {filtered.length === 1 ? "Assessment" : "Assessments"} Available
        </div>
      </div>

      {/* Search Bar Card */}
      <div className="exl-search-card">
        <div className="exl-search-wrap">
          <FaSearch />
          <input
            type="text"
            className="exl-search-input"
            placeholder="Search exams by topic, title, or keywords…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="exl-counter-label">
          Showing {filtered.length} of {exams.length} exams
        </div>
      </div>

      {/* Exams Grid */}
      <div className="exl-grid">
        {loading ? (
          <div className="exl-empty-card">
            <div className="exl-empty-icon">⏳</div>
            <div className="exl-empty-title">Loading assessments…</div>
            <div className="exl-empty-sub">Fetching test questionnaire catalog</div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="exl-empty-card">
            <FaSearch className="exl-empty-icon" />
            <div className="exl-empty-title">No exams found</div>
            <div className="exl-empty-sub">
              {search
                ? `No assessments match "${search}". Try searching for another topic.`
                : "No assessments are currently available."}
            </div>
          </div>
        ) : (
          filtered.map((exam) => {
            const questionCount = exam.questions?.length || 0;
            const durationMins = exam.duration || 30;

            return (
              <div className="exl-card" key={exam._id}>
                <div>
                  <div className="exl-card-top">
                    <div className="exl-card-icon">
                      <FaClipboardList />
                    </div>
                    <div className="exl-card-header">
                      <h2 className="exl-card-title">{exam.title}</h2>
                      <span className="exl-card-meta">
                        ID: {exam._id?.slice(-6)}
                      </span>
                    </div>
                  </div>

                  <p className="exl-card-desc">
                    {exam.description || "Comprehensive timed evaluation assessing core concepts and problem solving."}
                  </p>
                </div>

                <div className="exl-card-footer">
                  <div className="exl-card-pills">
                    <span className="exl-pill exl-pill-questions">
                      <FaQuestionCircle size={10} />
                      {questionCount} Qs
                    </span>
                    <span className="exl-pill exl-pill-duration">
                      <FaClock size={10} />
                      {durationMins}m
                    </span>
                  </div>

                  <Link to={`/take/${exam._id}`} className="exl-action-btn">
                    Take Exam <FaArrowRight size={10} />
                  </Link>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

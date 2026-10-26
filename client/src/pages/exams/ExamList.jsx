import React, { useEffect, useState } from "react";
import api from "../../api/api";
import { Link } from "react-router-dom";
import {
  FaClipboardList,
  FaSearch,
  FaQuestionCircle,
  FaClock,
  FaArrowRight,
  FaCheckCircle,
  FaLock,
} from "react-icons/fa";
import "./ExamList.css";

export default function ExamList() {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get("/exams").catch(() => ({ data: [] })),
      api.get("/attempts/my").catch(() => ({ data: [] })),
    ])
      .then(([examsRes, attemptsRes]) => {
        const attemptList = attemptsRes.data || [];
        const attemptMap = new Map();
        attemptList.forEach((att) => {
          const eId = String(att.exam?._id || att.exam?.id || att.exam || "");
          if (eId) attemptMap.set(eId, att);
        });

        const examList = (examsRes.data || []).map((exam) => {
          const examId = String(exam._id || exam.id || "");
          const att = attemptMap.get(examId);
          return {
            ...exam,
            alreadyGiven: Boolean(exam.alreadyGiven || att),
            myAttempt: att || exam.myAttempt || null,
          };
        });
        setExams(examList);
      })
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
            const isAlreadyGiven = Boolean(exam.alreadyGiven);
            const myAttempt = exam.myAttempt;
            const attemptId = myAttempt?._id || myAttempt?.id;
            const scoreText = myAttempt ? `${myAttempt.score}/${myAttempt.total || questionCount}` : null;

            return (
              <div className={`exl-card ${isAlreadyGiven ? "exl-card--given" : ""}`} key={exam._id}>
                <div>
                  <div className="exl-card-top">
                    <div className="exl-card-icon" style={isAlreadyGiven ? { background: "rgba(34, 197, 94, 0.15)", color: "#16a34a" } : {}}>
                      {isAlreadyGiven ? <FaCheckCircle /> : <FaClipboardList />}
                    </div>
                    <div className="exl-card-header">
                      <div className="exl-card-title-row">
                        <h2 className="exl-card-title">{exam.title}</h2>
                        {isAlreadyGiven && (
                          <span className="exl-badge-given">
                            <FaCheckCircle size={10} /> Already Given
                          </span>
                        )}
                      </div>
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
                    {isAlreadyGiven && scoreText && (
                      <span className="exl-pill exl-pill-score">
                        Score: {scoreText}
                      </span>
                    )}
                  </div>

                  {isAlreadyGiven ? (
                    <div className="exl-actions-group">
                      {attemptId && (
                        <Link to={`/result/${attemptId}?examId=${exam._id}`} className="exl-action-btn exl-action-btn-view">
                          View Result
                        </Link>
                      )}
                      <button
                        type="button"
                        disabled
                        className="exl-action-btn exl-action-btn-given"
                        title="You have already taken this assessment and cannot retake it."
                      >
                        <FaLock size={10} /> Already Given
                      </button>
                    </div>
                  ) : (
                    <Link to={`/take/${exam._id}`} className="exl-action-btn">
                      Take Exam <FaArrowRight size={10} />
                    </Link>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

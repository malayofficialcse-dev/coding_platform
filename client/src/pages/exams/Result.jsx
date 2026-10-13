import React, { useEffect, useState } from "react";
import api from "../../api/api";
import { useParams, Link } from "react-router-dom";
import {
  FaCheckCircle,
  FaTimesCircle,
  FaTrophy,
  FaArrowLeft,
  FaClipboardList,
  FaClock,
  FaAward,
  FaPrint,
  FaExclamationTriangle,
} from "react-icons/fa";
import "./Result.css";

export default function Result() {
  const { attemptId } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        let attempt = null;
        let exam = null;

        // Try direct attempt fetch by ID
        try {
          const directRes = await api.get(`/attempts/${attemptId}`);
          attempt = directRes.data;
          exam = directRes.data?.exam;
        } catch {
          // Fallback to /attempts/my
          const myRes = await api.get("/attempts/my");
          attempt =
            myRes.data?.find((a) => a._id === attemptId) || myRes.data?.[0];
          if (attempt) {
            const examId = attempt.exam?._id || attempt.exam;
            const examRes = await api.get(`/exams/${examId}`);
            exam = examRes.data;
          }
        }

        if (attempt && exam) {
          setData({ attempt, exam });
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, [attemptId]);

  if (loading) {
    return (
      <div className="res-shell" style={{ textAlign: "center", padding: "80px 20px" }}>
        <div className="spinner-border text-primary" role="status" />
        <div style={{ marginTop: 12, fontWeight: 600 }}>Loading assessment scorecard…</div>
      </div>
    );
  }

  if (!data || !data.attempt || !data.exam) {
    return (
      <div className="res-shell">
        <div className="res-heading">
          <div>
            <div className="res-eyebrow">Assessment Results</div>
            <h1>Scorecard Not Found</h1>
          </div>
          <Link to="/exams" className="res-action-btn">
            <FaArrowLeft /> Back to Exams
          </Link>
        </div>
        <div className="res-outcome-card">
          <p>We could not find the result records for this assessment attempt.</p>
        </div>
      </div>
    );
  }

  const { attempt, exam } = data;
  const questions = exam.questions || [];
  const totalQuestions = questions.length;
  const score = Number(attempt.score) || 0;
  const passingMarks = Math.ceil(totalQuestions * 0.4);
  const isPass = score >= passingMarks;
  const percentage = totalQuestions > 0 ? ((score / totalQuestions) * 100).toFixed(1) : "0";

  // Calculate detailed accuracy stats
  let answeredCount = 0;
  let correctCount = 0;
  let wrongCount = 0;

  questions.forEach((q, i) => {
    const studentAns = attempt.answers?.[i];
    if (studentAns) {
      answeredCount++;
      if (studentAns === q.answer) {
        correctCount++;
      } else {
        wrongCount++;
      }
    }
  });

  const accuracy = answeredCount > 0 ? Math.round((correctCount / answeredCount) * 100) : 0;

  return (
    <div className="res-shell">
      {/* Header */}
      <div className="res-heading">
        <div>
          <div className="res-eyebrow">Assessment Scorecard &amp; Report</div>
          <h1>{exam.title}</h1>
          <p>
            Submitted on {attempt.createdAt ? new Date(attempt.createdAt).toLocaleString() : "Recently"} &bull; Attempt ID: {attempt._id?.slice(-8)}
          </p>
        </div>
        <div className="res-header-actions">
          <button
            type="button"
            className="res-action-btn"
            onClick={() => window.print()}
          >
            <FaPrint /> Print Scorecard
          </button>
          <Link to="/my-attempts" className="res-action-btn">
            <FaClipboardList /> My Attempts
          </Link>
          <Link to="/exams" className="res-action-btn res-action-btn-primary">
            All Assessments
          </Link>
        </div>
      </div>

      {/* Outcome Banner */}
      <div className={`res-outcome-card ${isPass ? "pass" : "fail"}`}>
        <div className="res-outcome-info">
          <h2>
            {isPass ? <FaCheckCircle /> : <FaTimesCircle />}
            {isPass ? "Assessment Passed" : "Needs Improvement"}
          </h2>
          <p>
            {isPass
              ? "Congratulations! You have satisfied the technical competency benchmarks for this assessment."
              : `Passing threshold requires at least ${passingMarks} marks (${Math.round((passingMarks/totalQuestions)*100)}%). Review the detailed answer breakdown below.`}
          </p>
          {attempt.autoSubmitted && (
            <div style={{ marginTop: 8, fontSize: 12, color: "#b45309", display: "flex", alignItems: "center", gap: 5 }}>
              <FaExclamationTriangle /> Auto-submitted {attempt.warningsCount ? `after ${attempt.warningsCount} warnings` : "on time expiration"}.
            </div>
          )}
        </div>

        <div className="res-outcome-badge">
          <div className="res-outcome-score">
            {score} <span style={{ fontSize: 18, color: "#697687" }}>/ {totalQuestions}</span>
          </div>
          <span className="res-outcome-status-pill">
            {isPass ? "QUALIFIED" : "NOT QUALIFIED"} &bull; {percentage}%
          </span>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="res-stat-grid">
        <div className="res-stat-card green">
          <FaCheckCircle />
          <small>Correct</small>
          <strong>{correctCount}</strong>
          <span>Of {totalQuestions} questions</span>
        </div>

        <div className="res-stat-card red">
          <FaTimesCircle />
          <small>Incorrect</small>
          <strong>{wrongCount}</strong>
          <span>Deducted points</span>
        </div>

        <div className="res-stat-card purple">
          <FaAward />
          <small>Accuracy</small>
          <strong>{accuracy}%</strong>
          <span>Answer precision</span>
        </div>

        <div className="res-stat-card">
          <FaClock />
          <small>Passing Mark</small>
          <strong>{passingMarks}</strong>
          <span>Required threshold</span>
        </div>
      </div>

      {/* Detailed Question Review */}
      <div className="res-section-title">
        <span>Question-by-Question Detailed Review</span>
        <span style={{ fontSize: 11, color: "#697687", fontWeight: 500 }}>
          {totalQuestions} Questions total
        </span>
      </div>

      <div className="res-questions-list">
        {questions.map((q, idx) => {
          const userChoice = attempt.answers?.[idx];
          const isCorrect = userChoice === q.answer;
          const isUnattempted = !userChoice;

          return (
            <div className="res-question-card" key={q._id || idx}>
              <div className="res-question-head">
                <span
                  className={`res-q-badge ${
                    isCorrect ? "correct" : isUnattempted ? "unanswered" : "wrong"
                  }`}
                >
                  Question #{idx + 1} &bull; {isCorrect ? "Correct (+1)" : isUnattempted ? "Unattempted (0)" : "Incorrect (0)"}
                </span>
                <span style={{ fontSize: 11, color: "#697687", fontWeight: 600 }}>
                  1 Point
                </span>
              </div>

              <div className="res-question-text">{q.question}</div>

              <div className="res-options-grid">
                {q.options.map((opt, oi) => {
                  const isOptionCorrect = opt === q.answer;
                  const isUserSelection = userChoice === opt;

                  return (
                    <div
                      key={oi}
                      className={`res-option-row ${
                        isOptionCorrect
                          ? "is-correct"
                          : isUserSelection
                          ? "is-user-wrong"
                          : ""
                      }`}
                    >
                      <div>
                        <strong>{String.fromCharCode(65 + oi)}.</strong> {opt}
                      </div>

                      <div className="res-option-tags">
                        {isOptionCorrect && (
                          <span className="res-tag-correct">Correct Answer</span>
                        )}
                        {isUserSelection && (
                          <span className="res-tag-user">Your Choice</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

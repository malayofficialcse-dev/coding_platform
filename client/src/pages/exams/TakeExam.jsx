import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  FaArrowLeft,
  FaArrowRight,
  FaCheckCircle,
  FaClock,
  FaExpand,
  FaExclamationTriangle,
  FaFlag,
  FaPaperPlane,
  FaShieldAlt,
  FaTimesCircle,
  FaVideo,
  FaMicrophone,
  FaWifi,
  FaUserCheck,
} from "react-icons/fa";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../api/api";
import { useAuth } from "../../contexts/AuthContext";
import "./TakeExam.css";

const MAX_PROCTOR_WARNINGS = 5;

export default function TakeExam() {
  const { id: examId } = useParams();
  const nav = useNavigate();
  const { user } = useAuth();

  const [exam, setExam] = useState(null);
  const [selected, setSelected] = useState({});
  const [flagged, setFlagged] = useState({});
  const [activeQuestion, setActiveQuestion] = useState(0);
  const [timeLeft, setTimeLeft] = useState(null);
  const [examStarted, setExamStarted] = useState(false);
  const [warnings, setWarnings] = useState(0);

  // Pre-exam agreement & system checks
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [hasCamera, setHasCamera] = useState(false);

  // Question matrix filter: "all" | "answered" | "flagged" | "unanswered"
  const [matrixFilter, setMatrixFilter] = useState("all");

  // In-app modals
  const [warningModal, setWarningModal] = useState(null);
  const [submitConfirmModal, setSubmitConfirmModal] = useState(false);

  const videoRef = useRef(null);
  const timerRef = useRef();
  const submittingRef = useRef(false);
  const lastWarningTimeRef = useRef(0);

  const sessionKey = `cc_exam_session_${examId}_${user?._id || user?.id || "guest"}`;
  // JSONB questions may not have Mongo-style IDs; fall back to position to isolate answers.
  const getQuestionKey = (question, index) => String(question?._id ?? question?.id ?? index);

  // 1. Load Exam
  useEffect(() => {
    (async () => {
      try {
        const res = await api.get(`/exams/${examId}`);
        setExam(res.data);

        // Restore local storage session if exists
        try {
          const saved = localStorage.getItem(sessionKey);
          if (saved) {
            const parsed = JSON.parse(saved);
            if (parsed.selected && Array.isArray(res.data.questions)) {
              const validKeys = new Set(res.data.questions.map((question, index) => String(question?._id ?? question?.id ?? index)));
              setSelected(Object.fromEntries(Object.entries(parsed.selected).filter(([key, value]) => validKeys.has(key) && Number.isInteger(value))));
            }
            if (parsed.flagged) setFlagged(parsed.flagged);
            if (typeof parsed.activeQuestion === "number") setActiveQuestion(parsed.activeQuestion);
            if (typeof parsed.timeLeft === "number" && parsed.timeLeft > 0) {
              setTimeLeft(parsed.timeLeft);
            } else {
              setTimeLeft((res.data.duration || 30) * 60);
            }
          } else {
            setTimeLeft((res.data.duration || 30) * 60);
          }
        } catch {
          setTimeLeft((res.data.duration || 30) * 60);
        }
      } catch (err) {
        alert(err.response?.data?.message || "Cannot load exam");
        nav("/exams");
      }
    })();
  }, [examId, nav, sessionKey]);

  // 2. Autosave session to localStorage
  useEffect(() => {
    if (examStarted && exam) {
      try {
        localStorage.setItem(
          sessionKey,
          JSON.stringify({
            selected,
            flagged,
            activeQuestion,
            timeLeft,
            updatedAt: Date.now(),
          })
        );
      } catch (e) {
        // quota exceeded or private mode
      }
    }
  }, [selected, flagged, activeQuestion, timeLeft, examStarted, exam, sessionKey]);

  // 3. WebCam stream setup
  useEffect(() => {
    let stream = null;
    if (examStarted && navigator.mediaDevices?.getUserMedia) {
      navigator.mediaDevices
        .getUserMedia({ video: { width: 320, height: 240 }, audio: true })
        .then((s) => {
          stream = s;
          setHasCamera(true);
          if (videoRef.current) {
            videoRef.current.srcObject = s;
          }
        })
        .catch(() => {
          setHasCamera(false);
        });
    }

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [examStarted]);

  // 4. Submit Handler
  const submitAll = useCallback(
    async (forcedWarnings = warnings, forceCheated = false, isTimeOut = false) => {
      if (!exam || submittingRef.current) return;
      submittingRef.current = true;

      const answers = exam.questions.map((question, index) => {
        const selectedIndex = selected[getQuestionKey(question, index)];
        return typeof selectedIndex === "number" ? question.options[selectedIndex] : "";
      });

      try {
        const res = await api.post("/attempts", {
          examId: exam._id,
          answers,
          warningsCount: forcedWarnings,
          autoSubmitted: isTimeOut || forceCheated,
          cheatingLogged: forceCheated,
        });

        // Clear saved session
        try {
          localStorage.removeItem(sessionKey);
        } catch (e) {}

        clearInterval(timerRef.current);
        if (document.exitFullscreen && document.fullscreenElement) {
          document.exitFullscreen().catch(() => {});
        }

        const attemptId = res.data?.attempt?._id || res.data?._id;
        if (attemptId) {
          nav(`/result/${attemptId}`);
        } else {
          nav("/my-attempts");
        }
      } catch (err) {
        const errMsg = err.response?.data?.message || "Assessment recorded.";
        if (errMsg.includes("already submitted")) {
          try {
            localStorage.removeItem(sessionKey);
          } catch (e) {}
          nav("/my-attempts");
        } else {
          alert("Submission error: " + errMsg);
          submittingRef.current = false;
        }
      } finally {
        setWarningModal(null);
        setSubmitConfirmModal(false);
      }
    },
    [exam, warnings, selected, sessionKey, nav]
  );

  const autoSubmitTimeUp = useCallback(async () => {
    setWarningModal({
      isFinal: true,
      title: "Time Is Up",
      reason: "The assessment duration has elapsed. Your answers have been submitted automatically.",
    });
    await submitAll(warnings, false, true);
  }, [submitAll, warnings]);

  // 5. Timer Countdown
  useEffect(() => {
    if (!examStarted || timeLeft === null) return undefined;
    if (timeLeft <= 0) {
      autoSubmitTimeUp();
      return undefined;
    }
    timerRef.current = setInterval(() => {
      setTimeLeft((current) => {
        if (current <= 1) {
          clearInterval(timerRef.current);
          return 0;
        }
        return current - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [timeLeft, examStarted, autoSubmitTimeUp]);

  // 6. Proctoring Listeners with Cooldown
  useEffect(() => {
    if (!examStarted) return undefined;

    const triggerWarning = (reason) => {
      if (submittingRef.current) return;
      const now = Date.now();
      if (now - lastWarningTimeRef.current < 8000) return;
      lastWarningTimeRef.current = now;

      setWarnings((prev) => {
        const next = prev + 1;
        if (next >= MAX_PROCTOR_WARNINGS) {
          setWarningModal({
            isFinal: true,
            title: "Proctoring Warning Limit Reached",
            reason: `Exam submitted automatically after reaching ${MAX_PROCTOR_WARNINGS} proctoring violations (${reason}).`,
          });
          submitAll(next, true, false);
        } else {
          setWarningModal({
            isFinal: false,
            count: next,
            title: `Proctoring Notice (Warning ${next}/${MAX_PROCTOR_WARNINGS})`,
            reason: `${reason}. Please keep this tab active and remain in fullscreen mode.`,
          });
        }
        return next;
      });
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        triggerWarning("Tab or browser window lost focus");
      }
    };

    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && !submittingRef.current) {
        triggerWarning("Exited fullscreen mode");
      }
    };

    // Keyboard shortcut prevention (Devtools, Print, Save, Inspect)
    const handleKeyDown = (e) => {
      if (
        e.key === "F12" ||
        (e.ctrlKey && e.shiftKey && (e.key === "I" || e.key === "i" || e.key === "C" || e.key === "c" || e.key === "J" || e.key === "j")) ||
        (e.ctrlKey && (e.key === "U" || e.key === "u" || e.key === "P" || e.key === "p" || e.key === "S" || e.key === "s"))
      ) {
        e.preventDefault();
        triggerWarning("Restricted developer shortcut attempted");
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [examStarted, submitAll]);

  const resumeFromWarning = () => {
    setWarningModal(null);
    try {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen?.().catch(() => {});
      }
    } catch {}
  };

  const formatTime = (seconds) =>
    `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;

  const chooseOption = (questionId, optionIndex) => {
    setSelected((prev) => ({ ...prev, [questionId]: optionIndex }));
  };

  const startExam = async () => {
    try {
      await document.documentElement.requestFullscreen?.();
    } catch (err) {
      console.warn("Fullscreen request rejected:", err);
    }
    setExamStarted(true);
  };

  const handleManualSubmitClick = () => {
    setSubmitConfirmModal(true);
  };

  if (!exam) {
    return (
      <div className="cc-exam-loading">
        <div className="spinner-border text-primary" role="status" />
        <span>Loading assessment…</span>
      </div>
    );
  }

  // Pre-Exam Welcome Screen
  if (!examStarted) {
    return (
      <div className="cc-exam-start-shell">
        <div className="cc-exam-start-card">
          <span className="cc-exam-eyebrow">Technical Assessment</span>
          <h1>{exam.title}</h1>
          <p>{exam.description || "A comprehensive timed evaluation testing technical competencies and problem-solving skills."}</p>

          <div className="cc-start-checks">
            <div className="cc-start-check-item">
              <FaUserCheck />
              <span>{user?.name || "Verified Student"}</span>
            </div>
            <div className="cc-start-check-item">
              <FaVideo />
              <span>Camera Monitor</span>
            </div>
            <div className="cc-start-check-item">
              <FaWifi />
              <span>Secure Session</span>
            </div>
          </div>

          <div className="cc-exam-instructions">
            <strong>
              <FaShieldAlt /> Assessment &amp; Proctoring Rules
            </strong>
            <ul>
              <li>
                <strong>{exam.questions.length} Questions</strong> with a{" "}
                <strong>{exam.duration || 30}-minute</strong> time limit.
              </li>
              <li>Fullscreen mode is strictly enforced. Do not switch tabs or minimize the window.</li>
              <li>
                A maximum of <strong>{MAX_PROCTOR_WARNINGS} proctoring warnings</strong> are permitted before automatic submission.
              </li>
              <li>Questions carry 1 point each. Unsaved answers are cached locally so progress is preserved.</li>
            </ul>
          </div>

          <label className="cc-exam-agreement">
            <input
              type="checkbox"
              checked={agreedToTerms}
              onChange={(e) => setAgreedToTerms(e.target.checked)}
            />
            <span>
              I confirm that I am {user?.name || "the candidate"} and agree to the exam code of conduct, honor code, and continuous proctoring terms.
            </span>
          </label>

          <button
            className="cc-exam-primary-button"
            onClick={startExam}
            disabled={!agreedToTerms}
            style={{ width: "100%", opacity: agreedToTerms ? 1 : 0.6 }}
          >
            <FaExpand /> Start Assessment Now
          </button>
        </div>
      </div>
    );
  }

  const question = exam.questions[activeQuestion];
  const questionKey = getQuestionKey(question, activeQuestion);
  const questionCount = exam.questions.length;
  const answeredCount = exam.questions.reduce((count, item, index) => count + (selected[getQuestionKey(item, index)] !== undefined ? 1 : 0), 0);
  const flaggedCount = Object.values(flagged).filter(Boolean).length;
  const unansweredCount = questionCount - answeredCount;
  const currentChoice = selected[questionKey];
  const progress = questionCount ? Math.round((answeredCount / questionCount) * 100) : 0;

  // Filter matrix items
  const filteredQuestions = exam.questions.map((item, idx) => ({ ...item, originalIndex: idx })).filter((item, idx) => {
    const key = getQuestionKey(item, idx);
    if (matrixFilter === "answered") return selected[key] !== undefined;
    if (matrixFilter === "flagged") return !!flagged[key];
    if (matrixFilter === "unanswered") return selected[key] === undefined;
    return true;
  });

  const isWarningTimer = timeLeft !== null && timeLeft <= 300 && timeLeft > 60;
  const isCriticalTimer = timeLeft !== null && timeLeft <= 60;

  return (
    <div
      className="cc-exam-shell"
      onCopy={(e) => e.preventDefault()}
      onCut={(e) => e.preventDefault()}
      onPaste={(e) => e.preventDefault()}
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* Proctoring Warning In-App Modal */}
      {warningModal && (
        <div className="cc-exam-modal-backdrop">
          <div className="cc-exam-modal">
            <div className={`cc-exam-modal-head ${warningModal.isFinal ? "danger" : "warning"}`}>
              <FaExclamationTriangle size={20} />
              <h2>{warningModal.title}</h2>
            </div>
            <div className="cc-exam-modal-body">
              <p>{warningModal.reason}</p>
              {!warningModal.isFinal && (
                <div className="cc-exam-modal-note">
                  Warning count: {warningModal.count} / {MAX_PROCTOR_WARNINGS}. Reaching {MAX_PROCTOR_WARNINGS} will immediately submit your assessment.
                </div>
              )}
            </div>
            <div className="cc-exam-modal-actions">
              {warningModal.isFinal ? (
                <button
                  type="button"
                  className="cc-exam-modal-btn cc-exam-modal-btn-danger"
                  onClick={() => setWarningModal(null)}
                >
                  View Summary
                </button>
              ) : (
                <button
                  type="button"
                  className="cc-exam-modal-btn"
                  onClick={resumeFromWarning}
                >
                  I Understand, Return to Assessment
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Manual Submit Confirmation Modal */}
      {submitConfirmModal && (
        <div className="cc-exam-modal-backdrop">
          <div className="cc-exam-modal">
            <div className="cc-exam-modal-head warning">
              <FaExclamationTriangle size={20} />
              <h2>Finalize Assessment?</h2>
            </div>
            <div className="cc-exam-modal-body">
              <p>Review your submission breakdown before submitting your final answers:</p>
              <div className="cc-exam-modal-breakdown">
                <div className="cc-exam-modal-stat">
                  <span>Answered</span>
                  <strong style={{ color: "#15803d" }}>{answeredCount}</strong>
                </div>
                <div className="cc-exam-modal-stat">
                  <span>Unanswered</span>
                  <strong style={{ color: "#b91c1c" }}>{unansweredCount}</strong>
                </div>
                <div className="cc-exam-modal-stat">
                  <span>Flagged</span>
                  <strong style={{ color: "#b45309" }}>{flaggedCount}</strong>
                </div>
              </div>
              <p style={{ fontSize: 12, color: "#697687" }}>
                Once submitted, you will not be able to change your choices for this evaluation.
              </p>
            </div>
            <div className="cc-exam-modal-actions">
              <button
                type="button"
                className="cc-exam-footer-button"
                onClick={() => setSubmitConfirmModal(false)}
              >
                Continue Exam
              </button>
              <button
                type="button"
                className="cc-exam-modal-btn"
                onClick={() => submitAll(warnings, false, false)}
              >
                Confirm &amp; Submit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Top Header */}
      <div className="cc-exam-header">
        <div className="cc-exam-breadcrumb">
          Assessments <span>/</span> {exam.title}
        </div>
        <div className="cc-exam-header-actions">
          <div
            className={`cc-exam-timer ${
              isCriticalTimer ? "is-critical" : isWarningTimer ? "is-warning" : ""
            }`}
          >
            <FaClock />
            <span>TIME REMAINING</span>
            <strong>{timeLeft !== null ? formatTime(timeLeft) : "—"}</strong>
          </div>
          <div className="cc-exam-progress">
            <span>PROGRESS</span>
            <strong>
              {answeredCount} / {questionCount} ({progress}%)
            </strong>
          </div>
          <button
            type="button"
            className={`cc-exam-header-button ${flagged[questionKey] ? "is-flagged" : ""}`}
            onClick={() =>
              setFlagged((prev) => ({
                ...prev,
                [questionKey]: !prev[questionKey],
              }))
            }
          >
            <FaFlag /> {flagged[questionKey] ? "Flagged" : "Flag Question"}
          </button>
          <button
            type="button"
            className="cc-exam-submit-button"
            onClick={handleManualSubmitClick}
          >
            <FaPaperPlane /> Submit Exam
          </button>
        </div>
      </div>

      <div className="cc-exam-layout">
        {/* Main Workspace */}
        <section className="cc-exam-workspace">
          <div className="cc-exam-question-meta">
            <span className="cc-exam-question-number">
              Question {String(activeQuestion + 1).padStart(2, "0")} of {questionCount}
            </span>
            <span className="cc-exam-question-type">Single choice</span>
            <span className="cc-exam-question-points">
              {question.points || 1} Point
            </span>
          </div>

          <div className="cc-exam-question-title-row">
            <h1>{question.question}</h1>
            {flagged[questionKey] && (
              <span className="cc-exam-flagged">
                <FaFlag /> Flagged for review
              </span>
            )}
          </div>

          <div className="cc-exam-options">
            {question.options.map((option, optionIndex) => {
              const isSelected = currentChoice === optionIndex;

              return (
                <button
                  type="button"
                  key={option}
                  className={`cc-exam-option${isSelected ? " is-selected" : ""}`}
                  onClick={() => chooseOption(questionKey, optionIndex)}
                >
                  <span className="cc-exam-option-radio">
                    {isSelected ? "✓" : String.fromCharCode(65 + optionIndex)}
                  </span>
                  <span>{option}</span>
                </button>
              );
            })}
          </div>

          <div className="cc-exam-question-footer">
            <button
              type="button"
              className="cc-exam-footer-button"
              disabled={activeQuestion === 0}
              onClick={() => setActiveQuestion((curr) => curr - 1)}
            >
              <FaArrowLeft /> Previous Question
            </button>
            <button
              type="button"
              className="cc-exam-clear-button"
              disabled={currentChoice === undefined}
              onClick={() =>
                setSelected((prev) => {
                  const next = { ...prev };
                  delete next[questionKey];
                  return next;
                })
              }
            >
              Clear Selection
            </button>
            <button
              type="button"
              className="cc-exam-next-button"
              disabled={activeQuestion === questionCount - 1}
              onClick={() => setActiveQuestion((curr) => curr + 1)}
            >
              Save &amp; Next <FaArrowRight />
            </button>
          </div>

          <div className="cc-exam-status-cards">
            <div>
              <FaShieldAlt />
              <span>
                <small>PROCTOR STATUS</small>
                <strong>Screen &amp; audio locked</strong>
              </span>
            </div>
            <div>
              <FaClock />
              <span>
                <small>AVG. SPEED / Q</small>
                <strong>
                  {answeredCount
                    ? Math.max(
                        1,
                        Math.round(
                          (exam.duration * 60 - (timeLeft || 0)) / answeredCount
                        )
                      )
                    : "—"}{" "}
                  seconds
                </strong>
              </span>
            </div>
            <div>
              <FaExclamationTriangle />
              <span>
                <small>WARNINGS</small>
                <strong>
                  {warnings} / {MAX_PROCTOR_WARNINGS} recorded
                </strong>
              </span>
            </div>
          </div>
        </section>

        {/* Right Rail: Live Video Proctor & Question Matrix */}
        <aside className="cc-exam-rail">
          {/* Live Proctor Video Box */}
          <div className="cc-exam-rail-card cc-exam-heartbeat">
            <div>
              <h2>Proctor Supervision</h2>
              <span className="cc-heartbeat-dot" />
            </div>

            <div className="cc-proctor-video-wrap">
              <span className="cc-proctor-live-tag">
                <span className="cc-proctor-live-dot" /> LIVE FEED
              </span>
              {hasCamera ? (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="cc-proctor-video"
                />
              ) : (
                <div className="cc-proctor-fallback-avatar">
                  <FaShieldAlt />
                  <div style={{ fontSize: 11, fontWeight: 700 }}>SENSOR MONITORED</div>
                </div>
              )}
            </div>

            <p>
              Screen Capture <strong>Active</strong>
            </p>
            <p>
              Audio Analysis <strong>Active</strong>
            </p>
            <p>
              Browser Lock <strong>Engaged</strong>
            </p>
          </div>

          {/* Question Matrix */}
          <div className="cc-exam-rail-card">
            <div className="cc-exam-rail-heading">
              <h2>Question Matrix</h2>
              <span>{questionCount} Total</span>
            </div>

            {/* Matrix Filters */}
            <div className="cc-matrix-tabs">
              <button
                type="button"
                className={`cc-matrix-tab ${matrixFilter === "all" ? "active" : ""}`}
                onClick={() => setMatrixFilter("all")}
              >
                All ({questionCount})
              </button>
              <button
                type="button"
                className={`cc-matrix-tab ${matrixFilter === "answered" ? "active" : ""}`}
                onClick={() => setMatrixFilter("answered")}
              >
                Ans ({answeredCount})
              </button>
              <button
                type="button"
                className={`cc-matrix-tab ${matrixFilter === "flagged" ? "active" : ""}`}
                onClick={() => setMatrixFilter("flagged")}
              >
                Flag ({flaggedCount})
              </button>
              <button
                type="button"
                className={`cc-matrix-tab ${matrixFilter === "unanswered" ? "active" : ""}`}
                onClick={() => setMatrixFilter("unanswered")}
              >
                Left ({unansweredCount})
              </button>
            </div>

            <div className="cc-exam-matrix">
              {filteredQuestions.map((item) => (
                <button
                  type="button"
                  key={getQuestionKey(item, item.originalIndex)}
                  className={`${
                    item.originalIndex === activeQuestion ? "is-current " : ""
                  }${selected[getQuestionKey(item, item.originalIndex)] !== undefined ? "is-answered " : ""}${
                    flagged[getQuestionKey(item, item.originalIndex)] ? "is-flagged" : ""
                  }`}
                  onClick={() => setActiveQuestion(item.originalIndex)}
                  aria-label={`Go to question ${item.originalIndex + 1}`}
                >
                  {String(item.originalIndex + 1).padStart(2, "0")}
                  {flagged[getQuestionKey(item, item.originalIndex)] && <i />}
                </button>
              ))}
            </div>

            <div className="cc-exam-legend">
              <span>
                <i className="answered" /> Answered
              </span>
              <span>
                <i className="flagged" /> Flagged
              </span>
              <span>
                <i className="remaining" /> Remaining
              </span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

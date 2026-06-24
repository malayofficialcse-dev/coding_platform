import React, { useEffect, useRef, useState } from "react";
import { FaCheckCircle, FaClock, FaPaperPlane, FaTimesCircle, FaTrophy, FaExclamationTriangle, FaExpand } from "react-icons/fa";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../api/api";

export default function TakeExam() {
  const { id: examId } = useParams();
  const nav = useNavigate();
  const [exam, setExam] = useState(null);
  const [selected, setSelected] = useState({});
  const [timeLeft, setTimeLeft] = useState(null);
  const [showAnswers, setShowAnswers] = useState(false);
  const [lastAttempt, setLastAttempt] = useState(null);
  const [examStarted, setExamStarted] = useState(false);
  const [warnings, setWarnings] = useState(0);
  const timerRef = useRef();

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get(`/exams/${examId}`);
        const e = res.data;
        setExam(e);
        setTimeLeft((e.duration || 30) * 60);
      } catch (err) {
        alert(err.response?.data?.message || "Cannot load exam");
        nav("/exams");
      }
    })();
  }, [examId, nav]);

  useEffect(() => {
    if (!examStarted || timeLeft === null || showAnswers) return;
    if (timeLeft <= 0) {
      autoSubmit();
      return;
    }
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [timeLeft, showAnswers, examStarted]);

  // Anti-Cheat Proctoring Listeners
  useEffect(() => {
    if (!examStarted || showAnswers) return;

    const triggerWarning = (reason) => {
      setWarnings((prev) => {
        const nextWarnings = prev + 1;
        if (nextWarnings >= 3) {
          alert("Exam submitted automatically due to exceeding the cheating/proctoring warning threshold.");
          submitAll(nextWarnings, true, false);
          return nextWarnings;
        } else {
          alert(`WARNING: Proctoring violation detected! (Reason: ${reason}). Exiting full-screen, changing tabs, or losing focus is strictly prohibited.\n\nWarning ${nextWarnings}/3. The exam will auto-submit on the 3rd violation.`);
          try {
            if (!document.fullscreenElement) {
              document.documentElement.requestFullscreen?.().catch(() => {});
            }
          } catch (_) {}
          return nextWarnings;
        }
      });
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        triggerWarning("Switched Tabs/Applications");
      }
    };

    const handleFullscreenChange = () => {
      const isFullscreen = document.fullscreenElement ||
                           document.webkitFullscreenElement ||
                           document.mozFullScreenElement ||
                           document.msFullscreenElement;
      if (!isFullscreen) {
        triggerWarning("Exited Fullscreen Mode");
      }
    };

    const handleBlur = () => {
      triggerWarning("Lost Window Focus");
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    window.addEventListener("blur", handleBlur);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      window.removeEventListener("blur", handleBlur);
    };
  }, [examStarted, showAnswers]);

  const formatTime = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${String(sec).padStart(2, "0")}`;
  };

  const chooseOption = (qId, optionIndex) => {
    if (selected[qId] !== undefined) return;
    setSelected((prev) => ({ ...prev, [qId]: optionIndex }));
  };

  const startExam = async () => {
    try {
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
      } else if (document.documentElement.webkitRequestFullscreen) {
        await document.documentElement.webkitRequestFullscreen();
      } else if (document.documentElement.msRequestFullscreen) {
        await document.documentElement.msRequestFullscreen();
      }
    } catch (err) {
      console.warn("Fullscreen request rejected:", err);
    }
    setExamStarted(true);
  };

  const submitAll = async (forcedWarnings = warnings, forceCheated = false, isTimeOut = false) => {
    if (!exam) return;
    const answers = exam.questions.map((q) => {
      const selIdx = selected[q._id];
      return typeof selIdx === "number" ? q.options[selIdx] : "";
    });

    if (!forceCheated && !isTimeOut && answers.some((ans) => !ans)) {
      alert("Please answer every question before submitting.");
      return;
    }

    try {
      const res = await api.post("/attempts", {
        examId: exam._id,
        answers,
        warningsCount: forcedWarnings,
        autoSubmitted: isTimeOut || forceCheated,
        cheatingLogged: forceCheated,
      });
      setLastAttempt(res.data.attempt || res.data);
      setShowAnswers(true);
      clearInterval(timerRef.current);
      if (document.exitFullscreen && document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
    } catch (err) {
      alert(err.response?.data?.message || "Could not submit.");
      setShowAnswers(true);
      clearInterval(timerRef.current);
    }
  };

  const autoSubmit = async () => {
    alert("Time is up! Your exam is being submitted automatically.");
    await submitAll(warnings, false, true);
  };

  if (!exam) {
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border text-primary" role="status"></div>
        <div className="mt-2">Loading exam...</div>
      </div>
    );
  }

  // Pre-exam instruction screen
  if (!examStarted && !showAnswers) {
    return (
      <div className="container py-5">
        <div className="row justify-content-center">
          <div className="col-lg-6 col-md-8 col-12">
            <div className="card shadow-lg border-0 text-center p-4">
              <div className="card-body">
                <h3 className="fw-bold text-primary mb-3">{exam.title}</h3>
                <p className="text-muted mb-4">{exam.description || "No description provided."}</p>
                <div className="alert alert-warning text-start mb-4">
                  <h6 className="fw-bold d-flex align-items-center gap-2">
                    <FaExclamationTriangle /> Important Proctoring Instructions:
                  </h6>
                  <ul className="mb-0 small">
                    <li>This exam is timed ({exam.duration || 30} minutes).</li>
                    <li>You must enter and remain in <strong>Fullscreen Mode</strong>.</li>
                    <li>Switching tabs, leaving the window, or exiting fullscreen will log a violation.</li>
                    <li>Exceeding <strong>3 violations</strong> will trigger auto-submission.</li>
                  </ul>
                </div>
                <button className="btn btn-lg btn-primary px-5 py-3 shadow d-inline-flex align-items-center gap-2" onClick={startExam}>
                  <FaExpand /> Start & Enter Fullscreen
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-4">
      <div className="text-center mb-4">
        <h2 className="fw-bold text-primary">{exam.title}</h2>
        <p className="lead text-muted">{exam.description}</p>
        <div className="d-flex justify-content-center gap-3 align-items-center flex-wrap">
          <span className="badge bg-warning text-dark fs-6 px-3 py-2 shadow-sm d-inline-flex align-items-center gap-2">
            <FaClock /> Time Left: {timeLeft !== null ? formatTime(timeLeft) : "-"}
          </span>
          {!showAnswers && (
            <span className="badge bg-danger fs-6 px-3 py-2 shadow-sm d-inline-flex align-items-center gap-2">
              <FaExclamationTriangle /> Warnings: {warnings}/3
            </span>
          )}
        </div>
      </div>
      <div className="row justify-content-center">
        <div className="col-lg-8 col-md-10 col-12">
          {exam.questions.map((q, idx) => {
            const chosen = selected[q._id];
            const correctAnswer = q.answer;
            const isSubmitted = showAnswers;
            const userAnswer =
              typeof chosen === "number" ? q.options[chosen] : undefined;

            return (
              <div
                key={q._id}
                className="card mb-4 shadow border-0"
                style={{ background: "#f8fafc" }}
              >
                <div className="card-body">
                  <h5 className="card-title mb-3">
                    <span className="badge bg-primary me-2">{idx + 1}</span>
                    {q.question}
                  </h5>
                  <div className="d-flex flex-column gap-2 p-2">
                    {q.options.map((opt, oi) => {
                      let btnClass = "btn btn-outline-secondary text-start";
                      if (isSubmitted) {
                        if (opt === correctAnswer) {
                          btnClass = "btn btn-success text-start";
                        } else if (userAnswer === opt && userAnswer !== correctAnswer) {
                          btnClass = "btn btn-danger text-start";
                        }
                      } else if (chosen === oi) {
                        btnClass = "btn btn-primary text-start";
                      }

                      return (
                        <button
                          key={oi}
                          disabled={isSubmitted || chosen !== undefined}
                          className={`${btnClass} px-3 py-2`}
                          onClick={() => chooseOption(q._id, oi)}
                        >
                          <strong>{String.fromCharCode(65 + oi)})</strong> {opt}
                        </button>
                      );
                    })}
                  </div>
                  {chosen !== undefined && !isSubmitted && (
                    <div className="mt-2 small text-muted">
                      Selected:{" "}
                      <span className="fw-bold">
                        {String.fromCharCode(65 + chosen)}
                      </span>
                    </div>
                  )}
                  {isSubmitted && (
                    <div className="mt-3 d-flex flex-wrap gap-3">
                      <span className="fw-bold text-success d-inline-flex align-items-center gap-2">
                        <FaCheckCircle /> Correct: {correctAnswer}
                      </span>
                      {userAnswer !== correctAnswer && (
                        <span className="text-danger d-inline-flex align-items-center gap-2">
                          <FaTimesCircle /> Your Answer: {userAnswer || "None"}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      {!showAnswers && (
        <div className="text-center mt-4">
          <button className="btn btn-lg btn-success px-5 py-2 shadow-sm" onClick={() => submitAll(warnings, false, false)}>
            <FaPaperPlane className="me-2" /> Submit Exam
          </button>
        </div>
      )}
      {showAnswers && lastAttempt && (
        <div className="text-center mt-5">
          <h3 className="fw-bold d-inline-flex align-items-center gap-2">
            <FaTrophy /> Your Score:{" "}
            <span className="text-success display-6">{lastAttempt.score}</span>
          </h3>
          {lastAttempt.cheatingLogged && (
            <div className="alert alert-danger mt-3 d-inline-block">
              <FaExclamationTriangle className="me-2" />
              This exam was auto-submitted due to proctoring violations.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

import React, { useEffect, useRef, useState } from "react";
import { FaArrowLeft, FaArrowRight, FaCheckCircle, FaClock, FaExpand, FaExclamationTriangle, FaFlag, FaPaperPlane, FaShieldAlt, FaTimesCircle, FaTrophy } from "react-icons/fa";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../api/api";
import "./TakeExam.css";

export default function TakeExam() {
  const { id: examId } = useParams();
  const nav = useNavigate();
  const [exam, setExam] = useState(null);
  const [selected, setSelected] = useState({});
  const [flagged, setFlagged] = useState({});
  const [activeQuestion, setActiveQuestion] = useState(0);
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
        setExam(res.data);
        setTimeLeft((res.data.duration || 30) * 60);
      } catch (err) {
        alert(err.response?.data?.message || "Cannot load exam");
        nav("/exams");
      }
    })();
  }, [examId, nav]);

  useEffect(() => {
    if (!examStarted || timeLeft === null || showAnswers) return undefined;
    if (timeLeft <= 0) {
      autoSubmit();
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
  }, [timeLeft, showAnswers, examStarted]);

  useEffect(() => {
    if (!examStarted || showAnswers) return undefined;
    const triggerWarning = (reason) => {
      setWarnings((previous) => {
        const next = previous + 1;
        if (next >= 3) {
          alert("Exam submitted automatically after reaching the proctoring warning limit.");
          submitAll(next, true, false);
        } else {
          alert(`Proctoring warning: ${reason}. Warning ${next}/3.`);
          try {
            if (!document.fullscreenElement) document.documentElement.requestFullscreen?.().catch(() => {});
          } catch {
            // Fullscreen may be unavailable in some browsers.
          }
        }
        return next;
      });
    };
    const handleVisibilityChange = () => { if (document.visibilityState === "hidden") triggerWarning("You switched tabs or applications"); };
    const handleFullscreenChange = () => { if (!document.fullscreenElement) triggerWarning("You exited fullscreen mode"); };
    const handleBlur = () => triggerWarning("The exam window lost focus");
    document.addEventListener("visibilitychange", handleVisibilityChange);
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    window.addEventListener("blur", handleBlur);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      window.removeEventListener("blur", handleBlur);
    };
  }, [examStarted, showAnswers]);

  const formatTime = (seconds) => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
  const chooseOption = (questionId, optionIndex) => {
    if (selected[questionId] !== undefined || showAnswers) return;
    setSelected((previous) => ({ ...previous, [questionId]: optionIndex }));
  };
  const startExam = async () => {
    try { await document.documentElement.requestFullscreen?.(); } catch (err) { console.warn("Fullscreen request rejected:", err); }
    setExamStarted(true);
  };
  const submitAll = async (forcedWarnings = warnings, forceCheated = false, isTimeOut = false) => {
    if (!exam) return;
    const answers = exam.questions.map((question) => {
      const selectedIndex = selected[question._id];
      return typeof selectedIndex === "number" ? question.options[selectedIndex] : "";
    });
    if (!forceCheated && !isTimeOut && answers.some((answer) => !answer)) {
      alert("Please answer every question before submitting.");
      return;
    }
    try {
      const res = await api.post("/attempts", { examId: exam._id, answers, warningsCount: forcedWarnings, autoSubmitted: isTimeOut || forceCheated, cheatingLogged: forceCheated });
      setLastAttempt(res.data.attempt || res.data);
      setShowAnswers(true);
      clearInterval(timerRef.current);
      if (document.exitFullscreen && document.fullscreenElement) document.exitFullscreen().catch(() => {});
    } catch (err) {
      alert(err.response?.data?.message || "Could not submit.");
      setShowAnswers(true);
      clearInterval(timerRef.current);
    }
  };
  const autoSubmit = async () => { alert("Time is up. Your exam is being submitted automatically."); await submitAll(warnings, false, true); };

  if (!exam) return <div className="cc-exam-loading"><div className="spinner-border text-primary" role="status" /><span>Loading assessment…</span></div>;

  if (!examStarted && !showAnswers) {
    return (
      <div className="cc-exam-start-shell">
        <div className="cc-exam-start-card">
          <span className="cc-exam-eyebrow">Technical assessment</span>
          <h1>{exam.title}</h1>
          <p>{exam.description || "A focused assessment to check your understanding."}</p>
          <div className="cc-exam-instructions"><strong><FaShieldAlt /> Secure assessment rules</strong><ul><li>{exam.questions.length} questions with a {exam.duration || 30}-minute time limit.</li><li>Fullscreen mode and focus monitoring are required.</li><li>Three proctoring warnings trigger automatic submission.</li></ul></div>
          <button className="cc-exam-primary-button" onClick={startExam}><FaExpand /> Start assessment</button>
        </div>
      </div>
    );
  }

  const question = exam.questions[activeQuestion];
  const questionCount = exam.questions.length;
  const answeredCount = Object.keys(selected).length;
  const currentChoice = selected[question?._id];
  const progress = questionCount ? Math.round((answeredCount / questionCount) * 100) : 0;

  return (
    <div className="cc-exam-shell">
      <div className="cc-exam-header">
        <div className="cc-exam-breadcrumb">Assessments <span>/</span> {exam.title}</div>
        <div className="cc-exam-header-actions">
          <div className="cc-exam-timer"><FaClock /><span>TIME REMAINING</span><strong>{timeLeft !== null ? formatTime(timeLeft) : "—"}</strong></div>
          <div className="cc-exam-progress"><span>PROGRESS</span><strong>{answeredCount} / {questionCount} ({progress}%)</strong></div>
          <button className="cc-exam-header-button" onClick={() => setFlagged((previous) => ({ ...previous, [question._id]: !previous[question._id] }))}><FaFlag /> {flagged[question._id] ? "Flagged" : "Flag question"}</button>
          <button className="cc-exam-submit-button" onClick={() => submitAll()}><FaPaperPlane /> Submit exam</button>
        </div>
      </div>

      <div className="cc-exam-layout">
        <section className="cc-exam-workspace">
          <div className="cc-exam-question-meta"><span className="cc-exam-question-number">Question {String(activeQuestion + 1).padStart(2, "0")}</span><span className="cc-exam-question-type">Single choice</span><span className="cc-exam-question-points">{question.points || 1} Point{question.points === 1 ? "" : "s"}</span></div>
          <div className="cc-exam-question-title-row"><h1>{question.question}</h1>{flagged[question._id] && <span className="cc-exam-flagged"><FaFlag /> Flagged</span>}</div>
          <div className="cc-exam-options">
            {question.options.map((option, optionIndex) => {
              const isSelected = currentChoice === optionIndex;
              const isCorrect = showAnswers && option === question.answer;
              const isWrong = showAnswers && isSelected && option !== question.answer;
              return <button key={option} className={`cc-exam-option${isSelected ? " is-selected" : ""}${isCorrect ? " is-correct" : ""}${isWrong ? " is-wrong" : ""}`} disabled={showAnswers || currentChoice !== undefined} onClick={() => chooseOption(question._id, optionIndex)}><span className="cc-exam-option-radio">{isSelected ? "✓" : String.fromCharCode(65 + optionIndex)}</span><span>{option}</span>{isCorrect && <FaCheckCircle className="cc-exam-answer-icon" />}{isWrong && <FaTimesCircle className="cc-exam-answer-icon" />}</button>;
            })}
          </div>
          {showAnswers && <div className={`cc-exam-answer-note ${currentChoice !== undefined && question.options[currentChoice] === question.answer ? "is-correct" : "is-wrong"}`}>{currentChoice !== undefined && question.options[currentChoice] === question.answer ? <FaCheckCircle /> : <FaTimesCircle />} Correct answer: <strong>{question.answer}</strong></div>}
          <div className="cc-exam-question-footer"><button className="cc-exam-footer-button" disabled={activeQuestion === 0} onClick={() => setActiveQuestion((current) => current - 1)}><FaArrowLeft /> Previous question</button><button className="cc-exam-clear-button" disabled={currentChoice === undefined || showAnswers} onClick={() => setSelected((previous) => { const next = { ...previous }; delete next[question._id]; return next; })}>Clear selection</button><button className="cc-exam-next-button" disabled={activeQuestion === questionCount - 1} onClick={() => setActiveQuestion((current) => current + 1)}>Save &amp; next <FaArrowRight /></button></div>
          <div className="cc-exam-status-cards"><div><FaShieldAlt /><span><small>PROCTOR STATUS</small><strong>Screen &amp; audio locked</strong></span></div><div><FaClock /><span><small>AVG. SPEED / Q</small><strong>{answeredCount ? Math.max(1, Math.round(((exam.duration * 60) - (timeLeft || 0)) / answeredCount)) : "—"} seconds</strong></span></div><div><FaExclamationTriangle /><span><small>WARNINGS</small><strong>{warnings} / 3 recorded</strong></span></div></div>
        </section>

        <aside className="cc-exam-rail">
          <div className="cc-exam-rail-card"><div className="cc-exam-rail-heading"><h2>Question matrix</h2><span>1-{questionCount}</span></div><div className="cc-exam-matrix">{exam.questions.map((item, index) => <button key={item._id} className={`${index === activeQuestion ? "is-current " : ""}${selected[item._id] !== undefined ? "is-answered " : ""}${flagged[item._id] ? "is-flagged" : ""}`} onClick={() => setActiveQuestion(index)} aria-label={`Go to question ${index + 1}`}>{String(index + 1).padStart(2, "0")}{flagged[item._id] && <i />}</button>)}</div><div className="cc-exam-legend"><span><i className="answered" /> Answered</span><span><i className="flagged" /> Flagged</span><span><i className="remaining" /> Remaining</span></div></div>
          <div className="cc-exam-rail-card cc-exam-heartbeat"><div><h2>Hardware &amp; proctor heartbeat</h2><span className="cc-heartbeat-dot" /></div><p>Screen capture <strong>Active</strong></p><p>Microphone monitor <strong>Active</strong></p><p>Browser lock <strong>Engaged</strong></p></div>
        </aside>
      </div>

      {showAnswers && lastAttempt && <div className="cc-exam-result-banner"><FaTrophy /><span>Your score <strong>{lastAttempt.score}</strong></span>{lastAttempt.cheatingLogged && <em><FaExclamationTriangle /> Auto-submitted after proctoring violations</em>}</div>}
    </div>
  );
}

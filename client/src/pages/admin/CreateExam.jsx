import React, { useEffect, useState } from "react";
import {
  FaBookOpen,
  FaEdit,
  FaPaperPlane,
  FaPlus,
  FaSave,
  FaSpinner,
  FaTrashAlt,
  FaArrowLeft,
  FaCheckCircle,
} from "react-icons/fa";
import { useNavigate, useParams, Link } from "react-router-dom";
import api from "../../api/api";
import "./CreateExam.css";

export default function CreateExam() {
  const { id } = useParams();
  const nav = useNavigate();
  const [exam, setExam] = useState({
    title: "",
    description: "",
    duration: 30,
    questions: [{ question: "", options: ["", "", "", ""], answer: "" }],
  });
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (id) {
      (async () => {
        setLoading(true);
        try {
          const res = await api.get(`/admin/exams/${id}`);
          if (res.data) {
            setExam({
              title: res.data.title || "",
              description: res.data.description || "",
              duration: res.data.duration || 30,
              questions:
                Array.isArray(res.data.questions) && res.data.questions.length > 0
                  ? res.data.questions.map((q) => ({
                      question: q.question || "",
                      options:
                        Array.isArray(q.options) && q.options.length === 4
                          ? q.options
                          : ["", "", "", ""],
                      answer: q.answer || "",
                    }))
                  : [{ question: "", options: ["", "", "", ""], answer: "" }],
            });
          }
        } catch (err) {
          alert("Failed to load exam data.");
        }
        setLoading(false);
      })();
    }
  }, [id]);

  const handleChange = (e) => {
    setExam({ ...exam, [e.target.name]: e.target.value });
  };

  const handleQuestionChange = (idx, field, value) => {
    const updated = [...exam.questions];
    if (field === "options") {
      updated[idx].options = value;
    } else {
      updated[idx][field] = value;
    }
    setExam({ ...exam, questions: updated });
  };

  const addQuestion = () => {
    setExam({
      ...exam,
      questions: [
        ...exam.questions,
        { question: "", options: ["", "", "", ""], answer: "" },
      ],
    });
  };

  const removeQuestion = (idx) => {
    if (exam.questions.length <= 1) {
      alert("An exam must have at least one question.");
      return;
    }
    setExam({
      ...exam,
      questions: exam.questions.filter((_, i) => i !== idx),
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (id) {
        await api.put(`/admin/exams/${id}`, exam);
        alert("Exam updated successfully!");
      } else {
        await api.post("/admin/exams", exam);
        alert("Exam created successfully!");
      }
      nav("/admin/exams");
    } catch (err) {
      alert("Failed to save exam. " + (err.response?.data?.message || err.message));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="ce-shell">
      {/* Header */}
      <div className="ce-heading">
        <div>
          <div className="ce-eyebrow">Assessments &amp; Testing</div>
          <h1>{id ? "Edit Assessment" : "Create New Assessment"}</h1>
          <p>
            {id
              ? "Modify questions, answer keys, and timing configurations for this exam."
              : "Design assessment questionnaires, multiple choice options, and duration."}
          </p>
        </div>
        <div>
          <Link to="/admin/exams" className="ce-back-link">
            <FaArrowLeft /> Back to All Exams
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="ce-card" style={{ textAlign: "center", padding: "48px 20px" }}>
          <FaSpinner className="spin" size={24} style={{ color: "#0078d4", marginBottom: 12 }} />
          <div style={{ fontWeight: 600 }}>Loading exam data…</div>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          {/* General Information Card */}
          <div className="ce-card">
            <div className="ce-section-title">
              <span>Exam Overview &amp; Settings</span>
              <span style={{ fontSize: 11, color: "#697687", fontWeight: 500 }}>
                Basic metadata
              </span>
            </div>

            <div className="ce-form-group">
              <label className="ce-form-label">Exam Title *</label>
              <input
                className="ce-input"
                name="title"
                value={exam.title}
                onChange={handleChange}
                required
                placeholder="e.g. Advanced JavaScript & TypeScript Assessment"
              />
            </div>

            <div className="ce-form-group">
              <label className="ce-form-label">Description</label>
              <textarea
                className="ce-textarea"
                name="description"
                value={exam.description}
                onChange={handleChange}
                placeholder="Brief summary of skills assessed and target candidate profile…"
              />
            </div>

            <div className="ce-form-group" style={{ maxWidth: 280 }}>
              <label className="ce-form-label">Duration (Minutes) *</label>
              <input
                type="number"
                className="ce-input"
                name="duration"
                value={exam.duration}
                onChange={handleChange}
                min={1}
                required
              />
            </div>
          </div>

          {/* Questions Section Card */}
          <div className="ce-card">
            <div className="ce-section-title">
              <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <FaBookOpen style={{ color: "#0078d4" }} /> Questions ({exam.questions.length})
              </span>
              <span style={{ fontSize: 11, color: "#697687", fontWeight: 500 }}>
                Multiple choice with correct answer matching
              </span>
            </div>

            {exam.questions.map((q, idx) => (
              <div className="ce-question-card" key={idx}>
                <div className="ce-question-head">
                  <span className="ce-question-badge">
                    Question #{idx + 1}
                  </span>
                  {exam.questions.length > 1 && (
                    <button
                      type="button"
                      className="ce-btn-delete-q"
                      onClick={() => removeQuestion(idx)}
                      title="Remove this question"
                    >
                      <FaTrashAlt size={10} /> Delete Question
                    </button>
                  )}
                </div>

                <div className="ce-form-group">
                  <label className="ce-form-label">Question Text *</label>
                  <input
                    className="ce-input"
                    value={q.question || ""}
                    onChange={(e) =>
                      handleQuestionChange(idx, "question", e.target.value)
                    }
                    required
                    placeholder="Enter the question statement…"
                  />
                </div>

                <label className="ce-form-label">Answer Options (A, B, C, D) *</label>
                <div className="ce-options-grid">
                  {q.options.map((opt, oi) => {
                    const letter = String.fromCharCode(65 + oi);
                    return (
                      <div className="ce-option-wrap" key={oi}>
                        <span className="ce-option-prefix">{letter}</span>
                        <input
                          className="ce-option-input"
                          value={opt}
                          onChange={(e) => {
                            const newOpts = [...q.options];
                            newOpts[oi] = e.target.value;
                            handleQuestionChange(idx, "options", newOpts);
                          }}
                          placeholder={`Option ${letter}`}
                          required
                        />
                      </div>
                    );
                  })}
                </div>

                <div className="ce-answer-wrap">
                  <span className="ce-answer-label">
                    <FaCheckCircle style={{ marginRight: 4 }} /> Correct Answer:
                  </span>
                  <input
                    className="ce-answer-input"
                    value={q.answer}
                    onChange={(e) =>
                      handleQuestionChange(idx, "answer", e.target.value)
                    }
                    required
                    placeholder="Exact text matching the correct option above"
                  />
                </div>
              </div>
            ))}

            <div className="ce-actions-bar">
              <button
                type="button"
                className="ce-btn-add"
                onClick={addQuestion}
              >
                <FaPlus size={11} /> Add Another Question
              </button>

              <button
                type="submit"
                className="ce-btn-submit"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <FaSpinner className="spin" /> Saving…
                  </>
                ) : id ? (
                  <>
                    <FaSave /> Update Exam
                  </>
                ) : (
                  <>
                    <FaPaperPlane /> Create Exam
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}

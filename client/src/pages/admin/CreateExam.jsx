import React, { useEffect, useState } from "react";
import {
  FaBookOpen,
  FaEdit,
  FaPaperPlane,
  FaPlus,
  FaSave,
  FaSpinner,
  FaTrashAlt,
} from "react-icons/fa";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../api/api";

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

  useEffect(() => {
    if (id) {
      (async () => {
        setLoading(true);
        try {
          const res = await api.get(`/admin/exams/${id}`);
          setExam(res.data);
        } catch (err) {
          alert("Failed to load exam");
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
    setExam({
      ...exam,
      questions: exam.questions.filter((_, i) => i !== idx),
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (id) {
        await api.put(`/admin/exams/${id}`, exam);
        alert("Exam updated!");
      } else {
        await api.post("/admin/exams", exam);
        alert("Exam created!");
      }
      nav("/admin/exams");
    } catch (err) {
      alert("Save failed");
    }
    setLoading(false);
  };

  return (
    <div className="d-flex justify-content-center align-items-center min-vh-100 bg-light">
      <div className="col-lg-8 col-md-10 col-12">
        <div className="card shadow-lg border-0">
          <div className="card-header bg-primary text-white text-center">
            <h2 className="fw-bold m-0 d-inline-flex align-items-center gap-2">
              {id ? <FaEdit /> : <FaPlus />} {id ? "Edit Exam" : "Create Exam"}
            </h2>
          </div>
          <div className="card-body p-4">
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="form-label fw-semibold">Title</label>
                <input
                  className="form-control form-control-lg border-primary"
                  name="title"
                  value={exam.title}
                  onChange={handleChange}
                  required
                  placeholder="Enter exam title"
                />
              </div>
              <div className="mb-3">
                <label className="form-label fw-semibold">Description</label>
                <textarea
                  className="form-control border-info"
                  name="description"
                  value={exam.description}
                  onChange={handleChange}
                  required
                  rows="3"
                  placeholder="Write a short description..."
                />
              </div>
              <div className="mb-4">
                <label className="form-label fw-semibold">Duration (minutes)</label>
                <input
                  type="number"
                  className="form-control border-success"
                  name="duration"
                  value={exam.duration}
                  onChange={handleChange}
                  min={1}
                  required
                />
              </div>
              <h5 className="fw-bold text-primary mb-3 d-flex align-items-center gap-2">
                <FaBookOpen /> Questions
              </h5>
              {exam.questions.map((q, idx) => (
                <div className="card mb-4 border-0 shadow-sm" key={idx}>
                  <div className="card-body bg-light">
                    <div className="mb-3">
                      <label className="form-label fw-semibold">
                        Question {idx + 1}
                      </label>
                      <input
                        className="form-control border-primary"
                        value={q.question || ""}
                        onChange={(e) =>
                          handleQuestionChange(idx, "question", e.target.value)
                        }
                        required
                        placeholder="Type the question..."
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label fw-semibold">Options</label>
                      {q.options.map((opt, oi) => (
                        <input
                          key={oi}
                          className="form-control mb-2 border-secondary"
                          value={opt}
                          onChange={(e) => {
                            const newOpts = [...q.options];
                            newOpts[oi] = e.target.value;
                            handleQuestionChange(idx, "options", newOpts);
                          }}
                          placeholder={`Option ${String.fromCharCode(65 + oi)}`}
                          required
                        />
                      ))}
                    </div>
                    <div className="mb-3">
                      <label className="form-label fw-semibold">Correct Answer</label>
                      <input
                        className="form-control border-success"
                        value={q.answer}
                        onChange={(e) =>
                          handleQuestionChange(idx, "answer", e.target.value)
                        }
                        required
                        placeholder="Must match one of the options"
                      />
                    </div>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-danger d-inline-flex align-items-center gap-2"
                      onClick={() => removeQuestion(idx)}
                    >
                      <FaTrashAlt /> Remove Question
                    </button>
                  </div>
                </div>
              ))}
              <div className="text-center mb-4">
                <button
                  type="button"
                  className="btn btn-outline-primary px-4 py-2 d-inline-flex align-items-center gap-2"
                  onClick={addQuestion}
                >
                  <FaPlus /> Add Question
                </button>
              </div>
              <div className="text-center">
                <button
                  type="submit"
                  className="btn btn-lg btn-success px-5 text-white shadow-sm d-inline-flex align-items-center gap-2"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <FaSpinner /> Saving...
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
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

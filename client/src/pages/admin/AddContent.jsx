import React, { useState, useEffect } from "react";
import api from "../../api/api";
import { useParams, useNavigate, useSearchParams, Link } from "react-router-dom";

const LANGUAGES = [
  "python",
  "javascript",
  "java",
  "c",
  "cpp",
  "csharp",
  "ruby",
  "go",
  "php",
  "html",
  "css",
  "bash",
  "json",
  "sql",
  "dockerfile",
  "yaml"
];

export default function AddContent() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const urlTopicId = searchParams.get("topicId") || "";
  const nav = useNavigate();

  const [course, setCourse] = useState(null);
  const [selectedTopicId, setSelectedTopicId] = useState(urlTopicId);
  const [form, setForm] = useState({
    title: "",
    body: "",
    order: 0,
    codeBlocks: [],
  });
  const [images, setImages] = useState([]);

  useEffect(() => {
    api.get(`/courses/${id}`).then((res) => {
      setCourse(res.data);
      if (res.data.topics && res.data.topics.length > 0) {
        if (!urlTopicId) {
          // Default to the first topic
          setSelectedTopicId(res.data.topics[0]._id);
        }
      }
    });
  }, [id, urlTopicId]);

  // Code block handlers
  const handleCodeChange = (idx, field, value) => {
    const newBlocks = [...form.codeBlocks];
    newBlocks[idx][field] = value;
    setForm({ ...form, codeBlocks: newBlocks });
  };
  const addCodeBlock = () => {
    if (form.codeBlocks.length < 10)
      setForm({
        ...form,
        codeBlocks: [...form.codeBlocks, { language: "python", code: "" }],
      });
  };
  const removeCodeBlock = (idx) => {
    const newBlocks = form.codeBlocks.filter((_, i) => i !== idx);
    setForm({ ...form, codeBlocks: newBlocks });
  };

  const handleImageFiles = (e) => {
    const files = Array.from(e.target.files).slice(0, 10);
    setImages(files);
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!selectedTopicId) {
      alert("Please select a topic first. If no topics exist, create one in the Course Editor first.");
      return;
    }
    const codeBlocks = form.codeBlocks.filter((cb) => cb.code.trim() !== "");
    const data = new FormData();
    data.append("title", form.title);
    data.append("body", form.body);
    data.append("order", form.order);
    codeBlocks.forEach((cb, i) => {
      data.append(`codeBlocks[${i}][language]`, cb.language);
      data.append(`codeBlocks[${i}][code]`, cb.code);
    });
    images.forEach((img) => data.append("images", img));
    try {
      await api.post(`/courses/${id}/topics/${selectedTopicId}/subtopics`, data, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      nav(`/admin/courses/${id}/edit`);
    } catch (err) {
      alert("Failed to add subtopic");
    }
  };

  if (!course)
    return <div className="container py-5 text-center">Loading...</div>;

  const topicsList = course.topics || [];

  return (
    <div className="container py-4" style={{ maxWidth: "800px" }}>
      <div className="card shadow-sm border-0 rounded-4 p-4 p-md-5">
        <h2 className="fw-bold mb-2 text-primary">Add Subtopic</h2>
        <h5 className="text-muted mb-4">Course: {course.title}</h5>

        {topicsList.length === 0 ? (
          <div className="alert alert-warning mb-4 rounded-3">
            <strong>No topics exist in this course yet!</strong> You must create at least one Topic before you can add subtopics.
            <div className="mt-3">
              <Link to={`/admin/courses/${id}/edit`} className="btn btn-warning btn-sm">
                Go to Course Builder
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={submit}>
            {/* Topic Selection Dropdown */}
            <div className="mb-3">
              <label className="form-label fw-bold text-dark">Select Parent Topic:</label>
              <select
                className="form-select"
                value={selectedTopicId}
                onChange={(e) => setSelectedTopicId(e.target.value)}
                required
              >
                {topicsList.map((topic) => (
                  <option key={topic._id} value={topic._id}>
                    {topic.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-3">
              <label className="form-label fw-bold text-dark">Subtopic Title:</label>
              <input
                className="form-control"
                placeholder="e.g., Docker Basics"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
              />
            </div>

            <div className="mb-3">
              <label className="form-label fw-bold text-dark">Content Body (Markdown Supported):</label>
              <textarea
                className="form-control"
                placeholder="Enter description, theories, and formatted instructions..."
                rows={8}
                value={form.body}
                onChange={(e) => setForm({ ...form, body: e.target.value })}
                required
              />
            </div>

            <div className="mb-3">
              <label className="form-label fw-bold text-dark">Display Order:</label>
              <input
                type="number"
                className="form-control"
                placeholder="0"
                value={form.order}
                onChange={(e) =>
                  setForm({ ...form, order: Number(e.target.value) })
                }
              />
            </div>

            {/* Image upload */}
            <div className="mb-4">
              <label className="form-label fw-bold text-dark">Upload Images (up to 10):</label>
              <input
                type="file"
                className="form-control"
                accept="image/*"
                multiple
                onChange={handleImageFiles}
              />
              {images.length > 0 && (
                <div className="mt-2 d-flex flex-wrap gap-2">
                  {images.map((img, idx) => (
                    <div key={idx} className="position-relative" style={{ width: 80 }}>
                      <img
                        src={URL.createObjectURL(img)}
                        alt="preview"
                        style={{
                          width: 80,
                          height: 80,
                          objectFit: "cover",
                          borderRadius: 8,
                        }}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Code blocks */}
            <div className="mb-4">
              <label className="form-label fw-bold text-dark">
                Code Blocks (optional, up to 10):
              </label>
              {form.codeBlocks.map((cb, idx) => (
                <div key={idx} className="mb-3 p-3 border rounded bg-light position-relative">
                  <div className="d-flex mb-2 align-items-center justify-content-between">
                    <span className="badge bg-secondary">Block #{idx + 1}</span>
                    <div className="d-flex gap-2">
                      <select
                        className="form-select form-select-sm"
                        value={cb.language}
                        onChange={(e) =>
                          handleCodeChange(idx, "language", e.target.value)
                        }
                        style={{ width: 140 }}
                      >
                        {LANGUAGES.map((lang) => (
                          <option key={lang} value={lang}>
                            {lang}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        className="btn btn-danger btn-sm"
                        onClick={() => removeCodeBlock(idx)}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                  <textarea
                    className="form-control font-monospace text-light"
                    rows={6}
                    placeholder="Paste or write code here..."
                    value={cb.code}
                    onChange={(e) => handleCodeChange(idx, "code", e.target.value)}
                    style={{ background: "#212529" }}
                  />
                </div>
              ))}
              {form.codeBlocks.length < 10 && (
                <button
                  type="button"
                  className="btn btn-outline-secondary btn-sm"
                  onClick={addCodeBlock}
                >
                  + Add Code Block
                </button>
              )}
            </div>

            <div className="d-flex gap-3">
              <button className="btn btn-success px-4">Create Subtopic</button>
              <Link to={`/admin/courses/${id}/edit`} className="btn btn-outline-secondary">
                Cancel
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}


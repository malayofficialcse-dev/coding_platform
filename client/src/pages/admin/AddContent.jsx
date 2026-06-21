import React, { useState, useEffect } from "react";
import api from "../../api/api";
import { useParams, useNavigate } from "react-router-dom";

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
];

export default function AddContent() {
  const { id } = useParams();
  const [form, setForm] = useState({
    title: "",
    body: "",
    order: 0,
    codeBlocks: [],
  });
  const [images, setImages] = useState([]);
  const [course, setCourse] = useState(null);
  const nav = useNavigate();

  useEffect(() => {
    api.get(`/courses/${id}`).then((res) => setCourse(res.data));
  }, [id]);

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
      await api.post(`/courses/${id}/content`, data, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      nav("/admin/courses");
    } catch (err) {
      alert("Failed to add content");
    }
  };

  if (!course)
    return <div className="container py-5 text-center">Loading...</div>;

  return (
    <div className="container py-4">
      <h2 className="fw-bold mb-3">Add Content to {course.title}</h2>
      <form onSubmit={submit}>
        <div className="mb-3">
          <input
            className="form-control"
            placeholder="Content Title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            required
          />
        </div>
        <div className="mb-3">
          <textarea
            className="form-control"
            placeholder="Content Body (Markdown/HTML allowed)"
            rows={6}
            value={form.body}
            onChange={(e) => setForm({ ...form, body: e.target.value })}
            required
          />
        </div>
        <div className="mb-3">
          <input
            type="number"
            className="form-control"
            placeholder="Order (optional)"
            value={form.order}
            onChange={(e) =>
              setForm({ ...form, order: Number(e.target.value) })
            }
          />
        </div>
        <div className="mb-3">
          <label className="form-label">Upload Images (up to 10):</label>
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
                <div key={idx} style={{ width: 80 }}>
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
        <div className="mb-3">
          <label className="form-label">
            Code Blocks (optional, up to 10):
          </label>
          {form.codeBlocks.map((cb, idx) => (
            <div key={idx} className="mb-2 p-2 border rounded bg-light">
              <div className="d-flex mb-2">
                <select
                  className="form-select me-2"
                  value={cb.language}
                  onChange={(e) =>
                    handleCodeChange(idx, "language", e.target.value)
                  }
                  style={{ maxWidth: 180 }}
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
              <textarea
                className="form-control font-monospace"
                rows={6}
                placeholder="Paste or write code here..."
                value={cb.code}
                onChange={(e) => handleCodeChange(idx, "code", e.target.value)}
                style={{ background: "#222", color: "#fff" }}
              />
            </div>
          ))}
          {form.codeBlocks.length < 10 && (
            <button
              type="button"
              className="btn btn-secondary btn-sm mt-2"
              onClick={addCodeBlock}
            >
              + Add Code Block
            </button>
          )}
        </div>
        <button className="btn btn-success">Add Content</button>
      </form>
    </div>
  );
}

import React, { useState } from "react";
import api from "../api/api";
import { javascript } from "@codemirror/lang-javascript";
import { python } from "@codemirror/lang-python";
import { java } from "@codemirror/lang-java";
import CodeMirror from "@uiw/react-codemirror";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const LANGUAGES = [
  { label: "JavaScript", value: "javascript", extension: javascript },
  { label: "Python", value: "python", extension: python },
  { label: "Java", value: "java", extension: java },
];

const STUDY_GROUPS = [
  "General Feed",
  "Python Learners 🐍",
  "JavaScript Hub 🟨",
  "Java Specialists ☕",
  "C++ Wizards 🟦",
  "Algorithms & DS 📊",
  "Web Dev Bootcamp 🌐"
];

export default function PostForm({ onPost, onClose }) {
  const [text, setText] = useState("");
  const [images, setImages] = useState([]);
  const [codeBlocks, setCodeBlocks] = useState([]);
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("javascript");
  const [group, setGroup] = useState("General Feed");
  const [editorTab, setEditorTab] = useState("edit"); // "edit" | "preview"
  const [loading, setLoading] = useState(false);

  const handleImageChange = (e) => setImages(Array.from(e.target.files));
  const handleAddCodeBlock = () => {
    if (code.trim()) {
      setCodeBlocks([...codeBlocks, { language, code }]);
      setCode("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const data = new FormData();
    data.append("text", text);
    data.append("group", group);
    data.append("codeBlocks", JSON.stringify(codeBlocks));
    images.forEach((img) => data.append("images", img));
    const res = await api.post("/posts", data, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    onPost(res.data);
    setText("");
    setImages([]);
    setCodeBlocks([]);
    setLoading(false);
    if (onClose) onClose();
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Group Selector */}
      <div className="mb-3">
        <label className="form-label fw-semibold text-muted small">Post to Study Group / Community</label>
        <select
          className="form-select border-primary"
          value={group}
          onChange={(e) => setGroup(e.target.value)}
        >
          {STUDY_GROUPS.map((g) => (
            <option key={g} value={g}>
              {g}
            </option>
          ))}
        </select>
      </div>

      {/* Editor Tabs */}
      <div className="d-flex mb-2 border-bottom">
        <button
          type="button"
          className={`btn btn-sm ${editorTab === "edit" ? "btn-primary" : "btn-light"} me-1`}
          onClick={() => setEditorTab("edit")}
          style={{ borderBottomLeftRadius: 0, borderBottomRightRadius: 0 }}
        >
          Write (Markdown)
        </button>
        <button
          type="button"
          className={`btn btn-sm ${editorTab === "preview" ? "btn-primary" : "btn-light"}`}
          onClick={() => setEditorTab("preview")}
          style={{ borderBottomLeftRadius: 0, borderBottomRightRadius: 0 }}
        >
          Preview
        </button>
      </div>

      {editorTab === "edit" ? (
        <textarea
          className="form-control mb-2"
          rows="5"
          placeholder="Write in Markdown (**bold**, *italics*, # headers, - lists)..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          required
        />
      ) : (
        <div
          className="border rounded p-3 mb-2 bg-light cc-scroll"
          style={{ minHeight: "120px", maxHeight: "250px", overflowY: "auto" }}
        >
          {text.trim() ? (
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{text}</ReactMarkdown>
          ) : (
            <span className="text-muted small">Nothing to preview yet.</span>
          )}
        </div>
      )}

      <input
        type="file"
        multiple
        accept="image/*"
        className="form-control mb-2"
        onChange={handleImageChange}
      />
      <div className="mb-2">
        <div className="d-flex align-items-center mb-1">
          <select
            className="form-select me-2"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            style={{ maxWidth: 180 }}
          >
            {LANGUAGES.map((lang) => (
              <option key={lang.value} value={lang.value}>
                {lang.label}
              </option>
            ))}
          </select>
          <button
            type="button"
            className="btn btn-outline-secondary btn-sm"
            onClick={handleAddCodeBlock}
            disabled={!code.trim()}
          >
            + Add Code Block
          </button>
        </div>
        <CodeMirror
          value={code}
          height="100px"
          extensions={[
            LANGUAGES.find((l) => l.value === language)?.extension(),
          ]}
          theme="dark"
          onChange={(value) => setCode(value)}
        />
      </div>
      <button className="btn btn-primary w-100" disabled={loading}>
        {loading ? "Posting..." : "Post"}
      </button>
    </form>
  );
}

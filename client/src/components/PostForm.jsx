import React, { useState } from "react";
import api from "../api/api";
import { javascript } from "@codemirror/lang-javascript";
import { python } from "@codemirror/lang-python";
import { java } from "@codemirror/lang-java";
import CodeMirror from "@uiw/react-codemirror";

const LANGUAGES = [
  { label: "JavaScript", value: "javascript", extension: javascript },
  { label: "Python", value: "python", extension: python },
  { label: "Java", value: "java", extension: java },
];

export default function PostForm({ onPost, onClose }) {
  const [text, setText] = useState("");
  const [images, setImages] = useState([]);
  const [codeBlocks, setCodeBlocks] = useState([]);
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("javascript");
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
      <textarea
        className="form-control mb-2"
        placeholder="Ask a question or share something..."
        value={text}
        onChange={(e) => setText(e.target.value)}
        required
      />
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

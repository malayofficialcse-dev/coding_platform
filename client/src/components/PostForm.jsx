import React, { useEffect, useState } from "react";
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

export default function PostForm({
  post = null,
  submitLabel = "Post",
  onPost,
  onClose,
}) {
  const [text, setText] = useState(post?.text || "");
  const [images, setImages] = useState([]);
  const [codeBlocks, setCodeBlocks] = useState(post?.codeBlocks || []);
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("javascript");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setText(post?.text || "");
    setImages([]);
    setCodeBlocks(post?.codeBlocks || []);
    setCode("");
    setLanguage("javascript");
  }, [post]);

  const handleImageChange = (e) => setImages(Array.from(e.target.files || []));

  const handleAddCodeBlock = () => {
    if (code.trim()) {
      setCodeBlocks([...codeBlocks, { language, code }]);
      setCode("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = new FormData();
      data.append("text", text);
      data.append("codeBlocks", JSON.stringify(codeBlocks));
      images.forEach((img) => data.append("images", img));

      const config = { headers: { "Content-Type": "multipart/form-data" } };
      const res = post?._id
        ? await api.put(`/posts/${post._id}`, data, config)
        : await api.post("/posts", data, config);

      onPost?.(res.data);
      setText("");
      setImages([]);
      setCodeBlocks([]);
      if (onClose) onClose();
    } finally {
      setLoading(false);
    }
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
        {loading ? "Saving..." : submitLabel}
      </button>
    </form>
  );
}

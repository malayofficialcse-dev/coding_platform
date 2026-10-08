import React, { useEffect, useState } from "react";
import api from "../api/api";
import { javascript } from "@codemirror/lang-javascript";
import { python } from "@codemirror/lang-python";
import { java } from "@codemirror/lang-java";
import CodeMirror from "@uiw/react-codemirror";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useTheme } from "../contexts/ThemeContext";
import { FaAlignLeft, FaCode, FaEye, FaFileImage, FaPaperPlane, FaPlus, FaTimes, FaTrash } from "react-icons/fa";

const LANGUAGES = [
  { label: "JavaScript", value: "javascript", extension: javascript },
  { label: "Python", value: "python", extension: python },
  { label: "Java", value: "java", extension: java },
];

const STUDY_GROUPS = ["General Feed", "Web Development", "Data Structures", "Interview Preparation"];

export default function PostForm({
  post = null,
  submitLabel = "Post",
  onPost,
  onClose,
}) {
  const { theme } = useTheme();
  const [text, setText] = useState(post?.text || "");
  const [images, setImages] = useState([]);
  const [codeBlocks, setCodeBlocks] = useState(post?.codeBlocks || []);
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("javascript");
  const [group, setGroup] = useState("General Feed");
  const [editorTab, setEditorTab] = useState("edit"); // "edit" | "preview"
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

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
    setUploadProgress(images.length > 0 ? 0 : 100);

    try {
      const data = new FormData();
      data.append("text", text);
      data.append("group", group);
      data.append("codeBlocks", JSON.stringify(codeBlocks));
      images.forEach((img) => data.append("images", img));

      const requestConfig = {
        onUploadProgress: (event) => {
          if (!event.total) return;
          setUploadProgress(Math.min(99, Math.round((event.loaded * 100) / event.total)));
        },
      };

      const res = post?._id
        ? await api.put(`/posts/${post._id}`, data, requestConfig)
        : await api.post("/posts", data, requestConfig);

      setUploadProgress(100);
      onPost?.(res.data);
      setText("");
      setImages([]);
      setCodeBlocks([]);
      if (onClose) onClose();
    } catch (err) {
      const message = err.response?.data?.error || err.response?.data?.message || "Image upload failed. Please try again.";
      console.error("Post upload failed:", err.response?.data || err);
      window.alert(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Group Selector */}
      <div className="cc-post-form-section mb-3">
        <div className="cc-post-form-section-title"><span><FaAlignLeft /> Publishing destination</span><small>Choose where this update belongs</small></div>
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
      <div className="cc-post-editor-tabs d-flex mb-2 border-bottom">
        <button
          type="button"
          className={`btn btn-sm ${editorTab === "edit" ? "btn-primary" : "btn-light"} me-1`}
          onClick={() => setEditorTab("edit")}
          style={{ borderBottomLeftRadius: 0, borderBottomRightRadius: 0 }}
        >
          <FaAlignLeft /> Write
        </button>
        <button
          type="button"
          className={`btn btn-sm ${editorTab === "preview" ? "btn-primary" : "btn-light"}`}
          onClick={() => setEditorTab("preview")}
          style={{ borderBottomLeftRadius: 0, borderBottomRightRadius: 0 }}
        >
          <FaEye /> Preview
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

      <div className="cc-post-form-section cc-post-attachments mb-3"><div className="cc-post-form-section-title"><span><FaFileImage /> Attachments</span><small>{images.length ? `${images.length} selected` : "Optional"}</small></div><label className="cc-file-picker"><FaFileImage /> Choose images<input type="file" multiple accept="image/*" onChange={handleImageChange} /></label>{images.length > 0 && <div className="cc-selected-files">{images.map((image, index) => <span key={`${image.name}-${index}`}><FaFileImage /> {image.name}<button type="button" onClick={() => setImages((current) => current.filter((_, fileIndex) => fileIndex !== index))}><FaTimes /></button></span>)}</div>}</div>
      {loading && (
        <div className="cc-upload-status" role="status" aria-live="polite">
          <div className="cc-upload-status-row">
            <span>{images.length ? "Uploading your images…" : "Publishing your post…"}</span>
            {images.length > 0 && <strong>{uploadProgress}%</strong>}
          </div>
          <div
            className="cc-progress-track"
            role="progressbar"
            aria-valuemin="0"
            aria-valuemax="100"
            aria-valuenow={images.length > 0 ? uploadProgress : undefined}
          >
            <div
              className="cc-progress-bar"
              style={{ width: `${images.length > 0 ? Math.max(uploadProgress, 6) : 100}%` }}
            />
          </div>
          <span className="cc-upload-help">
            {images.length ? "Keep this window open while your files are being processed." : "Almost there…"}
          </span>
        </div>
      )}
      <div className="cc-post-form-section mb-3">
        <div className="cc-post-form-section-title"><span><FaCode /> Code blocks</span><small>Add formatted code to your post</small></div>
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
            <FaPlus /> Add code block
          </button>
        </div>
        <CodeMirror
          value={code}
          height="100px"
          extensions={[
            LANGUAGES.find((l) => l.value === language)?.extension(),
          ]}
          theme={theme === "dark" ? "dark" : "light"}
          onChange={(value) => setCode(value)}
        />
        {codeBlocks.length > 0 && <div className="cc-attached-code-list">{codeBlocks.map((block, index) => <div key={`${block.language}-${index}`}><span><FaCode /> {block.language}</span><button type="button" onClick={() => setCodeBlocks((current) => current.filter((_, blockIndex) => blockIndex !== index))}><FaTrash /></button></div>)}</div>}
      </div>
      <button className="cc-publish-button btn btn-primary w-100" disabled={loading}>
        {!loading && <FaPaperPlane />}
        {loading ? (images.length ? `${uploadProgress}% Uploading…` : "Publishing…") : submitLabel}
      </button>
    </form>
  );
}

import React, { useEffect, useState } from "react";
import api from "../api/api";
import { javascript } from "@codemirror/lang-javascript";
import { python } from "@codemirror/lang-python";
import { java } from "@codemirror/lang-java";
import CodeMirror from "@uiw/react-codemirror";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useTheme } from "../contexts/ThemeContext";
import {
  FaAlignLeft,
  FaCode,
  FaEye,
  FaFileImage,
  FaPaperPlane,
  FaPlus,
  FaTimes,
  FaTrash,
  FaChartBar,
  FaTags,
  FaQuestionCircle,
} from "react-icons/fa";

const LANGUAGES = [
  { label: "JavaScript", value: "javascript", extension: javascript },
  { label: "Python", value: "python", extension: python },
  { label: "Java", value: "java", extension: java },
];

const STUDY_GROUPS = [
  "General Feed",
  "Web Development",
  "Data Structures",
  "Interview Preparation",
];

const QUICK_TAGS = ["dsa", "webdev", "python", "javascript", "react", "question", "interview"];

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

  // Poll state
  const [showPoll, setShowPoll] = useState(Boolean(post?.poll?.question));
  const [pollQuestion, setPollQuestion] = useState(post?.poll?.question || "");
  const [pollOptions, setPollOptions] = useState(
    post?.poll?.options?.map((o) => o.text) || ["", ""]
  );

  // Tags & Type
  const [tags, setTags] = useState(post?.tags || []);
  const [tagInput, setTagInput] = useState("");
  const [postType, setPostType] = useState(post?.postType || "text");

  useEffect(() => {
    setText(post?.text || "");
    setImages([]);
    setCodeBlocks(post?.codeBlocks || []);
    setCode("");
    setLanguage("javascript");
    setShowPoll(Boolean(post?.poll?.question));
    setPollQuestion(post?.poll?.question || "");
    setPollOptions(post?.poll?.options?.map((o) => o.text) || ["", ""]);
    setTags(post?.tags || []);
    setPostType(post?.postType || "text");
  }, [post]);

  const handleImageChange = (e) => setImages(Array.from(e.target.files || []));

  const handleAddCodeBlock = () => {
    if (code.trim()) {
      setCodeBlocks([...codeBlocks, { language, code }]);
      setCode("");
    }
  };

  const handleAddPollOption = () => {
    if (pollOptions.length < 4) {
      setPollOptions([...pollOptions, ""]);
    }
  };

  const handlePollOptionChange = (idx, value) => {
    const updated = [...pollOptions];
    updated[idx] = value;
    setPollOptions(updated);
  };

  const handleRemovePollOption = (idx) => {
    if (pollOptions.length > 2) {
      setPollOptions(pollOptions.filter((_, i) => i !== idx));
    }
  };

  const toggleTag = (tag) => {
    const clean = tag.toLowerCase().replace(/^#/, "");
    if (tags.includes(clean)) {
      setTags(tags.filter((t) => t !== clean));
    } else {
      setTags([...tags, clean]);
    }
  };

  const handleAddCustomTag = (e) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const clean = tagInput.trim().toLowerCase().replace(/^#/, "");
      if (clean && !tags.includes(clean)) {
        setTags([...tags, clean]);
      }
      setTagInput("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim() && !pollQuestion.trim() && codeBlocks.length === 0 && images.length === 0) {
      window.alert("Please provide text, a poll, a code block, or an image.");
      return;
    }

    setLoading(true);
    setUploadProgress(images.length > 0 ? 0 : 100);

    try {
      const data = new FormData();
      data.append("text", text);
      data.append("group", group);
      data.append("codeBlocks", JSON.stringify(codeBlocks));
      data.append("tags", JSON.stringify(tags));

      let resolvedType = postType;
      if (showPoll && pollQuestion.trim() && pollOptions.filter((o) => o.trim()).length >= 2) {
        resolvedType = "poll";
        data.append(
          "poll",
          JSON.stringify({
            question: pollQuestion.trim(),
            options: pollOptions.filter((o) => o.trim()).map((opt) => ({ text: opt.trim() })),
          })
        );
      } else if (codeBlocks.length > 0) {
        resolvedType = "code";
      } else if (tags.includes("question")) {
        resolvedType = "question";
      }
      data.append("postType", resolvedType);

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
      setShowPoll(false);
      setPollQuestion("");
      setPollOptions(["", ""]);
      setTags([]);
      if (onClose) onClose();
    } catch (err) {
      const message =
        err.response?.data?.error ||
        err.response?.data?.message ||
        "Post creation failed. Please try again.";
      console.error("Post creation failed:", err.response?.data || err);
      window.alert(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ maxHeight: "80vh", overflowY: "auto", paddingRight: 4 }}>
      {/* Group Selector */}
      <div className="cc-post-form-section mb-3">
        <div className="cc-post-form-section-title">
          <span>
            <FaAlignLeft /> Publishing destination
          </span>
          <small>Choose where this update belongs</small>
        </div>
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
          rows="4"
          placeholder="Share your thoughts, ask a question, or explain your code snippet..."
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
      ) : (
        <div
          className="border rounded p-3 mb-2 bg-light cc-scroll"
          style={{ minHeight: "100px", maxHeight: "220px", overflowY: "auto" }}
        >
          {text.trim() ? (
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{text}</ReactMarkdown>
          ) : (
            <span className="text-muted small">Nothing to preview yet.</span>
          )}
        </div>
      )}

      {/* Community Poll Section */}
      <div className="cc-post-form-section mb-3">
        <div className="cc-post-form-section-title">
          <span>
            <FaChartBar /> Community Poll
          </span>
          <button
            type="button"
            className="btn btn-sm btn-outline-primary"
            onClick={() => setShowPoll(!showPoll)}
            style={{ fontSize: "0.75rem", padding: "2px 8px" }}
          >
            {showPoll ? "Remove Poll" : "+ Add Poll"}
          </button>
        </div>

        {showPoll && (
          <div style={{ background: "var(--cc-surface, #fff)", padding: 12, borderRadius: 6, border: "1px solid var(--cc-border)" }}>
            <input
              type="text"
              className="form-control form-control-sm mb-2 fw-semibold"
              placeholder="Ask a question (e.g. Which DSA topic should we practice next?)"
              value={pollQuestion}
              onChange={(e) => setPollQuestion(e.target.value)}
            />
            <div style={{ display: "grid", gap: 6 }}>
              {pollOptions.map((opt, idx) => (
                <div key={idx} className="d-flex align-items-center gap-2">
                  <span className="text-muted small fw-bold" style={{ minWidth: 20 }}>
                    {idx + 1}.
                  </span>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    placeholder={`Option ${idx + 1}`}
                    value={opt}
                    onChange={(e) => handlePollOptionChange(idx, e.target.value)}
                  />
                  {pollOptions.length > 2 && (
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-danger"
                      onClick={() => handleRemovePollOption(idx)}
                      title="Remove option"
                      style={{ padding: "2px 6px" }}
                    >
                      <FaTimes size={12} />
                    </button>
                  )}
                </div>
              ))}
            </div>
            {pollOptions.length < 4 && (
              <button
                type="button"
                className="btn btn-sm btn-link text-primary p-0 mt-2 text-decoration-none"
                onClick={handleAddPollOption}
              >
                + Add another option (up to 4)
              </button>
            )}
          </div>
        )}
      </div>

      {/* Tags and Question categorization */}
      <div className="cc-post-form-section mb-3">
        <div className="cc-post-form-section-title">
          <span>
            <FaTags /> Tags & Category
          </span>
          <small>Click to toggle or type custom tags</small>
        </div>
        <div className="d-flex flex-wrap gap-1 mb-2">
          {QUICK_TAGS.map((qTag) => {
            const active = tags.includes(qTag);
            return (
              <button
                key={qTag}
                type="button"
                onClick={() => toggleTag(qTag)}
                style={{
                  fontSize: "0.72rem",
                  padding: "2px 8px",
                  borderRadius: 20,
                  border: active ? "1px solid var(--cc-primary, #0078d4)" : "1px solid var(--cc-border, #ccc)",
                  background: active ? "var(--cc-primary-soft, #e6f2fb)" : "transparent",
                  color: active ? "var(--cc-primary, #0078d4)" : "var(--cc-muted, #666)",
                  cursor: "pointer",
                  fontWeight: active ? 700 : 500,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 3,
                }}
              >
                {qTag === "question" && <FaQuestionCircle size={10} />}
                #{qTag}
              </button>
            );
          })}
        </div>
        <input
          type="text"
          className="form-control form-control-sm"
          placeholder="Add custom tag (press Enter)..."
          value={tagInput}
          onChange={(e) => setTagInput(e.target.value)}
          onKeyDown={handleAddCustomTag}
        />
        {tags.length > 0 && (
          <div className="d-flex flex-wrap gap-1 mt-2">
            {tags.map((t) => (
              <span
                key={t}
                className="badge bg-light text-dark border d-flex align-items-center gap-1"
                style={{ fontSize: "0.75rem", padding: "4px 8px" }}
              >
                #{t}
                <FaTimes
                  size={10}
                  style={{ cursor: "pointer" }}
                  onClick={() => setTags(tags.filter((item) => item !== t))}
                />
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Attachments Section */}
      <div className="cc-post-form-section cc-post-attachments mb-3">
        <div className="cc-post-form-section-title">
          <span>
            <FaFileImage /> Attachments
          </span>
          <small>{images.length ? `${images.length} selected` : "Optional"}</small>
        </div>
        <label className="cc-file-picker">
          <FaFileImage /> Choose images
          <input type="file" multiple accept="image/*" onChange={handleImageChange} />
        </label>
        {images.length > 0 && (
          <div className="cc-selected-files">
            {images.map((image, index) => (
              <span key={`${image.name}-${index}`}>
                <FaFileImage /> {image.name}
                <button
                  type="button"
                  onClick={() =>
                    setImages((current) => current.filter((_, fileIndex) => fileIndex !== index))
                  }
                >
                  <FaTimes />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

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
            {images.length
              ? "Keep this window open while your files are being processed."
              : "Almost there…"}
          </span>
        </div>
      )}

      {/* Code Blocks Section */}
      <div className="cc-post-form-section mb-3">
        <div className="cc-post-form-section-title">
          <span>
            <FaCode /> Code blocks
          </span>
          <small>Add formatted code to your post</small>
        </div>
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
          extensions={[LANGUAGES.find((l) => l.value === language)?.extension()]}
          theme={theme === "dark" ? "dark" : "light"}
          onChange={(value) => setCode(value)}
        />
        {codeBlocks.length > 0 && (
          <div className="cc-attached-code-list">
            {codeBlocks.map((block, index) => (
              <div key={`${block.language}-${index}`}>
                <span>
                  <FaCode /> {block.language}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setCodeBlocks((current) => current.filter((_, blockIndex) => blockIndex !== index))
                  }
                >
                  <FaTrash />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <button className="cc-publish-button btn btn-primary w-100" disabled={loading}>
        {!loading && <FaPaperPlane />}
        {loading ? (images.length ? `${uploadProgress}% Uploading…` : "Publishing…") : submitLabel}
      </button>
    </form>
  );
}

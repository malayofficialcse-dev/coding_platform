import React from "react";
import PostForm from "./PostForm";
import { FaPen, FaTimes } from "react-icons/fa";

export default function PostFormModal({
  show,
  onClose,
  onPost,
  post = null,
  title = "Create a Post",
  submitLabel = "Post",
}) {
  if (!show) return null;
  return (
    <div
      className="position-fixed top-0 start-0 w-100 h-100"
      style={{ background: "rgba(0,0,0,0.2)", zIndex: 2000 }}
      onClick={onClose}
    >
      <div
        className="cc-post-modal position-absolute top-50 start-50 translate-middle bg-white rounded shadow p-4"
        style={{ minWidth: 350, maxWidth: 640, width: "92%" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="cc-post-modal-header"><div><span className="cc-post-modal-eyebrow"><FaPen /> Community publishing</span><h5 className="fw-bold mb-0">{title}</h5><p>Create a clear, useful update for your learning community.</p></div><button type="button" className="cc-post-modal-close" onClick={onClose} aria-label="Close"><FaTimes /></button></div>
        <PostForm
          post={post}
          submitLabel={submitLabel}
          onPost={onPost}
          onClose={onClose}
        />
      </div>
    </div>
  );
}

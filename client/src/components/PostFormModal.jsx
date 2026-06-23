import React from "react";
import PostForm from "./PostForm";

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
        className="position-absolute top-50 start-50 translate-middle bg-white rounded shadow p-4"
        style={{ minWidth: 350, maxWidth: 500, width: "90%" }}
        onClick={(e) => e.stopPropagation()}
      >
        <h5 className="fw-bold mb-3">{title}</h5>
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

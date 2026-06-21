import React, { useState } from "react";
import PostForm from "./PostForm";

export default function PostFormModal({ show, onClose, onPost }) {
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
        <h5 className="fw-bold mb-3">Create a Post</h5>
        <PostForm onPost={onPost} onClose={onClose} />
      </div>
    </div>
  );
}

import React, { useState } from "react";
import { Link } from "react-router-dom";

export default function CommentSection({ comments, onComment, user }) {
  const [text, setText] = useState("");
  return (
    <div className="mt-2">
      {comments.map((c) => (
        <div key={c._id} className="border-bottom py-1">
          <b>{c.author?.name || c.author?.username || "Code Campus Member"}</b>: {c.text}
        </div>
      ))}
      {user ? <form
        onSubmit={(e) => {
          e.preventDefault();
          if (text.trim()) {
            onComment(text);
            setText("");
          }
        }}
      >
        <input
          className="form-control form-control-sm mt-2"
          placeholder="Add a comment..."
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
      </form> : (
        <p className="small text-muted mt-2 mb-0">
          <Link to="/login">Sign in</Link> to add a comment.
        </p>
      )}
    </div>
  );
}

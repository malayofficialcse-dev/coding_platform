import React, { useState } from "react";

export default function CommentSection({ comments, onComment }) {
  const [text, setText] = useState("");
  return (
    <div className="mt-2">
      {comments.map((c) => (
        <div key={c._id} className="border-bottom py-1">
          <b>{c.author.name || c.author.username}</b>: {c.text}
        </div>
      ))}
      <form
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
      </form>
    </div>
  );
}

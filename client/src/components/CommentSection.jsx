import React, { useState } from "react";
import { Link } from "react-router-dom";
import { optimizedImageUrl } from "../utils/imageUrl";
import { FaThumbsUp, FaRegThumbsUp, FaImage, FaSmile } from "react-icons/fa";

const DEFAULT_AVATAR = "/default-avatar.svg";

function timeAgo(dateString) {
  if (!dateString) return "";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "";
  const now = new Date();
  const seconds = Math.floor((now - date) / 1000);
  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks}w`;
  return date.toLocaleDateString();
}

export default function CommentSection({ comments = [], onComment, user }) {
  const [text, setText] = useState("");
  const [likedComments, setLikedComments] = useState({});
  const [focused, setFocused] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (text.trim()) {
      onComment(text.trim());
      setText("");
      setFocused(false);
    }
  };

  const toggleLike = (id) => {
    setLikedComments((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div style={{ padding: "0 0 4px 0" }}>
      {/* ── Comments List ── */}
      <div className="d-flex flex-column" style={{ gap: 12 }}>
        {comments.map((c, idx) => {
          const authorId =
            typeof c.author === "string"
              ? c.author
              : c.author?._id || c.author?.id || "";

          const authorName =
            (typeof c.author === "object" &&
              (c.author?.name || c.author?.username)) ||
            (typeof c.author === "string" && c.author) ||
            "Code Campus Member";

          const authorRole =
            (typeof c.author === "object" && c.author?.role) || "";

          const isCurrentUser =
            user &&
            (String(user._id || user.id) === String(authorId) ||
              user.name === authorName ||
              user.username === authorName);

          const rawAuthorImage =
            (typeof c.author === "object" &&
              (c.author?.profileImage ||
                c.author?.avatar ||
                c.author?.profilePicture ||
                c.author?.image)) ||
            c.authorImage ||
            c.profileImage ||
            (isCurrentUser ? user?.profileImage : null);

          const authorImage = rawAuthorImage || DEFAULT_AVATAR;
          const commentId = c._id || idx;
          const isLiked = likedComments[commentId];

          return (
            <div key={commentId} className="d-flex align-items-start gap-2">
              {/* Avatar */}
              <Link
                to={authorId ? `/profile/${authorId}` : "#"}
                className="flex-shrink-0 text-decoration-none"
                style={{
                  width: 38,
                  height: 38,
                  minWidth: 38,
                  minHeight: 38,
                  borderRadius: "50%",
                  overflow: "hidden",
                  display: "inline-flex",
                  border: "1.5px solid var(--cc-border, rgba(0,0,0,0.12))",
                }}
              >
                <img
                  src={optimizedImageUrl(authorImage, 80)}
                  alt={authorName}
                  style={{
                    width: 38,
                    height: 38,
                    objectFit: "cover",
                    borderRadius: "50%",
                    display: "block",
                  }}
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = DEFAULT_AVATAR;
                  }}
                />
              </Link>

              {/* Bubble */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    backgroundColor: "var(--cc-surface-muted, rgba(255,255,255,0.06))",
                    border: "1px solid var(--cc-border, rgba(0,0,0,0.08))",
                    borderRadius: 10,
                    padding: "8px 12px",
                    display: "inline-block",
                    maxWidth: "100%",
                    wordBreak: "break-word",
                  }}
                >
                  {/* Name + headline */}
                  <div className="d-flex align-items-center flex-wrap gap-2">
                    <Link
                      to={authorId ? `/profile/${authorId}` : "#"}
                      className="text-decoration-none fw-semibold"
                      style={{
                        color: "var(--cc-text, inherit)",
                        fontSize: "0.84rem",
                        lineHeight: 1.2,
                      }}
                    >
                      {authorName}
                    </Link>
                    {authorRole && (
                      <span
                        style={{
                          fontSize: "0.72rem",
                          color: "var(--cc-muted, #94a3b8)",
                          lineHeight: 1.2,
                        }}
                      >
                        · {authorRole}
                      </span>
                    )}
                  </div>

                  {/* Comment text */}
                  <div
                    style={{
                      color: "var(--cc-text, inherit)",
                      fontSize: "0.875rem",
                      whiteSpace: "pre-wrap",
                      lineHeight: 1.45,
                      marginTop: 2,
                    }}
                  >
                    {c.text}
                  </div>
                </div>

                {/* Actions row: timestamp · Like · Reply */}
                <div
                  className="d-flex align-items-center gap-2 ps-1 mt-1"
                  style={{ fontSize: "0.75rem", color: "var(--cc-muted, #64748b)" }}
                >
                  {c.createdAt && (
                    <span style={{ fontSize: "0.72rem" }}>{timeAgo(c.createdAt)}</span>
                  )}

                  {/* Like action */}
                  <button
                    type="button"
                    onClick={() => toggleLike(commentId)}
                    className="border-0 bg-transparent p-0 d-flex align-items-center gap-1"
                    style={{
                      cursor: "pointer",
                      color: isLiked
                        ? "var(--cc-primary, #0a66c2)"
                        : "var(--cc-muted, #64748b)",
                      fontWeight: isLiked ? 700 : 600,
                      fontSize: "0.75rem",
                      transition: "color 0.15s",
                    }}
                    title={isLiked ? "Unlike" : "Like"}
                  >
                    {isLiked ? (
                      <FaThumbsUp size={11} />
                    ) : (
                      <FaRegThumbsUp size={11} />
                    )}
                    Like
                  </button>

                  <span style={{ color: "var(--cc-border, #cbd5e1)" }}>·</span>

                  {/* Reply action (visual only) */}
                  <button
                    type="button"
                    className="border-0 bg-transparent p-0"
                    style={{
                      cursor: "pointer",
                      color: "var(--cc-muted, #64748b)",
                      fontWeight: 600,
                      fontSize: "0.75rem",
                    }}
                    onClick={() =>
                      setText((prev) =>
                        prev.startsWith(`@${authorName} `)
                          ? prev
                          : `@${authorName} ` + prev
                      )
                    }
                  >
                    Reply
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Comment Input (LinkedIn style) ── */}
      {user ? (
        <form
          onSubmit={handleSubmit}
          className="d-flex align-items-start gap-2 mt-3"
        >
          {/* Current user avatar */}
          <div
            className="flex-shrink-0"
            style={{
              width: 38,
              height: 38,
              minWidth: 38,
              borderRadius: "50%",
              overflow: "hidden",
              border: "1.5px solid var(--cc-border, rgba(0,0,0,0.12))",
            }}
          >
            <img
              src={optimizedImageUrl(user?.profileImage || DEFAULT_AVATAR, 80)}
              alt={user?.name || user?.username || "You"}
              style={{
                width: 38,
                height: 38,
                objectFit: "cover",
                borderRadius: "50%",
                display: "block",
              }}
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = DEFAULT_AVATAR;
              }}
            />
          </div>

          {/* Input container */}
          <div
            style={{
              flex: 1,
              borderRadius: 20,
              border: focused
                ? "1.5px solid var(--cc-primary, #0a66c2)"
                : "1.5px solid var(--cc-border, rgba(0,0,0,0.2))",
              backgroundColor: "var(--cc-surface-muted, transparent)",
              transition: "border-color 0.2s",
              overflow: "hidden",
            }}
          >
            {/* Textarea */}
            <textarea
              rows={focused ? 2 : 1}
              className="form-control border-0 bg-transparent shadow-none"
              style={{
                resize: "none",
                borderRadius: 0,
                fontSize: "0.875rem",
                color: "var(--cc-text, inherit)",
                padding: "9px 14px",
                lineHeight: 1.4,
                outline: "none",
              }}
              placeholder="Add a comment…"
              value={text}
              onFocus={() => setFocused(true)}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  if (text.trim()) handleSubmit(e);
                }
              }}
            />

            {/* Bottom toolbar: emoji + image + Post button */}
            {focused && (
              <div
                className="d-flex align-items-center justify-content-between px-3 pb-2"
                style={{ gap: 8 }}
              >
                {/* Left icons */}
                <div className="d-flex align-items-center gap-2">
                  <button
                    type="button"
                    className="border-0 bg-transparent p-0 d-flex align-items-center"
                    style={{
                      color: "var(--cc-muted, #64748b)",
                      cursor: "pointer",
                      fontSize: 16,
                    }}
                    title="Emoji"
                    tabIndex={-1}
                  >
                    <FaSmile size={17} />
                  </button>
                  <button
                    type="button"
                    className="border-0 bg-transparent p-0 d-flex align-items-center"
                    style={{
                      color: "var(--cc-muted, #64748b)",
                      cursor: "pointer",
                    }}
                    title="Attach image"
                    tabIndex={-1}
                  >
                    <FaImage size={16} />
                  </button>
                </div>

                {/* Post button */}
                <button
                  type="submit"
                  disabled={!text.trim()}
                  style={{
                    background: text.trim()
                      ? "var(--cc-primary, #0a66c2)"
                      : "transparent",
                    color: text.trim()
                      ? "#fff"
                      : "var(--cc-muted, #94a3b8)",
                    border: text.trim()
                      ? "none"
                      : "1.5px solid var(--cc-border, #cbd5e1)",
                    borderRadius: 20,
                    padding: "4px 16px",
                    fontSize: "0.82rem",
                    fontWeight: 700,
                    cursor: text.trim() ? "pointer" : "default",
                    transition: "background 0.2s, color 0.2s",
                  }}
                >
                  Post
                </button>
              </div>
            )}
          </div>
        </form>
      ) : (
        <p className="small text-muted mt-2 mb-0">
          <Link
            to="/login"
            className="fw-semibold text-decoration-none"
            style={{ color: "var(--cc-primary, #0a66c2)" }}
          >
            Sign in
          </Link>{" "}
          to add a comment.
        </p>
      )}
    </div>
  );
}

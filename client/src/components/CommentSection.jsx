import React, { useState } from "react";
import { Link } from "react-router-dom";
import { optimizedImageUrl } from "../utils/imageUrl";
import { FaPaperPlane } from "react-icons/fa";

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

  const handleSubmit = (e) => {
    e.preventDefault();
    if (text.trim()) {
      onComment(text.trim());
      setText("");
    }
  };

  return (
    <div className="mt-2">
      {/* Comments List */}
      <div className="d-flex flex-column gap-2 mb-3">
        {comments.map((c, idx) => {
          const authorId =
            typeof c.author === "string"
              ? c.author
              : c.author?._id || c.author?.id || "";

          const authorName =
            (typeof c.author === "object" && (c.author?.name || c.author?.username)) ||
            (typeof c.author === "string" && c.author) ||
            "Code Campus Member";

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

          return (
            <div key={c._id || idx} className="d-flex align-items-start gap-2">
              {/* User Avatar with explicit square wrapper to prevent squishing */}
              <Link
                to={authorId ? `/profile/${authorId}` : "#"}
                className="flex-shrink-0 text-decoration-none d-inline-flex"
                style={{
                  width: 34,
                  height: 34,
                  minWidth: 34,
                  minHeight: 34,
                  borderRadius: "50%",
                  overflow: "hidden",
                }}
              >
                <img
                  src={optimizedImageUrl(authorImage, 80)}
                  alt={authorName}
                  style={{
                    width: 34,
                    height: 34,
                    minWidth: 34,
                    minHeight: 34,
                    maxWidth: 34,
                    maxHeight: 34,
                    borderRadius: "50%",
                    objectFit: "cover",
                    aspectRatio: "1 / 1",
                    display: "block",
                    border: "1.5px solid var(--cc-border, rgba(255, 255, 255, 0.12))",
                  }}
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = DEFAULT_AVATAR;
                  }}
                />
              </Link>

              {/* Comment Bubble (FB / Insta Format) */}
              <div style={{ maxWidth: "calc(100% - 44px)" }}>
                <div
                  className="rounded-4 px-3 py-2"
                  style={{
                    backgroundColor: "var(--cc-surface-muted, rgba(255, 255, 255, 0.05))",
                    border: "1px solid var(--cc-border, rgba(255, 255, 255, 0.07))",
                    display: "inline-block",
                    wordBreak: "break-word",
                  }}
                >
                  <Link
                    to={authorId ? `/profile/${authorId}` : "#"}
                    className="fw-bold text-decoration-none d-block"
                    style={{
                      color: "var(--cc-text, inherit)",
                      fontSize: "0.85rem",
                      lineHeight: 1.25,
                      marginBottom: 2,
                    }}
                  >
                    {authorName}
                  </Link>
                  <div
                    style={{
                      color: "var(--cc-text, inherit)",
                      fontSize: "0.88rem",
                      whiteSpace: "pre-wrap",
                      lineHeight: 1.35,
                    }}
                  >
                    {c.text}
                  </div>
                </div>

                {/* Meta details (timestamp) */}
                {c.createdAt && (
                  <div
                    className="ps-2 mt-1"
                    style={{
                      fontSize: "0.72rem",
                      color: "var(--cc-muted, #94a3b8)",
                    }}
                  >
                    {timeAgo(c.createdAt)}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Input Box (FB / Insta style) */}
      {user ? (
        <form
          onSubmit={handleSubmit}
          className="d-flex align-items-center gap-2 mt-2"
        >
          {/* Current User Avatar with consistent 34x34 circle wrapper */}
          <div
            className="flex-shrink-0 d-inline-flex"
            style={{
              width: 34,
              height: 34,
              minWidth: 34,
              minHeight: 34,
              borderRadius: "50%",
              overflow: "hidden",
            }}
          >
            <img
              src={optimizedImageUrl(user?.profileImage || DEFAULT_AVATAR, 80)}
              alt={user?.name || user?.username || "You"}
              style={{
                width: 34,
                height: 34,
                minWidth: 34,
                minHeight: 34,
                maxWidth: 34,
                maxHeight: 34,
                borderRadius: "50%",
                objectFit: "cover",
                aspectRatio: "1 / 1",
                display: "block",
                border: "1.5px solid var(--cc-border, rgba(255, 255, 255, 0.12))",
              }}
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = DEFAULT_AVATAR;
              }}
            />
          </div>

          {/* Input field with Post button inside */}
          <div className="position-relative flex-grow-1 d-flex align-items-center">
            <input
              type="text"
              className="form-control form-control-sm rounded-pill pe-5 py-2 px-3"
              style={{
                backgroundColor: "var(--cc-surface-muted, rgba(255, 255, 255, 0.05))",
                borderColor: "var(--cc-border, rgba(255, 255, 255, 0.1))",
                color: "var(--cc-text, inherit)",
                fontSize: "0.875rem",
              }}
              placeholder="Write a comment..."
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
            {text.trim() && (
              <button
                type="submit"
                className="btn btn-sm position-absolute end-0 me-2 p-1 border-0 bg-transparent text-primary fw-bold d-flex align-items-center gap-1"
                style={{
                  color: "var(--cc-primary, #0078d4)",
                  fontSize: "0.82rem",
                }}
                title="Post comment"
              >
                <span>Post</span>
                <FaPaperPlane size={11} />
              </button>
            )}
          </div>
        </form>
      ) : (
        <p className="small text-muted mt-2 mb-0">
          <Link
            to="/login"
            className="fw-semibold text-decoration-none"
            style={{ color: "var(--cc-primary, #0078d4)" }}
          >
            Sign in
          </Link>{" "}
          to add a comment.
        </p>
      )}
    </div>
  );
}

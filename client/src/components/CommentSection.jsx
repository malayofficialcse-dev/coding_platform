import React, { useState, useMemo } from "react";
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

function formatCommentText(text) {
  if (!text) return "";
  const mentionMatch = text.match(/^(@[a-zA-Z0-9_\s.-]+?)(?:\s|$)(.*)/s);
  if (mentionMatch) {
    return (
      <>
        <span style={{ color: "var(--cc-primary, #0a66c2)", fontWeight: 600 }}>
          {mentionMatch[1]}
        </span>{" "}
        {mentionMatch[2]}
      </>
    );
  }
  return text;
}

function SingleCommentItem({
  comment,
  user,
  liked,
  onToggleLike,
  onReplyClick,
  isReply = false,
}) {
  const authorId =
    typeof comment.author === "string"
      ? comment.author
      : comment.author?._id || comment.author?.id || "";

  const authorName =
    (typeof comment.author === "object" &&
      (comment.author?.name || comment.author?.username)) ||
    (typeof comment.author === "string" && comment.author) ||
    "Code Campus Member";

  const authorRole =
    (typeof comment.author === "object" && comment.author?.role) || "";

  const isCurrentUser =
    user &&
    (String(user._id || user.id) === String(authorId) ||
      user.name === authorName ||
      user.username === authorName);

  const rawAuthorImage =
    (typeof comment.author === "object" &&
      (comment.author?.profileImage ||
        comment.author?.avatar ||
        comment.author?.profilePicture ||
        comment.author?.image)) ||
    comment.authorImage ||
    comment.profileImage ||
    (isCurrentUser ? user?.profileImage : null);

  const authorImage = rawAuthorImage || DEFAULT_AVATAR;
  const avatarSize = isReply ? 30 : 36;

  return (
    <div className="d-flex align-items-start gap-2" style={{ position: "relative" }}>
      {/* Avatar */}
      <Link
        to={authorId ? `/profile/${authorId}` : "#"}
        className="flex-shrink-0 text-decoration-none"
        style={{
          width: avatarSize,
          height: avatarSize,
          minWidth: avatarSize,
          minHeight: avatarSize,
          borderRadius: "50%",
          overflow: "hidden",
          display: "inline-flex",
          border: "1.5px solid var(--cc-border, rgba(255,255,255,0.12))",
          zIndex: 2,
        }}
      >
        <img
          src={optimizedImageUrl(authorImage, 80)}
          alt={authorName}
          style={{
            width: avatarSize,
            height: avatarSize,
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

      {/* Bubble + Actions */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            backgroundColor: "var(--cc-surface-muted, rgba(255,255,255,0.06))",
            border: "1px solid var(--cc-border, rgba(255,255,255,0.08))",
            borderRadius: 10,
            padding: isReply ? "6px 12px" : "8px 12px",
            display: "inline-block",
            maxWidth: "100%",
            wordBreak: "break-word",
          }}
        >
          {/* Author Name + Role */}
          <div className="d-flex align-items-center flex-wrap gap-2">
            <Link
              to={authorId ? `/profile/${authorId}` : "#"}
              className="text-decoration-none fw-semibold"
              style={{
                color: "var(--cc-text, inherit)",
                fontSize: isReply ? "0.8rem" : "0.84rem",
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
              fontSize: isReply ? "0.84rem" : "0.875rem",
              whiteSpace: "pre-wrap",
              lineHeight: 1.45,
              marginTop: 2,
            }}
          >
            {formatCommentText(comment.text)}
          </div>
        </div>

        {/* Actions row: timestamp · Like · Reply */}
        <div
          className="d-flex align-items-center gap-2 ps-1 mt-1"
          style={{ fontSize: "0.75rem", color: "var(--cc-muted, #64748b)" }}
        >
          {comment.createdAt && (
            <span style={{ fontSize: "0.72rem" }}>{timeAgo(comment.createdAt)}</span>
          )}

          <button
            type="button"
            onClick={onToggleLike}
            className="border-0 bg-transparent p-0 d-flex align-items-center gap-1"
            style={{
              cursor: "pointer",
              color: liked ? "var(--cc-primary, #0a66c2)" : "var(--cc-muted, #64748b)",
              fontWeight: liked ? 700 : 600,
              fontSize: "0.75rem",
              transition: "color 0.15s",
            }}
            title={liked ? "Unlike" : "Like"}
          >
            {liked ? <FaThumbsUp size={11} /> : <FaRegThumbsUp size={11} />}
            Like
          </button>

          <span style={{ color: "var(--cc-border, #cbd5e1)" }}>·</span>

          <button
            type="button"
            className="border-0 bg-transparent p-0"
            style={{
              cursor: "pointer",
              color: "var(--cc-muted, #64748b)",
              fontWeight: 600,
              fontSize: "0.75rem",
            }}
            onClick={onReplyClick}
          >
            Reply
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CommentSection({ comments = [], onComment, user }) {
  const [text, setText] = useState("");
  const [likedComments, setLikedComments] = useState({});
  const [focused, setFocused] = useState(false);

  // Inline replying target: { parentId: string, replyToAuthor: string }
  const [replyingTarget, setReplyingTarget] = useState(null);
  const [replyText, setReplyText] = useState("");
  // Track submitted reply messages to their target parent comment ID
  const [replyParentMap, setReplyParentMap] = useState(() => new Map());

  const handleSubmit = (e) => {
    e.preventDefault();
    if (text.trim()) {
      onComment(text.trim());
      setText("");
      setFocused(false);
    }
  };

  const handleInlineReplySubmit = (e) => {
    e.preventDefault();
    if (!replyText.trim() || !replyingTarget) return;

    let finalMsg = replyText.trim();
    // Prepend @mention if not already typed
    if (
      replyingTarget.replyToAuthor &&
      !finalMsg.toLowerCase().startsWith(`@${replyingTarget.replyToAuthor.toLowerCase()}`)
    ) {
      finalMsg = `@${replyingTarget.replyToAuthor} ${finalMsg}`;
    }

    // Map this message to the parent comment so it immediately renders under it
    setReplyParentMap((prev) => {
      const next = new Map(prev);
      next.set(finalMsg.trim(), replyingTarget.parentId);
      return next;
    });

    onComment(finalMsg);
    setReplyText("");
    setReplyingTarget(null);
  };

  const handleStartReply = (parentId, authorName) => {
    setReplyingTarget({ parentId, replyToAuthor: authorName });
    setReplyText(`@${authorName} `);
  };

  const toggleLike = (id) => {
    setLikedComments((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Build hierarchical threaded tree (parents + replies)
  const commentTree = useMemo(() => {
    const rootComments = [];
    const rootMap = new Map(); // id -> rootComment
    const parentOfReply = new Map(); // replyId -> rootComment

    const getAuthorName = (author) =>
      (
        typeof author === "object"
          ? author?.name || author?.username || ""
          : String(author || "")
      )
        .trim()
        .toLowerCase();

    comments.forEach((c, index) => {
      const id = c._id || `c_${index}`;
      const commentObj = { ...c, _localId: id, replies: [] };
      const commentText = (c.text || "").trim();

      let matchedRoot = null;

      // 1. Explicit inline reply action mapping
      if (replyParentMap.has(commentText)) {
        const targetParentId = replyParentMap.get(commentText);
        if (rootMap.has(targetParentId)) {
          matchedRoot = rootMap.get(targetParentId);
        } else if (parentOfReply.has(targetParentId)) {
          matchedRoot = parentOfReply.get(targetParentId);
        }
      }

      // 2. Explicit c.parentId or c.parent
      if (!matchedRoot && (c.parentId || c.parent)) {
        const pId = c.parentId || c.parent;
        if (rootMap.has(pId)) {
          matchedRoot = rootMap.get(pId);
        } else if (parentOfReply.has(pId)) {
          matchedRoot = parentOfReply.get(pId);
        }
      }

      // 3. Mention @Author matching preceding comments
      const mentionMatch = commentText.match(/^@([a-zA-Z0-9_\s.-]+?)(?:\s|$)/);
      if (!matchedRoot && mentionMatch) {
        const mentioned = mentionMatch[1].trim().toLowerCase();

        for (let i = index - 1; i >= 0; i--) {
          const prev = comments[i];
          const prevId = prev._id || `c_${i}`;
          const prevAuthor = getAuthorName(prev.author);

          if (prevAuthor === mentioned || prevAuthor.startsWith(mentioned)) {
            if (rootMap.has(prevId)) {
              matchedRoot = rootMap.get(prevId);
              break;
            } else if (parentOfReply.has(prevId)) {
              matchedRoot = parentOfReply.get(prevId);
              break;
            }
          }
        }
      }

      if (matchedRoot) {
        // Attach to the root comment's replies list
        matchedRoot.replies.push(commentObj);
        parentOfReply.set(id, matchedRoot);
      } else {
        // Top-level root comment
        rootComments.push(commentObj);
        rootMap.set(id, commentObj);
      }
    });

    return rootComments;
  }, [comments, replyParentMap]);

  return (
    <div style={{ padding: "0 0 4px 0" }}>
      {/* ── Threaded Comments List (LinkedIn style) ── */}
      <div className="d-flex flex-column" style={{ gap: 16 }}>
        {commentTree.map((parent) => {
          const parentId = parent._localId;
          const parentAuthorName =
            (typeof parent.author === "object" &&
              (parent.author?.name || parent.author?.username)) ||
            (typeof parent.author === "string" && parent.author) ||
            "Member";

          const hasReplies = parent.replies && parent.replies.length > 0;
          const isReplyingToThis = replyingTarget?.parentId === parentId;

          return (
            <div key={parentId} className="d-flex flex-column" style={{ position: "relative" }}>
              {/* Parent Comment Item */}
              <SingleCommentItem
                comment={parent}
                user={user}
                liked={likedComments[parentId]}
                onToggleLike={() => toggleLike(parentId)}
                onReplyClick={() => handleStartReply(parentId, parentAuthorName)}
                isReply={false}
              />

              {/* ── Replies Section with LinkedIn Vertical Line ── */}
              {(hasReplies || isReplyingToThis) && (
                <div
                  style={{
                    position: "relative",
                    marginLeft: 17, // Aligned with the center of the 36px parent avatar
                    paddingLeft: 24, // Indentation for the replies
                    marginTop: 8,
                  }}
                >
                  {/* Continuous Vertical Connector Line */}
                  <div
                    style={{
                      position: "absolute",
                      left: 0,
                      top: -6,
                      bottom: isReplyingToThis ? 24 : 14,
                      width: 2,
                      backgroundColor: "var(--cc-border, rgba(255, 255, 255, 0.16))",
                      borderRadius: 1,
                    }}
                  />

                  {/* Replies List */}
                  <div className="d-flex flex-column" style={{ gap: 10 }}>
                    {parent.replies.map((reply, rIdx) => {
                      const replyId = reply._localId;
                      const replyAuthorName =
                        (typeof reply.author === "object" &&
                          (reply.author?.name || reply.author?.username)) ||
                        (typeof reply.author === "string" && reply.author) ||
                        "Member";

                      return (
                        <div key={replyId || rIdx} style={{ position: "relative" }}>
                          {/* Curved Connector Elbow Branch */}
                          <div
                            style={{
                              position: "absolute",
                              left: -24,
                              top: 0,
                              width: 18,
                              height: 15,
                              borderBottom: "2px solid var(--cc-border, rgba(255, 255, 255, 0.16))",
                              borderLeft: "2px solid var(--cc-border, rgba(255, 255, 255, 0.16))",
                              borderBottomLeftRadius: 10,
                              pointerEvents: "none",
                            }}
                          />

                          <SingleCommentItem
                            comment={reply}
                            user={user}
                            liked={likedComments[replyId]}
                            onToggleLike={() => toggleLike(replyId)}
                            onReplyClick={() => handleStartReply(parentId, replyAuthorName)}
                            isReply={true}
                          />
                        </div>
                      );
                    })}

                    {/* Inline Reply Input directly below the replies */}
                    {isReplyingToThis && (
                      <div style={{ position: "relative", marginTop: 4 }}>
                        {/* Connector Elbow Branch to Inline Reply */}
                        <div
                          style={{
                            position: "absolute",
                            left: -24,
                            top: 0,
                            width: 18,
                            height: 15,
                            borderBottom: "2px solid var(--cc-border, rgba(255, 255, 255, 0.16))",
                            borderLeft: "2px solid var(--cc-border, rgba(255, 255, 255, 0.16))",
                            borderBottomLeftRadius: 10,
                            pointerEvents: "none",
                          }}
                        />

                        <form onSubmit={handleInlineReplySubmit} className="d-flex align-items-start gap-2">
                          <div
                            style={{
                              width: 28,
                              height: 28,
                              minWidth: 28,
                              borderRadius: "50%",
                              overflow: "hidden",
                              border: "1.5px solid var(--cc-border, rgba(255,255,255,0.12))",
                              zIndex: 2,
                            }}
                          >
                            <img
                              src={optimizedImageUrl(user?.profileImage || DEFAULT_AVATAR, 60)}
                              alt={user?.name || "You"}
                              style={{ width: 28, height: 28, objectFit: "cover", borderRadius: "50%" }}
                            />
                          </div>

                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div
                              style={{
                                borderRadius: 16,
                                border: "1.5px solid var(--cc-primary, #0a66c2)",
                                backgroundColor: "var(--cc-surface-muted, transparent)",
                                padding: "4px 10px",
                              }}
                            >
                              <textarea
                                rows={1}
                                autoFocus
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter" && !e.shiftKey) {
                                    e.preventDefault();
                                    handleInlineReplySubmit(e);
                                  }
                                }}
                                placeholder={`Reply to ${replyingTarget?.replyToAuthor || "comment"}...`}
                                style={{
                                  width: "100%",
                                  border: "none",
                                  outline: "none",
                                  background: "transparent",
                                  color: "var(--cc-text, inherit)",
                                  fontSize: "0.82rem",
                                  resize: "none",
                                  padding: "4px 0",
                                }}
                              />
                            </div>

                            <div className="d-flex align-items-center justify-content-end gap-2 mt-1">
                              <button
                                type="button"
                                onClick={() => setReplyingTarget(null)}
                                style={{
                                  background: "transparent",
                                  border: "none",
                                  color: "var(--cc-muted, #64748b)",
                                  fontSize: "0.75rem",
                                  fontWeight: 600,
                                  cursor: "pointer",
                                  padding: "2px 8px",
                                }}
                              >
                                Cancel
                              </button>
                              <button
                                type="submit"
                                disabled={!replyText.trim()}
                                style={{
                                  background: replyText.trim()
                                    ? "var(--cc-primary, #0a66c2)"
                                    : "transparent",
                                  color: replyText.trim()
                                    ? "#fff"
                                    : "var(--cc-muted, #94a3b8)",
                                  border: replyText.trim()
                                    ? "none"
                                    : "1px solid var(--cc-border, #cbd5e1)",
                                  borderRadius: 14,
                                  padding: "2px 12px",
                                  fontSize: "0.75rem",
                                  fontWeight: 700,
                                  cursor: replyText.trim() ? "pointer" : "default",
                                }}
                              >
                                Reply
                              </button>
                            </div>
                          </div>
                        </form>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Main Post Comment Input (LinkedIn style) ── */}
      {user ? (
        <form onSubmit={handleSubmit} className="d-flex align-items-start gap-2 mt-3">
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

            {/* Bottom toolbar */}
            {focused && (
              <div
                className="d-flex align-items-center justify-content-between px-3 pb-2"
                style={{ gap: 8 }}
              >
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

                <button
                  type="submit"
                  disabled={!text.trim()}
                  style={{
                    background: text.trim() ? "var(--cc-primary, #0a66c2)" : "transparent",
                    color: text.trim() ? "#fff" : "var(--cc-muted, #94a3b8)",
                    border: text.trim() ? "none" : "1.5px solid var(--cc-border, #cbd5e1)",
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

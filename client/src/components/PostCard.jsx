import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/api";
import CommentSection from "./CommentSection";
import PostFormModal from "./PostFormModal";
import CodeSnippetSandboxModal from "./CodeSnippetSandboxModal";
import { EditorView } from "@codemirror/view";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { javascript } from "@codemirror/lang-javascript";
import { python } from "@codemirror/lang-python";
import { java } from "@codemirror/lang-java";
import { sql } from "@codemirror/lang-sql";
import { cpp } from "@codemirror/lang-cpp";
import CodeMirror from "@uiw/react-codemirror";
import { optimizedImageUrl } from "../utils/imageUrl";
import { formatDateTime } from "../utils/formatDateTime";
import { useTheme } from "../contexts/ThemeContext";

import {
  FaCode,
  FaCopy,
  FaCheck,
  FaPlay,
  FaChevronLeft,
  FaChevronRight,
  FaTimes,
  FaDownload,
  FaHeart,
  FaComment,
  FaShare,
  FaEdit,
  FaTrash,
  FaEllipsisV,
  FaBookmark,
  FaRegBookmark,
  FaChartBar,
  FaQuestionCircle,
  FaFire,
  FaLightbulb,
  FaRocket,
} from "react-icons/fa";

const LANGUAGES = { javascript, js: javascript, python, py: python, java, sql, cpp, "c++": cpp };

const getLanguageExtension = (language) => {
  const normalizedLanguage = String(language || "").trim().toLowerCase();
  const extension = LANGUAGES[normalizedLanguage] || javascript;
  return extension();
};

const isLikedByUser = (likes, userId) =>
  Array.isArray(likes) &&
  likes.some((like) => String(like?._id || like) === String(userId));

const REACTION_CONFIG = [
  { type: "like", emoji: "❤️", label: "Like", color: "#dc2626" },
  { type: "fire", emoji: "🔥", label: "Fire", color: "#ea580c" },
  { type: "insight", emoji: "💡", label: "Insight", color: "#ca8a04" },
  { type: "rocket", emoji: "🚀", label: "Shipped", color: "#2563eb" },
  { type: "clap", emoji: "👏", label: "Clap", color: "#16a34a" },
];

export default function PostCard({
  post,
  user,
  onUpdate,
  onDelete,
  onTagClick,
  embedded = false,
}) {
  const { theme } = useTheme();
  const currentUserId = String(user?._id || user?.id || "");

  // Likes & Reactions
  const reactionsList = Array.isArray(post.reactions) ? post.reactions : [];
  const [reactions, setReactions] = useState(reactionsList);
  const userReaction = reactions.find((r) => String(r.user) === currentUserId)?.type ||
    (isLikedByUser(post.likes, currentUserId) ? "like" : null);
  const [myReaction, setMyReaction] = useState(userReaction);
  const [showReactionPicker, setShowReactionPicker] = useState(false);

  // Poll
  const [poll, setPoll] = useState(post.poll || null);
  const [votingPoll, setVotingPoll] = useState(false);

  // Bookmarks
  const isBookmarkedInitial =
    Array.isArray(post.bookmarks) &&
    post.bookmarks.some((b) => String(b) === currentUserId);
  const [bookmarked, setBookmarked] = useState(isBookmarkedInitial);

  // Comments
  const [comments, setComments] = useState(post.comments || []);
  const [showComments, setShowComments] = useState(false);

  // Code Carousel & Sandbox
  const [copiedIdx, setCopiedIdx] = useState(null);
  const [codeIndex, setCodeIndex] = useState(0);
  const [sandboxModal, setSandboxModal] = useState({ show: false, code: "", language: "javascript" });

  // Modals & Menu
  const [showEditModal, setShowEditModal] = useState(false);
  const [showOwnerMenu, setShowOwnerMenu] = useState(false);
  const [previewImageIdx, setPreviewImageIdx] = useState(null);

  const authorId = typeof post.author === "string" ? post.author : post.author?._id || post.author?.id;
  const isOwner = Boolean(
    currentUserId &&
    authorId &&
    currentUserId.toString() === authorId.toString()
  );

  const authorName =
    post.author?.name ||
    post.author?.username ||
    (isOwner ? user?.name || user?.username : "") ||
    "Code Campus Member";

  const authorImage =
    post.author?.profileImage ||
    (isOwner ? user?.profileImage : "") ||
    "https://static.vecteezy.com/system/resources/previews/018/742/015/original/minimal-profile-account-symbol-user-interface-theme-3d-icon-rendering-illustration-isolated-in-transparent-background-png.png";

  const authorProfileLink = `/profile/${authorId || ""}`;

  useEffect(() => {
    setReactions(Array.isArray(post.reactions) ? post.reactions : []);
    const r = (Array.isArray(post.reactions) ? post.reactions : []).find(
      (item) => String(item.user) === currentUserId
    )?.type || (isLikedByUser(post.likes, currentUserId) ? "like" : null);
    setMyReaction(r);
    setPoll(post.poll || null);
    setBookmarked(
      Array.isArray(post.bookmarks) &&
        post.bookmarks.some((b) => String(b) === currentUserId)
    );
    setComments(post.comments || []);
  }, [post, currentUserId]);

  // Compute reaction counts
  const reactionCounts = { like: 0, fire: 0, insight: 0, rocket: 0, clap: 0 };
  reactions.forEach((r) => {
    if (reactionCounts[r.type] !== undefined) reactionCounts[r.type]++;
  });
  // Fallback if legacy likes exist but no reactions
  if (reactions.length === 0 && Array.isArray(post.likes) && post.likes.length > 0) {
    reactionCounts.like = post.likes.length;
  }
  const totalReactionCount = Object.values(reactionCounts).reduce((a, b) => a + b, 0);

  // Handle Developer Reaction
  const handleReaction = async (type) => {
    if (!user) return;
    try {
      setShowReactionPicker(false);
      const res = await api.post(`/posts/react/${post._id}`, { type });
      setReactions(res.data.reactions || []);
      setMyReaction(res.data.myReaction);
      onUpdate?.({
        ...post,
        reactions: res.data.reactions,
        likes: res.data.likes,
      });
    } catch (err) {
      console.error("Error reacting:", err);
    }
  };

  // Handle Poll Vote
  const handleVote = async (optionIndex) => {
    if (!user || !poll || votingPoll) return;
    setVotingPoll(true);
    try {
      const res = await api.post(`/posts/poll/${post._id}/vote`, { optionIndex });
      setPoll(res.data.poll);
      onUpdate?.({ ...post, poll: res.data.poll });
    } catch (err) {
      console.error("Error voting on poll:", err);
    } finally {
      setVotingPoll(false);
    }
  };

  // Handle Bookmark
  const handleBookmark = async () => {
    if (!user) return;
    try {
      const res = await api.post(`/posts/bookmark/${post._id}`);
      setBookmarked(res.data.bookmarked);
      onUpdate?.({
        ...post,
        bookmarks: res.data.bookmarked
          ? [...(post.bookmarks || []), currentUserId]
          : (post.bookmarks || []).filter((b) => String(b) !== currentUserId),
      });
    } catch (err) {
      console.error("Error bookmarking:", err);
    }
  };

  const handleComment = async (text) => {
    const res = await api.post(`/posts/comment/${post._id}`, { text });
    setComments([...comments, res.data]);
    onUpdate?.({ ...post, comments: [...comments, res.data] });
  };

  const handleRepost = async () => {
    await api.post(`/posts/repost/${post._id}`);
    alert("Post shared with your followers!");
  };

  const handleDelete = async () => {
    const confirmed = window.confirm("Delete this post? This cannot be undone.");
    if (!confirmed) return;
    try {
      await api.delete(`/posts/${post._id}`);
      if (onDelete) onDelete(post._id);
      else window.location.reload();
    } catch (err) {
      console.error("Error deleting post:", err);
      alert("Failed to delete post.");
    }
  };

  const downloadImage = (url) => {
    const link = document.createElement("a");
    link.href = url;
    link.download = "campus-post-image.jpg";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Calculate Poll total votes
  const pollTotalVotes =
    poll?.options?.reduce((acc, opt) => acc + (opt.votes?.length || 0), 0) || 0;

  const isSingleImage =
    !post.text && !post.codeBlocks?.length && post.images?.length === 1;

  const PostContent = ({ data }) => (
    <>
      {/* Question Badge / Flair */}
      {data.postType === "question" && (
        <div className="mb-2">
          <span
            className="badge d-inline-flex align-items-center gap-1"
            style={{
              background: "#fee2e2",
              color: "#991b1b",
              border: "1px solid #fecaca",
              fontSize: "0.74rem",
              padding: "4px 8px",
              fontWeight: 700,
            }}
          >
            <FaQuestionCircle /> Community Question / Doubt
          </span>
        </div>
      )}

      {/* Post Text */}
      {data.text && (
        <div className="mb-2 cc-markdown-text" style={{ fontSize: "0.93rem", lineHeight: 1.6 }}>
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{data.text}</ReactMarkdown>
        </div>
      )}

      {/* Tags List */}
      {Array.isArray(data.tags) && data.tags.length > 0 && (
        <div className="d-flex flex-wrap gap-1 mb-2">
          {data.tags.map((tag) => (
            <button
              key={tag}
              type="button"
              className="badge text-decoration-none border"
              onClick={() => onTagClick?.(tag)}
              style={{
                background: "var(--cc-surface-muted, #f1f5f9)",
                color: "var(--cc-primary, #0078d4)",
                cursor: onTagClick ? "pointer" : "default",
                fontSize: "0.72rem",
                padding: "3px 8px",
                borderRadius: 12,
                fontWeight: 600,
              }}
            >
              #{tag}
            </button>
          ))}
        </div>
      )}

      {/* Community Poll Rendering */}
      {poll && Array.isArray(poll.options) && poll.options.length > 0 && (
        <div
          className="p-3 my-3 rounded-3"
          style={{
            background: "var(--cc-surface-muted, #f8fafc)",
            border: "1px solid var(--cc-border, #e2e8f0)",
          }}
        >
          <div className="d-flex align-items-center justify-content-between mb-2">
            <span className="fw-bold d-flex align-items-center gap-2" style={{ fontSize: "0.9rem" }}>
              <FaChartBar color="var(--cc-primary, #0078d4)" /> {poll.question || "Community Poll"}
            </span>
            <span className="text-muted small" style={{ fontSize: "0.75rem" }}>
              {pollTotalVotes} {pollTotalVotes === 1 ? "vote" : "votes"}
            </span>
          </div>

          <div className="d-flex flex-column gap-2 mt-2">
            {poll.options.map((opt, optIdx) => {
              const optVotes = opt.votes?.length || 0;
              const pct = pollTotalVotes > 0 ? Math.round((optVotes / pollTotalVotes) * 100) : 0;
              const hasVotedForThis = Array.isArray(opt.votes) && opt.votes.some((v) => String(v) === currentUserId);

              return (
                <button
                  key={optIdx}
                  type="button"
                  onClick={() => handleVote(optIdx)}
                  disabled={votingPoll || !user}
                  className="btn text-start p-2 position-relative overflow-hidden border"
                  style={{
                    background: hasVotedForThis ? "var(--cc-primary-soft, #e6f2fb)" : "var(--cc-surface, #ffffff)",
                    borderColor: hasVotedForThis ? "var(--cc-primary, #0078d4)" : "var(--cc-border, #cbd5e1)",
                    borderRadius: 8,
                    cursor: user ? "pointer" : "default",
                  }}
                >
                  {/* Progress Fill Bar */}
                  <div
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      bottom: 0,
                      width: `${pct}%`,
                      background: hasVotedForThis
                        ? "rgba(0, 120, 212, 0.18)"
                        : "rgba(148, 163, 184, 0.14)",
                      transition: "width 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
                      pointerEvents: "none",
                    }}
                  />

                  {/* Option Content */}
                  <div className="position-relative d-flex align-items-center justify-content-between" style={{ zIndex: 1 }}>
                    <div className="d-flex align-items-center gap-2">
                      <span
                        style={{
                          width: 18,
                          height: 18,
                          borderRadius: "50%",
                          border: `2px solid ${hasVotedForThis ? "var(--cc-primary, #0078d4)" : "#94a3b8"}`,
                          display: "grid",
                          placeItems: "center",
                          fontSize: 10,
                          color: "#fff",
                          background: hasVotedForThis ? "var(--cc-primary, #0078d4)" : "transparent",
                        }}
                      >
                        {hasVotedForThis && "✓"}
                      </span>
                      <span className="fw-semibold" style={{ fontSize: "0.85rem", color: "var(--cc-text, #1b1b1b)" }}>
                        {opt.text}
                      </span>
                    </div>

                    <div className="d-flex align-items-center gap-2">
                      <span className="fw-bold" style={{ fontSize: "0.82rem", color: "var(--cc-text, #1b1b1b)" }}>
                        {pct}%
                      </span>
                      <span className="text-muted" style={{ fontSize: "0.74rem" }}>
                        ({optVotes})
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="d-flex align-items-center justify-content-between mt-2 pt-1">
            <small className="text-muted" style={{ fontSize: "0.72rem" }}>
              {user ? "Click an option to cast or toggle your vote" : "Log in to vote in this poll"}
            </small>
            {poll.closed && (
              <span className="badge bg-secondary" style={{ fontSize: "0.7rem" }}>
                Poll Ended
              </span>
            )}
          </div>
        </div>
      )}

      {/* Images */}
      {data.images?.length > 0 && (
        <div className="my-2">
          {isSingleImage ? (
            <img
              src={optimizedImageUrl(data.images[0], 1200)}
              alt="post"
              onClick={() => setPreviewImageIdx(0)}
              style={{
                width: "100%",
                maxHeight: 460,
                objectFit: "contain",
                background: "#000",
                borderRadius: 12,
                display: "block",
                margin: "0 auto",
                cursor: "pointer",
              }}
            />
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: data.images.length === 2 ? "1fr 1fr" : "repeat(auto-fit, minmax(180px, 1fr))",
                gap: 8,
              }}
            >
              {data.images.map((img, i) => (
                <img
                  key={i}
                  src={optimizedImageUrl(img, 800)}
                  alt="post"
                  onClick={() => setPreviewImageIdx(i)}
                  style={{
                    width: "100%",
                    height: 200,
                    objectFit: "cover",
                    borderRadius: 10,
                    cursor: "pointer",
                  }}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Code Blocks Carousel */}
      {data.codeBlocks?.length > 0 && (
        <div
          className="position-relative mt-3"
          style={{
            borderRadius: 10,
            overflow: "hidden",
            boxShadow: "0 4px 14px rgba(0,0,0,0.12)",
            border: "1px solid var(--cc-border, #d6dbe1)",
          }}
        >
          {/* Code Block Header */}
          <div
            className="d-flex justify-content-between align-items-center px-3 py-2"
            style={{
              background: "var(--cc-surface-muted, #f8fafc)",
              borderBottom: "1px solid var(--cc-border, #d6dbe1)",
            }}
          >
            <div className="d-flex align-items-center gap-2">
              <div
                style={{
                  background: "var(--cc-primary-soft, #e6f2fb)",
                  color: "var(--cc-primary, #0078d4)",
                  width: 28,
                  height: 28,
                  borderRadius: "50%",
                  display: "grid",
                  placeItems: "center",
                }}
              >
                <FaCode size={13} />
              </div>
              <span style={{ fontSize: 13, fontWeight: 700, color: "var(--cc-text)" }}>
                {data.codeBlocks[codeIndex].language}
              </span>
              {data.codeBlocks.length > 1 && (
                <span className="badge bg-light text-muted border" style={{ fontSize: 10 }}>
                  {codeIndex + 1} of {data.codeBlocks.length}
                </span>
              )}
            </div>

            {/* Actions: Run in Sandbox & Copy */}
            <div className="d-flex align-items-center gap-2">
              <button
                type="button"
                className="btn btn-sm btn-primary d-flex align-items-center gap-1 shadow-sm"
                onClick={() =>
                  setSandboxModal({
                    show: true,
                    code: data.codeBlocks[codeIndex].code,
                    language: data.codeBlocks[codeIndex].language,
                  })
                }
                style={{
                  fontSize: 12,
                  padding: "3px 10px",
                  borderRadius: 6,
                  fontWeight: 600,
                }}
                title="Run this code live in sandbox"
              >
                <FaPlay size={10} />
                <span>Run</span>
              </button>

              <button
                type="button"
                onClick={async () => {
                  await navigator.clipboard.writeText(data.codeBlocks[codeIndex].code);
                  setCopiedIdx(codeIndex);
                  setTimeout(() => setCopiedIdx(null), 1400);
                }}
                style={{
                  background: "var(--cc-surface, #ffffff)",
                  border: "1px solid var(--cc-border, #cbd5e1)",
                  borderRadius: 6,
                  height: 28,
                  padding: "0 8px",
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                  cursor: "pointer",
                  color: "var(--cc-text)",
                  fontSize: 12,
                }}
                title="Copy code to clipboard"
              >
                {copiedIdx === codeIndex ? (
                  <>
                    <FaCheck size={12} color="#16a34a" />
                    <span style={{ color: "#16a34a", fontWeight: 600 }}>Copied</span>
                  </>
                ) : (
                  <>
                    <FaCopy size={12} />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Carousel Arrows if multiple code blocks */}
          {data.codeBlocks.length > 1 && (
            <>
              <button
                type="button"
                onClick={() =>
                  setCodeIndex((prev) => (prev === 0 ? data.codeBlocks.length - 1 : prev - 1))
                }
                style={{
                  position: "absolute",
                  top: "50%",
                  left: 8,
                  transform: "translateY(-50%)",
                  zIndex: 5,
                  background: "var(--cc-surface, #ffffff)",
                  borderRadius: "50%",
                  border: "1px solid var(--cc-border)",
                  width: 30,
                  height: 30,
                  display: "grid",
                  placeItems: "center",
                  boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
                }}
              >
                <FaChevronLeft size={12} />
              </button>

              <button
                type="button"
                onClick={() =>
                  setCodeIndex((prev) => (prev === data.codeBlocks.length - 1 ? 0 : prev + 1))
                }
                style={{
                  position: "absolute",
                  top: "50%",
                  right: 8,
                  transform: "translateY(-50%)",
                  zIndex: 5,
                  background: "var(--cc-surface, #ffffff)",
                  borderRadius: "50%",
                  border: "1px solid var(--cc-border)",
                  width: 30,
                  height: 30,
                  display: "grid",
                  placeItems: "center",
                  boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
                }}
              >
                <FaChevronRight size={12} />
              </button>
            </>
          )}

          {/* CodeMirror View */}
          <CodeMirror
            value={data.codeBlocks[codeIndex].code}
            height="220px"
            extensions={[
              getLanguageExtension(data.codeBlocks[codeIndex].language),
              EditorView.theme({
                "&": { fontSize: "13.5px" },
                ".cm-scroller": { overflow: "auto" },
              }),
            ]}
            theme={theme === "dark" ? "dark" : "light"}
            readOnly
          />
        </div>
      )}
    </>
  );

  return (
    <>
      {/* FULL IMAGE LIGHTBOX MODAL */}
      {previewImageIdx !== null && post.images?.[previewImageIdx] && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            background: "rgba(0,0,0,0.92)",
            zIndex: 99999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          onClick={() => setPreviewImageIdx(null)}
        >
          {/* Close Button */}
          <button
            onClick={() => setPreviewImageIdx(null)}
            style={{
              position: "fixed",
              top: 20,
              right: 20,
              background: "#ffffff",
              borderRadius: "50%",
              width: 40,
              height: 40,
              display: "grid",
              placeItems: "center",
              border: "none",
              cursor: "pointer",
              zIndex: 100000,
            }}
          >
            <FaTimes size={18} />
          </button>

          {/* Download Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              downloadImage(post.images[previewImageIdx]);
            }}
            style={{
              position: "fixed",
              top: 20,
              right: 74,
              background: "#ffffff",
              borderRadius: "50%",
              width: 40,
              height: 40,
              display: "grid",
              placeItems: "center",
              border: "none",
              cursor: "pointer",
              zIndex: 100000,
            }}
          >
            <FaDownload size={18} />
          </button>

          {/* Previous / Next Arrows */}
          {post.images.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setPreviewImageIdx((prev) => (prev === 0 ? post.images.length - 1 : prev - 1));
                }}
                style={{
                  position: "fixed",
                  top: "50%",
                  left: 20,
                  transform: "translateY(-50%)",
                  background: "#ffffff",
                  borderRadius: "50%",
                  width: 44,
                  height: 44,
                  display: "grid",
                  placeItems: "center",
                  border: "none",
                  cursor: "pointer",
                  zIndex: 100000,
                }}
              >
                <FaChevronLeft size={18} />
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setPreviewImageIdx((prev) => (prev === post.images.length - 1 ? 0 : prev + 1));
                }}
                style={{
                  position: "fixed",
                  top: "50%",
                  right: 20,
                  transform: "translateY(-50%)",
                  background: "#ffffff",
                  borderRadius: "50%",
                  width: 44,
                  height: 44,
                  display: "grid",
                  placeItems: "center",
                  border: "none",
                  cursor: "pointer",
                  zIndex: 100000,
                }}
              >
                <FaChevronRight size={18} />
              </button>
            </>
          )}

          <img
            src={post.images[previewImageIdx]}
            alt="Preview"
            style={{
              maxWidth: "90%",
              maxHeight: "88%",
              objectFit: "contain",
              borderRadius: 8,
              boxShadow: "0 0 35px rgba(0,0,0,0.6)",
            }}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {/* MAIN POST CARD */}
      <div
        className={`card cc-post-card shadow-sm mb-3 border-0 rounded-4${embedded ? " cc-embedded-post" : ""}`}
        style={
          embedded
            ? {
                marginBottom: 0,
                border: "0",
                boxShadow: "none",
                background: "transparent",
              }
            : undefined
        }
      >
        <div className="card-body" style={embedded ? { padding: "0.75rem" } : undefined}>
          {/* Author Header */}
          <div className="d-flex align-items-start justify-content-between mb-2 gap-2">
            <div className="d-flex align-items-center">
              <img
                src={authorImage}
                alt="Profile"
                className="border me-2"
                style={{ width: 38, height: 38, objectFit: "cover", borderRadius: "50%" }}
              />

              <div className="d-flex flex-column">
                <Link
                  to={authorProfileLink}
                  className="fw-bold text-dark text-decoration-none"
                  style={{ fontSize: "0.92rem" }}
                >
                  {authorName}
                </Link>
                <time className="small text-muted" dateTime={post.createdAt || undefined} style={{ fontSize: "0.76rem" }}>
                  {formatDateTime(post.createdAt)}
                </time>
              </div>
            </div>

            {/* Owner dropdown menu */}
            {isOwner && (
              <div
                className="cc-post-owner-menu d-flex align-items-center flex-shrink-0 position-relative"
                onBlur={(event) => {
                  if (!event.currentTarget.contains(event.relatedTarget)) {
                    setShowOwnerMenu(false);
                  }
                }}
              >
                <button
                  type="button"
                  className="cc-post-owner-menu-trigger"
                  aria-label="Post options"
                  aria-haspopup="menu"
                  aria-expanded={showOwnerMenu}
                  onClick={() => setShowOwnerMenu((visible) => !visible)}
                >
                  <FaEllipsisV size={15} />
                </button>
                {showOwnerMenu && (
                  <div className="cc-post-owner-menu-items" role="menu">
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setShowOwnerMenu(false);
                        setShowEditModal(true);
                      }}
                    >
                      <FaEdit size={13} />
                      Edit
                    </button>
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setShowOwnerMenu(false);
                        handleDelete();
                      }}
                    >
                      <FaTrash size={13} />
                      Delete
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* POST CONTENT */}
          <PostContent data={post} />

          {/* ACTIVE REACTION PILLS (Shows all emojis that have >= 1 reactions) */}
          {totalReactionCount > 0 && (
            <div className="d-flex align-items-center gap-1 mt-3 flex-wrap">
              {REACTION_CONFIG.map(({ type, emoji }) => {
                const count = reactionCounts[type];
                if (!count) return null;
                const isSelected = myReaction === type;
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => handleReaction(type)}
                    className="btn btn-sm d-inline-flex align-items-center gap-1 border"
                    style={{
                      fontSize: "0.75rem",
                      padding: "2px 8px",
                      borderRadius: 16,
                      background: isSelected ? "var(--cc-primary-soft, #e6f2fb)" : "var(--cc-surface-muted, #f8fafc)",
                      borderColor: isSelected ? "var(--cc-primary, #0078d4)" : "var(--cc-border, #cbd5e1)",
                    }}
                    title={`React with ${emoji}`}
                  >
                    <span>{emoji}</span>
                    <span className="fw-bold">{count}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* ACTION BUTTONS BAR */}
          <div className="d-flex align-items-center justify-content-between mt-3 pt-2 border-top flex-wrap gap-2">
            <div className="d-flex align-items-center gap-2 position-relative">
              {/* Developer Reaction Button & Popover */}
              <div
                className="position-relative"
                onMouseEnter={() => setShowReactionPicker(true)}
                onMouseLeave={() => setShowReactionPicker(false)}
              >
                {/* Floating Reaction Popover */}
                {showReactionPicker && user && (
                  <div
                    className="position-absolute d-flex align-items-center gap-2 p-2 bg-white rounded-pill shadow-lg border"
                    style={{
                      bottom: "100%",
                      left: 0,
                      marginBottom: 8,
                      zIndex: 30,
                      animation: "fadeIn 0.15s ease",
                    }}
                  >
                    {REACTION_CONFIG.map(({ type, emoji, label }) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => handleReaction(type)}
                        className="btn btn-sm p-1 border-0"
                        style={{
                          fontSize: 20,
                          transform: myReaction === type ? "scale(1.25)" : "scale(1)",
                          transition: "transform 0.15s ease",
                        }}
                        title={label}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                )}

                <button
                  type="button"
                  className={`btn btn-sm d-flex align-items-center gap-2 border ${myReaction ? "btn-light" : "btn-light"}`}
                  onClick={() => handleReaction(myReaction || "like")}
                  style={{
                    borderRadius: 8,
                    fontWeight: 600,
                    borderColor: myReaction ? "var(--cc-primary, #0078d4)" : undefined,
                  }}
                  title={user ? "React to post" : "Sign in to react"}
                >
                  {myReaction ? (
                    <span>
                      {REACTION_CONFIG.find((r) => r.type === myReaction)?.emoji || "❤️"}
                    </span>
                  ) : (
                    <FaHeart color="#64748b" />
                  )}
                  <span>{totalReactionCount > 0 ? totalReactionCount : "React"}</span>
                </button>
              </div>

              {/* Comment Button */}
              <button
                type="button"
                className="btn btn-sm btn-light border d-flex align-items-center gap-2"
                onClick={() => setShowComments((v) => !v)}
                style={{ borderRadius: 8, fontWeight: 600 }}
              >
                <FaComment color="#64748b" />
                <span>{comments.length}</span>
              </button>

              {/* Repost Button */}
              {user && (
                <button
                  type="button"
                  className="btn btn-sm btn-light border d-flex align-items-center gap-2"
                  onClick={handleRepost}
                  style={{ borderRadius: 8, fontWeight: 600 }}
                  title="Repost to your feed"
                >
                  <FaShare color="#64748b" />
                  <span className="d-none d-sm-inline">Repost</span>
                </button>
              )}
            </div>

            {/* Bookmark Button */}
            {user && (
              <button
                type="button"
                className="btn btn-sm btn-light border d-flex align-items-center gap-1"
                onClick={handleBookmark}
                style={{
                  borderRadius: 8,
                  fontWeight: 600,
                  color: bookmarked ? "var(--cc-primary, #0078d4)" : "#64748b",
                }}
                title={bookmarked ? "Remove from bookmarks" : "Save post to bookmarks"}
              >
                {bookmarked ? <FaBookmark color="var(--cc-primary, #0078d4)" /> : <FaRegBookmark />}
                <span style={{ fontSize: "0.8rem" }}>{bookmarked ? "Saved" : "Save"}</span>
              </button>
            )}
          </div>

          {/* Nested Comments */}
          {showComments && (
            <div className="mt-3 pt-2">
              <CommentSection comments={comments} onComment={handleComment} user={user} />
            </div>
          )}
        </div>
      </div>

      {/* EDIT POST MODAL */}
      <PostFormModal
        show={showEditModal}
        onClose={() => setShowEditModal(false)}
        onPost={(updatedPost) => {
          setShowEditModal(false);
          onUpdate?.(updatedPost);
        }}
        post={post}
        title="Edit Post"
        submitLabel="Save Changes"
      />

      {/* CODE SANDBOX RUNNER MODAL */}
      <CodeSnippetSandboxModal
        show={sandboxModal.show}
        initialCode={sandboxModal.code}
        initialLanguage={sandboxModal.language}
        onClose={() => setSandboxModal({ show: false, code: "", language: "javascript" })}
      />
    </>
  );
}

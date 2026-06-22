import React, { useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/api";
import CommentSection from "./CommentSection";
import { EditorView } from "@codemirror/view";

import { javascript } from "@codemirror/lang-javascript";
import { python } from "@codemirror/lang-python";
import { java } from "@codemirror/lang-java";
import CodeMirror from "@uiw/react-codemirror";

import LikeButton from "../assets/thumbs-up-regular-full.svg";
import CommentButton from "../assets/comment-regular-full.svg";
import ShareButton from "../assets/share-nodes-solid-full.svg";

import {
  FaCode,
  FaCopy,
  FaCheck,
  FaChevronLeft,
  FaChevronRight,
  FaTimes,
  FaDownload,
} from "react-icons/fa";

const LANGUAGES = { javascript, python, java };

export default function PostCard({ post, user, onUpdate }) {
  const likesArray = Array.isArray(post.likes) ? post.likes : [];
  const [liked, setLiked] = useState(likesArray.includes(user?._id));
  const [likes, setLikes] = useState(
    typeof post.likes === "number" ? post.likes : likesArray.length
  );

  const [comments, setComments] = useState(post.comments || []);
  const [showComments, setShowComments] = useState(false);

  const [copiedIdx, setCopiedIdx] = useState(null);
  const [codeIndex, setCodeIndex] = useState(0);

  // IMAGE MODAL
  const [previewImage, setPreviewImage] = useState(null);

  const handleLike = async () => {
    try {
      let res;
      if (!liked) {
        res = await api.post(`/posts/${post._id}/like`);
        setLiked(true);
      } else {
        res = await api.post(`/posts/${post._id}/unlike`);
        setLiked(false);
      }
      setLikes(res.data.likes);

      onUpdate?.({ ...post, likes: res.data.likes });
    } catch (err) {
      console.error("Error liking:", err);
    }
  };

  const handleComment = async (text) => {
    const res = await api.post(`/posts/${post._id}/comment`, { text });
    setComments([...comments, res.data]);
    onUpdate?.({ ...post, comments: [...comments, res.data] });
  };

  const handleRepost = async () => {
    await api.post(`/posts/${post._id}/repost`);
  };

  const downloadImage = (url) => {
    const link = document.createElement("a");
    link.href = url;
    link.download = "post-image.jpg";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Single Image Rules
  const isSingleImage =
    !post.text && !post.codeBlocks?.length && post.images?.length === 1;

  const PostContent = ({ data }) => (
    <>
      {data.text && <p className="mb-2">{data.text}</p>}

      {/* Images */}
      {data.images?.length > 0 && (
        <div>
          {isSingleImage ? (
            <img
              src={data.images[0]}
              alt="post"
              onClick={() => setPreviewImage(data.images[0])}
              style={{
                width: "100%",
                height: 350,
                objectFit: "cover",
                borderRadius: 12,
                display: "block",
                margin: "0 auto",
                cursor: "pointer",
              }}
            />
          ) : (
            data.images.map((img, i) => (
              <img
                key={i}
                src={img}
                alt="post"
                onClick={() => setPreviewImage(img)}
                className="rounded mb-2"
                style={{
                  width: "100%",
                  maxHeight: 220,
                  objectFit: "cover",
                  borderRadius: 10,
                  cursor: "pointer",
                }}
              />
            ))
          )}
        </div>
      )}

      {/* CODE CAROUSEL */}
      {data.codeBlocks?.length > 0 && (
        <div
          className="position-relative"
          style={{
            borderRadius: 10,
            overflow: "hidden",
            boxShadow: "0 4px 10px rgba(0,0,0,0.15)",
            marginTop: 15,
          }}
        >
          {/* Header */}
          <div
            className="d-flex justify-content-between align-items-center px-3 py-2"
            style={{
              background: "var(--cc-surface-muted)",
              borderBottom: "1px solid var(--cc-border)",
            }}
          >
            <div className="d-flex align-items-center gap-2">
              <div
                style={{
                  background: "var(--cc-surface)",
                  width: 28,
                  height: 28,
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
                  color: "var(--cc-text)",
                }}
              >
                <FaCode size={14} />
              </div>

              <span style={{ fontSize: 13, fontWeight: 600, color: "var(--cc-text)" }}>
                {data.codeBlocks[codeIndex].language}
              </span>
            </div>

            {/* Copy button */}
            <button
              onClick={async () => {
                await navigator.clipboard.writeText(
                  data.codeBlocks[codeIndex].code
                );
                setCopiedIdx(codeIndex);
                setTimeout(() => setCopiedIdx(null), 1200);
              }}
              style={{
                background: "var(--cc-surface)",
                border: "1px solid var(--cc-border)",
                borderRadius: "50%",
                width: 30,
                height: 30,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                color: "var(--cc-text)",
              }}
            >
              {copiedIdx === codeIndex ? (
                <FaCheck size={14} color="green" />
              ) : (
                <FaCopy size={14} />
              )}
            </button>
          </div>

          {/* Arrow Left */}
          {data.codeBlocks.length > 1 && (
            <button
              onClick={() =>
                setCodeIndex((prev) =>
                  prev === 0 ? data.codeBlocks.length - 1 : prev - 1
                )
              }
              style={{
                position: "absolute",
                top: "45%",
                left: 10,
                zIndex: 5,
                background: "var(--cc-surface)",
                borderRadius: "50%",
                border: "1px solid var(--cc-border)",
                width: 32,
                height: 32,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--cc-text)",
              }}
            >
              <FaChevronLeft />
            </button>
          )}

          {/* CODE VIEW */}
          {/* <CodeMirror
            value={data.codeBlocks[codeIndex].code}
            height="220px"
            extensions={[LANGUAGES[data.codeBlocks[codeIndex].language]?.()]}
            theme="dark"
            readOnly
          /> */}

          <CodeMirror
            value={data.codeBlocks[codeIndex].code}
            height="220px"
            extensions={[
              LANGUAGES[data.codeBlocks[codeIndex].language]?.(),
              EditorView.theme({
                "&": {
                  fontSize: "14px",
                },

                ".cm-scroller": {
                  overflow: "auto",
                  scrollbarWidth: "thin",
                  scrollbarColor: "#6366f1 transparent",
                },

                ".cm-scroller::-webkit-scrollbar": {
                  width: "5px",
                  height: "5px",
                },

                ".cm-scroller::-webkit-scrollbar-track": {
                  background: "rgba(255,255,255,0.04)",
                  borderRadius: "10px",
                },

                ".cm-scroller::-webkit-scrollbar-thumb": {
                  background:
                    "linear-gradient(180deg, #8b5cf6 0%, #6366f1 50%, #3b82f6 100%)",
                  borderRadius: "10px",
                },

                ".cm-scroller::-webkit-scrollbar-thumb:hover": {
                  background:
                    "linear-gradient(180deg, #a855f7 0%, #7c3aed 50%, #2563eb 100%)",
                },

                ".cm-scroller::-webkit-scrollbar-corner": {
                  background: "transparent",
                },
              }),
            ]}
            theme="dark"
            readOnly
          />

          {/* Arrow Right */}
          {data.codeBlocks.length > 1 && (
            <button
              onClick={() =>
                setCodeIndex((prev) =>
                  prev === data.codeBlocks.length - 1 ? 0 : prev + 1
                )
              }
              style={{
                position: "absolute",
                top: "45%",
                right: 10,
                zIndex: 5,
                background: "var(--cc-surface)",
                borderRadius: "50%",
                border: "1px solid var(--cc-border)",
                width: 32,
                height: 32,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--cc-text)",
              }}
            >
              <FaChevronRight />
            </button>
          )}
        </div>
      )}
    </>
  );

  return (
    <>
      {/* FULL IMAGE VIEWER MODAL */}
      {previewImage && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            background: "rgba(0,0,0,0.85)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          onClick={() => setPreviewImage(null)}
        >
          {/* CLOSE BUTTON */}
          <button
            onClick={() => setPreviewImage(null)}
            style={{
              position: "fixed",
              top: 20,
              right: 20,
              background: "var(--cc-surface)",
              borderRadius: "50%",
              width: 38,
              height: 38,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "none",
              cursor: "pointer",
              boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
              color: "var(--cc-text)",
            }}
          >
            <FaTimes size={18} />
          </button>

          {/* DOWNLOAD BUTTON */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              downloadImage(previewImage);
            }}
            style={{
              position: "fixed",
              top: 20,
              right: 70,
              background: "var(--cc-surface)",
              borderRadius: "50%",
              width: 38,
              height: 38,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "none",
              cursor: "pointer",
              boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
              color: "var(--cc-text)",
            }}
          >
            <FaDownload size={18} />
          </button>

          <img
            src={previewImage}
            alt="Preview"
            style={{
              maxWidth: "90%",
              maxHeight: "90%",
              borderRadius: 12,
              boxShadow: "0 0 25px rgba(255,255,255,0.3)",
            }}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {/* MAIN CARD */}
      <div className="card shadow-sm mb-3 border-0 rounded-4">
        <div className="card-body">
          {/* Author */}
          <div className="d-flex align-items-center mb-2">
            <img
              src={
                post.author.profileImage ||
                "https://static.vecteezy.com/system/resources/previews/018/742/015/original/minimal-profile-account-symbol-user-interface-theme-3d-icon-rendering-illustration-isolated-in-transparent-background-png.png"
              }
              alt="Profile"
              className="rounded-circle border me-2"
              style={{ width: 36, height: 36, objectFit: "cover" }}
            />

            <Link
              to={`/profile/${post.author._id}`}
              className="fw-bold text-dark text-decoration-none"
            >
              {post.author.name || post.author.username}
            </Link>
          </div>

          {/* CONTENT */}
          <PostContent data={post} />

          {/* ACTION BUTTONS */}
          <div
            className="d-flex justify-content-center gap-4 mt-3"
            style={{ fontSize: 14 }}
          >
            <div
              className="d-flex align-items-center gap-1"
              onClick={handleLike}
              style={{ cursor: "pointer" }}
            >
              <img
                src={LikeButton}
                alt="like"
                style={{
                  height: 22,
                  filter: liked ? "drop-shadow(0 0 2px green)" : "none",
                }}
              />
              {likes}
            </div>

            <div
              className="d-flex align-items-center gap-1"
              onClick={() => setShowComments((v) => !v)}
              style={{ cursor: "pointer" }}
            >
              <img src={CommentButton} alt="comment" style={{ height: 22 }} />
              {comments.length}
            </div>

            <div
              className="d-flex align-items-center gap-1"
              onClick={handleRepost}
              style={{ cursor: "pointer" }}
            >
              <img src={ShareButton} alt="share" style={{ height: 22 }} />
            </div>
          </div>

          {showComments && (
            <CommentSection comments={comments} onComment={handleComment} />
          )}
        </div>
      </div>
    </>
  );
}

import React from "react";
import "./DashboardSkeleton.css";

/**
 * Individual post skeleton matching PostCard.jsx layout
 */
export function PostSkeleton({ variant = "standard" }) {
  // variant: "standard" | "code" | "image"
  return (
    <div className="card cc-post-card cc-skeleton-card shadow-sm mb-3 border-0 rounded-4">
      <div className="card-body p-3">
        {/* Author Header */}
        <div className="d-flex align-items-center justify-content-between mb-3">
          <div className="d-flex align-items-center gap-2">
            {/* Avatar circle */}
            <div
              className="cc-skeleton-shimmer cc-skeleton-avatar"
              style={{ width: 42, height: 42 }}
            />
            {/* Name + Subtitle lines */}
            <div className="d-flex flex-column gap-1">
              <div
                className="cc-skeleton-shimmer cc-skeleton-line"
                style={{ width: 130, height: 13 }}
              />
              <div
                className="cc-skeleton-shimmer cc-skeleton-line"
                style={{ width: 90, height: 10, opacity: 0.7 }}
              />
            </div>
          </div>
          {/* Top-right menu dot */}
          <div
            className="cc-skeleton-shimmer cc-skeleton-line"
            style={{ width: 20, height: 20, borderRadius: 4, opacity: 0.5 }}
          />
        </div>

        {/* Post Text Paragraphs */}
        <div className="d-flex flex-column gap-2 mb-3">
          <div
            className="cc-skeleton-shimmer cc-skeleton-line"
            style={{ width: "98%", height: 13 }}
          />
          <div
            className="cc-skeleton-shimmer cc-skeleton-line"
            style={{ width: "88%", height: 13 }}
          />
          <div
            className="cc-skeleton-shimmer cc-skeleton-line"
            style={{ width: variant === "standard" ? "62%" : "78%", height: 13 }}
          />
        </div>

        {/* Optional Code Block Variant */}
        {variant === "code" && (
          <div className="cc-skeleton-codeblock mb-3">
            <div className="cc-skeleton-codeheader d-flex align-items-center justify-content-between px-3">
              <div className="d-flex align-items-center gap-2">
                <div
                  className="cc-skeleton-shimmer cc-skeleton-avatar"
                  style={{ width: 20, height: 20 }}
                />
                <div
                  className="cc-skeleton-shimmer cc-skeleton-line"
                  style={{ width: 80, height: 10 }}
                />
              </div>
              <div
                className="cc-skeleton-shimmer cc-skeleton-line"
                style={{ width: 50, height: 12, borderRadius: 4 }}
              />
            </div>
            <div className="p-3 d-flex flex-column gap-2" style={{ minHeight: 140 }}>
              <div
                className="cc-skeleton-shimmer cc-skeleton-line"
                style={{ width: "45%", height: 11 }}
              />
              <div
                className="cc-skeleton-shimmer cc-skeleton-line"
                style={{ width: "70%", height: 11, marginLeft: 16 }}
              />
              <div
                className="cc-skeleton-shimmer cc-skeleton-line"
                style={{ width: "60%", height: 11, marginLeft: 16 }}
              />
              <div
                className="cc-skeleton-shimmer cc-skeleton-line"
                style={{ width: "85%", height: 11, marginLeft: 32 }}
              />
              <div
                className="cc-skeleton-shimmer cc-skeleton-line"
                style={{ width: "30%", height: 11 }}
              />
            </div>
          </div>
        )}

        {/* Optional Image Variant */}
        {variant === "image" && (
          <div
            className="cc-skeleton-shimmer mb-3"
            style={{
              width: "100%",
              height: 220,
              borderRadius: 10,
              border: "1px solid var(--cc-border, #d6dbe1)",
            }}
          />
        )}

        {/* Tags pills */}
        <div className="d-flex flex-wrap gap-2 mb-3">
          <div
            className="cc-skeleton-shimmer cc-skeleton-pill"
            style={{ width: 68, height: 22 }}
          />
          <div
            className="cc-skeleton-shimmer cc-skeleton-pill"
            style={{ width: 84, height: 22 }}
          />
          <div
            className="cc-skeleton-shimmer cc-skeleton-pill"
            style={{ width: 54, height: 22 }}
          />
        </div>

        {/* Action Bar (Like, Comment, Repost, Bookmark) */}
        <div
          className="d-flex align-items-center justify-content-between pt-2 border-top"
          style={{ borderColor: "var(--cc-border, #d6dbe1)" }}
        >
          <div className="d-flex align-items-center gap-4">
            <div className="d-flex align-items-center gap-2">
              <div
                className="cc-skeleton-shimmer cc-skeleton-avatar"
                style={{ width: 18, height: 18 }}
              />
              <div
                className="cc-skeleton-shimmer cc-skeleton-line"
                style={{ width: 34, height: 10 }}
              />
            </div>
            <div className="d-flex align-items-center gap-2">
              <div
                className="cc-skeleton-shimmer cc-skeleton-avatar"
                style={{ width: 18, height: 18 }}
              />
              <div
                className="cc-skeleton-shimmer cc-skeleton-line"
                style={{ width: 44, height: 10 }}
              />
            </div>
            <div className="d-flex align-items-center gap-2">
              <div
                className="cc-skeleton-shimmer cc-skeleton-avatar"
                style={{ width: 18, height: 18 }}
              />
              <div
                className="cc-skeleton-shimmer cc-skeleton-line"
                style={{ width: 38, height: 10 }}
              />
            </div>
          </div>
          <div
            className="cc-skeleton-shimmer cc-skeleton-line"
            style={{ width: 18, height: 18, borderRadius: 4 }}
          />
        </div>
      </div>
    </div>
  );
}

/**
 * Staggered feed skeleton simulating a live timeline
 */
export function FeedSkeleton({ count = 3 }) {
  const variants = ["standard", "code", "image", "standard"];
  return (
    <div className="cc-feed-skeleton-container" aria-label="Loading posts" role="status">
      {Array.from({ length: count }).map((_, idx) => (
        <PostSkeleton key={idx} variant={variants[idx % variants.length]} />
      ))}
    </div>
  );
}

/**
 * Suggested Peers / Right Sidebar Skeleton
 */
export function PeerSkeleton({ count = 5 }) {
  return (
    <div className="d-flex flex-column gap-3 p-2" role="status" aria-label="Loading peers">
      {Array.from({ length: count }).map((_, idx) => (
        <div key={idx} className="d-flex align-items-center justify-content-between gap-2">
          <div className="d-flex align-items-center gap-2">
            <div
              className="cc-skeleton-shimmer cc-skeleton-avatar"
              style={{ width: 36, height: 36 }}
            />
            <div className="d-flex flex-column gap-1">
              <div
                className="cc-skeleton-shimmer cc-skeleton-line"
                style={{ width: 95, height: 12 }}
              />
              <div
                className="cc-skeleton-shimmer cc-skeleton-line"
                style={{ width: 68, height: 10, opacity: 0.7 }}
              />
            </div>
          </div>
          <div
            className="cc-skeleton-shimmer cc-skeleton-line"
            style={{ width: 30, height: 28, borderRadius: 6 }}
          />
        </div>
      ))}
    </div>
  );
}

/**
 * Left Sidebar Profile Skeleton
 */
export function LeftProfileSkeleton() {
  return (
    <div className="card cc-skeleton-card shadow-sm border-0 mb-3" role="status">
      {/* Banner */}
      <div
        className="cc-skeleton-shimmer"
        style={{ height: 80, width: "100%" }}
      />
      <div className="card-body text-center p-3" style={{ marginTop: -40 }}>
        {/* Center avatar */}
        <div
          className="cc-skeleton-shimmer cc-skeleton-avatar mx-auto mb-2"
          style={{ width: 72, height: 72, border: "3px solid var(--cc-surface, #ffffff)" }}
        />
        <div
          className="cc-skeleton-shimmer cc-skeleton-line mx-auto mb-1"
          style={{ width: 120, height: 14 }}
        />
        <div
          className="cc-skeleton-shimmer cc-skeleton-line mx-auto mb-2"
          style={{ width: 80, height: 10, opacity: 0.7 }}
        />
        <div
          className="cc-skeleton-shimmer cc-skeleton-pill mx-auto mb-3"
          style={{ width: 90, height: 20 }}
        />
        <div
          className="cc-skeleton-shimmer cc-skeleton-line mx-auto mb-3"
          style={{ width: "100%", height: 34, borderRadius: 6 }}
        />
      </div>
    </div>
  );
}

export default FeedSkeleton;


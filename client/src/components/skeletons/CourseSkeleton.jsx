import React from "react";
import "./CourseSkeleton.css";

/**
 * Skeleton for the 4 Top Metric Stat Cards on Course Catalog
 */
export function CourseStatsSkeleton() {
  return (
    <div className="cc-courses-stat-grid" aria-hidden="true">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="cc-skeleton-stat">
          <div className="d-flex align-items-center justify-content-between">
            <div
              className="cc-skeleton-shimmer cc-skeleton-pill"
              style={{ width: "28px", height: "28px" }}
            />
            <div
              className="cc-skeleton-shimmer cc-skeleton-line"
              style={{ width: "45px", height: "12px" }}
            />
          </div>
          <div
            className="cc-skeleton-shimmer cc-skeleton-line"
            style={{ width: "70px", height: "11px", marginTop: "4px" }}
          />
          <div
            className="cc-skeleton-shimmer cc-skeleton-line"
            style={{ width: "48px", height: "26px", margin: "4px 0" }}
          />
          <div
            className="cc-skeleton-shimmer cc-skeleton-line"
            style={{ width: "95px", height: "11px" }}
          />
        </div>
      ))}
    </div>
  );
}

/**
 * Skeleton for a single Course Card in the Course Grid
 */
export function CourseCardSkeleton() {
  return (
    <div className="cc-skeleton-course-card" aria-hidden="true">
      {/* Thumbnail Cover */}
      <div className="cc-skeleton-course-cover cc-skeleton-shimmer">
        <div className="cc-skeleton-course-badge cc-skeleton-shimmer" />
      </div>

      {/* Card Body */}
      <div className="cc-skeleton-course-body">
        {/* Title (2 lines) */}
        <div
          className="cc-skeleton-shimmer cc-skeleton-line"
          style={{ width: "88%", height: "20px" }}
        />
        <div
          className="cc-skeleton-shimmer cc-skeleton-line"
          style={{ width: "55%", height: "18px", marginTop: "-4px" }}
        />

        {/* Description (2 lines) */}
        <div
          className="cc-skeleton-shimmer cc-skeleton-line"
          style={{ width: "100%", height: "13px", marginTop: "4px" }}
        />
        <div
          className="cc-skeleton-shimmer cc-skeleton-line"
          style={{ width: "80%", height: "13px" }}
        />

        {/* Meta Row: Modules count & Duration pills */}
        <div className="cc-skeleton-course-meta-row">
          <div
            className="cc-skeleton-shimmer cc-skeleton-pill"
            style={{ width: "85px", height: "22px" }}
          />
          <div
            className="cc-skeleton-shimmer cc-skeleton-pill"
            style={{ width: "110px", height: "22px" }}
          />
        </div>

        {/* Action Button */}
        <div
          className="cc-skeleton-shimmer cc-skeleton-line"
          style={{ width: "100%", height: "36px", borderRadius: "6px", marginTop: "6px" }}
        />
      </div>
    </div>
  );
}

/**
 * Skeleton for the Course Grid (renders N card skeletons)
 */
export function CourseGridSkeleton({ count = 6 }) {
  return (
    <div className="cc-courses-grid" aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => (
        <CourseCardSkeleton key={i} />
      ))}
    </div>
  );
}

/**
 * Skeleton for CourseDetail / Curriculum Learning Canvas
 */
export function CourseDetailSkeleton() {
  return (
    <div className="cc-courses-shell" aria-hidden="true">
      {/* ── Page Heading Skeleton ── */}
      <div className="cc-courses-heading">
        <div style={{ flex: 1 }}>
          <div
            className="cc-skeleton-shimmer cc-skeleton-line"
            style={{ width: "140px", height: "12px", marginBottom: "8px" }}
          />
          <div
            className="cc-skeleton-shimmer cc-skeleton-line"
            style={{ width: "60%", height: "32px", marginBottom: "10px" }}
          />
          <div
            className="cc-skeleton-shimmer cc-skeleton-line"
            style={{ width: "75%", height: "14px" }}
          />
        </div>
        <div className="d-flex align-items-center gap-2 flex-wrap">
          <div
            className="cc-skeleton-shimmer cc-skeleton-line"
            style={{ width: "100px", height: "34px", borderRadius: "6px" }}
          />
          <div
            className="cc-skeleton-shimmer cc-skeleton-line"
            style={{ width: "110px", height: "34px", borderRadius: "6px" }}
          />
        </div>
      </div>

      {/* ── Track Overview Bar Skeleton ── */}
      <div className="cc-skeleton-track-bar">
        <div
          className="cc-skeleton-shimmer cc-course-track-thumb"
          style={{ width: "72px", height: "72px", borderRadius: "8px", flexShrink: 0 }}
        />
        <div className="cc-course-track-details">
          <div className="cc-course-track-meta">
            <div
              className="cc-skeleton-shimmer cc-skeleton-pill"
              style={{ width: "90px", height: "24px" }}
            />
            <div
              className="cc-skeleton-shimmer cc-skeleton-pill"
              style={{ width: "80px", height: "24px" }}
            />
            <div
              className="cc-skeleton-shimmer cc-skeleton-pill"
              style={{ width: "120px", height: "24px" }}
            />
            <div
              className="cc-skeleton-shimmer cc-skeleton-pill"
              style={{ width: "100px", height: "24px" }}
            />
          </div>
          <div className="cc-course-track-progress">
            <div
              className="cc-skeleton-shimmer cc-skeleton-line"
              style={{ flex: 1, height: "7px", borderRadius: "999px" }}
            />
            <div
              className="cc-skeleton-shimmer cc-skeleton-line"
              style={{ width: "80px", height: "14px" }}
            />
          </div>
        </div>
        <div className="d-flex align-items-center gap-2">
          <div
            className="cc-skeleton-shimmer cc-skeleton-line"
            style={{ width: "130px", height: "36px", borderRadius: "6px" }}
          />
        </div>
      </div>

      {/* ── Learning Grid (Sidebar + Content Card) ── */}
      <div className="cc-course-learning-grid">
        {/* Left / Sidebar Syllabus Skeleton */}
        <aside className="cc-courses-card cc-course-syllabus-card">
          <div className="cc-courses-section-title">
            <div
              className="cc-skeleton-shimmer cc-skeleton-line"
              style={{ width: "120px", height: "16px" }}
            />
            <div
              className="cc-skeleton-shimmer cc-skeleton-line"
              style={{ width: "60px", height: "12px" }}
            />
          </div>

          {/* Filter tabs skeleton */}
          <div className="cc-course-syllabus-filter-tabs">
            <div
              className="cc-skeleton-shimmer cc-skeleton-pill"
              style={{ flex: 1, height: "28px" }}
            />
            <div
              className="cc-skeleton-shimmer cc-skeleton-pill"
              style={{ flex: 1, height: "28px" }}
            />
            <div
              className="cc-skeleton-shimmer cc-skeleton-pill"
              style={{ flex: 1, height: "28px" }}
            />
          </div>

          {/* Search box skeleton */}
          <div className="cc-course-syllabus-search">
            <div
              className="cc-skeleton-shimmer cc-skeleton-line"
              style={{ width: "100%", height: "34px", borderRadius: "6px" }}
            />
          </div>

          {/* Modules / Topics Accordion Skeleton */}
          <div className="cc-course-syllabus-list">
            {[1, 2, 3, 4].map((modIdx) => (
              <div key={modIdx} className="cc-skeleton-syllabus-module">
                <div className="cc-skeleton-syllabus-module-header">
                  <div
                    className="cc-skeleton-shimmer cc-skeleton-line"
                    style={{ width: `${60 + (modIdx % 3) * 15}%`, height: "14px" }}
                  />
                  <div
                    className="cc-skeleton-shimmer cc-skeleton-line"
                    style={{ width: "14px", height: "14px" }}
                  />
                </div>
                {/* 2-3 Subtopics inside each module */}
                <div style={{ padding: "4px 0" }}>
                  {[1, 2, 3].map((subIdx) => (
                    <div key={subIdx} className="cc-skeleton-subtopic-row">
                      <div
                        className="cc-skeleton-shimmer cc-skeleton-avatar"
                        style={{ width: "8px", height: "8px" }}
                      />
                      <div
                        className="cc-skeleton-shimmer cc-skeleton-line"
                        style={{
                          width: `${50 + ((modIdx + subIdx) % 4) * 12}%`,
                          height: "12px",
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </aside>

        {/* Right / Main Workspace Content Skeleton */}
        <main className="cc-courses-card cc-course-content-card">
          {/* Header */}
          <div className="cc-skeleton-content-header">
            <div style={{ flex: 1 }}>
              <div className="d-flex align-items-center gap-2 mb-2">
                <div
                  className="cc-skeleton-shimmer cc-skeleton-pill"
                  style={{ width: "110px", height: "20px" }}
                />
                <div
                  className="cc-skeleton-shimmer cc-skeleton-line"
                  style={{ width: "70px", height: "12px" }}
                />
              </div>
              <div
                className="cc-skeleton-shimmer cc-skeleton-line"
                style={{ width: "75%", height: "26px", marginBottom: "12px" }}
              />
              <div className="d-flex align-items-center gap-3">
                <div
                  className="cc-skeleton-shimmer cc-skeleton-pill"
                  style={{ width: "95px", height: "22px" }}
                />
                <div
                  className="cc-skeleton-shimmer cc-skeleton-pill"
                  style={{ width: "105px", height: "22px" }}
                />
                <div
                  className="cc-skeleton-shimmer cc-skeleton-pill"
                  style={{ width: "65px", height: "22px" }}
                />
              </div>
            </div>
            <div className="d-flex flex-column align-items-end gap-2">
              <div
                className="cc-skeleton-shimmer cc-skeleton-line"
                style={{ width: "100px", height: "12px" }}
              />
              <div
                className="cc-skeleton-shimmer cc-skeleton-line"
                style={{ width: "120px", height: "32px", borderRadius: "6px" }}
              />
            </div>
          </div>

          {/* Lesson Body Paragraphs */}
          <div className="d-flex flex-column gap-2 mb-4">
            <div
              className="cc-skeleton-shimmer cc-skeleton-line"
              style={{ width: "100%", height: "14px" }}
            />
            <div
              className="cc-skeleton-shimmer cc-skeleton-line"
              style={{ width: "96%", height: "14px" }}
            />
            <div
              className="cc-skeleton-shimmer cc-skeleton-line"
              style={{ width: "88%", height: "14px" }}
            />
            <div
              className="cc-skeleton-shimmer cc-skeleton-line"
              style={{ width: "92%", height: "14px" }}
            />
            <div
              className="cc-skeleton-shimmer cc-skeleton-line"
              style={{ width: "65%", height: "14px" }}
            />
          </div>

          {/* Code Block Container Placeholder */}
          <div className="cc-skeleton-code-editor">
            <div className="cc-skeleton-code-editor-header">
              <div className="cc-skeleton-code-editor-dots">
                <span className="cc-skeleton-code-editor-dot" />
                <span className="cc-skeleton-code-editor-dot" />
                <span className="cc-skeleton-code-editor-dot" />
              </div>
              <div
                className="cc-skeleton-shimmer cc-skeleton-pill"
                style={{ width: "60px", height: "18px" }}
              />
              <div
                className="cc-skeleton-shimmer cc-skeleton-pill"
                style={{ width: "50px", height: "20px" }}
              />
            </div>
            <div className="cc-skeleton-code-editor-body">
              <div
                className="cc-skeleton-shimmer cc-skeleton-line"
                style={{ width: "45%", height: "13px" }}
              />
              <div
                className="cc-skeleton-shimmer cc-skeleton-line"
                style={{ width: "70%", height: "13px" }}
              />
              <div
                className="cc-skeleton-shimmer cc-skeleton-line"
                style={{ width: "62%", height: "13px" }}
              />
              <div
                className="cc-skeleton-shimmer cc-skeleton-line"
                style={{ width: "85%", height: "13px" }}
              />
              <div
                className="cc-skeleton-shimmer cc-skeleton-line"
                style={{ width: "50%", height: "13px" }}
              />
              <div
                className="cc-skeleton-shimmer cc-skeleton-line"
                style={{ width: "35%", height: "13px" }}
              />
            </div>
          </div>

          {/* More paragraph lines */}
          <div className="d-flex flex-column gap-2 my-4">
            <div
              className="cc-skeleton-shimmer cc-skeleton-line"
              style={{ width: "98%", height: "14px" }}
            />
            <div
              className="cc-skeleton-shimmer cc-skeleton-line"
              style={{ width: "90%", height: "14px" }}
            />
            <div
              className="cc-skeleton-shimmer cc-skeleton-line"
              style={{ width: "78%", height: "14px" }}
            />
          </div>

          {/* Bottom Navigation Buttons */}
          <div
            className="d-flex align-items-center justify-content-between pt-4 mt-auto"
            style={{ borderTop: "1px solid var(--cc-border, #e2e8f0)" }}
          >
            <div
              className="cc-skeleton-shimmer cc-skeleton-line"
              style={{ width: "120px", height: "36px", borderRadius: "6px" }}
            />
            <div
              className="cc-skeleton-shimmer cc-skeleton-line"
              style={{ width: "130px", height: "36px", borderRadius: "6px" }}
            />
            <div
              className="cc-skeleton-shimmer cc-skeleton-line"
              style={{ width: "120px", height: "36px", borderRadius: "6px" }}
            />
          </div>
        </main>
      </div>
    </div>
  );
}

/**
 * Skeleton for EnrollCourse Page
 */
export function EnrollCourseSkeleton() {
  return (
    <div className="cc-courses-shell" aria-hidden="true">
      {/* Heading Skeleton */}
      <div className="cc-courses-heading">
        <div style={{ flex: 1 }}>
          <div
            className="cc-skeleton-shimmer cc-skeleton-line"
            style={{ width: "160px", height: "12px", marginBottom: "8px" }}
          />
          <div
            className="cc-skeleton-shimmer cc-skeleton-line"
            style={{ width: "55%", height: "30px", marginBottom: "8px" }}
          />
          <div
            className="cc-skeleton-shimmer cc-skeleton-line"
            style={{ width: "70%", height: "14px" }}
          />
        </div>
        <div
          className="cc-skeleton-shimmer cc-skeleton-line"
          style={{ width: "130px", height: "36px", borderRadius: "6px" }}
        />
      </div>

      {/* Two Column Card Skeleton */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: "24px",
          marginTop: "16px",
        }}
      >
        {/* Left Column: Course Preview */}
        <div className="cc-skeleton-course-card">
          <div
            className="cc-skeleton-shimmer"
            style={{ height: "200px", width: "100%" }}
          />
          <div className="p-4 d-flex flex-column gap-3">
            <div
              className="cc-skeleton-shimmer cc-skeleton-line"
              style={{ width: "80%", height: "22px" }}
            />
            <div
              className="cc-skeleton-shimmer cc-skeleton-line"
              style={{ width: "95%", height: "14px" }}
            />
            <div
              className="cc-skeleton-shimmer cc-skeleton-line"
              style={{ width: "65%", height: "14px" }}
            />

            <div className="d-flex gap-2 mt-2">
              <div
                className="cc-skeleton-shimmer cc-skeleton-pill"
                style={{ width: "90px", height: "24px" }}
              />
              <div
                className="cc-skeleton-shimmer cc-skeleton-pill"
                style={{ width: "110px", height: "24px" }}
              />
              <div
                className="cc-skeleton-shimmer cc-skeleton-pill"
                style={{ width: "110px", height: "24px" }}
              />
            </div>

            <div className="d-flex flex-column gap-2 mt-3 pt-3" style={{ borderTop: "1px solid var(--cc-border, #e2e8f0)" }}>
              {[1, 2, 3].map((i) => (
                <div key={i} className="d-flex align-items-center gap-2">
                  <div
                    className="cc-skeleton-shimmer cc-skeleton-avatar"
                    style={{ width: "14px", height: "14px" }}
                  />
                  <div
                    className="cc-skeleton-shimmer cc-skeleton-line"
                    style={{ width: `${60 + i * 10}%`, height: "13px" }}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Enrollment Form */}
        <div className="cc-skeleton-course-card p-4 d-flex flex-column gap-4">
          <div
            className="cc-skeleton-shimmer cc-skeleton-line"
            style={{ width: "50%", height: "20px" }}
          />

          {/* Student ID box */}
          <div
            className="p-3"
            style={{
              background: "var(--cc-surface-muted, #f8fafc)",
              border: "1px dashed var(--cc-border, #cbd5e1)",
              borderRadius: "8px",
            }}
          >
            <div
              className="cc-skeleton-shimmer cc-skeleton-line"
              style={{ width: "60%", height: "14px", marginBottom: "8px" }}
            />
            <div
              className="cc-skeleton-shimmer cc-skeleton-line"
              style={{ width: "100%", height: "36px", borderRadius: "6px" }}
            />
          </div>

          {/* Presets */}
          <div>
            <div
              className="cc-skeleton-shimmer cc-skeleton-line"
              style={{ width: "40%", height: "14px", marginBottom: "10px" }}
            />
            <div className="d-flex gap-2 flex-wrap">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="cc-skeleton-shimmer cc-skeleton-pill"
                  style={{ width: "68px", height: "32px" }}
                />
              ))}
            </div>
          </div>

          {/* Submit button */}
          <div
            className="cc-skeleton-shimmer cc-skeleton-line mt-auto"
            style={{ width: "100%", height: "42px", borderRadius: "6px" }}
          />
        </div>
      </div>
    </div>
  );
}


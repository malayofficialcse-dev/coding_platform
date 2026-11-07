import React from "react";
import "./ProfileSkeleton.css";

/**
 * 1. Profile Identity Card Skeleton (Sidebar)
 */
export function ProfileIdentitySkeleton() {
  return (
    <section className="cc-profile-card cc-profile-identity" aria-hidden="true">
      {/* Cover Banner */}
      <div className="cc-profile-cover cc-skeleton-shimmer" style={{ height: "72px" }} />

      {/* Avatar Wrap */}
      <div className="cc-profile-avatar-wrap">
        <div
          className="cc-skeleton-shimmer cc-skeleton-avatar"
          style={{ width: "104px", height: "104px", border: "4px solid var(--cc-surface, #fff)" }}
        />
      </div>

      {/* Body */}
      <div className="cc-profile-identity-body">
        {/* Name */}
        <div
          className="cc-skeleton-shimmer cc-skeleton-line"
          style={{ width: "60%", height: "20px", margin: "0 auto 6px" }}
        />
        {/* Handle */}
        <div
          className="cc-skeleton-shimmer cc-skeleton-line"
          style={{ width: "35%", height: "13px", margin: "0 auto 4px" }}
        />
        {/* Email */}
        <div
          className="cc-skeleton-shimmer cc-skeleton-line"
          style={{ width: "50%", height: "12px", margin: "0 auto 10px" }}
        />
        {/* Role Pill */}
        <div
          className="cc-skeleton-shimmer cc-skeleton-pill"
          style={{ width: "80px", height: "22px", margin: "0 auto 12px" }}
        />

        {/* Bio Paragraph */}
        <div
          style={{
            padding: "12px",
            background: "var(--cc-surface-muted, #f5f7fa)",
            borderRadius: "4px",
            margin: "12px 0",
            display: "flex",
            flexDirection: "column",
            gap: "6px",
          }}
        >
          <div className="cc-skeleton-shimmer cc-skeleton-line" style={{ width: "100%", height: "12px" }} />
          <div className="cc-skeleton-shimmer cc-skeleton-line" style={{ width: "90%", height: "12px" }} />
          <div className="cc-skeleton-shimmer cc-skeleton-line" style={{ width: "65%", height: "12px" }} />
        </div>

        {/* Action Buttons */}
        <div className="cc-profile-actions">
          <div className="cc-skeleton-shimmer cc-skeleton-line" style={{ width: "100%", height: "32px", borderRadius: "4px" }} />
          <div className="cc-skeleton-shimmer cc-skeleton-line" style={{ width: "100%", height: "32px", borderRadius: "4px" }} />
        </div>
      </div>
    </section>
  );
}

/**
 * 2. Verified Specialties Card Skeleton (Sidebar)
 */
export function ProfileSpecialtiesSkeleton() {
  return (
    <section className="cc-profile-card cc-profile-specialties" aria-hidden="true">
      <div className="cc-profile-section-title">
        <div className="cc-skeleton-shimmer cc-skeleton-line" style={{ width: "130px", height: "16px" }} />
        <div className="cc-skeleton-shimmer cc-skeleton-line" style={{ width: "80px", height: "11px" }} />
      </div>
      <div className="cc-profile-tags">
        {[110, 130, 95, 120].map((width, i) => (
          <div
            key={i}
            className="cc-skeleton-shimmer cc-skeleton-pill"
            style={{ width: `${width}px`, height: "28px" }}
          />
        ))}
      </div>
    </section>
  );
}

/**
 * 3. Campus Graph Reach Card Skeleton (Sidebar)
 */
export function ProfileGraphReachSkeleton() {
  return (
    <section className="cc-profile-card" style={{ marginTop: "1rem" }} aria-hidden="true">
      <div className="cc-profile-section-title">
        <div className="cc-skeleton-shimmer cc-skeleton-line" style={{ width: "140px", height: "16px" }} />
        <div className="cc-skeleton-shimmer cc-skeleton-line" style={{ width: "110px", height: "11px" }} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", padding: "12px 14px" }}>
        {[1, 2].map((i) => (
          <div
            key={i}
            style={{
              background: "var(--cc-surface-muted, #f8fafc)",
              padding: "12px 10px",
              borderRadius: "8px",
              border: "1px solid var(--cc-border, #e2e8f0)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <div className="cc-skeleton-shimmer cc-skeleton-line" style={{ width: "40px", height: "24px" }} />
            <div className="cc-skeleton-shimmer cc-skeleton-line" style={{ width: "80px", height: "10px" }} />
          </div>
        ))}
      </div>
    </section>
  );
}

/**
 * 4. Network Card Skeleton (Sidebar)
 */
export function ProfileNetworkSkeleton() {
  return (
    <section className="cc-profile-card cc-profile-network" aria-hidden="true">
      <div className="cc-profile-tabs">
        <div style={{ padding: "11px 16px", display: "flex", justifyContent: "center" }}>
          <div className="cc-skeleton-shimmer cc-skeleton-line" style={{ width: "80px", height: "14px" }} />
        </div>
        <div style={{ padding: "11px 16px", display: "flex", justifyContent: "center" }}>
          <div className="cc-skeleton-shimmer cc-skeleton-line" style={{ width: "80px", height: "14px" }} />
        </div>
      </div>
      <div className="cc-profile-people">
        {[1, 2, 3, 4].map((i) => (
          <div key={i}>
            <div
              className="cc-skeleton-shimmer cc-skeleton-avatar"
              style={{ width: "28px", height: "28px" }}
            />
            <div className="cc-skeleton-shimmer cc-skeleton-line" style={{ width: "65%", height: "12px" }} />
            <div
              className="cc-skeleton-shimmer cc-skeleton-pill"
              style={{ width: "55px", height: "22px" }}
            />
          </div>
        ))}
      </div>
    </section>
  );
}

/**
 * 5. Engineering Metrics Card Skeleton (Main)
 */
export function ProfileMetricsSkeleton() {
  return (
    <section className="cc-profile-card cc-profile-metrics" aria-hidden="true">
      <div className="cc-profile-section-title">
        <div>
          <div className="cc-skeleton-shimmer cc-skeleton-line" style={{ width: "240px", height: "16px", marginBottom: "4px" }} />
          <div className="cc-skeleton-shimmer cc-skeleton-line" style={{ width: "160px", height: "11px" }} />
        </div>
        <div className="cc-skeleton-shimmer cc-skeleton-pill" style={{ width: "75px", height: "20px" }} />
      </div>

      <div className="cc-profile-stat-grid">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="cc-profile-stat">
            <div className="cc-skeleton-shimmer cc-skeleton-avatar" style={{ width: "20px", height: "20px" }} />
            <div className="d-flex flex-column gap-1">
              <div className="cc-skeleton-shimmer cc-skeleton-line" style={{ width: "65px", height: "10px" }} />
              <div className="cc-skeleton-shimmer cc-skeleton-line" style={{ width: "42px", height: "22px" }} />
              <div className="cc-skeleton-shimmer cc-skeleton-line" style={{ width: "75px", height: "9px" }} />
            </div>
          </div>
        ))}
      </div>

      <div className="cc-profile-quality">
        <div className="d-flex justify-content-between mb-2">
          <div className="cc-skeleton-shimmer cc-skeleton-line" style={{ width: "110px", height: "12px" }} />
          <div className="cc-skeleton-shimmer cc-skeleton-line" style={{ width: "100px", height: "12px" }} />
        </div>
        <div className="cc-profile-quality-track">
          <div className="cc-skeleton-shimmer" style={{ width: "65%", height: "100%" }} />
        </div>
      </div>
    </section>
  );
}

/**
 * 6. Exam Results Card Skeleton (Main)
 */
export function ProfileExamsSkeleton() {
  return (
    <section className="cc-profile-card cc-profile-exams" aria-hidden="true">
      <div className="cc-profile-section-title">
        <div>
          <div className="cc-skeleton-shimmer cc-skeleton-line" style={{ width: "110px", height: "16px", marginBottom: "4px" }} />
          <div className="cc-skeleton-shimmer cc-skeleton-line" style={{ width: "180px", height: "11px" }} />
        </div>
        <div className="cc-skeleton-shimmer cc-skeleton-line" style={{ width: "60px", height: "14px" }} />
      </div>

      <div className="cc-profile-exam-list">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="cc-skeleton-exam-row">
            <div className="cc-profile-exam-info">
              <div className="cc-skeleton-shimmer cc-skeleton-line" style={{ width: "75%", height: "14px" }} />
              <div className="cc-skeleton-shimmer cc-skeleton-line" style={{ width: "45%", height: "11px" }} />
            </div>
            <div className="cc-profile-exam-score">
              <div className="cc-skeleton-shimmer cc-skeleton-line" style={{ width: "36px", height: "14px" }} />
              <div className="cc-skeleton-shimmer cc-skeleton-line" style={{ width: "30px", height: "14px" }} />
            </div>
            <div className="cc-profile-exam-bar">
              <div className="cc-skeleton-shimmer" style={{ width: `${50 + (i % 3) * 20}%`, height: "100%" }} />
            </div>
          </div>
        ))}
      </div>

      <p className="cc-profile-exam-note">
        <span className="cc-skeleton-shimmer cc-skeleton-line d-inline-block" style={{ width: "320px", height: "11px" }} />
      </p>
    </section>
  );
}

/**
 * 7. Certificates Card Skeleton (Main)
 */
export function ProfileCertificatesSkeleton() {
  return (
    <section className="cc-profile-card cc-profile-certificates" aria-hidden="true">
      <div className="cc-profile-section-title">
        <div>
          <div className="cc-skeleton-shimmer cc-skeleton-line" style={{ width: "100px", height: "16px", marginBottom: "4px" }} />
          <div className="cc-skeleton-shimmer cc-skeleton-line" style={{ width: "150px", height: "11px" }} />
        </div>
      </div>

      <div className="cc-profile-certificate-grid">
        {[1, 2, 3].map((i) => (
          <div key={i} className="cc-skeleton-cert-card">
            <div className="cc-skeleton-cert-preview">
              <div className="cc-skeleton-shimmer cc-skeleton-pill" style={{ width: "24px", height: "24px" }} />
              <div className="cc-skeleton-shimmer cc-skeleton-line" style={{ width: "70px", height: "8px" }} />
              <div className="cc-skeleton-shimmer cc-skeleton-line" style={{ width: "90%", height: "13px" }} />
              <div className="cc-skeleton-shimmer cc-skeleton-line" style={{ width: "40px", height: "2px" }} />
            </div>
            <div className="cc-skeleton-shimmer cc-skeleton-line" style={{ width: "85%", height: "13px" }} />
            <div className="cc-skeleton-shimmer cc-skeleton-line" style={{ width: "70px", height: "11px" }} />
          </div>
        ))}
      </div>
    </section>
  );
}

/**
 * 8. Contributions Card Skeleton (Main)
 */
export function ProfileContributionsSkeleton() {
  return (
    <section className="cc-profile-card cc-profile-contributions" aria-hidden="true">
      <div className="cc-profile-section-title">
        <div>
          <div className="cc-skeleton-shimmer cc-skeleton-line" style={{ width: "180px", height: "16px", marginBottom: "4px" }} />
          <div className="cc-skeleton-shimmer cc-skeleton-line" style={{ width: "220px", height: "11px" }} />
        </div>
        <div className="cc-skeleton-shimmer cc-skeleton-pill" style={{ width: "90px", height: "20px" }} />
      </div>

      {/* Summary stats */}
      <div className="cc-contribution-summary">
        {[1, 2, 3].map((i) => (
          <div key={i} className="d-flex flex-column gap-1">
            <div className="cc-skeleton-shimmer cc-skeleton-line" style={{ width: "45px", height: "18px" }} />
            <div className="cc-skeleton-shimmer cc-skeleton-line" style={{ width: "80px", height: "10px" }} />
          </div>
        ))}
      </div>

      {/* Heatmap shimmer */}
      <div className="cc-contribution-wrap">
        <div className="cc-contribution-months">
          <span>Jan</span><span>Mar</span><span>May</span><span>Jul</span><span>Sep</span><span>Nov</span>
        </div>
        <div className="cc-skeleton-contribution-grid">
          {Array.from({ length: 364 }).map((_, idx) => (
            <span
              key={idx}
              className="cc-skeleton-shimmer cc-skeleton-heatmap-cell"
              style={{
                opacity: idx % 7 === 0 ? 0.35 : idx % 5 === 0 ? 0.6 : idx % 3 === 0 ? 0.8 : 0.45,
              }}
            />
          ))}
        </div>
        <div className="cc-contribution-legend">
          <span>Less</span>
          <i className="level-0 cc-skeleton-shimmer" />
          <i className="level-1 cc-skeleton-shimmer" />
          <i className="level-2 cc-skeleton-shimmer" />
          <i className="level-3 cc-skeleton-shimmer" />
          <i className="level-4 cc-skeleton-shimmer" />
          <span>More</span>
        </div>
      </div>
    </section>
  );
}

/**
 * 9. Enrolled Courses Card Skeleton (Main)
 */
export function ProfileCoursesSkeleton() {
  return (
    <section className="cc-profile-card cc-profile-learning" aria-hidden="true">
      <div className="cc-profile-section-title">
        <div>
          <div className="cc-skeleton-shimmer cc-skeleton-line" style={{ width: "220px", height: "16px", marginBottom: "4px" }} />
          <div className="cc-skeleton-shimmer cc-skeleton-line" style={{ width: "140px", height: "11px" }} />
        </div>
        <div className="cc-skeleton-shimmer cc-skeleton-line" style={{ width: "85px", height: "14px" }} />
      </div>

      <div className="cc-profile-course-list">
        {[1, 2, 3].map((i) => (
          <div key={i} className="cc-profile-course">
            <div className="cc-profile-course-top">
              <div className="d-flex flex-column gap-1" style={{ flex: 1 }}>
                <div className="cc-skeleton-shimmer cc-skeleton-line" style={{ width: "55%", height: "14px" }} />
                <div className="cc-skeleton-shimmer cc-skeleton-line" style={{ width: "35%", height: "11px" }} />
              </div>
              <div className="cc-skeleton-shimmer cc-skeleton-pill" style={{ width: "85px", height: "20px" }} />
            </div>
            <div className="cc-profile-course-bar">
              <div className="cc-skeleton-shimmer" style={{ width: `${30 + i * 25}%`, height: "100%" }} />
            </div>
            <div className="cc-profile-course-bottom">
              <div className="cc-skeleton-shimmer cc-skeleton-line" style={{ width: "120px", height: "11px" }} />
              <div className="cc-skeleton-shimmer cc-skeleton-line" style={{ width: "95px", height: "12px" }} />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/**
 * 10. Recent Feed Posts Card Skeleton (Main)
 */
export function ProfilePostsSkeleton() {
  return (
    <section className="cc-profile-card cc-profile-posts" aria-hidden="true">
      <div className="cc-profile-section-title">
        <div>
          <div className="cc-skeleton-shimmer cc-skeleton-line" style={{ width: "200px", height: "16px", marginBottom: "4px" }} />
          <div className="cc-skeleton-shimmer cc-skeleton-line" style={{ width: "170px", height: "11px" }} />
        </div>
        <div className="cc-skeleton-shimmer cc-skeleton-line" style={{ width: "75px", height: "14px" }} />
      </div>

      <div className="cc-profile-post-list">
        {/* Post 1: standard text post */}
        <article className="cc-profile-post">
          <div className="cc-profile-post-head">
            <div className="cc-skeleton-shimmer cc-skeleton-pill" style={{ width: "95px", height: "18px" }} />
            <div className="cc-skeleton-shimmer cc-skeleton-line" style={{ width: "70px", height: "11px" }} />
          </div>
          <div className="d-flex flex-column gap-2 my-2">
            <div className="cc-skeleton-shimmer cc-skeleton-line" style={{ width: "95%", height: "13px" }} />
            <div className="cc-skeleton-shimmer cc-skeleton-line" style={{ width: "80%", height: "13px" }} />
          </div>
          <div className="cc-profile-post-actions mt-2">
            <div className="cc-skeleton-shimmer cc-skeleton-line" style={{ width: "50px", height: "26px", borderRadius: "4px" }} />
            <div className="cc-skeleton-shimmer cc-skeleton-line" style={{ width: "50px", height: "26px", borderRadius: "4px" }} />
          </div>
        </article>

        {/* Post 2: post with code snippet */}
        <article className="cc-profile-post">
          <div className="cc-profile-post-head">
            <div className="cc-skeleton-shimmer cc-skeleton-pill" style={{ width: "100px", height: "18px" }} />
            <div className="cc-skeleton-shimmer cc-skeleton-line" style={{ width: "80px", height: "11px" }} />
          </div>
          <div className="cc-skeleton-shimmer cc-skeleton-line my-2" style={{ width: "70%", height: "13px" }} />
          <div className="cc-skeleton-codeblock p-3 d-flex flex-column gap-2 my-2" style={{ height: "100px" }}>
            <div className="cc-skeleton-shimmer cc-skeleton-line" style={{ width: "40%", height: "12px" }} />
            <div className="cc-skeleton-shimmer cc-skeleton-line" style={{ width: "70%", height: "12px" }} />
            <div className="cc-skeleton-shimmer cc-skeleton-line" style={{ width: "55%", height: "12px" }} />
          </div>
          <div className="cc-profile-post-actions mt-2">
            <div className="cc-skeleton-shimmer cc-skeleton-line" style={{ width: "50px", height: "26px", borderRadius: "4px" }} />
            <div className="cc-skeleton-shimmer cc-skeleton-line" style={{ width: "50px", height: "26px", borderRadius: "4px" }} />
          </div>
        </article>
      </div>
    </section>
  );
}

/**
 * Full Page Profile Skeleton for Profile.jsx (/profile)
 */
export function ProfileSkeleton() {
  return (
    <div className="cc-profile-shell" aria-hidden="true">
      {/* ── Page Heading Skeleton ── */}
      <div className="cc-profile-heading">
        <div>
          <div className="cc-skeleton-shimmer cc-skeleton-line" style={{ width: "140px", height: "11px", marginBottom: "8px" }} />
          <div className="cc-skeleton-shimmer cc-skeleton-line" style={{ width: "260px", height: "28px", marginBottom: "8px" }} />
          <div className="cc-skeleton-shimmer cc-skeleton-line" style={{ width: "380px", height: "14px" }} />
        </div>
        <div className="cc-skeleton-shimmer cc-skeleton-line" style={{ width: "140px", height: "36px", borderRadius: "4px" }} />
      </div>

      {/* ── 2-Column Layout ── */}
      <div className="cc-profile-layout">
        {/* Left Sidebar Cards */}
        <aside className="cc-profile-sidebar">
          <ProfileIdentitySkeleton />
          <ProfileSpecialtiesSkeleton />
          <ProfileGraphReachSkeleton />
          <ProfileNetworkSkeleton />
        </aside>

        {/* Right Main Cards */}
        <main className="cc-profile-main">
          <ProfileMetricsSkeleton />
          <ProfileExamsSkeleton />
          <ProfileCertificatesSkeleton />
          <ProfileContributionsSkeleton />
          <ProfileCoursesSkeleton />
          <ProfilePostsSkeleton />
        </main>
      </div>
    </div>
  );
}

/**
 * Public User Profile Skeleton for PostToProfile.jsx (/profile/:id)
 */
export function PublicProfileSkeleton() {
  return (
    <div className="cc-public-profile-shell" aria-hidden="true">
      {/* Public Profile Card */}
      <div className="cc-skeleton-public-profile-card">
        {/* Banner */}
        <div className="cc-skeleton-shimmer" style={{ height: "160px", width: "100%" }} />

        {/* Identity Body */}
        <div className="p-4 d-flex gap-4 align-items-start flex-wrap">
          <div
            className="cc-skeleton-shimmer cc-skeleton-avatar"
            style={{
              width: "110px",
              height: "110px",
              marginTop: "-60px",
              border: "4px solid var(--cc-surface, #fff)",
            }}
          />
          <div style={{ flex: 1, minWidth: "240px" }} className="d-flex flex-column gap-2">
            <div className="d-flex align-items-center gap-2">
              <div className="cc-skeleton-shimmer cc-skeleton-line" style={{ width: "180px", height: "22px" }} />
              <div className="cc-skeleton-shimmer cc-skeleton-pill" style={{ width: "60px", height: "20px" }} />
            </div>
            <div className="cc-skeleton-shimmer cc-skeleton-line" style={{ width: "100px", height: "13px" }} />
            <div className="cc-skeleton-shimmer cc-skeleton-line" style={{ width: "190px", height: "13px" }} />

            <div className="d-flex gap-2 flex-wrap my-2">
              <div className="cc-skeleton-shimmer cc-skeleton-pill" style={{ width: "80px", height: "24px" }} />
              <div className="cc-skeleton-shimmer cc-skeleton-pill" style={{ width: "95px", height: "24px" }} />
              <div className="cc-skeleton-shimmer cc-skeleton-pill" style={{ width: "95px", height: "24px" }} />
              <div className="cc-skeleton-shimmer cc-skeleton-pill" style={{ width: "130px", height: "24px" }} />
            </div>

            <div className="cc-skeleton-shimmer cc-skeleton-line mt-2" style={{ width: "110px", height: "36px", borderRadius: "6px" }} />
          </div>
        </div>
      </div>

      {/* Posts Section Skeleton */}
      <section className="cc-public-profile-section mt-4">
        <div className="cc-skeleton-shimmer cc-skeleton-line mb-3" style={{ width: "70px", height: "22px" }} />
        <div className="row g-4">
          {[1, 2, 3].map((i) => (
            <div className="col-md-6 col-lg-4" key={i}>
              <div className="cc-skeleton-card p-4 d-flex flex-column gap-3" style={{ minHeight: "220px" }}>
                <div className="d-flex align-items-center gap-3">
                  <div className="cc-skeleton-shimmer cc-skeleton-avatar" style={{ width: "42px", height: "42px" }} />
                  <div className="d-flex flex-column gap-1" style={{ flex: 1 }}>
                    <div className="cc-skeleton-shimmer cc-skeleton-line" style={{ width: "60%", height: "14px" }} />
                    <div className="cc-skeleton-shimmer cc-skeleton-line" style={{ width: "35%", height: "11px" }} />
                  </div>
                </div>
                <div className="d-flex flex-column gap-2 my-2">
                  <div className="cc-skeleton-shimmer cc-skeleton-line" style={{ width: "100%", height: "13px" }} />
                  <div className="cc-skeleton-shimmer cc-skeleton-line" style={{ width: "90%", height: "13px" }} />
                  <div className="cc-skeleton-shimmer cc-skeleton-line" style={{ width: "70%", height: "13px" }} />
                </div>
                <div className="cc-skeleton-shimmer cc-skeleton-line mt-auto" style={{ width: "100%", height: "32px", borderRadius: "6px" }} />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}


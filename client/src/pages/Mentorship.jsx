import React, { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { io } from "socket.io-client";
import { getAccessToken } from "../api/accessToken";
import { toast } from "react-toastify";
import api, { refreshSession } from "../api/api";
import { useAuth } from "../contexts/AuthContext";
import "./Mentorship.css";

/* ─── helpers ─────────────────────────────────────────────────────────────── */
const initialApply = { expertise: "", experienceYears: 0, bio: "" };
const formatNames = {
  one_to_one: "1:1 Mentoring",
  group_class: "Masterclass",
  small_group: "Small Group",
};
const formatIcons = { one_to_one: "👤", group_class: "🎓", small_group: "👥" };
const formatColors = {
  one_to_one: "mc-badge--blue",
  group_class: "mc-badge--purple",
  small_group: "mc-badge--teal",
};

const when = (v) =>
  new Date(v).toLocaleString([], { dateStyle: "medium", timeStyle: "short" });
const toLocal = (d) =>
  new Date(d.getTime() - d.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
const countdown = (scheduledAt) => {
  const diff = new Date(scheduledAt) - Date.now();
  if (diff <= 0) return "Starting soon";
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  if (h > 24) return `in ${Math.floor(h / 24)}d ${h % 24}h`;
  if (h > 0) return `in ${h}h ${m}m`;
  return `in ${m}m`;
};
const mentorSocketOrigin = () => {
  const c = import.meta.env.VITE_API_URL;
  if (!c) return window.location.origin;
  try { return new URL(c).origin; } catch { return window.location.origin; }
};

/* ─── Tab bar ──────────────────────────────────────────────────────────────── */
function TabBar({ tabs, active, onChange }) {
  return (
    <div className="mc-tabs">
      {tabs.map((t) => (
        <button
          key={t.id}
          className={`mc-tab ${active === t.id ? "mc-tab--active" : ""}`}
          onClick={() => onChange(t.id)}
        >
          {t.icon && <span>{t.icon}</span>} {t.label}
        </button>
      ))}
    </div>
  );
}

/* ─── Session Card ─────────────────────────────────────────────────────────── */
function SessionCard({ session, user, onEnroll, onJoin }) {
  const isHost =
    String(session.mentor_id) === String(user?.id || user?._id);
  const now = Date.now();
  const scheduledMs = new Date(session.scheduled_at).getTime();
  const startedMs = session.started_at
    ? new Date(session.started_at).getTime()
    : scheduledMs;
  const endsMs = startedMs + session.duration_minutes * 60000;
  const canJoin =
    now <= endsMs + 30 * 60000 &&
    (session.status === "live" || now >= scheduledMs - 15 * 60000);
  const pct = Math.min(
    100,
    Math.round((session.enrolled_count / session.max_participants) * 100)
  );
  const isFull = session.enrolled_count >= session.max_participants;

  return (
    <article className={`mc-card ${session.status === "live" ? "mc-card--live" : ""}`}>
      {session.status === "live" && (
        <div className="mc-live-pill">
          <span className="mc-live-dot" /> LIVE
        </div>
      )}

      <div className="mc-card-header">
        <span className={`mc-badge ${formatColors[session.format]}`}>
          {formatIcons[session.format]} {formatNames[session.format]}
        </span>
        <span className="mc-card-time">
          {session.status === "live"
            ? "🔴 Happening now"
            : `🗓 ${when(session.scheduled_at)} · ${countdown(session.scheduled_at)}`}
        </span>
      </div>

      <h3 className="mc-card-title">{session.title}</h3>
      <p className="mc-card-desc">{session.description || session.topic}</p>

      <div className="mc-card-mentor">
        <div className="mc-avatar">{(session.mentor_name || "M")[0].toUpperCase()}</div>
        <div>
          <strong>{session.mentor_name || (isHost ? "You" : "Mentor")}</strong>
          <span>Mentor · {session.topic}</span>
        </div>
      </div>

      <div className="mc-card-footer">
        <div className="mc-seats">
          <div className="mc-seat-bar">
            <div className="mc-seat-fill" style={{ width: `${pct}%` }} />
          </div>
          <span>
            {session.enrolled_count}/{session.max_participants} seats filled
          </span>
        </div>

        <div className="mc-card-actions">
          {!isHost && !session.enrolled && session.status === "scheduled" && (
            <button
              className={`mc-btn mc-btn--outline ${isFull ? "mc-btn--disabled" : ""}`}
              disabled={isFull}
              onClick={() => onEnroll(session)}
            >
              {isFull ? "Full" : "Register Free"}
            </button>
          )}
          {(isHost || session.enrolled) && canJoin && (
            <Link className="mc-btn mc-btn--primary" to={`/mentorship/room/${session.id}`}>
              {isHost ? "Start Session →" : "Join Now →"}
            </Link>
          )}
          {isHost && session.status === "scheduled" && !canJoin && (
            <Link className="mc-btn mc-btn--secondary" to={`/mentorship/room/${session.id}`}>
              Open Room Early
            </Link>
          )}
          {session.enrolled && session.status === "scheduled" && !canJoin && (
            <span className="mc-registered-pill">✓ Registered</span>
          )}
        </div>
      </div>
    </article>
  );
}

/* ─── Main Page ────────────────────────────────────────────────────────────── */
export default function Mentorship() {
  const { user } = useAuth();
  const isAdmin = user?.role === "super_admin";
  const isMentor = user?.role === "mentor";

  const [tab, setTab] = useState("sessions");
  const [application, setApplication] = useState(null);
  const [applications, setApplications] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [applicationForm, setApplicationForm] = useState(initialApply);
  const [sessionForm, setSessionForm] = useState({
    title: "", topic: "", description: "", format: "group_class",
    scheduledAt: "", durationMinutes: 60, maxParticipants: 100,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const countdownRef = useRef(null);
  const [tick, setTick] = useState(0);

  /* live countdown every 30s */
  useEffect(() => {
    countdownRef.current = setInterval(() => setTick((t) => t + 1), 30000);
    return () => clearInterval(countdownRef.current);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const reqs = [api.get("/mentor/sessions")];
      if (isAdmin) reqs.push(api.get("/mentor/admin/applications"));
      else reqs.push(api.get("/mentor/me"));
      const [sessRes, otherRes] = await Promise.all(reqs);
      const allSessions = sessRes.data || [];
      setSessions(
        isMentor
          ? allSessions.filter(
              (s) => String(s.mentor_id) === String(user?.id || user?._id)
            )
          : allSessions
      );
      if (isAdmin) setApplications(otherRes.data || []);
      else if (otherRes.data) {
        setApplication(otherRes.data);
        setApplicationForm({
          expertise: (otherRes.data.expertise || []).join(", "),
          experienceYears: otherRes.data.experience_years || 0,
          bio: otherRes.data.bio || "",
        });
      }
    } catch {
      toast.error("Could not load the mentorship platform.");
    } finally {
      setLoading(false);
    }
  }, [isAdmin, isMentor, user?.id, user?._id]);

  useEffect(() => { load(); }, [load]);

  /* socket live updates */
  useEffect(() => {
    if (!getAccessToken()) return;
    const socket = io(mentorSocketOrigin(), {
      path: "/mentor-socket.io",
      auth: { token: getAccessToken() },
      transports: ["websocket", "polling"],
    });
    socket.on("mentor:sessions-updated", load);
    socket.on("connect_error", async (err) => {
      if (!/unauthorized|token|jwt|expired/i.test(err.message || "")) return;
      try {
        const { accessToken } = await refreshSession();
        socket.auth = { token: accessToken };
        socket.disconnect().connect();
      } catch { socket.disconnect(); }
    });
    return () => socket.disconnect();
  }, [load]);

  /* handlers */
  const submitApplication = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      const res = await api.post("/mentor/applications", {
        expertise: applicationForm.expertise.split(",").map((x) => x.trim()).filter(Boolean),
        experienceYears: Number(applicationForm.experienceYears),
        bio: applicationForm.bio,
      });
      setApplication(res.data);
      toast.success("🎉 Application submitted! The admin will review it shortly.");
    } catch (err) {
      toast.error(err.response?.data?.error || "Could not submit application.");
    } finally { setSaving(false); }
  };

  const reviewApplication = async (item, decision) => {
    try {
      await api.patch(`/mentor/admin/applications/${item.id}`, { decision });
      toast.success(decision === "approved" ? `✅ ${item.name} is now a mentor!` : "Application declined.");
      await load();
    } catch (err) { toast.error(err.response?.data?.error || "Could not review."); }
  };

  const createSession = async (e) => {
    e.preventDefault();
    if (saving) return;
    const startTime = new Date(sessionForm.scheduledAt);
    if (!sessionForm.scheduledAt || isNaN(startTime) || startTime <= new Date(Date.now() + 5 * 60000)) {
      toast.error("Schedule at least 5 minutes from now."); return;
    }
    setSaving(true);
    try {
      await api.post("/mentor/sessions", {
        ...sessionForm,
        durationMinutes: Number(sessionForm.durationMinutes),
        maxParticipants: Number(sessionForm.maxParticipants),
        scheduledAt: startTime.toISOString(),
      });
      toast.success("🎓 Masterclass scheduled!");
      setSessionForm({ ...sessionForm, title: "", topic: "", description: "", scheduledAt: "" });
      await load();
      setTab("sessions");
    } catch (err) {
      toast.error(err.response?.data?.error || "Could not schedule session.");
    } finally { setSaving(false); }
  };

  const enroll = async (session) => {
    try {
      await api.post(`/mentor/sessions/${session.id}/enroll`);
      toast.success("🎉 Registered! You'll be notified when the session starts.");
      await load();
    } catch (err) { toast.error(err.response?.data?.error || "Could not register."); }
  };

  const updateFormat = (format) =>
    setSessionForm((f) => ({
      ...f, format,
      maxParticipants: format === "one_to_one" ? 1 : format === "small_group" ? 6 : 100,
    }));

  /* filtered sessions */
  const filtered = sessions.filter((s) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      s.title.toLowerCase().includes(q) ||
      s.topic.toLowerCase().includes(q) ||
      (s.mentor_name || "").toLowerCase().includes(q);
    const matchFilter =
      filter === "all" ||
      (filter === "live" && s.status === "live") ||
      (filter === "enrolled" && s.enrolled) ||
      (filter === "mine" && String(s.mentor_id) === String(user?.id || user?._id));
    return matchSearch && matchFilter;
  });

  const liveCount = sessions.filter((s) => s.status === "live").length;
  const upcomingCount = sessions.filter((s) => s.status === "scheduled").length;
  const enrolledCount = sessions.filter((s) => s.enrolled).length;

  /* tabs config */
  const tabs = [
    { id: "sessions", label: "Upcoming Sessions", icon: "🎓" },
    ...(isMentor ? [{ id: "create", label: "Schedule Class", icon: "➕" }] : []),
    ...(!isMentor && !isAdmin ? [{ id: "apply", label: "Become a Mentor", icon: "🌟" }] : []),
    ...(isAdmin ? [{ id: "review", label: `Review Applications ${applications.length > 0 ? `(${applications.length})` : ""}`, icon: "👮" }] : []),
  ];

  return (
    <div className="mc-page">
      {/* ─── Hero ──────────────────────────────────────────────────────── */}
      <div className="mc-hero">
        <div className="mc-hero-inner">
          <div className="mc-hero-text">
            <div className="mc-hero-eyebrow">🎓 Code Campus Live</div>
            <h1 className="mc-hero-title">
              Learn from the best.<br />
              <span className="mc-hero-highlight">Live Masterclasses</span>
            </h1>
            <p className="mc-hero-sub">
              Join live coding sessions, workshops, and 1:1 mentoring from
              industry experts. Interactive, real-time learning.
            </p>
            <div className="mc-hero-stats">
              <div className="mc-stat">
                <strong>{liveCount}</strong>
                <span>Live Now</span>
              </div>
              <div className="mc-stat">
                <strong>{upcomingCount}</strong>
                <span>Upcoming</span>
              </div>
              <div className="mc-stat">
                <strong>{enrolledCount}</strong>
                <span>Enrolled</span>
              </div>
            </div>
          </div>
          <div className="mc-hero-art">
            <div className="mc-art-card">
              <div className="mc-art-screen" />
              <div className="mc-art-row">
                <div className="mc-art-avatar" />
                <div className="mc-art-lines">
                  <div /><div />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mc-content">
        {/* ─── Tabs ───────────────────────────────────────────────────── */}
        <TabBar tabs={tabs} active={tab} onChange={setTab} />

        {/* ─── Sessions tab ───────────────────────────────────────────── */}
        {tab === "sessions" && (
          <div>
            {/* search / filter bar */}
            <div className="mc-filter-bar">
              <div className="mc-search-wrap">
                <span className="mc-search-icon">🔍</span>
                <input
                  className="mc-search"
                  placeholder="Search by title, topic, or mentor…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <div className="mc-filter-chips">
                {["all", "live", "enrolled", ...(isMentor ? ["mine"] : [])].map((f) => (
                  <button
                    key={f}
                    className={`mc-chip ${filter === f ? "mc-chip--active" : ""}`}
                    onClick={() => setFilter(f)}
                  >
                    {f === "all" ? "All" : f === "live" ? "🔴 Live" : f === "enrolled" ? "✓ Registered" : "My Sessions"}
                  </button>
                ))}
              </div>
              <button className="mc-btn mc-btn--ghost" onClick={load}>↺ Refresh</button>
            </div>

            {loading ? (
              <div className="mc-skeleton-grid">
                {[1, 2, 3].map((i) => <div key={i} className="mc-skeleton-card" />)}
              </div>
            ) : filtered.length === 0 ? (
              <div className="mc-empty">
                <div className="mc-empty-icon">📅</div>
                <h3>No sessions found</h3>
                <p>
                  {sessions.length === 0
                    ? "No sessions are scheduled yet. Check back soon or apply to become a mentor!"
                    : "No sessions match your search. Try a different keyword."}
                </p>
                {isMentor && (
                  <button className="mc-btn mc-btn--primary" onClick={() => setTab("create")}>
                    Schedule First Class →
                  </button>
                )}
              </div>
            ) : (
              <div className="mc-session-grid">
                {filtered.map((s) => (
                  <SessionCard
                    key={s.id}
                    session={s}
                    user={user}
                    onEnroll={enroll}
                    onJoin={() => {}}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ─── Create Session tab ─────────────────────────────────────── */}
        {tab === "create" && isMentor && (
          <div className="mc-panel">
            <div className="mc-panel-header">
              <div>
                <h2>Schedule a New Class</h2>
                <p>Fill in the details below. Students will be able to register and join on the scheduled time.</p>
              </div>
            </div>
            <form className="mc-create-form" onSubmit={createSession}>
              <div className="mc-form-row">
                <label className="mc-label">
                  Session Title *
                  <input
                    required minLength={4} maxLength={120}
                    className="mc-input"
                    placeholder='e.g. "Build a RAG Pipeline from scratch"'
                    value={sessionForm.title}
                    onChange={(e) => setSessionForm({ ...sessionForm, title: e.target.value })}
                  />
                </label>
                <label className="mc-label">
                  Topic / Tag *
                  <input
                    required className="mc-input"
                    placeholder='e.g. "LLMs", "System Design"'
                    value={sessionForm.topic}
                    onChange={(e) => setSessionForm({ ...sessionForm, topic: e.target.value })}
                  />
                </label>
              </div>

              <label className="mc-label mc-label--full">
                Session Format *
                <div className="mc-format-grid">
                  {[
                    { val: "group_class", label: "Masterclass", desc: "Broadcast to unlimited students. You present, they watch & chat.", icon: "🎓" },
                    { val: "small_group", label: "Small Group", desc: "Interactive session with up to 6 learners. All cameras on.", icon: "👥" },
                    { val: "one_to_one", label: "1:1 Mentoring", desc: "Private session with one learner. Focused & personal.", icon: "👤" },
                  ].map((opt) => (
                    <button
                      type="button" key={opt.val}
                      className={`mc-format-btn ${sessionForm.format === opt.val ? "mc-format-btn--active" : ""}`}
                      onClick={() => updateFormat(opt.val)}
                    >
                      <span className="mc-format-icon">{opt.icon}</span>
                      <strong>{opt.label}</strong>
                      <span>{opt.desc}</span>
                    </button>
                  ))}
                </div>
              </label>

              <div className="mc-form-row">
                <label className="mc-label">
                  Scheduled Date & Time *
                  <input
                    required type="datetime-local"
                    className="mc-input"
                    min={toLocal(new Date(Date.now() + 5 * 60000))}
                    value={sessionForm.scheduledAt}
                    onChange={(e) => setSessionForm({ ...sessionForm, scheduledAt: e.target.value })}
                  />
                  <small className="mc-hint">Times shown in your local timezone.</small>
                </label>
                <label className="mc-label">
                  Duration (minutes) *
                  <input
                    required type="number" min={15} max={240}
                    className="mc-input"
                    value={sessionForm.durationMinutes}
                    onChange={(e) => setSessionForm({ ...sessionForm, durationMinutes: e.target.value })}
                  />
                </label>
                <label className="mc-label">
                  Max Participants *
                  <input
                    required type="number" min={1}
                    max={sessionForm.format === "small_group" ? 6 : sessionForm.format === "one_to_one" ? 1 : 1000}
                    className="mc-input"
                    value={sessionForm.maxParticipants}
                    onChange={(e) => setSessionForm({ ...sessionForm, maxParticipants: e.target.value })}
                  />
                </label>
              </div>

              <label className="mc-label mc-label--full">
                Description
                <textarea
                  rows={4} maxLength={2000}
                  className="mc-input mc-textarea"
                  placeholder="What will learners gain? What topics will you cover? Any prerequisites?"
                  value={sessionForm.description}
                  onChange={(e) => setSessionForm({ ...sessionForm, description: e.target.value })}
                />
              </label>

              <div className="mc-form-actions">
                <button
                  type="button" className="mc-btn mc-btn--ghost"
                  onClick={() => setTab("sessions")}
                >
                  Cancel
                </button>
                <button type="submit" className="mc-btn mc-btn--primary" disabled={saving}>
                  {saving ? "Scheduling…" : "🎓 Schedule Masterclass →"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ─── Apply tab ──────────────────────────────────────────────── */}
        {tab === "apply" && !isMentor && !isAdmin && (
          <div className="mc-apply-layout">
            <div className="mc-panel">
              <div className="mc-panel-header">
                <div>
                  <h2>
                    {application?.status === "pending"
                      ? "⏳ Application Under Review"
                      : application?.status === "approved"
                      ? "✅ You're an Approved Mentor"
                      : application?.status === "rejected"
                      ? "❌ Update and Resubmit"
                      : "🌟 Apply to Become a Mentor"}
                  </h2>
                  <p>
                    {application?.status === "pending"
                      ? "The admin team reviews applications carefully. You'll be notified once a decision is made."
                      : application?.status === "approved"
                      ? "Sign out and back in to access your mentor tools."
                      : "Share your expertise with thousands of learners through live sessions."}
                  </p>
                </div>
              </div>

              {application?.status === "pending" ? (
                <div className="mc-status-card mc-status-card--pending">
                  <div className="mc-status-icon">⏳</div>
                  <div>
                    <strong>Application submitted on {when(application.created_at)}</strong>
                    <p>You can still use all student features while waiting. Once approved and after re-logging in, mentor tools will unlock.</p>
                  </div>
                </div>
              ) : application?.status === "approved" ? (
                <div className="mc-status-card mc-status-card--approved">
                  <div className="mc-status-icon">✅</div>
                  <div>
                    <strong>Your mentor application was approved!</strong>
                    <p>Sign out and back in to start scheduling sessions.</p>
                  </div>
                </div>
              ) : (
                <form className="mc-create-form" onSubmit={submitApplication}>
                  <label className="mc-label mc-label--full">
                    Topics / Skills you can teach *
                    <input
                      required className="mc-input"
                      placeholder="React, System Design, Python, DSA, Interview Prep…"
                      value={applicationForm.expertise}
                      onChange={(e) => setApplicationForm({ ...applicationForm, expertise: e.target.value })}
                    />
                    <small className="mc-hint">Separate multiple topics with commas.</small>
                  </label>
                  <label className="mc-label">
                    Years of Experience *
                    <input
                      required type="number" min={0} max={60}
                      className="mc-input"
                      value={applicationForm.experienceYears}
                      onChange={(e) => setApplicationForm({ ...applicationForm, experienceYears: e.target.value })}
                    />
                  </label>
                  <label className="mc-label mc-label--full">
                    Introduction & Teaching Experience *
                    <textarea
                      required minLength={30} maxLength={3000} rows={5}
                      className="mc-input mc-textarea"
                      placeholder="Describe your background, what you've built, what you'll teach, and how your sessions help learners…"
                      value={applicationForm.bio}
                      onChange={(e) => setApplicationForm({ ...applicationForm, bio: e.target.value })}
                    />
                  </label>
                  <div className="mc-form-actions">
                    <button type="submit" className="mc-btn mc-btn--primary" disabled={saving}>
                      {saving ? "Submitting…" : application ? "Resubmit Application →" : "Submit Application →"}
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* perks sidebar */}
            <div className="mc-perks">
              <h3>Why mentor on Code Campus?</h3>
              {[
                { icon: "🎙", title: "Reach thousands", desc: "Broadcast live to a large audience of eager learners." },
                { icon: "💬", title: "Real-time interaction", desc: "Live chat, polls, and Q&A during your sessions." },
                { icon: "🎥", title: "HD video rooms", desc: "Professional-grade video powered by LiveKit." },
                { icon: "📊", title: "Engagement analytics", desc: "See who attended and how they engaged." },
              ].map((p) => (
                <div className="mc-perk" key={p.title}>
                  <span>{p.icon}</span>
                  <div>
                    <strong>{p.title}</strong>
                    <p>{p.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ─── Admin Review tab ───────────────────────────────────────── */}
        {tab === "review" && isAdmin && (
          <div className="mc-panel">
            <div className="mc-panel-header">
              <div>
                <h2>Mentor Applications</h2>
                <p>
                  Review applicants carefully. Approved mentors can schedule and host live sessions.
                </p>
              </div>
            </div>
            {applications.length === 0 ? (
              <div className="mc-empty">
                <div className="mc-empty-icon">📭</div>
                <h3>No pending applications</h3>
                <p>You're all caught up!</p>
              </div>
            ) : (
              <div className="mc-application-list">
                {applications.map((item) => (
                  <article className="mc-application" key={item.id}>
                    <div className="mc-app-avatar">
                      {(item.name || "?")[0].toUpperCase()}
                    </div>
                    <div className="mc-app-body">
                      <div className="mc-app-header">
                        <div>
                          <h3>{item.name}</h3>
                          <span>{item.email}</span>
                        </div>
                        <span className="mc-badge mc-badge--yellow">
                          {item.experience_years} yrs exp
                        </span>
                      </div>
                      <div className="mc-tag-row">
                        {item.expertise.map((tag) => (
                          <span className="mc-tag" key={tag}>{tag}</span>
                        ))}
                      </div>
                      <p className="mc-app-bio">{item.bio}</p>
                      <small className="mc-app-time">
                        Submitted {when(item.created_at)}
                      </small>
                    </div>
                    <div className="mc-app-actions">
                      <button
                        className="mc-btn mc-btn--primary"
                        onClick={() => reviewApplication(item, "approved")}
                      >
                        ✅ Approve
                      </button>
                      <button
                        className="mc-btn mc-btn--danger"
                        onClick={() => reviewApplication(item, "rejected")}
                      >
                        ✕ Decline
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

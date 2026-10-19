import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { io } from "socket.io-client";
import { toast } from "react-toastify";
import { FaChalkboardTeacher, FaClock, FaUsers, FaVideo } from "react-icons/fa";
import api from "../api/api";
import { useAuth } from "../contexts/AuthContext";
import "./Mentorship.css";

const initialApply = { expertise: "", experienceYears: 0, bio: "" };
const formatNames = { one_to_one: "1:1 mentoring", group_class: "Live class (1:N)", small_group: "Small group (N:1)" };
const when = (value) => new Date(value).toLocaleString([], { dateStyle: "medium", timeStyle: "short" });
const toLocalDateTimeInput = (date) => new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
const mentorSocketOrigin = () => {
  const configured = import.meta.env.VITE_API_URL;
  if (!configured) return window.location.origin;
  try { return new URL(configured).origin; } catch { return window.location.origin; }
};

export default function Mentorship() {
  const { user } = useAuth();
  const isAdmin = user?.role === "super_admin";
  const isMentor = user?.role === "mentor";
  const [application, setApplication] = useState(null);
  const [applications, setApplications] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [applicationForm, setApplicationForm] = useState(initialApply);
  const [sessionForm, setSessionForm] = useState({ title: "", topic: "", description: "", format: "one_to_one", scheduledAt: "", durationMinutes: 60, maxParticipants: 1 });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const requests = [api.get("/mentor/sessions")];
      if (isAdmin) requests.push(api.get("/mentor/admin/applications"));
      else requests.push(api.get("/mentor/me"));
      const [sessionsRes, otherRes] = await Promise.all(requests);
      setSessions(isMentor ? (sessionsRes.data || []).filter((session) => String(session.mentor_id) === String(user?.id || user?._id)) : sessionsRes.data || []);
      if (isAdmin) setApplications(otherRes.data || []);
      else if (otherRes.data) {
        setApplication(otherRes.data);
        setApplicationForm({ expertise: (otherRes.data.expertise || []).join(", "), experienceYears: otherRes.data.experience_years || 0, bio: otherRes.data.bio || "" });
      }
    } catch (error) { toast.error(error.response?.data?.error || "Could not load the mentor platform."); }
    finally { setLoading(false); }
  }, [isAdmin, isMentor, user?.id, user?._id]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const socket = io(mentorSocketOrigin(), {
      path: "/mentor-socket.io",
      auth: { token: localStorage.getItem("token") },
      transports: ["websocket", "polling"],
    });
    socket.on("mentor:sessions-updated", load);
    return () => socket.disconnect();
  }, [load]);

  const submitApplication = async (event) => {
    event.preventDefault(); setSaving(true);
    try {
      const response = await api.post("/mentor/applications", {
        expertise: applicationForm.expertise.split(",").map((item) => item.trim()).filter(Boolean),
        experienceYears: Number(applicationForm.experienceYears), bio: applicationForm.bio,
      });
      setApplication(response.data); toast.success("Mentor application submitted for super admin review.");
    } catch (error) { toast.error(error.response?.data?.error || "Could not submit application."); }
    finally { setSaving(false); }
  };

  const reviewApplication = async (item, decision) => {
    try {
      await api.patch(`/mentor/admin/applications/${item.id}`, { decision });
      toast.success(decision === "approved" ? `${item.name} is now an approved mentor.` : "Application declined.");
      await load();
    } catch (error) { toast.error(error.response?.data?.error || "Could not review application."); }
  };

  const createSession = async (event) => {
    event.preventDefault();
    if (saving) return;
    const startTime = new Date(sessionForm.scheduledAt);
    if (!sessionForm.scheduledAt || Number.isNaN(startTime.getTime()) || startTime.getTime() < Date.now() + 5 * 60 * 1000) {
      toast.error("Choose a session start time at least 5 minutes from now.");
      return;
    }
    setSaving(true);
    try {
      await api.post("/mentor/sessions", { ...sessionForm, durationMinutes: Number(sessionForm.durationMinutes), maxParticipants: Number(sessionForm.maxParticipants), scheduledAt: new Date(sessionForm.scheduledAt).toISOString() });
      toast.success("Session scheduled.");
      setSessionForm({ ...sessionForm, title: "", topic: "", description: "", scheduledAt: "" });
      await load();
    } catch (error) { toast.error(error.response?.data?.error || "Could not schedule session."); }
    finally { setSaving(false); }
  };

  const enroll = async (session) => {
    try { await api.post(`/mentor/sessions/${session.id}/enroll`); toast.success("You are enrolled. Join when the room opens."); await load(); }
    catch (error) { toast.error(error.response?.data?.error || "Could not enroll."); }
  };

  const updateFormat = (format) => setSessionForm((current) => ({ ...current, format, maxParticipants: format === "one_to_one" ? 1 : format === "small_group" ? 6 : 30 }));
  const isJoinTime = (session) => {
    const now = Date.now(), scheduled = new Date(session.scheduled_at).getTime();
    const starts = session.started_at ? new Date(session.started_at).getTime() : scheduled;
    const roomIsLive = session.status === "live";
    return now <= starts + session.duration_minutes * 60000 + 30 * 60000 && (roomIsLive || now >= scheduled - 15 * 60000);
  };
  const isSessionHost = (session) => String(session.mentor_id) === String(user?.id || user?._id);

  return <section className="mentor-platform">
    <header className="mentor-platform-hero"><FaChalkboardTeacher /><div><p>CODE CAMPUS LIVE LEARNING</p><h1>Mentor sessions</h1><span>Apply to teach, get approved, and meet learners in live sessions.</span></div></header>
    {isAdmin ? <section className="mentor-panel"><h2>Mentor applications for review</h2><p>Approve only after checking the applicant's teaching experience and expertise.</p>
      {applications.length === 0 ? <div className="mentor-empty">No pending mentor applications.</div> : applications.map((item) => <article className="mentor-application" key={item.id}>
        <div><h3>{item.name}</h3><p>{item.email} · {item.experience_years} years experience</p><div className="mentor-tags">{item.expertise.map((tag) => <span key={tag}>{tag}</span>)}</div><p>{item.bio}</p><small>Submitted {when(item.created_at)}</small></div>
        <div className="mentor-actions"><button className="mentor-btn primary" onClick={() => reviewApplication(item, "approved")}>Approve mentor</button><button className="mentor-btn secondary" onClick={() => reviewApplication(item, "rejected")}>Decline</button></div>
      </article>)}</section> : <>
      {!isMentor && <section className="mentor-panel mentor-status-panel"><h2>{application?.status === "pending" ? "Your mentor application is being reviewed" : application?.status === "rejected" ? "Update and resubmit your application" : application?.status === "approved" ? "You are approved as a mentor" : "Apply to become a mentor"}</h2>
        {application?.status === "pending" ? <p>The super admin reviews applications. You can use student features while it is pending; mentor tools unlock after approval and signing in again.</p> : <form className="mentor-form" onSubmit={submitApplication}>
          <label>Topics or skills you can teach<input required value={applicationForm.expertise} onChange={(event) => setApplicationForm({ ...applicationForm, expertise: event.target.value })} placeholder="React, Python, interview preparation" /></label>
          <label>Years of experience<input required type="number" min="0" max="60" value={applicationForm.experienceYears} onChange={(event) => setApplicationForm({ ...applicationForm, experienceYears: event.target.value })} /></label>
          <label>Introduction and teaching experience<textarea required minLength="30" maxLength="3000" rows="4" value={applicationForm.bio} onChange={(event) => setApplicationForm({ ...applicationForm, bio: event.target.value })} placeholder="Describe your experience and how you will help learners." /></label>
          <button className="mentor-btn primary" disabled={saving}>{saving ? "Submitting…" : application ? "Resubmit application" : "Submit for review"}</button>
        </form>}
      </section>}

      {isMentor && <section className="mentor-panel"><h2>Schedule a mentoring session</h2><p>1:1 supports one learner, live class supports up to 1,000 listeners, and small group supports up to six learners with cameras.</p>
        <form className="mentor-form mentor-session-form" onSubmit={createSession}>
          <label>Session title<input required minLength="4" maxLength="120" value={sessionForm.title} onChange={(event) => setSessionForm({ ...sessionForm, title: event.target.value })} placeholder="Build your first React app" /></label>
          <label>Topic<input required value={sessionForm.topic} onChange={(event) => setSessionForm({ ...sessionForm, topic: event.target.value })} placeholder="React fundamentals" /></label>
          <label>Format<select value={sessionForm.format} onChange={(event) => updateFormat(event.target.value)}><option value="one_to_one">1:1 mentoring</option><option value="group_class">Live class (mentor presents to learners)</option><option value="small_group">Small group (up to 6 learners)</option></select></label>
          <label>Start time<input required type="datetime-local" min={toLocalDateTimeInput(new Date(Date.now() + 5 * 60 * 1000))} value={sessionForm.scheduledAt} onChange={(event) => setSessionForm({ ...sessionForm, scheduledAt: event.target.value })} /><small className="mentor-help">Choose a time at least 5 minutes ahead. Times are shown in your local time zone.</small></label>
          <label>Duration (minutes)<input required type="number" min="15" max="240" value={sessionForm.durationMinutes} onChange={(event) => setSessionForm({ ...sessionForm, durationMinutes: event.target.value })} /></label>
          <label>Maximum learners<input required type="number" min="1" max={sessionForm.format === "small_group" ? "6" : sessionForm.format === "one_to_one" ? "1" : "1000"} value={sessionForm.maxParticipants} onChange={(event) => setSessionForm({ ...sessionForm, maxParticipants: event.target.value })} /></label>
          <label className="full-row">Description<textarea rows="3" maxLength="2000" value={sessionForm.description} onChange={(event) => setSessionForm({ ...sessionForm, description: event.target.value })} placeholder="What will learners practice?" /></label>
          <button className="mentor-btn primary" disabled={saving}>{saving ? "Scheduling…" : "Schedule session"}</button>
        </form>
      </section>}
      <section className="mentor-panel"><div className="mentor-panel-heading"><div><h2>{isMentor ? "Your sessions" : "Upcoming sessions"}</h2><p>Students can join 15 minutes early, or as soon as the mentor starts the session.</p></div><button className="mentor-btn secondary" onClick={load}>Refresh</button></div>
        {loading ? <div className="mentor-empty">Loading sessions…</div> : sessions.length === 0 ? <div className="mentor-empty">No upcoming sessions yet. Approved mentors can schedule one here.</div> : <div className="mentor-session-list">{sessions.map((session) => <article className="mentor-session-card" key={session.id}>
          <div className="mentor-session-icon"><FaVideo /></div><div className="mentor-session-main"><div className="mentor-session-title"><h3>{session.title}</h3><span className={`mentor-format ${session.format}`}>{formatNames[session.format]}</span></div><p>{session.description || session.topic}</p><div className="mentor-session-meta"><span><FaChalkboardTeacher /> {session.mentor_name || (session.mentor_id === user?.id ? "You" : "Mentor")}</span><span><FaClock /> {when(session.scheduled_at)}</span><span><FaUsers /> {session.enrolled_count}/{session.max_participants} learners</span></div></div>
          <div className="mentor-session-actions">{!isSessionHost(session) && !session.enrolled && session.status === "scheduled" && <button className="mentor-btn secondary" onClick={() => enroll(session)}>Enroll</button>}
            {isSessionHost(session) && session.status === "scheduled" && !isJoinTime(session) && Date.now() <= new Date(session.scheduled_at).getTime() + (session.duration_minutes + 30) * 60000 && <Link className="mentor-btn primary" to={`/mentorship/room/${session.id}`}>Start session early</Link>}
            {(session.enrolled || isSessionHost(session)) && isJoinTime(session) && <Link className="mentor-btn primary" to={`/mentorship/room/${session.id}`}>Join room</Link>}
            {session.status === "live" && <span className="mentor-live">LIVE</span>}</div>
        </article>)}</div>}
      </section>
    </>}
  </section>;
}

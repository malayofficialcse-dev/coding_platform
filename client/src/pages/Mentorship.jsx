import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import { FaChalkboardTeacher, FaCheck, FaComments, FaSearch, FaTimes, FaUserGraduate } from "react-icons/fa";
import api from "../api/api";
import { useAuth } from "../contexts/AuthContext";
import "./Mentorship.css";

const emptyProfile = {
  mode: "seeking", headline: "", bio: "", skills: [], interests: [], goals: [],
  mentoringTopics: [], preferredLanguages: [], availability: "Flexible", capacity: 3, active: true,
};
const listFields = ["skills", "interests", "goals", "mentoringTopics", "preferredLanguages"];
const labels = { skills: "Skills", interests: "Interests", goals: "Learning goals", mentoringTopics: "Topics I can mentor", preferredLanguages: "Preferred languages" };
const split = (items) => Array.isArray(items) ? items.join(", ") : "";

export default function Mentorship() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [tab, setTab] = useState(searchParams.get("tab") === "requests" ? "requests" : searchParams.get("tab") === "connections" ? "connections" : "discover");
  const [profile, setProfile] = useState(emptyProfile);
  const [savedProfile, setSavedProfile] = useState(false);
  const [matches, setMatches] = useState([]);
  const [incoming, setIncoming] = useState([]);
  const [outgoing, setOutgoing] = useState([]);
  const [connections, setConnections] = useState([]);
  const [query, setQuery] = useState("");
  const [requestTarget, setRequestTarget] = useState(null);
  const [requestGoal, setRequestGoal] = useState("");
  const [requestMessage, setRequestMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const refresh = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [profileResult, matchesResult, incomingResult, outgoingResult, connectionsResult] = await Promise.allSettled([
        api.get("/mentorship/profile"), api.get("/mentorship/matches"),
        api.get("/mentorship/requests?box=incoming"), api.get("/mentorship/requests?box=outgoing"),
        api.get("/mentorship/requests?box=connections"),
      ]);
      const currentProfile = profileResult.status === "fulfilled" ? profileResult.value.data : null;
      setSavedProfile(Boolean(currentProfile));
      setProfile({ ...emptyProfile, ...(currentProfile || {}) });
      if (matchesResult.status === "fulfilled") setMatches(matchesResult.value.data?.matches || []);
      if (incomingResult.status === "fulfilled") setIncoming(incomingResult.value.data || []);
      if (outgoingResult.status === "fulfilled") setOutgoing(outgoingResult.value.data || []);
      if (connectionsResult.status === "fulfilled") setConnections(connectionsResult.value.data || []);
      const failed = [profileResult, matchesResult, incomingResult, outgoingResult, connectionsResult].find((item) => item.status === "rejected");
      if (failed) toast.error(failed.reason?.response?.data?.error || "Some mentorship information could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { refresh(); }, [refresh]);
  useEffect(() => {
    const nextTab = searchParams.get("tab");
    if (["requests", "connections", "discover"].includes(nextTab)) setTab(nextTab);
  }, [searchParams]);

  const changeTab = (nextTab) => {
    setTab(nextTab);
    setSearchParams(nextTab === "discover" ? {} : { tab: nextTab });
    setRequestTarget(null);
  };

  const updateList = (key, value) => setProfile((current) => ({
    ...current,
    [key]: value.split(",").map((item) => item.trim()).filter(Boolean),
  }));

  const saveProfile = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      const response = await api.put("/mentorship/profile", profile);
      setProfile({ ...emptyProfile, ...response.data });
      setSavedProfile(true);
      toast.success("Mentorship profile saved");
      await refresh();
    } catch (error) {
      toast.error(error.response?.data?.error || "Could not save your mentorship profile");
    } finally {
      setSaving(false);
    }
  };

  const submitRequest = async (event) => {
    event.preventDefault();
    if (!requestTarget) return;
    try {
      await api.post("/mentorship/requests", { mentorId: requestTarget.mentor.id, goal: requestGoal, message: requestMessage });
      toast.success("Mentorship request sent");
      setRequestTarget(null);
      setRequestMessage("");
      await refresh();
    } catch (error) {
      toast.error(error.response?.data?.error || "Could not send request");
    }
  };

  const updateRequest = async (request, status) => {
    try {
      await api.patch(`/mentorship/requests/${request.id}`, { status });
      toast.success(status === "accepted" ? "Request accepted" : status === "declined" ? "Request declined" : "Request cancelled");
      await refresh();
    } catch (error) {
      toast.error(error.response?.data?.error || "Could not update request");
    }
  };

  const visibleMatches = useMemo(() => matches.filter(({ mentor, profile: mentorProfile }) =>
    [mentor?.name, mentor?.username, mentor?.college, mentorProfile?.headline,
      ...(mentorProfile?.skills || []), ...(mentorProfile?.mentoringTopics || [])]
      .filter(Boolean).join(" ").toLowerCase().includes(query.trim().toLowerCase())
  ), [matches, query]);

  return (
    <section className="mentorship-page">
      <header className="mentorship-hero">
        <div className="mentorship-hero-icon"><FaChalkboardTeacher /></div>
        <div><p className="mentorship-eyebrow">CODE CAMPUS COMMUNITY</p><h1>Mentorship</h1>
          <p>Find guidance, share what you know, and make progress together.</p></div>
      </header>

      <nav className="mentorship-tabs" aria-label="Mentorship sections">
        <button className={tab === "discover" ? "active" : ""} onClick={() => changeTab("discover")}><FaSearch /> Find a mentor</button>
        <button className={tab === "requests" ? "active" : ""} onClick={() => changeTab("requests")}>Requests <span>{incoming.filter((item) => item.status === "pending").length}</span></button>
        <button className={tab === "connections" ? "active" : ""} onClick={() => changeTab("connections")}>Connections <span>{connections.length}</span></button>
      </nav>

      <div className="mentorship-layout">
        <aside className="mentorship-profile-card">
          <div className="mentorship-card-heading"><div><h2>Your mentorship profile</h2><p>Set what you need or what you can offer.</p></div><FaUserGraduate /></div>
          <form onSubmit={saveProfile} className="mentorship-form">
            <label>I'm here to
              <select value={profile.mode} onChange={(event) => setProfile({ ...profile, mode: event.target.value })}>
                <option value="seeking">Find a mentor</option><option value="mentor">Mentor others</option><option value="both">Both</option>
              </select>
            </label>
            <label>Headline<input maxLength="120" value={profile.headline} onChange={(event) => setProfile({ ...profile, headline: event.target.value })} placeholder="e.g. Building my first full-stack app" /></label>
            <label>About<textarea maxLength="1200" rows="3" value={profile.bio} onChange={(event) => setProfile({ ...profile, bio: event.target.value })} placeholder="Share a little about your experience and what you hope to achieve." /></label>
            {listFields.map((key) => <label key={key}>{labels[key]} <span className="mentorship-field-hint">(comma separated)</span>
              <input value={split(profile[key])} onChange={(event) => updateList(key, event.target.value)} placeholder={key === "goals" ? "Interview prep, React project" : "JavaScript, React, UI design"} />
            </label>)}
            <div className="mentorship-form-row">
              <label>Availability<input maxLength="120" value={profile.availability} onChange={(event) => setProfile({ ...profile, availability: event.target.value })} placeholder="Weekends, evenings" /></label>
              {profile.mode !== "seeking" && <label>Mentor capacity<input type="number" min="0" max="20" value={profile.capacity} onChange={(event) => setProfile({ ...profile, capacity: Number(event.target.value) })} /></label>}
            </div>
            <label className="mentorship-active"><input type="checkbox" checked={profile.active} onChange={(event) => setProfile({ ...profile, active: event.target.checked })} /> Show my profile in mentorship</label>
            <button className="mentorship-primary" disabled={saving}>{saving ? "Saving…" : savedProfile ? "Save changes" : "Create profile"}</button>
          </form>
        </aside>

        <main className="mentorship-results">
          {tab === "discover" && <>
            <div className="mentorship-section-heading"><div><h2>Recommended mentors</h2><p>Matches are based on your goals, skills, and interests.</p></div>
              <label className="mentorship-search"><FaSearch /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search people or topics" /></label>
            </div>
            {!savedProfile && <div className="mentorship-notice">Create your mentorship profile to get recommendations matched to your goals.</div>}
            {loading ? <div className="mentorship-empty">Loading mentorship matches…</div> : visibleMatches.length === 0 ?
              <div className="mentorship-empty"><FaChalkboardTeacher /><h3>No mentors match yet</h3><p>Try adding goals or interests to your profile, or check back as more people join.</p></div> :
              <div className="mentorship-match-list">{visibleMatches.map((match) => <article className="mentor-card" key={match.mentor.id}>
                <img src={match.mentor.profileImage || "/default-avatar.svg"} alt="" />
                <div className="mentor-card-main"><div className="mentor-name-row"><h3>{match.mentor.name}</h3><span>{match.mentor.college || "Code Campus"}</span></div>
                  <p className="mentor-headline">{match.profile.headline || match.profile.mentoringTopics?.join(" · ") || "Available to mentor"}</p>
                  {match.profile.bio && <p className="mentor-bio">{match.profile.bio}</p>}
                  <div className="mentor-tags">{(match.profile.mentoringTopics || []).slice(0, 5).map((topic) => <span key={topic}>{topic}</span>)}</div>
                  <p className="mentor-reasons">{match.reasons.join(" · ")}</p>
                  <p className="mentor-availability">Available: {match.profile.availability || "Flexible"}</p>
                </div>
                <div className="mentor-card-action">{match.requestStatus === "accepted" ? <span className="mentorship-status accepted"><FaCheck /> Connected</span> : match.requestStatus === "pending" ? <span className="mentorship-status">Request sent</span> : <button className="mentorship-primary" onClick={() => { setRequestTarget(match); setRequestGoal(profile.goals?.[0] || ""); }}>Request mentorship</button>}</div>
              </article>)}</div>}
            {requestTarget && <div className="mentorship-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setRequestTarget(null); }}><form className="mentorship-request-modal" onSubmit={submitRequest}>
              <button className="mentorship-modal-close" type="button" onClick={() => setRequestTarget(null)} aria-label="Close"><FaTimes /></button>
              <p className="mentorship-eyebrow">MENTORSHIP REQUEST</p><h2>Message {requestTarget.mentor.name}</h2>
              <label>What do you want help with?<input required maxLength="180" value={requestGoal} onChange={(event) => setRequestGoal(event.target.value)} placeholder="e.g. Prepare for a frontend interview" /></label>
              <label>Introduce yourself<textarea maxLength="1200" rows="4" value={requestMessage} onChange={(event) => setRequestMessage(event.target.value)} placeholder="Share your experience and what kind of guidance would help." /></label>
              <button className="mentorship-primary" type="submit">Send request</button>
            </form></div>}
          </>}

          {tab === "requests" && <>
            <div className="mentorship-section-heading"><div><h2>Mentorship requests</h2><p>Review requests and see the ones you sent.</p></div></div>
            <h3 className="mentorship-subheading">Received</h3>
            {incoming.length === 0 ? <div className="mentorship-empty compact">No incoming requests yet.</div> : incoming.map((item) => <article className="request-card" key={item.id}>
              <img src={item.counterpart?.profileImage || "/default-avatar.svg"} alt="" /><div className="request-card-main"><h3>{item.counterpart?.name || "Code Campus member"}</h3><p><strong>Goal:</strong> {item.goal}</p>{item.message && <p>{item.message}</p>}<span>{new Date(item.createdAt).toLocaleDateString()}</span></div>
              {item.status === "pending" ? <div className="request-actions"><button className="mentorship-primary" onClick={() => updateRequest(item, "accepted")}>Accept</button><button className="mentorship-secondary" onClick={() => updateRequest(item, "declined")}>Decline</button></div> : <span className={`mentorship-status ${item.status}`}>{item.status}</span>}
            </article>)}
            <h3 className="mentorship-subheading outgoing-heading">Sent</h3>
            {outgoing.length === 0 ? <div className="mentorship-empty compact">You have not sent any requests.</div> : outgoing.map((item) => <article className="request-card" key={item.id}>
              <img src={item.counterpart?.profileImage || "/default-avatar.svg"} alt="" /><div className="request-card-main"><h3>{item.counterpart?.name || "Mentor"}</h3><p><strong>Goal:</strong> {item.goal}</p><span>{new Date(item.createdAt).toLocaleDateString()}</span></div>
              <span className={`mentorship-status ${item.status}`}>{item.status}</span>{item.status === "pending" && <button className="mentorship-secondary" onClick={() => updateRequest(item, "cancelled")}>Cancel</button>}
            </article>)}
          </>}

          {tab === "connections" && <>
            <div className="mentorship-section-heading"><div><h2>Your mentorship connections</h2><p>Accepted requests are ready for a conversation.</p></div></div>
            {connections.length === 0 ? <div className="mentorship-empty"><FaUserGraduate /><h3>No connections yet</h3><p>When a mentor accepts your request, they will appear here.</p></div> : connections.map((item) => <article className="request-card" key={item.id}>
              <img src={item.counterpart?.profileImage || "/default-avatar.svg"} alt="" /><div className="request-card-main"><h3>{item.counterpart?.name || "Code Campus member"}</h3><p><strong>Goal:</strong> {item.goal}</p><span>Connected {new Date(item.respondedAt || item.updatedAt).toLocaleDateString()}</span></div>
              <Link className="mentorship-primary mentorship-link-button" to="/messages"><FaComments /> Open messages</Link>
            </article>)}
          </>}
        </main>
      </div>
    </section>
  );
}

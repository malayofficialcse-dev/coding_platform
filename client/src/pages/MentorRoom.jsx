import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { io } from "socket.io-client";
import { toast } from "react-toastify";
import api from "../api/api";
import { useAuth } from "../contexts/AuthContext";
import "./MentorRoom.css";

const socketOrigin = () => {
  const configured = import.meta.env.VITE_API_URL;
  if (!configured) return window.location.origin;
  try { return new URL(configured).origin; } catch { return window.location.origin; }
};

function TrackTile({ participant, publication }) {
  const element = useRef(null);
  useEffect(() => {
    const track = publication?.track;
    if (!track || !element.current) return undefined;
    const attached = track.attach();
    attached.autoplay = true;
    if (attached instanceof HTMLVideoElement) attached.playsInline = true;
    if (attached instanceof HTMLAudioElement) attached.style.display = "none";
    element.current.appendChild(attached);
    return () => { track.detach(attached); attached.remove(); };
  }, [publication?.track]);
  if (publication?.kind === "audio") return <div className="live-audio" ref={element} />;
  return <div className="live-tile"><div ref={element} className="live-track" /><span>{participant.name || participant.identity}{publication?.source === "screen_share" ? " · screen" : ""}</span></div>;
}

export default function MentorRoom() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [room, setRoom] = useState(null);
  const [session, setSession] = useState(null);
  const [connected, setConnected] = useState(false);
  const [trackRevision, setTrackRevision] = useState(0);
  const [socket, setSocket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [polls, setPolls] = useState([]);
  const [pollQuestion, setPollQuestion] = useState("");
  const [pollOptions, setPollOptions] = useState("Yes,No");
  const [joining, setJoining] = useState(true);
  const isHost = useMemo(() => session?.mentorId === (user?.id || user?._id), [session, user]);

  useEffect(() => {
    let active = true;
    let nextRoom;
    const join = async () => {
      try {
        const response = await api.post(`/mentor/sessions/${id}/join-token`);
        if (!active) return;
        setSession(response.data.session);
        const { Room, RoomEvent } = await import("livekit-client");
        nextRoom = new Room({ adaptiveStream: true, dynacast: true, stopLocalTrackOnUnpublish: true });
        const refreshTracks = () => setTrackRevision((revision) => revision + 1);
    [RoomEvent.TrackSubscribed, RoomEvent.TrackUnsubscribed, RoomEvent.TrackPublished, RoomEvent.TrackUnpublished,
          RoomEvent.ParticipantConnected, RoomEvent.ParticipantDisconnected, RoomEvent.LocalTrackPublished,
          RoomEvent.LocalTrackUnpublished, RoomEvent.Disconnected].forEach((event) => nextRoom.on(event, refreshTracks));
        await nextRoom.connect(response.data.url, response.data.token);
        if (!active) { nextRoom.disconnect(); return; }
        setRoom(nextRoom); setConnected(true); setJoining(false);
        const nextSocket = io(socketOrigin(), { path: "/mentor-socket.io", auth: { token: localStorage.getItem("token") }, transports: ["websocket", "polling"] });
        nextSocket.on("connect", () => nextSocket.emit("session:join", { sessionId: id }, (ack) => { if (ack?.error) toast.error(ack.error); }));
        nextSocket.on("session:chat", (item) => setMessages((items) => [...items, item]));
        nextSocket.on("session:poll", (item) => setPolls((items) => [item, ...items.filter((poll) => poll.id !== item.id)]));
        nextSocket.on("session:poll-results", ({ pollId, results }) => setPolls((items) => items.map((poll) => poll.id === pollId ? { ...poll, results } : poll)));
        nextSocket.on("session:ended", () => { toast.info("The mentor ended this session."); navigate("/mentorship"); });
        setSocket(nextSocket);
        const [messagesResponse, pollsResponse] = await Promise.all([api.get(`/mentor/sessions/${id}/messages`), api.get(`/mentor/sessions/${id}/polls`)]);
        if (active) { setMessages(messagesResponse.data || []); setPolls(pollsResponse.data || []); }
      } catch (error) {
        if (active) { toast.error(error.response?.data?.error || "Could not join this session."); navigate("/mentorship"); }
      } finally { if (active) setJoining(false); }
    };
    join();
    return () => { active = false; nextRoom?.disconnect(); };
  }, [id, navigate]);

  useEffect(() => () => socket?.disconnect(), [socket]);

  const participants = useMemo(() => {
    if (!room) return [];
    return [room.localParticipant, ...room.remoteParticipants.values()].map((participant) => ({
      participant,
      tracks: [...participant.videoTrackPublications.values(), ...participant.audioTrackPublications.values()].filter((publication) => publication.track),
    }));
  }, [room, trackRevision]);

  const toggleMic = async () => { try { await room.localParticipant.setMicrophoneEnabled(!room.localParticipant.isMicrophoneEnabled); setTrackRevision((r) => r + 1); } catch { toast.error("Microphone permission was denied."); } };
  const toggleCamera = async () => { try { await room.localParticipant.setCameraEnabled(!room.localParticipant.isCameraEnabled); setTrackRevision((r) => r + 1); } catch { toast.error("Camera permission was denied."); } };
  const shareScreen = async () => { try { await room.localParticipant.setScreenShareEnabled(!room.localParticipant.isScreenShareEnabled); setTrackRevision((r) => r + 1); } catch { toast.error("Screen sharing is unavailable or permission was denied."); } };
  const sendMessage = (event) => {
    event.preventDefault(); if (!message.trim() || !socket) return;
    socket.emit("session:chat", { sessionId: id, body: message }, (ack) => { if (ack?.error) toast.error(ack.error); });
    setMessage("");
  };
  const createPoll = async (event) => {
    event.preventDefault();
    try {
      const response = await api.post(`/mentor/sessions/${id}/polls`, { question: pollQuestion, options: pollOptions.split(",").map((x) => x.trim()).filter(Boolean) });
      setPolls((items) => [response.data, ...items]); setPollQuestion(""); setPollOptions("Yes,No");
    } catch (error) { toast.error(error.response?.data?.error || "Could not create poll."); }
  };
  const vote = async (poll, optionIndex) => {
    try {
      const response = await api.post(`/mentor/polls/${poll.id}/vote`, { optionIndex });
      setPolls((items) => items.map((item) => item.id === poll.id ? { ...item, my_vote: optionIndex, results: response.data.results } : item));
    } catch (error) { toast.error(error.response?.data?.error || "Could not submit vote."); }
  };
  const leave = async (end = false) => {
    if (end && isHost) {
      try { await api.post(`/mentor/sessions/${id}/end`); }
      catch (error) { toast.error(error.response?.data?.error || "Could not end the session."); return; }
    }
    room?.disconnect(); socket?.disconnect(); navigate("/mentorship");
  };

  if (joining) return <main className="mentor-room-loading">Connecting to your session…</main>;
  return <main className="mentor-room-page">
    <header className="mentor-room-header"><div><Link to="/mentorship">← Sessions</Link><h1>Live mentoring room</h1><p>{connected ? "Connected" : "Reconnecting…"} · Share your screen, ask questions, and use the live chat.</p></div>
      <div className="mentor-room-controls"><button onClick={toggleMic} disabled={!room}>Mic</button><button onClick={toggleCamera} disabled={!room}>Camera</button><button onClick={shareScreen} disabled={!room}>Share screen</button><button className="leave" onClick={() => leave(false)}>Leave</button>{isHost && <button className="end" onClick={() => leave(true)}>End session</button>}</div>
    </header>
    <div className="mentor-room-grid"><section className="mentor-room-stage"><h2>{session?.title}</h2><div className="live-tiles">{participants.flatMap(({ participant, tracks }) => tracks.map((publication) => <TrackTile key={`${participant.identity}-${publication.trackSid}`} participant={participant} publication={publication} />))}{participants.every(({ tracks }) => tracks.every((publication) => publication.kind === "audio")) && <div className="mentor-room-empty">Camera is off. Turn it on to appear here.</div>}</div>
      {isHost && <form className="mentor-poll-create" onSubmit={createPoll}><h3>Create a live poll</h3><input required value={pollQuestion} onChange={(event) => setPollQuestion(event.target.value)} placeholder="Question for learners" /><input required value={pollOptions} onChange={(event) => setPollOptions(event.target.value)} placeholder="Option A, Option B" /><button>Create poll</button></form>}
      <div className="mentor-polls"><h3>Live polls</h3>{polls.length === 0 ? <p>No polls yet. Your mentor can create one during the session.</p> : polls.map((poll) => <article className="mentor-poll" key={poll.id}><strong>{poll.question}</strong>{poll.options.map((option, index) => { const result = poll.results?.find((item) => Number(item.option_index) === index); return <button key={`${poll.id}-${index}`} className={Number(poll.my_vote) === index ? "voted" : ""} onClick={() => vote(poll, index)} disabled={isHost}>{option}<span>{result?.count || 0}</span></button>; })}</article>)}</div>
    </section><aside className="mentor-live-chat"><h2>Session chat</h2><div className="mentor-chat-messages">{messages.map((item) => <article key={item.id}><strong>{item.user_name}</strong><p>{item.body}</p><time>{new Date(item.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</time></article>)}</div><form onSubmit={sendMessage}><input value={message} onChange={(event) => setMessage(event.target.value)} maxLength="2000" placeholder="Write a message…" /><button disabled={!message.trim()}>Send</button></form></aside></div>
  </main>;
}

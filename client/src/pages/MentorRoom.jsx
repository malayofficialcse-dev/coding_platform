import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { io } from "socket.io-client";
import { getAccessToken } from "../api/accessToken";
import { toast } from "react-toastify";
import api, { refreshSession } from "../api/api";
import { useAuth } from "../contexts/AuthContext";
import "./MentorRoom.css";

/* ── Socket origin ─────────────────────────────────────────── */
const socketOrigin = () => {
  const c = import.meta.env.VITE_API_URL;
  if (!c) return window.location.origin;
  try { return new URL(c).origin; } catch { return window.location.origin; }
};

/* ── Remote Track Tile (LiveKit) ──────────────────────────── */
function TrackTile({ participant, publication, isHost, isPinned, onPin }) {
  const ref = useRef(null);

  useEffect(() => {
    const track = publication?.track;
    if (!track || !ref.current) return;
    const el = track.attach();
    el.autoplay = true;
    if (el instanceof HTMLVideoElement) el.playsInline = true;
    if (el instanceof HTMLAudioElement) el.style.display = "none";
    ref.current.appendChild(el);
    return () => {
      try { track.detach(el); el.remove(); } catch {}
    };
  }, [publication?.track]);

  if (publication?.kind === "audio") {
    return <div ref={ref} style={{ display: "none" }} />;
  }

  const name = participant.name || participant.identity || "Participant";
  const isScreen = publication?.source === "screen_share";

  return (
    <div
      className={`mr-tile ${isPinned ? "mr-tile--pinned" : ""} ${isScreen ? "mr-tile--screen" : ""}`}
      onClick={() => onPin && onPin(participant.identity)}
    >
      <div ref={ref} className="mr-tile-video" />
      {!publication?.track && (
        <div className="mr-tile-avatar">
          <span>{name[0].toUpperCase()}</span>
        </div>
      )}
      <div className="mr-tile-overlay">
        <span className="mr-tile-name">
          {name}
          {isHost && <span className="mr-tile-host-tag">HOST</span>}
          {isScreen && " · Screen"}
        </span>
      </div>
    </div>
  );
}

/* ── Local Stream Tile (Native Media Fallback) ─────────────── */
function LocalStreamTile({ stream, isScreen = false, label = "You", isHost = false, onPin, isPinned = false }) {
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div
      className={`mr-tile ${isPinned ? "mr-tile--pinned" : ""} ${isScreen ? "mr-tile--screen" : ""}`}
      onClick={() => onPin && onPin(isScreen ? "screen" : "local")}
    >
      <div className="mr-tile-video">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={!isScreen}
          style={{ transform: !isScreen ? "scaleX(-1)" : "none" }}
        />
      </div>
      <div className="mr-tile-overlay">
        <span className="mr-tile-name">
          {label}
          {isHost && <span className="mr-tile-host-tag">HOST</span>}
          {isScreen && " · Screen Share"}
        </span>
      </div>
    </div>
  );
}

/* ── Poll Component ────────────────────────────────────────── */
function PollCard({ poll, isHost, onVote }) {
  const total = poll.results?.reduce((s, r) => s + (r.count || 0), 0) || 0;
  return (
    <div className="mr-poll-card">
      <p className="mr-poll-q">{poll.question}</p>
      <div className="mr-poll-options">
        {poll.options.map((opt, i) => {
          const res = poll.results?.find((r) => Number(r.option_index) === i);
          const pct = total > 0 ? Math.round(((res?.count || 0) / total) * 100) : 0;
          const voted = Number(poll.my_vote) === i;
          return (
            <button
              key={i}
              className={`mr-poll-opt ${voted ? "mr-poll-opt--voted" : ""}`}
              onClick={() => !isHost && onVote(poll, i)}
              disabled={isHost}
            >
              <div className="mr-poll-fill" style={{ width: `${pct}%` }} />
              <span className="mr-poll-text">{opt}</span>
              <span className="mr-poll-pct">{pct}%</span>
            </button>
          );
        })}
      </div>
      <p className="mr-poll-total">{total} votes</p>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────── */
export default function MentorRoom() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [room, setRoom] = useState(null);
  const [session, setSession] = useState(null);
  const [isLiveKitMode, setIsLiveKitMode] = useState(false);
  const [connected, setConnected] = useState(false);
  const [trackRevision, setTrackRevision] = useState(0);
  const [socket, setSocket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [polls, setPolls] = useState([]);
  const [pollQuestion, setPollQuestion] = useState("");
  const [pollOptions, setPollOptions] = useState("Yes,No");
  const [joining, setJoining] = useState(true);
  const [sidebarTab, setSidebarTab] = useState("chat"); // chat | polls | questions
  const [pinnedId, setPinnedId] = useState(null);
  const [micOn, setMicOn] = useState(false);
  const [camOn, setCamOn] = useState(false);
  const [screenOn, setScreenOn] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [raisedHands, setRaisedHands] = useState([]);
  const [myHandRaised, setMyHandRaised] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [qInput, setQInput] = useState("");
  const [peers, setPeers] = useState([]);
  const [localStream, setLocalStream] = useState(null);
  const [screenStream, setScreenStream] = useState(null);

  const chatBottomRef = useRef(null);
  const elapsedRef = useRef(null);

  const isHost = useMemo(
    () => session?.mentorId === (user?.id || user?._id),
    [session, user]
  );

  /* auto-scroll chat */
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  /* elapsed timer */
  useEffect(() => {
    if (!connected) return;
    elapsedRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(elapsedRef.current);
  }, [connected]);

  /* cleanup media tracks */
  useEffect(() => {
    return () => {
      localStream?.getTracks().forEach((t) => t.stop());
      screenStream?.getTracks().forEach((t) => t.stop());
    };
  }, [localStream, screenStream]);

  const formatElapsed = (s) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return h > 0
      ? `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`
      : `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  };

  /* join room */
  useEffect(() => {
    let active = true;
    let nextRoom = null;

    const join = async () => {
      try {
        const res = await api.post(`/mentor/sessions/${id}/join-token`);
        if (!active) return;
        setSession(res.data.session);

        if (res.data.url && res.data.token) {
          setIsLiveKitMode(true);
          try {
            const { Room, RoomEvent } = await import("livekit-client");
            nextRoom = new Room({ adaptiveStream: true, dynacast: true, stopLocalTrackOnUnpublish: true });

            const refresh = () => setTrackRevision((r) => r + 1);
            [
              RoomEvent.TrackSubscribed, RoomEvent.TrackUnsubscribed,
              RoomEvent.TrackPublished, RoomEvent.TrackUnpublished,
              RoomEvent.ParticipantConnected, RoomEvent.ParticipantDisconnected,
              RoomEvent.LocalTrackPublished, RoomEvent.LocalTrackUnpublished,
              RoomEvent.Disconnected,
            ].forEach((ev) => nextRoom.on(ev, refresh));

            await nextRoom.connect(res.data.url, res.data.token);
            if (!active) { nextRoom.disconnect(); return; }
            setRoom(nextRoom);
          } catch (lkErr) {
            console.warn("LiveKit client connect failed, using browser media:", lkErr.message);
            setIsLiveKitMode(false);
          }
        } else {
          setIsLiveKitMode(false);
        }

        setConnected(true);
        setJoining(false);

        /* socket setup */
        const nextSocket = io(socketOrigin(), {
          path: "/mentor-socket.io",
          auth: { token: getAccessToken() },
          transports: ["websocket", "polling"],
        });

        nextSocket.on("connect_error", async (err) => {
          if (!/unauthorized|token|jwt|expired/i.test(err.message || "")) return;
          try {
            const { accessToken } = await refreshSession();
            nextSocket.auth = { token: accessToken };
            nextSocket.disconnect().connect();
          } catch { nextSocket.disconnect(); }
        });

        nextSocket.on("connect", () => {
          nextSocket.emit("session:join", { sessionId: id }, (ack) => {
            if (ack?.error) {
              toast.error(ack.error);
            } else if (ack?.peers) {
              setPeers(ack.peers);
            }
          });
        });

        nextSocket.on("session:peer-joined", (data) => {
          if (data?.peers) setPeers(data.peers);
          else if (data?.userId) setPeers((prev) => [...prev.filter((p) => p.userId !== data.userId), data]);
        });

        nextSocket.on("session:peer-left", ({ userId }) => {
          setPeers((prev) => prev.filter((p) => p.userId !== userId));
        });

        nextSocket.on("session:chat", (item) =>
          setMessages((prev) => [...prev, item])
        );

        nextSocket.on("session:poll", (item) =>
          setPolls((prev) => [item, ...prev.filter((p) => p.id !== item.id)])
        );

        nextSocket.on("session:poll-results", ({ pollId, results }) =>
          setPolls((prev) => prev.map((p) => (p.id === pollId ? { ...p, results } : p)))
        );

        nextSocket.on("session:ended", () => {
          toast.info("The mentor ended this session.");
          navigate("/mentorship");
        });

        nextSocket.on("session:hand-raised", ({ userId, userName }) => {
          setRaisedHands((prev) => [...prev.filter((h) => h.userId !== userId), { userId, userName }]);
        });

        nextSocket.on("session:hand-lowered", ({ userId }) => {
          setRaisedHands((prev) => prev.filter((h) => h.userId !== userId));
        });

        nextSocket.on("session:question", (q) =>
          setQuestions((prev) => [q, ...prev])
        );

        setSocket(nextSocket);

        /* load history */
        const [msgRes, pollRes] = await Promise.all([
          api.get(`/mentor/sessions/${id}/messages`).catch(() => ({ data: [] })),
          api.get(`/mentor/sessions/${id}/polls`).catch(() => ({ data: [] })),
        ]);
        if (active) {
          setMessages(msgRes.data || []);
          setPolls(pollRes.data || []);
        }
      } catch (err) {
        if (active) {
          toast.error(err.response?.data?.error || "Could not join this session.");
          navigate("/mentorship");
        }
      } finally {
        if (active) setJoining(false);
      }
    };

    join();
    return () => {
      active = false;
      nextRoom?.disconnect();
    };
  }, [id, navigate]);

  useEffect(() => () => socket?.disconnect(), [socket]);

  /* participants list */
  const participants = useMemo(() => {
    if (room) {
      return [room.localParticipant, ...room.remoteParticipants.values()].map((p) => ({
        participant: p,
        tracks: [
          ...p.videoTrackPublications.values(),
          ...p.audioTrackPublications.values(),
        ].filter((pub) => pub.track),
      }));
    }
    return peers;
  }, [room, trackRevision, peers]);

  /* controls */
  const toggleMic = async () => {
    try {
      if (room?.localParticipant) {
        const next = !room.localParticipant.isMicrophoneEnabled;
        await room.localParticipant.setMicrophoneEnabled(next);
        setMicOn(next);
        setTrackRevision((r) => r + 1);
      } else {
        if (localStream) {
          const audioTracks = localStream.getAudioTracks();
          if (audioTracks.length > 0) {
            const next = !audioTracks[0].enabled;
            audioTracks.forEach((t) => (t.enabled = next));
            setMicOn(next);
          } else {
            const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const track = audioStream.getAudioTracks()[0];
            localStream.addTrack(track);
            setMicOn(true);
          }
        } else {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          setLocalStream(stream);
          setMicOn(true);
        }
      }
    } catch {
      toast.error("Microphone permission denied or unavailable.");
    }
  };

  const toggleCamera = async () => {
    try {
      if (room?.localParticipant) {
        const next = !room.localParticipant.isCameraEnabled;
        await room.localParticipant.setCameraEnabled(next);
        setCamOn(next);
        setTrackRevision((r) => r + 1);
      } else {
        if (camOn) {
          if (localStream) {
            localStream.getVideoTracks().forEach((t) => t.stop());
            const remaining = localStream.getAudioTracks();
            if (remaining.length > 0) {
              setLocalStream(new MediaStream(remaining));
            } else {
              setLocalStream(null);
            }
          }
          setCamOn(false);
        } else {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: { width: { ideal: 1280 }, height: { ideal: 720 } },
            audio: micOn,
          });
          setLocalStream(stream);
          setCamOn(true);
        }
      }
    } catch {
      toast.error("Camera permission denied or unavailable.");
    }
  };

  const toggleScreen = async () => {
    try {
      if (room?.localParticipant) {
        const next = !room.localParticipant.isScreenShareEnabled;
        await room.localParticipant.setScreenShareEnabled(next);
        setScreenOn(next);
        setTrackRevision((r) => r + 1);
      } else {
        if (screenOn) {
          if (screenStream) {
            screenStream.getTracks().forEach((t) => t.stop());
          }
          setScreenStream(null);
          setScreenOn(false);
        } else {
          const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
          stream.getVideoTracks()[0].onended = () => {
            setScreenStream(null);
            setScreenOn(false);
          };
          setScreenStream(stream);
          setScreenOn(true);
        }
      }
    } catch {
      toast.error("Screen sharing cancelled or unavailable.");
    }
  };

  const sendMessage = (e) => {
    e.preventDefault();
    if (!message.trim() || !socket) return;
    socket.emit("session:chat", { sessionId: id, body: message }, (ack) => {
      if (ack?.error) toast.error(ack.error);
    });
    setMessage("");
  };

  const createPoll = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post(`/mentor/sessions/${id}/polls`, {
        question: pollQuestion,
        options: pollOptions.split(",").map((x) => x.trim()).filter(Boolean),
      });
      setPolls((prev) => [res.data, ...prev]);
      setPollQuestion(""); setPollOptions("Yes,No");
      setSidebarTab("polls");
    } catch (err) { toast.error(err.response?.data?.error || "Could not create poll."); }
  };

  const vote = async (poll, optionIndex) => {
    try {
      const res = await api.post(`/mentor/polls/${poll.id}/vote`, { optionIndex });
      setPolls((prev) =>
        prev.map((p) =>
          p.id === poll.id ? { ...p, my_vote: optionIndex, results: res.data.results } : p
        )
      );
    } catch (err) { toast.error(err.response?.data?.error || "Could not vote."); }
  };

  const raiseHand = () => {
    const next = !myHandRaised;
    setMyHandRaised(next);
    socket?.emit(next ? "session:raise-hand" : "session:lower-hand", { sessionId: id });
  };

  const sendQuestion = (e) => {
    e.preventDefault();
    if (!qInput.trim()) return;
    socket?.emit("session:question", { sessionId: id, body: qInput }, (ack) => {
      if (ack?.error) toast.error(ack.error);
    });
    const q = { id: Date.now(), user_name: user?.name || "You", body: qInput, created_at: new Date().toISOString() };
    setQuestions((prev) => [q, ...prev]);
    setQInput("");
  };

  const leave = async (end = false) => {
    if (end && isHost) {
      try { await api.post(`/mentor/sessions/${id}/end`); }
      catch (err) { toast.error(err.response?.data?.error || "Could not end session."); return; }
    }
    localStream?.getTracks().forEach((t) => t.stop());
    screenStream?.getTracks().forEach((t) => t.stop());
    room?.disconnect();
    socket?.disconnect();
    navigate("/mentorship");
  };

  /* LiveKit video tracks if room is active */
  const allLiveKitVideoTracks = useMemo(() => {
    if (!room) return [];
    return participants.flatMap(({ participant, tracks }) =>
      (tracks || [])
        .filter((pub) => pub.kind === "video")
        .map((pub) => ({ participant, publication: pub }))
    );
  }, [room, participants]);

  /* ── Loading Screen ──────────────────────────────────────── */
  if (joining) {
    return (
      <div className="mr-loading">
        <div className="mr-loading-card">
          <div className="mr-loading-spinner" />
          <h2>Connecting to session…</h2>
          <p>Setting up your live masterclass room. Initializing audio & video streams.</p>
        </div>
      </div>
    );
  }

  const participantCount = room
    ? participants.length
    : Math.max(peers.length, 1);

  /* ── Room UI ─────────────────────────────────────────────── */
  return (
    <div className="mr-page">
      {/* ── Top Bar ──────────────────────────────────────────── */}
      <header className="mr-topbar">
        <div className="mr-topbar-left">
          <Link to="/mentorship" className="mr-back">← Sessions</Link>
          <div className="mr-session-info">
            <div className="mr-live-badge">
              <span className="mr-live-dot" />
              LIVE
            </div>
            <h1 className="mr-session-title">{session?.title || "Live Session"}</h1>
            <span className="mr-elapsed">{formatElapsed(elapsed)}</span>
          </div>
        </div>
        <div className="mr-topbar-right">
          <span className="mr-participants-count">
            👥 {participantCount} participant{participantCount !== 1 ? "s" : ""}
          </span>
          {raisedHands.length > 0 && (
            <span className="mr-raised-count">✋ {raisedHands.length}</span>
          )}
          <button
            className={`mr-ctrl-btn ${micOn ? "mr-ctrl-btn--active" : ""} ${!connected ? "mr-ctrl-btn--disabled" : ""}`}
            onClick={toggleMic}
            disabled={!connected}
            title={micOn ? "Mute mic" : "Unmute mic"}
          >
            {micOn ? "🎙" : "🔇"}
          </button>
          <button
            className={`mr-ctrl-btn ${camOn ? "mr-ctrl-btn--active" : ""} ${!connected ? "mr-ctrl-btn--disabled" : ""}`}
            onClick={toggleCamera}
            disabled={!connected}
            title={camOn ? "Turn off camera" : "Turn on camera"}
          >
            {camOn ? "📹" : "📷"}
          </button>
          <button
            className={`mr-ctrl-btn ${screenOn ? "mr-ctrl-btn--active" : ""} ${!connected ? "mr-ctrl-btn--disabled" : ""}`}
            onClick={toggleScreen}
            disabled={!connected}
            title="Share screen"
          >
            🖥
          </button>
          {!isHost && (
            <button
              className={`mr-ctrl-btn ${myHandRaised ? "mr-ctrl-btn--raised" : ""}`}
              onClick={raiseHand}
              title={myHandRaised ? "Lower hand" : "Raise hand"}
            >
              ✋
            </button>
          )}
          <button className="mr-leave-btn" onClick={() => leave(false)}>
            Leave
          </button>
          {isHost && (
            <button className="mr-end-btn" onClick={() => leave(true)}>
              End Session
            </button>
          )}
        </div>
      </header>

      {/* ── Main Content ─────────────────────────────────────── */}
      <div className="mr-body">
        {/* ── Stage ────────────────────────────────────────────── */}
        <main className="mr-stage">
          {/* LiveKit SFU Mode */}
          {allLiveKitVideoTracks.length > 0 ? (
            <div className={`mr-grid mr-grid--${Math.min(allLiveKitVideoTracks.length, 4)}`}>
              {allLiveKitVideoTracks.map(({ participant, publication }) => (
                <TrackTile
                  key={`${participant.identity}-${publication.trackSid}`}
                  participant={participant}
                  publication={publication}
                  isHost={String(participant.identity) === String(session?.mentorId)}
                  onPin={setPinnedId}
                />
              ))}
            </div>
          ) : screenStream ? (
            /* Browser Media: Screen Sharing Active */
            <div className="mr-pinned-area">
              <LocalStreamTile
                stream={screenStream}
                isScreen
                isPinned
                label={`${user?.name || "Host"}'s Screen`}
                isHost={isHost}
              />
              {camOn && localStream && (
                <div className="mr-strip">
                  <LocalStreamTile
                    stream={localStream}
                    label={user?.name || "You"}
                    isHost={isHost}
                  />
                </div>
              )}
            </div>
          ) : camOn && localStream ? (
            /* Browser Media: Camera Active */
            <div className="mr-grid mr-grid--1">
              <LocalStreamTile
                stream={localStream}
                label={user?.name || "You"}
                isHost={isHost}
              />
            </div>
          ) : (
            /* Masterclass Standby Stage */
            <div className="mr-no-video">
              <div className="mr-no-video-inner">
                <div className="mr-waiting-avatar">
                  {(session?.title || "S")[0].toUpperCase()}
                </div>
                <h2>{session?.title || "Interactive Masterclass"}</h2>
                <p>
                  {isHost
                    ? "Welcome to your masterclass room. Turn on your camera or share your screen to begin presenting."
                    : "You are connected to the live session room. The mentor will begin presenting shortly."}
                </p>
                <div style={{ display: "flex", gap: "10px", justifyContent: "center", marginTop: "16px" }}>
                  <button
                    className="mr-leave-btn"
                    style={{ background: "var(--mr-primary)", color: "#fff", border: "none", padding: "8px 18px" }}
                    onClick={toggleCamera}
                  >
                    {camOn ? "Turn Off Camera" : "Turn On Camera"}
                  </button>
                  <button
                    className="mr-leave-btn"
                    style={{ background: "#334155", color: "#fff", border: "none", padding: "8px 18px" }}
                    onClick={toggleScreen}
                  >
                    {screenOn ? "Stop Screen" : "Share Screen"}
                  </button>
                </div>
                <div className="mr-waiting-dots" style={{ marginTop: "24px" }}>
                  <span /><span /><span />
                </div>
              </div>
            </div>
          )}

          {/* Raised hands notification */}
          {isHost && raisedHands.length > 0 && (
            <div className="mr-raised-hands-bar">
              ✋ Raised hands: {raisedHands.map((h) => h.userName).join(", ")}
            </div>
          )}
        </main>

        {/* ── Sidebar ──────────────────────────────────────────── */}
        <aside className="mr-sidebar">
          {/* Sidebar tabs */}
          <div className="mr-sidebar-tabs">
            {[
              { id: "chat", label: "Chat", count: messages.length },
              { id: "questions", label: "Q&A", count: questions.length },
              { id: "polls", label: "Polls", count: polls.length },
            ].map((t) => (
              <button
                key={t.id}
                className={`mr-stab ${sidebarTab === t.id ? "mr-stab--active" : ""}`}
                onClick={() => setSidebarTab(t.id)}
              >
                {t.label}
                {t.count > 0 && <span className="mr-stab-count">{t.count}</span>}
              </button>
            ))}
          </div>

          {/* ── Chat ── */}
          {sidebarTab === "chat" && (
            <div className="mr-chat">
              <div className="mr-chat-messages">
                {messages.length === 0 && (
                  <div className="mr-chat-empty">
                    <span>💬</span>
                    <p>Chat is empty. Be the first to say hello!</p>
                  </div>
                )}
                {messages.map((m) => (
                  <div key={m.id} className="mr-chat-msg">
                    <div className="mr-msg-header">
                      <div className="mr-msg-avatar">
                        {(m.user_name || "?")[0].toUpperCase()}
                      </div>
                      <strong>{m.user_name}</strong>
                      <time>
                        {new Date(m.created_at).toLocaleTimeString([], {
                          hour: "2-digit", minute: "2-digit",
                        })}
                      </time>
                    </div>
                    <p className="mr-msg-body">{m.body}</p>
                  </div>
                ))}
                <div ref={chatBottomRef} />
              </div>
              <form className="mr-chat-form" onSubmit={sendMessage}>
                <input
                  className="mr-chat-input"
                  placeholder="Type a message…"
                  value={message}
                  maxLength={2000}
                  onChange={(e) => setMessage(e.target.value)}
                />
                <button type="submit" className="mr-send-btn" disabled={!message.trim()}>
                  ➤
                </button>
              </form>
            </div>
          )}

          {/* ── Q&A ── */}
          {sidebarTab === "questions" && (
            <div className="mr-chat">
              <div className="mr-chat-messages">
                {questions.length === 0 && (
                  <div className="mr-chat-empty">
                    <span>🙋</span>
                    <p>No questions yet. Raise a question for the mentor!</p>
                  </div>
                )}
                {questions.map((q) => (
                  <div key={q.id} className="mr-chat-msg mr-chat-msg--question">
                    <div className="mr-msg-header">
                      <div className="mr-msg-avatar mr-msg-avatar--q">
                        {(q.user_name || "?")[0].toUpperCase()}
                      </div>
                      <strong>{q.user_name}</strong>
                      <span className="mr-q-tag">Question</span>
                    </div>
                    <p className="mr-msg-body">{q.body}</p>
                  </div>
                ))}
              </div>
              <form className="mr-chat-form" onSubmit={sendQuestion}>
                <input
                  className="mr-chat-input"
                  placeholder="Ask a question…"
                  value={qInput}
                  maxLength={500}
                  onChange={(e) => setQInput(e.target.value)}
                />
                <button type="submit" className="mr-send-btn" disabled={!qInput.trim()}>
                  ➤
                </button>
              </form>
            </div>
          )}

          {/* ── Polls ── */}
          {sidebarTab === "polls" && (
            <div className="mr-polls-panel">
              {isHost && (
                <form className="mr-create-poll" onSubmit={createPoll}>
                  <h4>Create Poll</h4>
                  <input
                    required
                    className="mr-poll-input"
                    placeholder="Question…"
                    value={pollQuestion}
                    onChange={(e) => setPollQuestion(e.target.value)}
                  />
                  <input
                    required
                    className="mr-poll-input"
                    placeholder="Option A, Option B, …"
                    value={pollOptions}
                    onChange={(e) => setPollOptions(e.target.value)}
                  />
                  <button type="submit" className="mr-create-poll-btn">
                    Launch Poll
                  </button>
                </form>
              )}
              <div className="mr-polls-list">
                {polls.length === 0 ? (
                  <div className="mr-chat-empty">
                    <span>📊</span>
                    <p>
                      {isHost
                        ? "Launch a poll above to engage your audience."
                        : "No polls yet. The mentor can create one during the session."}
                    </p>
                  </div>
                ) : (
                  polls.map((poll) => (
                    <PollCard
                      key={poll.id}
                      poll={poll}
                      isHost={isHost}
                      onVote={vote}
                    />
                  ))
                )}
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

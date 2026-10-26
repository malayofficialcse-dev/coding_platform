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

const RTC_CONFIG = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ],
};

/* ── LiveKit Remote Track Tile ────────────────────────────── */
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
      try { track.detach(el); el.remove(); } catch (e) { void e; }
    };
  }, [publication?.track]);

  if (publication?.kind === "audio") {
    return <div ref={ref} style={{ display: "none" }} />;
  }

  const name = participant.name || participant.identity || "Mentor";
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
          {isHost && <span className="mr-tile-host-tag">MENTOR</span>}
          {isScreen && " · Screen"}
        </span>
      </div>
    </div>
  );
}

/* ── Local Stream Video (Mentor Camera / Screen) ──────────── */
function LocalStreamTile({ stream, isScreen = false, label = "You", isHost = false }) {
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div className={`mr-tile ${isScreen ? "mr-tile--screen mr-tile--pinned" : ""}`}>
      <div className="mr-tile-video">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          style={{ transform: !isScreen ? "scaleX(-1)" : "none" }}
        />
      </div>
      <div className="mr-tile-overlay">
        <span className="mr-tile-name">
          {label}
          {isHost && <span className="mr-tile-host-tag">MENTOR</span>}
          {isScreen && " · Screen"}
        </span>
      </div>
    </div>
  );
}

/* ── Remote Broadcast Player (For Students) ────────────────── */
function RemoteBroadcastPlayer({ stream, isScreen = false, mentorName = "Mentor" }) {
  const videoRef = useRef(null);
  const [playBlocked, setPlayBlocked] = useState(false);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().then(() => {
        setPlayBlocked(false);
      }).catch((err) => {
        console.warn("[WebRTC] Autoplay blocked, awaiting user click:", err);
        setPlayBlocked(true);
      });
    }
  }, [stream]);

  const handleStartPlayback = () => {
    if (videoRef.current) {
      videoRef.current.play().then(() => setPlayBlocked(false)).catch(console.error);
    }
  };

  return (
    <div className="mr-tile mr-tile--screen mr-tile--pinned" style={{ width: "100%", height: "100%", flex: 1, minHeight: 0, position: "relative" }}>
      <div className="mr-tile-video" style={{ width: "100%", height: "100%", position: "relative" }}>
        <video
          ref={videoRef}
          autoPlay
          playsInline
          controls={false}
          style={{
            width: "100%",
            height: "100%",
            objectFit: isScreen ? "contain" : "cover",
            display: "block",
            background: "#090d16",
          }}
        />
        {playBlocked && (
          <div
            onClick={handleStartPlayback}
            style={{
              position: "absolute",
              inset: 0,
              background: "rgba(15, 23, 42, 0.88)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              zIndex: 10,
              gap: "12px",
            }}
          >
            <button
              className="mr-studio-btn mr-studio-btn--primary"
              style={{ padding: "12px 24px", fontSize: "14px", fontWeight: "700" }}
            >
              ▶ Click to Watch Live Broadcast
            </button>
            <span style={{ color: "#94a3b8", fontSize: "12px" }}>Browser blocked audio autoplay</span>
          </div>
        )}
      </div>
      <div className="mr-tile-overlay">
        <span className="mr-tile-name">
          <span className="mr-live-dot" />
          {mentorName}
          <span className="mr-tile-host-tag">MENTOR</span>
          {isScreen ? " · Screen Sharing" : " · Live Camera"}
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
  const [micOn, setMicOn] = useState(false);
  const [camOn, setCamOn] = useState(false);
  const [screenOn, setScreenOn] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [raisedHands, setRaisedHands] = useState([]);
  const [myHandRaised, setMyHandRaised] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [qInput, setQInput] = useState("");
  const [peers, setPeers] = useState([]);

  /* Native media streams (Mentor broadcast) */
  const [localStream, setLocalStream] = useState(null);
  const [screenStream, setScreenStream] = useState(null);
  const [remoteMentorStream, setRemoteMentorStream] = useState(null);
  const [remoteIsScreen, setRemoteIsScreen] = useState(false);

  const localStreamRef = useRef(null);
  const screenStreamRef = useRef(null);
  const isHostRef = useRef(false);
  const userRef = useRef(user);
  const socketRef = useRef(null);
  const peersRef = useRef([]);
  const iceCandidateQueueRef = useRef(new Map());

  const chatBottomRef = useRef(null);
  const elapsedRef = useRef(null);
  const mentorPeerConnectionsRef = useRef(new Map()); // mentor: studentId -> RTCPeerConnection
  const studentPcRef = useRef(null); // student: RTCPeerConnection

  /* Determine if the logged-in user is the Mentor (Host) */
  const isHost = useMemo(() => {
    if (!session || !user) return false;
    const currentUserId = String(user.id || user._id || "");
    const mentorId = String(session.mentorId || session.mentor_id || "");
    return Boolean(
      (currentUserId && mentorId && currentUserId === mentorId) ||
      (user.role === "mentor" && currentUserId === mentorId)
    );
  }, [session, user]);

  useEffect(() => {
    isHostRef.current = isHost;
  }, [isHost]);

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  useEffect(() => {
    peersRef.current = peers;
  }, [peers]);

  /* Auto-scroll chat */
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  /* Elapsed timer */
  useEffect(() => {
    if (!connected) return;
    elapsedRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(elapsedRef.current);
  }, [connected]);

  /* Clean up local media tracks */
  useEffect(() => {
    return () => {
      localStreamRef.current?.getTracks().forEach((t) => t.stop());
      screenStreamRef.current?.getTracks().forEach((t) => t.stop());
      mentorPeerConnectionsRef.current.forEach((pc) => {
        try { pc.close(); } catch (_) {}
      });
      mentorPeerConnectionsRef.current.clear();
      try { studentPcRef.current?.close(); } catch (_) {}
    };
  }, []);

  const formatElapsed = (s) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return h > 0
      ? `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`
      : `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  };

  /* Helper to get active broadcast stream for mentor */
  const getActiveMentorStream = () => {
    return screenStreamRef.current || localStreamRef.current || null;
  };

  /* Send mentor offer to a specific student */
  const sendOfferToStudent = async (studentId, sock, explicitStream = null) => {
    const stream = explicitStream || getActiveMentorStream();
    if (!sock || !studentId || !stream) {
      console.log("[WebRTC Mentor] Cannot send offer - missing sock, studentId, or stream:", { studentId, hasStream: Boolean(stream) });
      return;
    }

    try {
      console.log(`[WebRTC Mentor] Initiating offer to student ${studentId}...`);
      if (mentorPeerConnectionsRef.current.has(studentId)) {
        try { mentorPeerConnectionsRef.current.get(studentId)?.close(); } catch (_) {}
        mentorPeerConnectionsRef.current.delete(studentId);
      }

      const pc = new RTCPeerConnection(RTC_CONFIG);
      mentorPeerConnectionsRef.current.set(studentId, pc);
      iceCandidateQueueRef.current.set(studentId, []);

      stream.getTracks().forEach((track) => {
        pc.addTrack(track, stream);
      });

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          sock.emit("session:signal", {
            sessionId: id,
            targetUserId: studentId,
            signal: { type: "candidate", candidate: event.candidate },
          });
        }
      };

      pc.onconnectionstatechange = () => {
        console.log(`[WebRTC Mentor -> Student ${studentId}] connectionState:`, pc.connectionState);
      };

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      const isScreen = Boolean(screenStreamRef.current && (stream === screenStreamRef.current));

      sock.emit("session:signal", {
        sessionId: id,
        targetUserId: studentId,
        signal: {
          type: "offer",
          sdp: pc.localDescription,
          isScreen,
        },
      });
      console.log(`[WebRTC Mentor] Offer successfully sent to student ${studentId} (isScreen: ${isScreen})`);
    } catch (err) {
      console.warn("Could not initiate WebRTC offer to student:", err);
    }
  };

  /* Push tracks to all connected students when mentor changes media */
  const broadcastTracksToAllStudents = (stream) => {
    const sock = socketRef.current;
    if (!isHostRef.current || !sock) return;

    mentorPeerConnectionsRef.current.forEach((pc) => {
      try { pc.close(); } catch (_) {}
    });
    mentorPeerConnectionsRef.current.clear();

    if (!stream) {
      sock.emit("session:signal", {
        sessionId: id,
        signal: { type: "stream-ended" },
      });
      return;
    }

    const myId = String(userRef.current?.id || userRef.current?._id || "");
    peersRef.current.forEach((peer) => {
      const peerId = peer.userId || peer.id;
      if (peerId && String(peerId) !== myId) {
        sendOfferToStudent(peerId, sock, stream);
      }
    });
  };

  /* Join session room */
  useEffect(() => {
    let active = true;
    let nextRoom = null;

    const join = async () => {
      try {
        const res = await api.post(`/mentor/sessions/${id}/join-token`);
        if (!active) return;
        const sess = res.data.session;
        setSession(sess);

        const currentUserId = String(userRef.current?.id || userRef.current?._id || "");
        const mentorId = String(sess?.mentorId || sess?.mentor_id || "");
        if (currentUserId && mentorId && currentUserId === mentorId) {
          isHostRef.current = true;
        }

        /* LiveKit cloud mode if credentials returned */
        if (res.data.url && res.data.token) {
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
          }
        }

        setConnected(true);
        setJoining(false);

        /* Socket setup */
        const nextSocket = io(socketOrigin(), {
          path: "/mentor-socket.io",
          auth: { token: getAccessToken() },
          transports: ["websocket", "polling"],
        });
        socketRef.current = nextSocket;

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
              peersRef.current = ack.peers;
            }
          });
          /* If student, request stream from mentor */
          const myId = String(userRef.current?.id || userRef.current?._id || "");
          const hostId = String(sess?.mentorId || sess?.mentor_id || "");
          if (myId !== hostId) {
            nextSocket.emit("session:request-stream", { sessionId: id });
          }
        });

        nextSocket.on("session:peer-joined", (data) => {
          if (data?.peers) {
            setPeers(data.peers);
            peersRef.current = data.peers;
          } else if (data?.userId) {
            setPeers((prev) => {
              const updated = [...prev.filter((p) => p.userId !== data.userId), data];
              peersRef.current = updated;
              return updated;
            });
          }

          /* If we are the mentor and already broadcasting, push stream to this newly joined student */
          if (isHostRef.current && data?.userId) {
            const myId = String(userRef.current?.id || userRef.current?._id || "");
            if (String(data.userId) !== myId) {
              const activeStream = getActiveMentorStream();
              if (activeStream) {
                sendOfferToStudent(data.userId, nextSocket, activeStream);
              }
            }
          }
        });

        nextSocket.on("session:peer-left", ({ userId }) => {
          setPeers((prev) => {
            const updated = prev.filter((p) => p.userId !== userId);
            peersRef.current = updated;
            return updated;
          });
          if (mentorPeerConnectionsRef.current.has(userId)) {
            mentorPeerConnectionsRef.current.get(userId)?.close();
            mentorPeerConnectionsRef.current.delete(userId);
          }
        });

        /* Handle incoming student stream requests on mentor */
        nextSocket.on("session:request-stream", ({ studentId }) => {
          if (isHostRef.current && studentId) {
            const myId = String(userRef.current?.id || userRef.current?._id || "");
            if (String(studentId) !== myId) {
              const activeStream = getActiveMentorStream();
              if (activeStream) {
                sendOfferToStudent(studentId, nextSocket, activeStream);
              }
            }
          }
        });

        /* Handle WebRTC signaling */
        nextSocket.on("session:signal", async ({ senderId, targetUserId, signal }) => {
          const myId = String(userRef.current?.id || userRef.current?._id || "");
          if (targetUserId && String(targetUserId) !== myId) return;

          /* Stream ended signal (mentor turned off broadcast) */
          if (signal?.type === "stream-ended") {
            if (!isHostRef.current) {
              setRemoteMentorStream(null);
              setRemoteIsScreen(false);
              try { studentPcRef.current?.close(); } catch (_) {}
              studentPcRef.current = null;
            }
            return;
          }

          /* Student receives offer from mentor */
          if (signal?.type === "offer") {
            try {
              console.log("[WebRTC Student] Received offer from mentor:", senderId);
              if (studentPcRef.current) {
                try { studentPcRef.current.close(); } catch (_) {}
              }

              const pc = new RTCPeerConnection(RTC_CONFIG);
              studentPcRef.current = pc;
              iceCandidateQueueRef.current.set("student", []);

              pc.ontrack = (event) => {
                console.log("[WebRTC Student] ontrack event received:", event.streams);
                if (event.streams && event.streams[0]) {
                  setRemoteMentorStream(event.streams[0]);
                  setRemoteIsScreen(Boolean(signal.isScreen));
                }
              };

              pc.onicecandidate = (event) => {
                if (event.candidate) {
                  nextSocket.emit("session:signal", {
                    sessionId: id,
                    targetUserId: senderId,
                    signal: { type: "candidate", candidate: event.candidate },
                  });
                }
              };

              pc.onconnectionstatechange = () => {
                console.log("[WebRTC Student] connectionState:", pc.connectionState);
              };

              await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));

              // Flush queued candidates
              const queue = iceCandidateQueueRef.current.get("student") || [];
              for (const cand of queue) {
                try {
                  await pc.addIceCandidate(new RTCIceCandidate(cand));
                } catch (e) {
                  console.warn("Could not add queued candidate:", e);
                }
              }
              iceCandidateQueueRef.current.set("student", null);

              const answer = await pc.createAnswer();
              await pc.setLocalDescription(answer);

              nextSocket.emit("session:signal", {
                sessionId: id,
                targetUserId: senderId,
                signal: { type: "answer", sdp: pc.localDescription },
              });
              console.log("[WebRTC Student] Answer sent to mentor");
            } catch (err) {
              console.warn("Student WebRTC answer failed:", err);
            }
            return;
          }

          /* Mentor receives answer from student */
          if (signal?.type === "answer") {
            const pc = mentorPeerConnectionsRef.current.get(senderId);
            if (pc) {
              try {
                console.log("[WebRTC Mentor] Received answer from student:", senderId);
                await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));

                const queue = iceCandidateQueueRef.current.get(senderId) || [];
                for (const cand of queue) {
                  try {
                    await pc.addIceCandidate(new RTCIceCandidate(cand));
                  } catch (e) {
                    console.warn("Could not add queued candidate on mentor:", e);
                  }
                }
                iceCandidateQueueRef.current.set(senderId, null);
              } catch (err) {
                console.warn("Mentor could not set remote description:", err);
              }
            }
            return;
          }

          /* ICE candidates */
          if (signal?.type === "candidate") {
            const isMentor = isHostRef.current;
            const pc = isMentor ? mentorPeerConnectionsRef.current.get(senderId) : studentPcRef.current;
            const queueKey = isMentor ? senderId : "student";
            if (pc && signal.candidate) {
              if (pc.remoteDescription && pc.remoteDescription.type) {
                try {
                  await pc.addIceCandidate(new RTCIceCandidate(signal.candidate));
                } catch (e) {
                  console.warn("Could not add ICE candidate:", e);
                }
              } else {
                const queue = iceCandidateQueueRef.current.get(queueKey);
                if (Array.isArray(queue)) {
                  queue.push(signal.candidate);
                }
              }
            }
          }
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

        /* Load history */
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

  /* Participants list */
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

  /* Mentor Media Controls: Only the Mentor can invoke these! */
  const toggleMic = async () => {
    if (!isHost) return;
    try {
      if (room?.localParticipant) {
        const next = !room.localParticipant.isMicrophoneEnabled;
        await room.localParticipant.setMicrophoneEnabled(next);
        setMicOn(next);
        setTrackRevision((r) => r + 1);
      } else {
        if (localStreamRef.current) {
          const audioTracks = localStreamRef.current.getAudioTracks();
          if (audioTracks.length > 0) {
            const next = !audioTracks[0].enabled;
            audioTracks.forEach((t) => (t.enabled = next));
            setMicOn(next);
          } else {
            const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const track = audioStream.getAudioTracks()[0];
            localStreamRef.current.addTrack(track);
            setMicOn(true);
            broadcastTracksToAllStudents(screenStreamRef.current || localStreamRef.current);
          }
        } else {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          localStreamRef.current = stream;
          setLocalStream(stream);
          setMicOn(true);
          broadcastTracksToAllStudents(screenStreamRef.current || stream);
        }
      }
    } catch {
      toast.error("Microphone permission denied or unavailable.");
    }
  };

  const toggleCamera = async () => {
    if (!isHost) return;
    try {
      if (room?.localParticipant) {
        const next = !room.localParticipant.isCameraEnabled;
        await room.localParticipant.setCameraEnabled(next);
        setCamOn(next);
        setTrackRevision((r) => r + 1);
      } else {
        if (camOn) {
          if (localStreamRef.current) {
            localStreamRef.current.getVideoTracks().forEach((t) => t.stop());
            const remaining = localStreamRef.current.getAudioTracks();
            const nextStream = remaining.length > 0 ? new MediaStream(remaining) : null;
            localStreamRef.current = nextStream;
            setLocalStream(nextStream);
            broadcastTracksToAllStudents(screenStreamRef.current || nextStream);
          }
          setCamOn(false);
        } else {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: { width: { ideal: 1280 }, height: { ideal: 720 } },
            audio: micOn,
          });
          localStreamRef.current = stream;
          setLocalStream(stream);
          setCamOn(true);
          broadcastTracksToAllStudents(screenStreamRef.current || stream);
        }
      }
    } catch {
      toast.error("Camera permission denied or unavailable.");
    }
  };

  const toggleScreen = async () => {
    if (!isHost) return;
    try {
      if (room?.localParticipant) {
        const next = !room.localParticipant.isScreenShareEnabled;
        await room.localParticipant.setScreenShareEnabled(next);
        setScreenOn(next);
        setTrackRevision((r) => r + 1);
      } else {
        if (screenOn) {
          if (screenStreamRef.current) {
            screenStreamRef.current.getTracks().forEach((t) => t.stop());
          }
          screenStreamRef.current = null;
          setScreenStream(null);
          setScreenOn(false);
          const fallback = camOn ? localStreamRef.current : null;
          broadcastTracksToAllStudents(fallback);
        } else {
          const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
          stream.getVideoTracks()[0].onended = () => {
            if (screenStreamRef.current) {
              screenStreamRef.current.getTracks().forEach((t) => t.stop());
            }
            screenStreamRef.current = null;
            setScreenStream(null);
            setScreenOn(false);
            const fallback = camOn ? localStreamRef.current : null;
            broadcastTracksToAllStudents(fallback);
          };
          screenStreamRef.current = stream;
          setScreenStream(stream);
          setScreenOn(true);
          broadcastTracksToAllStudents(stream);
        }
      }
    } catch {
      toast.error("Screen sharing cancelled or unavailable.");
    }
  };

  /* Chat / Q&A / Poll Controls (Available to everyone) */
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
    if (!isHost) return;
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
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    screenStreamRef.current?.getTracks().forEach((t) => t.stop());
    mentorPeerConnectionsRef.current.forEach((pc) => {
      try { pc.close(); } catch (_) {}
    });
    mentorPeerConnectionsRef.current.clear();
    try { studentPcRef.current?.close(); } catch (_) {}
    room?.disconnect();
    socket?.disconnect();
    navigate("/mentorship");
  };

  /* LiveKit tracks */
  const allLiveKitVideoTracks = useMemo(() => {
    if (!room) return [];
    return participants.flatMap(({ participant, tracks }) =>
      (tracks || [])
        .filter((pub) => pub.kind === "video")
        .map((pub) => ({ participant, publication: pub }))
    );
  }, [room, participants]);

  /* Loading Screen */
  if (joining) {
    return (
      <div className="mr-loading">
        <div className="mr-loading-card">
          <div className="mr-loading-spinner" />
          <h2>Connecting to session…</h2>
          <p>Joining the live masterclass room. Setting up secure connection.</p>
        </div>
      </div>
    );
  }

  const participantCount = room
    ? participants.length
    : Math.max(peers.length, 1);

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
            <h1 className="mr-session-title">{session?.title || "Masterclass"}</h1>
            <span className="mr-elapsed">{formatElapsed(elapsed)}</span>
            <span className={`mr-role-tag ${isHost ? "mr-role-tag--mentor" : "mr-role-tag--student"}`}>
              {isHost ? "Mentor (Host)" : "Attendee (View Only)"}
            </span>
          </div>
        </div>

        <div className="mr-topbar-right">
          <span className="mr-participants-count">
            👥 {participantCount} attendee{participantCount !== 1 ? "s" : ""}
          </span>

          {raisedHands.length > 0 && (
            <span className="mr-raised-count">✋ {raisedHands.length}</span>
          )}

          {/* BROADCAST CONTROLS: ONLY FOR THE MENTOR */}
          {isHost ? (
            <>
              <button
                className={`mr-ctrl-btn ${micOn ? "mr-ctrl-btn--active" : ""}`}
                onClick={toggleMic}
                title={micOn ? "Mute Microphone" : "Unmute Microphone"}
              >
                {micOn ? "🎙" : "🔇"}
              </button>
              <button
                className={`mr-ctrl-btn ${camOn ? "mr-ctrl-btn--active" : ""}`}
                onClick={toggleCamera}
                title={camOn ? "Turn Off Camera" : "Turn On Camera"}
              >
                {camOn ? "📹" : "📷"}
              </button>
              <button
                className={`mr-ctrl-btn ${screenOn ? "mr-ctrl-btn--active" : ""}`}
                onClick={toggleScreen}
                title={screenOn ? "Stop Screen Share" : "Share Screen to Students"}
              >
                🖥
              </button>
              <button className="mr-end-btn" onClick={() => leave(true)}>
                End Session
              </button>
            </>
          ) : (
            /* STUDENTS / ATTENDEES: NO CAMERA, NO MIC, NO SCREEN SHARE */
            <button
              className={`mr-ctrl-btn ${myHandRaised ? "mr-ctrl-btn--raised" : ""}`}
              onClick={raiseHand}
              title={myHandRaised ? "Lower Hand" : "Raise Hand"}
            >
              ✋
            </button>
          )}

          <button className="mr-leave-btn" onClick={() => leave(false)}>
            Leave
          </button>
        </div>
      </header>

      {/* ── Main Content ─────────────────────────────────────── */}
      <div className="mr-body">
        {/* ── Stage ────────────────────────────────────────────── */}
        <main className="mr-stage">
          {/* CASE 1: LiveKit SFU Tracks */}
          {allLiveKitVideoTracks.length > 0 ? (
            <div className={`mr-grid mr-grid--${Math.min(allLiveKitVideoTracks.length, 4)}`}>
              {allLiveKitVideoTracks.map(({ participant, publication }) => (
                <TrackTile
                  key={`${participant.identity}-${publication.trackSid}`}
                  participant={participant}
                  publication={publication}
                  isHost={String(participant.identity) === String(session?.mentorId)}
                />
              ))}
            </div>
          ) : isHost ? (
            /* CASE 2: MENTOR'S STAGE */
            screenStream ? (
              <div className="mr-pinned-area">
                <LocalStreamTile
                  stream={screenStream}
                  isScreen
                  label="Your Shared Screen"
                  isHost
                />
                {camOn && localStream && (
                  <div className="mr-strip">
                    <LocalStreamTile
                      stream={localStream}
                      label="Your Camera"
                      isHost
                    />
                  </div>
                )}
              </div>
            ) : camOn && localStream ? (
              <div className="mr-grid mr-grid--1">
                <LocalStreamTile
                  stream={localStream}
                  label="Your Live Camera"
                  isHost
                />
              </div>
            ) : (
              /* Mentor Studio Control Card (When Camera & Screen are off) */
              <div className="mr-no-video">
                <div className="mr-studio-card">
                  <div className="mr-studio-badge">🎯 Mentor Studio Hub</div>
                  <h2>{session?.title || "Live Masterclass"}</h2>
                  <p>
                    You are hosting this session. Students are in <strong>view-only mode</strong> and can only watch, listen, and interact via chat and Q&amp;A.
                  </p>
                  <div className="mr-studio-actions">
                    <button className="mr-studio-btn mr-studio-btn--primary" onClick={toggleCamera}>
                      📹 Turn On Camera
                    </button>
                    <button className="mr-studio-btn mr-studio-btn--secondary" onClick={toggleScreen}>
                      🖥 Share Screen
                    </button>
                    <button className="mr-studio-btn mr-studio-btn--secondary" onClick={toggleMic}>
                      {micOn ? "🔇 Mute Mic" : "🎙 Unmute Mic"}
                    </button>
                  </div>
                  <div className="mr-studio-note">
                    {participantCount} attendee{participantCount !== 1 ? "s" : ""} currently in room · Click buttons above to start broadcasting
                  </div>
                </div>
              </div>
            )
          ) : (
            /* CASE 3: STUDENT'S STAGE (ATTENDEES JUST WATCH & LISTEN) */
            remoteMentorStream ? (
              <RemoteBroadcastPlayer
                stream={remoteMentorStream}
                isScreen={remoteIsScreen || Boolean(remoteMentorStream.getVideoTracks()[0]?.label?.toLowerCase().includes("screen"))}
                mentorName={session?.mentor_name || "Mentor"}
              />
            ) : (
              /* Scaler-style Attendee Waiting Card */
              <div className="mr-no-video">
                <div className="mr-attendee-card">
                  <div className="mr-attendee-avatar">
                    {(session?.mentor_name || session?.title || "M")[0].toUpperCase()}
                  </div>
                  <h2>{session?.title || "Live Masterclass"}</h2>
                  <div className="mr-attendee-topic">Topic: {session?.topic || "Engineering"}</div>
                  <p>
                    Welcome to the masterclass! The mentor is in the room. As soon as the mentor turns on their camera or screen share, the live broadcast will appear right here.
                  </p>
                  <div className="mr-attendee-pill">
                    🎧 Listen-and-view mode · Post questions in Q&amp;A or chat on the right
                  </div>
                  <div className="mr-waiting-dots" style={{ marginTop: "20px" }}>
                    <span /><span /><span />
                  </div>
                </div>
              </div>
            )
          )}

          {/* Raised hands notification for mentor */}
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
                    <p>No questions yet. Ask a question for the mentor!</p>
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
                  placeholder="Ask the mentor a question…"
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

import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  FiPhone,
  FiPhoneCall,
  FiPhoneOff,
  FiVideo,
  FiVideoOff,
  FiMic,
  FiMicOff,
  FiMaximize2,
  FiMinimize2,
  FiVolume2,
  FiVolumeX,
  FiTv,
} from "react-icons/fi";
import {
  playIncomingRingtone,
  playOutgoingRingtone,
  playCallEndTone,
  stopRingtone,
} from "../utils/callSounds";
import "./CallModal.css";

const RTC_CONFIG = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
  ],
};

export default function CallModal({
  user,
  socket,
  activeCall,
  onCloseCall,
}) {
  // activeCall shape:
  // {
  //   status: "outgoing" | "incoming" | "connecting" | "connected" | "ended",
  //   targetUser: { id, _id, name, username, profileImage },
  //   callType: "video" | "audio",
  //   isCaller: boolean,
  //   reason?: string
  // }

  const [callStatus, setCallStatus] = useState(activeCall?.status || "outgoing");
  const [statusMessage, setStatusMessage] = useState("");
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(activeCall?.callType === "audio");
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isSpeakerMuted, setIsSpeakerMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const remoteAudioRef = useRef(null);
  const modalContainerRef = useRef(null);

  const pcRef = useRef(null);
  const localStreamRef = useRef(null);
  const screenStreamRef = useRef(null);
  const iceCandidatesQueueRef = useRef([]);
  const durationTimerRef = useRef(null);

  const currentUserId = String(user?._id || user?.id || "");
  const targetUser = activeCall?.targetUser || {};
  const targetUserId = String(targetUser?._id || targetUser?.id || "");
  const callType = activeCall?.callType || "video";
  const isCaller = activeCall?.isCaller;

  const peerDisplayName = targetUser.name || targetUser.username || "User";
  const peerAvatar = targetUser.profileImage || "/default-avatar.png";

  // Format MM:SS duration
  const formatDuration = (totalSeconds) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  /* --------------------------------------------------------------------------
     CLEANUP UTILITY
  -------------------------------------------------------------------------- */
  const cleanupMedia = useCallback(() => {
    stopRingtone();
    if (durationTimerRef.current) {
      clearInterval(durationTimerRef.current);
      durationTimerRef.current = null;
    }

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }

    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((track) => track.stop());
      screenStreamRef.current = null;
    }

    if (pcRef.current) {
      try {
        pcRef.current.close();
      } catch (_) {}
      pcRef.current = null;
    }

    iceCandidatesQueueRef.current = [];
  }, []);

  /* --------------------------------------------------------------------------
     START WEBRTC PEER CONNECTION
  -------------------------------------------------------------------------- */
  const setupPeerConnection = useCallback(
    (stream) => {
      if (pcRef.current) {
        try {
          pcRef.current.close();
        } catch (_) {}
      }

      const pc = new RTCPeerConnection(RTC_CONFIG);
      pcRef.current = pc;

      // Add local media tracks
      if (stream) {
        stream.getTracks().forEach((track) => {
          pc.addTrack(track, stream);
        });
      }

      // Relay ICE candidates
      pc.onicecandidate = (event) => {
        if (event.candidate && socket && targetUserId) {
          socket.emit("call:signal", {
            targetUserId,
            signal: { type: "candidate", candidate: event.candidate },
          });
        }
      };

      // Remote track handling
      pc.ontrack = (event) => {
        console.log("[Call WebRTC] Remote track received:", event.streams);
        const remoteStream = event.streams && event.streams[0];
        if (remoteStream) {
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = remoteStream;
          }
          if (remoteAudioRef.current) {
            remoteAudioRef.current.srcObject = remoteStream;
          }
        }
      };

      pc.onconnectionstatechange = () => {
        console.log("[Call WebRTC] Connection state:", pc.connectionState);
        if (pc.connectionState === "connected") {
          setCallStatus("connected");
          setStatusMessage("Connected");
          stopRingtone();
        } else if (
          pc.connectionState === "disconnected" ||
          pc.connectionState === "failed" ||
          pc.connectionState === "closed"
        ) {
          endCall(false, "Connection lost");
        }
      };

      return pc;
    },
    [socket, targetUserId]
  );

  /* --------------------------------------------------------------------------
     ACQUIRE LOCAL USER MEDIA
  -------------------------------------------------------------------------- */
  const getMedia = useCallback(
    async (requestVideo = true) => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: requestVideo
            ? { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "user" }
            : false,
        });
        localStreamRef.current = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
        return stream;
      } catch (err) {
        console.warn("Could not get requested user media with video:", err.message);
        // Fallback to audio only if camera denied/not available
        try {
          const audioOnlyStream = await navigator.mediaDevices.getUserMedia({
            audio: true,
            video: false,
          });
          localStreamRef.current = audioOnlyStream;
          setIsVideoOff(true);
          return audioOnlyStream;
        } catch (audioErr) {
          console.error("Microphone permission denied:", audioErr);
          setStatusMessage("Microphone permission required.");
          return null;
        }
      }
    },
    []
  );

  /* --------------------------------------------------------------------------
     CALL ACTIONS (ACCEPT, DECLINE, END)
  -------------------------------------------------------------------------- */
  const acceptCall = async () => {
    stopRingtone();
    setCallStatus("connecting");
    setStatusMessage("Connecting call...");

    const stream = await getMedia(callType === "video");
    const pc = setupPeerConnection(stream);

    // Notify caller that call was accepted
    if (socket) {
      socket.emit("call:accept", { targetUserId });
    }
  };

  const declineCall = () => {
    stopRingtone();
    playCallEndTone();
    if (socket) {
      socket.emit("call:reject", { targetUserId, reason: "declined" });
    }
    setCallStatus("ended");
    setStatusMessage("Call declined");
    cleanupMedia();
    setTimeout(() => onCloseCall(), 1200);
  };

  const endCall = useCallback(
    (emitEvent = true, message = "Call ended") => {
      stopRingtone();
      playCallEndTone();
      if (emitEvent && socket && targetUserId) {
        socket.emit("call:end", { targetUserId });
      }
      setCallStatus("ended");
      setStatusMessage(message);
      cleanupMedia();
      setTimeout(() => onCloseCall(), 1500);
    },
    [socket, targetUserId, cleanupMedia, onCloseCall]
  );

  /* --------------------------------------------------------------------------
     SOCKET EVENT LISTENERS
  -------------------------------------------------------------------------- */
  useEffect(() => {
    if (!socket) return;

    // Caller: Recipient accepted our call!
    const handleAccepted = async () => {
      console.log("[Call] Call accepted by remote user");
      stopRingtone();
      setCallStatus("connecting");
      setStatusMessage("Connecting call...");

      try {
        const stream = await getMedia(callType === "video");
        const pc = setupPeerConnection(stream);

        // Caller creates and sends initial WebRTC offer
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        socket.emit("call:signal", {
          targetUserId,
          signal: { type: "offer", sdp: pc.localDescription },
        });
      } catch (err) {
        console.error("Failed to initiate WebRTC offer:", err);
        endCall(true, "Connection setup failed");
      }
    };

    // Caller: Recipient rejected call
    const handleRejected = ({ reason }) => {
      console.log("[Call] Call rejected:", reason);
      stopRingtone();
      playCallEndTone();
      setCallStatus("ended");
      setStatusMessage(reason === "busy" ? "User is busy" : "Call declined");
      cleanupMedia();
      setTimeout(() => onCloseCall(), 1600);
    };

    // Recipient was busy
    const handleBusy = () => {
      stopRingtone();
      playCallEndTone();
      setCallStatus("ended");
      setStatusMessage("User is currently on another call");
      cleanupMedia();
      setTimeout(() => onCloseCall(), 2000);
    };

    // Recipient offline
    const handleUserOffline = () => {
      stopRingtone();
      playCallEndTone();
      setCallStatus("ended");
      setStatusMessage("User is currently offline");
      cleanupMedia();
      setTimeout(() => onCloseCall(), 2000);
    };

    // Remote peer ended call
    const handleEnded = () => {
      console.log("[Call] Remote user ended the call");
      stopRingtone();
      playCallEndTone();
      setCallStatus("ended");
      setStatusMessage("Call ended");
      cleanupMedia();
      setTimeout(() => onCloseCall(), 1400);
    };

    // WebRTC Signaling Relay (SDP offer/answer, ICE candidates)
    const handleSignal = async ({ senderId, signal }) => {
      if (String(senderId) !== targetUserId || !signal) return;

      const pc = pcRef.current;

      // Remote SDP Offer (Callee receives this)
      if (signal.type === "offer") {
        try {
          console.log("[Call WebRTC] Received SDP offer");
          if (!pc) return;
          await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));

          // Drain queued ICE candidates
          while (iceCandidatesQueueRef.current.length > 0) {
            const cand = iceCandidatesQueueRef.current.shift();
            try {
              await pc.addIceCandidate(new RTCIceCandidate(cand));
            } catch (candErr) {
              console.warn("Failed to add queued candidate:", candErr);
            }
          }

          // Create and send SDP answer
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);

          socket.emit("call:signal", {
            targetUserId,
            signal: { type: "answer", sdp: pc.localDescription },
          });
        } catch (offerErr) {
          console.error("Error handling SDP offer:", offerErr);
        }
      }

      // Remote SDP Answer (Caller receives this)
      else if (signal.type === "answer") {
        try {
          console.log("[Call WebRTC] Received SDP answer");
          if (!pc) return;
          await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));

          // Drain queued candidates
          while (iceCandidatesQueueRef.current.length > 0) {
            const cand = iceCandidatesQueueRef.current.shift();
            try {
              await pc.addIceCandidate(new RTCIceCandidate(cand));
            } catch (candErr) {
              console.warn("Failed to add queued candidate:", candErr);
            }
          }
        } catch (ansErr) {
          console.error("Error setting remote SDP answer:", ansErr);
        }
      }

      // ICE Candidate
      else if (signal.type === "candidate") {
        if (pc && pc.remoteDescription && pc.remoteDescription.type) {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(signal.candidate));
          } catch (e) {
            console.warn("Could not add ICE candidate:", e);
          }
        } else {
          iceCandidatesQueueRef.current.push(signal.candidate);
        }
      }
    };

    socket.on("call:accepted", handleAccepted);
    socket.on("call:rejected", handleRejected);
    socket.on("call:busy", handleBusy);
    socket.on("call:user-offline", handleUserOffline);
    socket.on("call:ended", handleEnded);
    socket.on("call:signal", handleSignal);

    return () => {
      socket.off("call:accepted", handleAccepted);
      socket.off("call:rejected", handleRejected);
      socket.off("call:busy", handleBusy);
      socket.off("call:user-offline", handleUserOffline);
      socket.off("call:ended", handleEnded);
      socket.off("call:signal", handleSignal);
    };
  }, [socket, targetUserId, callType, getMedia, setupPeerConnection, endCall, onCloseCall, cleanupMedia]);

  /* --------------------------------------------------------------------------
     INITIAL LIFECYCLE (RINGTONES & TIMERS)
  -------------------------------------------------------------------------- */
  useEffect(() => {
    if (callStatus === "outgoing") {
      setStatusMessage("Ringing...");
      playOutgoingRingtone();
    } else if (callStatus === "incoming") {
      setStatusMessage(`Incoming ${callType === "video" ? "Video" : "Audio"} Call...`);
      playIncomingRingtone();
    } else if (callStatus === "connected") {
      stopRingtone();
      durationTimerRef.current = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);
    }

    return () => {
      stopRingtone();
      if (durationTimerRef.current) clearInterval(durationTimerRef.current);
    };
  }, [callStatus, callType]);

  /* --------------------------------------------------------------------------
     IN-CALL CONTROLS (MIC, CAM, SCREEN, FULLSCREEN)
  -------------------------------------------------------------------------- */
  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTracks = localStreamRef.current.getAudioTracks();
      const nextMuted = !isMuted;
      audioTracks.forEach((track) => {
        track.enabled = !nextMuted;
      });
      setIsMuted(nextMuted);
    }
  };

  const toggleVideo = async () => {
    if (!localStreamRef.current) return;
    const videoTracks = localStreamRef.current.getVideoTracks();

    if (videoTracks.length > 0) {
      const nextOff = !isVideoOff;
      videoTracks.forEach((track) => {
        track.enabled = !nextOff;
      });
      setIsVideoOff(nextOff);
    } else {
      // Stream had no video track originally (was audio-only), request new video track
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        const newTrack = stream.getVideoTracks()[0];
        localStreamRef.current.addTrack(newTrack);

        if (pcRef.current) {
          pcRef.current.addTrack(newTrack, localStreamRef.current);
        }
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = localStreamRef.current;
        }
        setIsVideoOff(false);
      } catch (err) {
        console.warn("Could not enable camera:", err);
      }
    }
  };

  const toggleScreenShare = async () => {
    if (isScreenSharing) {
      // Stop screen sharing and restore camera
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((t) => t.stop());
        screenStreamRef.current = null;
      }
      if (localStreamRef.current && pcRef.current) {
        const videoTrack = localStreamRef.current.getVideoTracks()[0];
        const senders = pcRef.current.getSenders();
        const videoSender = senders.find((s) => s.track && s.track.kind === "video");
        if (videoSender && videoTrack) {
          videoSender.replaceTrack(videoTrack);
        }
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = localStreamRef.current;
        }
      }
      setIsScreenSharing(false);
    } else {
      try {
        const displayStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        screenStreamRef.current = displayStream;
        const screenTrack = displayStream.getVideoTracks()[0];

        if (pcRef.current) {
          const senders = pcRef.current.getSenders();
          const videoSender = senders.find((s) => s.track && s.track.kind === "video");
          if (videoSender) {
            videoSender.replaceTrack(screenTrack);
          } else {
            pcRef.current.addTrack(screenTrack, displayStream);
          }
        }

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = displayStream;
        }

        screenTrack.onended = () => {
          toggleScreenShare();
        };

        setIsScreenSharing(true);
      } catch (err) {
        console.warn("Screen share cancelled or failed:", err);
      }
    }
  };

  const toggleSpeakerMute = () => {
    const next = !isSpeakerMuted;
    if (remoteAudioRef.current) {
      remoteAudioRef.current.muted = next;
    }
    if (remoteVideoRef.current) {
      remoteVideoRef.current.muted = next;
    }
    setIsSpeakerMuted(next);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      modalContainerRef.current?.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  /* --------------------------------------------------------------------------
     RENDER
  -------------------------------------------------------------------------- */
  return (
    <div className="cc-call-overlay" role="dialog" aria-modal="true">
      <div
        ref={modalContainerRef}
        className={`cc-call-container ${isFullscreen ? "is-fullscreen" : ""}`}
      >
        {/* TOP STATUS BAR */}
        <div className="cc-call-topbar">
          <div className="cc-call-user-info">
            <img src={peerAvatar} alt={peerDisplayName} className="cc-call-avatar-mini" />
            <div>
              <div className="cc-call-peer-name">{peerDisplayName}</div>
              <div className="cc-call-status-badge">
                {callStatus === "connected" && <span className="cc-call-live-indicator" />}
                <span>
                  {callStatus === "connected"
                    ? formatDuration(duration)
                    : statusMessage || "Calling..."}
                </span>
              </div>
            </div>
          </div>

          <div className="cc-call-top-actions">
            {callStatus === "connected" && (
              <>
                <button
                  className="cc-call-icon-btn"
                  onClick={toggleSpeakerMute}
                  title={isSpeakerMuted ? "Unmute Speaker" : "Mute Speaker"}
                >
                  {isSpeakerMuted ? <FiVolumeX size={18} /> : <FiVolume2 size={18} />}
                </button>
                <button
                  className="cc-call-icon-btn"
                  onClick={toggleFullscreen}
                  title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
                >
                  {isFullscreen ? <FiMinimize2 size={18} /> : <FiMaximize2 size={18} />}
                </button>
              </>
            )}
          </div>
        </div>

        {/* SCREEN SHARE BADGE */}
        {isScreenSharing && (
          <div className="cc-call-screen-badge">
            <FiTv size={14} /> Sharing your screen
          </div>
        )}

        {/* MAIN VIEWPORT */}
        <div className="cc-call-viewport">
          {/* Hidden element for remote audio stream playback */}
          <audio ref={remoteAudioRef} autoPlay playsInline />

          {/* Connected Video Mode: Show Remote Stream */}
          {callStatus === "connected" && callType === "video" && (
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className={`cc-call-remote-video ${isScreenSharing ? "is-contain" : ""}`}
            />
          )}

          {/* Connected Audio Mode OR Ringing / Outgoing Stage */}
          {(callStatus !== "connected" || callType === "audio") && (
            <div className="cc-call-audio-stage">
              <div className="cc-call-avatar-pulse-wrap">
                <img
                  src={peerAvatar}
                  alt={peerDisplayName}
                  className="cc-call-large-avatar"
                />
              </div>

              <div>
                <h3 className="cc-call-large-name">{peerDisplayName}</h3>
                <p className="cc-call-state-desc">
                  {callStatus === "connected"
                    ? `In Audio Call (${formatDuration(duration)})`
                    : statusMessage}
                </p>
              </div>

              {callStatus === "connected" && (
                <div className="cc-call-soundwaves" title="Audio streaming">
                  <span />
                  <span />
                  <span />
                  <span />
                  <span />
                </div>
              )}
            </div>
          )}

          {/* Self View (Picture-in-Picture) for Video Calls */}
          {callStatus === "connected" && callType === "video" && !isVideoOff && (
            <div className="cc-call-pip-video-wrap">
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="cc-call-local-video"
              />
              <span className="cc-call-pip-label">You</span>
            </div>
          )}
        </div>

        {/* BOTTOM ACTION BAR */}
        <div className="cc-call-bottombar">
          {/* Callee Incoming Call Ringing Controls */}
          {callStatus === "incoming" && (
            <>
              <button
                className="cc-call-btn cc-call-btn--accept"
                onClick={acceptCall}
              >
                <FiPhoneCall size={20} />
                <span>Answer</span>
              </button>
              <button
                className="cc-call-btn cc-call-btn--decline"
                onClick={declineCall}
              >
                <FiPhoneOff size={20} />
                <span>Decline</span>
              </button>
            </>
          )}

          {/* Caller Outgoing Calling Controls */}
          {callStatus === "outgoing" && (
            <button
              className="cc-call-btn cc-call-btn--hangup"
              onClick={() => endCall(true, "Call cancelled")}
              title="Cancel Call"
            >
              <FiPhoneOff size={22} />
            </button>
          )}

          {/* Active Call Controls (Connected or Connecting) */}
          {(callStatus === "connected" || callStatus === "connecting") && (
            <>
              {/* Mic Toggle */}
              <button
                className={`cc-call-btn cc-call-btn--round ${isMuted ? "cc-call-btn--active-off" : "cc-call-btn--default"}`}
                onClick={toggleMute}
                title={isMuted ? "Unmute Mic" : "Mute Mic"}
              >
                {isMuted ? <FiMicOff size={20} /> : <FiMic size={20} />}
              </button>

              {/* Video Toggle */}
              {callType === "video" && (
                <button
                  className={`cc-call-btn cc-call-btn--round ${isVideoOff ? "cc-call-btn--active-off" : "cc-call-btn--default"}`}
                  onClick={toggleVideo}
                  title={isVideoOff ? "Start Camera" : "Stop Camera"}
                >
                  {isVideoOff ? <FiVideoOff size={20} /> : <FiVideo size={20} />}
                </button>
              )}

              {/* Screen Share Toggle */}
              {callType === "video" && (
                <button
                  className={`cc-call-btn cc-call-btn--round ${isScreenSharing ? "cc-call-btn--active-off" : "cc-call-btn--default"}`}
                  onClick={toggleScreenShare}
                  title={isScreenSharing ? "Stop Sharing Screen" : "Share Screen"}
                >
                  <FiTv size={20} />
                </button>
              )}

              {/* Hang Up Button */}
              <button
                className="cc-call-btn cc-call-btn--hangup"
                onClick={() => endCall(true, "Call ended")}
                title="End Call"
              >
                <FiPhoneOff size={22} />
              </button>
            </>
          )}

          {/* Ended State */}
          {callStatus === "ended" && (
            <button
              className="cc-call-btn cc-call-btn--default"
              onClick={onCloseCall}
            >
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

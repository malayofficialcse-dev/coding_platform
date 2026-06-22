import React, { useEffect, useState, useRef } from "react";
import api from "../api/api";
import { initSocket } from "../socket";
import { useTheme } from "../contexts/ThemeContext";
import CloseIcon from "../assets/circle-xmark-solid-full.svg";
import PaperPlane from "../assets/paper-plane-solid-full.svg";
import ImageLogo from "../assets/images-regular-full.svg";
import ChatBox from "../assets/chat2.jpg";

export default function ChatPanel({ user }) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [users, setUsers] = useState([]);
  const [selected, setSelected] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [uploading, setUploading] = useState(false);
  const [onlineIds, setOnlineIds] = useState([]); // stored as strings
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [searchQuery, setSearchQuery] = useState("");

  const fileInputRef = useRef(null);
  const selectedRef = useRef(null);
  const socketRef = useRef(null); // holds socket instance
  const messagesEndRef = useRef(null);

  // ensure selectedRef always points to current selected
  useEffect(() => {
    selectedRef.current = selected;
  }, [selected]);

  // Resize watcher (no cleanup return value mistake)
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Auto-scroll helper: uses RAF fallback so it runs after DOM paint
  const scrollToBottom = (smooth = true) => {
    try {
      if (!messagesEndRef.current) return;
      const fn = () => {
        messagesEndRef.current.scrollIntoView({
          behavior: smooth ? "smooth" : "auto",
          block: "nearest",
        });
      };
      // Give React time to paint new message, then scroll
      if ("requestAnimationFrame" in window) requestAnimationFrame(fn);
      else setTimeout(fn, 50);
    } catch (e) {
      // ignore scroll errors
      // console.warn("scroll error", e);
    }
  };

  // Scroll when messages change
  useEffect(() => {
    // only attempt scroll after a short tick so DOM is ready
    scrollToBottom(true);
  }, [messages]);

  /* -------------------------------
     SOCKET.IO init + handlers
     - Use named handler functions so we can off(...) correctly
     - Store socket in socketRef so cleanup always references it
  --------------------------------*/
  useEffect(() => {
    if (!user) return; // nothing to do

    const uid = user._id || user.id;
    // initSocket is expected to return a connected socket.io client
    const s = initSocket(uid);
    socketRef.current = s;

    // Handler: online users (normalize to strings)
    const handleOnline = (ids) => {
      try {
        if (!Array.isArray(ids)) return setOnlineIds([]);
        setOnlineIds(ids.map((x) => String(x)));
      } catch {
        setOnlineIds([]);
      }
    };

    // Handler: new incoming message
    const handleNewMessage = ({ message }) => {
      try {
        const msg = message || {};
        const sel = selectedRef.current;
        const otherId = sel?._id || sel?.id;
        const senderId = msg.senderId?._id || msg.senderId;
        const receiverId = msg.receiverId?._id || msg.receiverId;

        // if current chat is open with the sender/receiver, append message
        if (
          otherId &&
          (String(senderId) === String(otherId) ||
            String(receiverId) === String(otherId))
        ) {
          setMessages((prev) => [...prev, msg]);
        }

        // move the user in users list to top (if present)
        setUsers((prev) => {
          const updated = Array.isArray(prev) ? [...prev] : [];
          const idx = updated.findIndex(
            (u) => String(u._id || u.id) === String(senderId || receiverId)
          );
          if (idx !== -1) {
            const [uobj] = updated.splice(idx, 1);
            uobj.lastChat = new Date();
            updated.unshift(uobj);
          }
          return updated;
        });
      } catch (e) {
        // ignore
      } finally {
        // always attempt to scroll
        scrollToBottom(true);
      }
    };

    // Register handlers safely
    try {
      s.on("getOnlineUsers", handleOnline);
      s.on("newMessage", handleNewMessage);
    } catch (e) {
      // in some edge cases initSocket may return a non-socket; guard
      // console.warn("socket on error", e);
    }

    // Load user list from API
    api
      .get("/messages/users")
      .then((res) => {
        const payload = res?.data;
        const list =
          payload?.users || payload?.data || payload?.list || payload || [];
        setUsers(Array.isArray(list) ? list : []);
      })
      .catch(() => setUsers([]));

    // CLEANUP: remove listeners safely
    return () => {
      const sock = socketRef.current;
      if (sock) {
        try {
          // remove exact handlers
          sock.off && sock.off("getOnlineUsers", handleOnline);
          sock.off && sock.off("newMessage", handleNewMessage);
        } catch (e) {
          // ignore off errors
        }
      }
      socketRef.current = null;
    };
    // NOTE: we intentionally depend on `user` only so this effect runs when user changes
  }, [user]);

  /* -------------------------------
     OPEN CHAT
  --------------------------------*/
  const openChatWith = async (otherUser) => {
    setSelected(otherUser);
    try {
      const id = otherUser._id || otherUser.id;
      const res = await api.get(`/messages/${id}`);
      const msgs = res?.data?.messages || res?.data || [];
      setMessages(Array.isArray(msgs) ? msgs : []);
      // scroll after short delay to ensure DOM updated
      setTimeout(() => scrollToBottom(false), 150);
    } catch (err) {
      setMessages([]);
    }
  };

  /* -------------------------------
     CLOSE CHAT
  --------------------------------*/
  const closeChat = () => {
    setSelected(null);
    setMessages([]);
  };

  /* -------------------------------
     SEND TEXT
  --------------------------------*/
  const sendText = async () => {
    const sel = selectedRef.current;
    if (!sel || !text.trim()) return;
    const receiverId = sel._id || sel.id;
    try {
      const res = await api.post(`/messages/send/${receiverId}`, { text });
      const message = res?.data;
      if (message) setMessages((m) => [...m, message]);
      setText("");
      scrollToBottom(true);
    } catch (err) {
      console.error("sendText error:", err);
    }
  };

  /* -------------------------------
     SEND IMAGE
  --------------------------------*/
  const handleFile = async (file) => {
    const sel = selectedRef.current;
    if (!sel || !file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert("File too large. Max 5MB.");
      return;
    }
    setUploading(true);
    try {
      const base64 = await new Promise((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(r.result);
        r.onerror = reject;
        r.readAsDataURL(file);
      });
      const receiverId = sel._id || sel.id;
      const res = await api.post(`/messages/send/${receiverId}`, {
        image: base64,
      });
      const message = res?.data;
      if (message) setMessages((m) => [...m, message]);
      scrollToBottom(true);
    } catch (err) {
      console.error("handleFile error:", err);
      alert("Image upload failed.");
    } finally {
      setUploading(false);
    }
  };

  const triggerFileSelect = () => fileInputRef.current?.click();

  /* -------------------------------
     FILTER + SORT USERS
  --------------------------------*/
  const filteredUsers = [...users]
    .sort((a, b) => new Date(b.lastChat || 0) - new Date(a.lastChat || 0))
    .filter((u) =>
      (u.name || u.username || u.email || "")
        .toLowerCase()
        .includes(searchQuery.toLowerCase())
    );

  /* -------------------------------
     RENDER
  --------------------------------*/
  return (
    <div
      style={{
        display: "flex",
        flexDirection: isMobile && selected ? "column" : "row",
        height: "82vh",
        border: "1px solid var(--cc-border)",
        borderRadius: 10,
        overflow: "hidden",
        boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
        background: "var(--cc-background)",
        color: "var(--cc-text)",
      }}
    >
      {/* LEFT PANEL */}
      {(!isMobile || !selected) && (
        <aside
          style={{
            width: isMobile ? "100%" : 300,
            borderRight: isMobile ? "none" : "1px solid var(--cc-border)",
            padding: 12,
            overflowY: "auto",
            background: "var(--cc-surface)",
            scrollbarWidth: "thin",
            flexShrink: 0,
            maxHeight: "100%",
          }}
        >
          <h5 style={{ margin: 0, fontWeight: 700 }}>Chats</h5>

          {/* SEARCH */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "8px 10px",
              margin: "12px 0",
              background: "var(--cc-surface-muted)",
              borderRadius: 10,
              boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
            }}
          >
            <input
              type="text"
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                flex: 1,
                border: "none",
                outline: "none",
                background: "transparent",
                color: "var(--cc-text)",
              }}
            />
          </div>

          {/* USERS */}
          {filteredUsers.map((u) => {
            const id = u._id || u.id;
            const online = onlineIds.includes(String(id));
            return (
              <div
                key={id}
                onClick={() => openChatWith(u)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "10px 12px",
                  cursor: "pointer",
                  borderRadius: 3,
                  transition: "0.2s",
                }}
              >
                <img
                  src={u.profileImage || "/default-avatar.png"}
                  alt={u.name || u.email}
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: "50%",
                    objectFit: "cover",
                  }}
                />

                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, color: "var(--cc-text)" }}>
                    {u.name || u.username || u.email}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--cc-muted)" }}>{u.email}</div>
                </div>

                {/* ONLINE DOT A1 (right of username) */}
                {online && (
                  <span
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: "50%",
                      background: "#2ecc71",
                      display: "inline-block",
                    }}
                    title="Online"
                  />
                )}
              </div>
            );
          })}
        </aside>
      )}

      {/* RIGHT PANEL */}
      {(!isMobile || selected) && (
        <main
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            background: "var(--cc-background)",
            minHeight: 0,
            width: isMobile ? "100%" : "auto",
            color: "var(--cc-text)",
          }}
        >
          {/* HEADER */}
          <div
            style={{
              padding: 14,
              borderBottom: "1px solid var(--cc-border)",
              display: "flex",
              alignItems: "center",
              gap: 12,
              background: "var(--cc-surface)",
              flexShrink: 0,
            }}
          >
            {!selected ? (
              <div style={{ color: "var(--cc-muted)", fontWeight: 600 }}>
                Select a user to start chat
              </div>
            ) : (
              <>
                <img
                  src={selected.profileImage || "/default-avatar.png"}
                  alt={selected.name || selected.email}
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: "50%",
                    objectFit: "cover",
                  }}
                />
                <div style={{ flex: 1, fontWeight: 700, color: "var(--cc-text)" }}>
                  {selected.name || selected.email}
                </div>

                <button
                  onClick={closeChat}
                  style={{
                    padding: "4px 10px",
                    borderRadius: 6,
                    border: "1px solid var(--cc-border)",
                    background: "var(--cc-surface-muted)",
                    cursor: "pointer",
                    color: "var(--cc-text)",
                  }}
                >
                  <img src={CloseIcon} style={{ width: 18 }} alt="close" />
                </button>
              </>
            )}
          </div>

          {/* MESSAGES - only this scrolls */}
          <div
            style={{
              flex: 1,
              padding: 16,
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
              gap: 10,
              scrollbarWidth: "thin",
              backgroundColor: "var(--cc-surface-muted)",
            }}
          >
            {messages.map((m) => {
              const fromMe =
                String(m.senderId?._id || m.senderId) ===
                String(user._id || user.id);

              return (
                <div
                  key={m._id || m.createdAt}
                  style={{
                    alignSelf: fromMe ? "flex-end" : "flex-start",
                    background: fromMe ? (isDark ? "#2a3b50" : "#dcf8c6") : "var(--cc-surface)",
                    padding: "10px 14px",
                    borderRadius: 10,
                    maxWidth: "70%",
                    boxShadow: "0 0 2px rgba(0,0,0,0.1)",
                    color: "var(--cc-text)",
                  }}
                >
                  {m.text && <div>{m.text}</div>}
                  {m.image && (
                    <img
                      src={m.image}
                      alt="img"
                      style={{
                        maxWidth: 250,
                        borderRadius: 6,
                        marginTop: 5,
                      }}
                    />
                  )}
                  <div
                    style={{
                      fontSize: 10,
                      color: "var(--cc-muted)",
                      marginTop: 6,
                      textAlign: "right",
                    }}
                  >
                    {new Date(m.createdAt).toLocaleTimeString()}
                  </div>
                </div>
              );
            })}

            {/* scroll anchor */}
            <div ref={messagesEndRef} />
          </div>

          {/* FOOTER - fixed at bottom */}
          {selected && (
            <div
              style={{
                padding: 10,
                display: "flex",
                gap: 8,
                alignItems: "center",
                borderTop: "1px solid var(--cc-border)",
                background: "var(--cc-surface)",
                flexShrink: 0,
              }}
            >
              <input
                type="text"
                placeholder="Type a message..."
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendText()}
                style={{
                  flex: 1,
                  padding: 10,
                  borderRadius: 8,
                  border: "1px solid var(--cc-border)",
                  outline: "none",
                  background: "var(--cc-surface)",
                  color: "var(--cc-text)",
                }}
              />

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFile(f);
                  e.target.value = null;
                }}
              />

              <button
                onClick={triggerFileSelect}
                disabled={uploading}
                style={{
                  padding: "6px 10px",
                  borderRadius: 8,
                  border: "1px solid var(--cc-border)",
                  background: "var(--cc-surface-muted)",
                  cursor: "pointer",
                  color: "var(--cc-text)",
                }}
              >
                <img src={ImageLogo} style={{ width: 18 }} alt="attach" />
              </button>

              <button
                onClick={sendText}
                disabled={!text.trim()}
                style={{
                  padding: "6px 10px",
                  borderRadius: 3,
                  background: "var(--cc-primary)",
                  border: "none",
                  color: "#fff",
                }}
              >
                <img src={PaperPlane} style={{ width: 18 }} alt="send" />
              </button>
            </div>
          )}
        </main>
      )}
    </div>
  );
}

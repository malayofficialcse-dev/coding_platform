import React, { useCallback, useEffect, useState, useRef } from "react";
import api from "../api/api";
import { initSocket } from "../socket";
import { useTheme } from "../contexts/ThemeContext";
import CloseIcon from "../assets/circle-xmark-solid-full.svg";
import PaperPlane from "../assets/paper-plane-solid-full.svg";
import ImageLogo from "../assets/images-regular-full.svg";
import ChatBox from "../assets/chat2.jpg";

const formatChatTime = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const sameDay = date.toDateString() === new Date().toDateString();
  return sameDay
    ? date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
    : date.toLocaleDateString([], { month: "short", day: "numeric" });
};

const formatLastSeen = (value) => {
  if (!value) return "last seen recently";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "last seen recently";
  const sameDay = date.toDateString() === new Date().toDateString();
  const time = date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  return sameDay
    ? `last seen today at ${time}`
    : `last seen ${date.toLocaleDateString([], { month: "short", day: "numeric" })} at ${time}`;
};

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
  const currentUserId = String(user?._id || user?.id || "");

  const updateConversationFromMessage = useCallback((message) => {
    const senderId = String(message.senderId?._id || message.senderId || "");
    const receiverId = String(message.receiverId?._id || message.receiverId || "");
    const otherUserId = senderId === currentUserId ? receiverId : senderId;
    const lastMessage = {
      _id: message._id,
      senderId,
      text: message.text || "",
      image: message.image || "",
      createdAt: message.createdAt || new Date().toISOString(),
    };

    setUsers((currentUsers) =>
      currentUsers
        .map((conversationUser) =>
          String(conversationUser._id || conversationUser.id) === otherUserId
            ? { ...conversationUser, lastMessage, lastChat: lastMessage.createdAt }
            : conversationUser
        )
        .sort(
          (first, second) =>
            new Date(second.lastChat || 0) - new Date(first.lastChat || 0)
        )
    );
  }, [currentUserId]);

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
      console.warn("Unable to scroll to the latest message:", e);
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

    const handleLastSeen = ({ userId, lastSeen }) => {
      const normalizedId = String(userId);
      setUsers((currentUsers) =>
        currentUsers.map((conversationUser) =>
          String(conversationUser._id || conversationUser.id) === normalizedId
            ? { ...conversationUser, lastSeen }
            : conversationUser
        )
      );
      setSelected((currentSelected) =>
        currentSelected &&
        String(currentSelected._id || currentSelected.id) === normalizedId
          ? { ...currentSelected, lastSeen }
          : currentSelected
      );
    };

    const requestOnlineUsers = () => s.emit("getOnlineUsers");

    // Handler: new incoming message
    const handleNewMessage = (payload) => {
      try {
        const msg = payload?.message || payload;
        if (!msg || typeof msg !== "object") return;
        updateConversationFromMessage(msg);
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
          setMessages((prev) =>
            prev.some((item) => item._id && item._id === msg._id)
              ? prev
              : [...prev, msg]
          );
        }

      } finally {
        // always attempt to scroll
        scrollToBottom(true);
      }
    };

    // Register handlers safely
    try {
      s.on("getOnlineUsers", handleOnline);
      s.on("userLastSeen", handleLastSeen);
      s.on("newMessage", handleNewMessage);
      s.on("connect", requestOnlineUsers);
      if (s.connected) requestOnlineUsers();
    } catch (e) {
      console.error("Unable to register chat socket listeners:", e);
    }

    // Load user list from API
    api
      .get("/messages/users")
      .then((res) => {
        const payload = res?.data;
        const list =
          payload?.users || payload?.data || payload?.list || payload || [];
        setUsers((currentUsers) => {
          const currentById = new Map(
            currentUsers.map((conversationUser) => [
              String(conversationUser._id || conversationUser.id),
              conversationUser,
            ])
          );
          return (Array.isArray(list) ? list : [])
            .map((conversationUser) => {
              const current = currentById.get(
                String(conversationUser._id || conversationUser.id)
              );
              return current &&
                new Date(current.lastChat || 0) >
                  new Date(conversationUser.lastChat || 0)
                ? { ...conversationUser, ...current }
                : conversationUser;
            })
            .sort(
              (first, second) =>
                new Date(second.lastChat || 0) - new Date(first.lastChat || 0)
            );
        });
      })
      .catch((error) => {
        console.error("Failed to load chat list:", error);
        setUsers([]);
      });

    // CLEANUP: remove listeners safely
    return () => {
      const sock = socketRef.current;
      if (sock) {
        try {
          // remove exact handlers
          sock.off && sock.off("getOnlineUsers", handleOnline);
          sock.off && sock.off("userLastSeen", handleLastSeen);
          sock.off && sock.off("newMessage", handleNewMessage);
          sock.off && sock.off("connect", requestOnlineUsers);
        } catch (e) {
          console.warn("Unable to remove chat socket listeners:", e);
        }
      }
      socketRef.current = null;
    };
    // NOTE: we intentionally depend on `user` only so this effect runs when user changes
  }, [user, updateConversationFromMessage]);

  /* -------------------------------
     OPEN CHAT
  --------------------------------*/
  const openChatWith = async (otherUser) => {
    setSelected(otherUser);
    try {
      const id = otherUser._id || otherUser.id;
      const res = await api.get(`/messages/${id}`);
      const msgs = res?.data?.messages || res?.data || [];
      setMessages((currentMessages) => {
        const merged = new Map();
        [...(Array.isArray(msgs) ? msgs : []), ...currentMessages].forEach(
          (message) => {
            if (message?._id) merged.set(String(message._id), message);
          }
        );
        return Array.from(merged.values()).sort(
          (first, second) =>
            new Date(first.createdAt || 0) - new Date(second.createdAt || 0)
        );
      });
      // scroll after short delay to ensure DOM updated
      setTimeout(() => scrollToBottom(false), 150);
    } catch (err) {
      console.error("Failed to load chat history:", err);
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
      if (message) {
        setMessages((current) =>
          current.some((item) => item._id === message._id)
            ? current
            : [...current, message]
        );
        updateConversationFromMessage(message);
      }
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
      }, { timeout: 60000 });
      const message = res?.data;
      if (message) {
        setMessages((current) =>
          current.some((item) => item._id === message._id)
            ? current
            : [...current, message]
        );
        updateConversationFromMessage(message);
      }
      scrollToBottom(true);
    } catch (err) {
      console.error("handleFile error:", err);
      const reason =
        err.response?.data?.details ||
        err.response?.data?.error ||
        err.message;
      alert(`Image upload failed: ${reason}`);
    } finally {
      setUploading(false);
    }
  };

  const triggerFileSelect = () => fileInputRef.current?.click();

  /* -------------------------------
     FILTER + SORT USERS
  --------------------------------*/
  const filteredUsers = users.filter((u) =>
      (u.name || u.username || u.email || "")
        .toLowerCase()
        .includes(searchQuery.toLowerCase())
  );

  /* -------------------------------
     RENDER
  --------------------------------*/
  return (
    <div
      className="cc-chat-panel"
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
        <aside className="cc-chat-sidebar"
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
                className={`cc-chat-user${String(selected?._id || selected?.id) === String(id) ? " is-selected" : ""}`}
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
                  <div className="cc-chat-user-preview">
                    {u.lastMessage
                      ? `${String(u.lastMessage.senderId?._id || u.lastMessage.senderId) === currentUserId ? "You: " : ""}${u.lastMessage.image ? "📷 Photo" : u.lastMessage.text || "Message"}`
                      : u.username
                        ? `@${u.username}`
                        : "Start a conversation"}
                  </div>
                </div>

                <div className="cc-chat-user-trailing">
                  <span className="cc-chat-user-time">{formatChatTime(u.lastChat)}</span>
                  {online && <span className="cc-chat-online-dot" title="Online" />}
                </div>
              </div>
            );
          })}
        </aside>
      )}

      {/* RIGHT PANEL */}
      {(!isMobile || selected) && (
        <main className="cc-chat-main"
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
          <div className="cc-chat-header"
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
                <div className="cc-chat-contact-heading">
                  <div>{selected.name || selected.username || selected.email}</div>
                  <span>
                    {onlineIds.includes(String(selected._id || selected.id))
                      ? "online"
                      : formatLastSeen(selected.lastSeen)}
                  </span>
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
          <div className="cc-chat-messages"
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
                <div className={`cc-chat-bubble ${fromMe ? "is-mine" : "is-theirs"}`}
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
            <div className="cc-chat-composer"
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

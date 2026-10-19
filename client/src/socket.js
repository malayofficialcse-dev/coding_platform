import io from "socket.io-client";

let socket;

export const initSocket = (userId) => {
  const normalizedUserId = String(userId || "");
  if (socket) {
    // Reuse an in-progress connection as well. AuthContext and ChatPanel both
    // initialize the socket; replacing it before the handshake caused a loop.
    if (String(socket.auth?.userId || "") === normalizedUserId) {
      return socket;
    }
    socket.disconnect();
  }

  const configuredSocketUrl = import.meta.env.VITE_SOCKET_URL?.replace(/\/+$/, "");
  const configuredApiUrl = import.meta.env.VITE_API_URL?.replace(/\/+$/, "");
  const BACKEND_URL =
    configuredSocketUrl ||
    (configuredApiUrl ? configuredApiUrl.replace(/\/api$/, "") : window.location.origin);

  socket = io(BACKEND_URL, {
    auth: { userId: normalizedUserId },
    path: "/socket.io",
    transports: ["websocket", "polling"],
    withCredentials: true,
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: Infinity,
  });

  socket.on("connect", () => {
    console.log("Socket connected:", socket.id);
  });

  socket.on("connect_error", (error) => {
    console.error("Socket connection error:", error);
  });

  socket.on("disconnect", () => {
    console.log("Socket disconnected");
  });

  return socket;
};

export const getSocket = (userId) => {
  if (!socket && userId) return initSocket(userId);
  if (!socket) console.warn("Socket not initialized. Call initSocket first.");
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

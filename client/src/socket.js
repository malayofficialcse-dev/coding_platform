import io from "socket.io-client";

let socket;

export const initSocket = (userId) => {
  if (socket) {
    if (socket.connected && socket.auth?.userId === userId) {
      return socket;
    }
    socket.disconnect();
  }

  const BACKEND_URL =
    import.meta.env.VITE_SOCKET_URL ||
    import.meta.env.VITE_API_URL?.replace("/api", "") ||
    "http://localhost:5000";

  socket = io(BACKEND_URL, {
    auth: { userId },
    path: "/socket.io",
    transports: ["websocket", "polling"],
    withCredentials: true,
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: 5,
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

export const getSocket = () => {
  if (!socket) console.warn("Socket not initialized. Call initSocket first.");
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

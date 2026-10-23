import io from "socket.io-client";
import { getAccessToken } from "./api/accessToken";
import { refreshSession } from "./api/api";

let socket;

export const initSocket = () => {
  if (socket) {
    return socket;
  }

  const configuredSocketUrl = import.meta.env.VITE_SOCKET_URL?.replace(/\/+$/, "");
  const configuredApiUrl = import.meta.env.VITE_API_URL?.replace(/\/+$/, "");
  const BACKEND_URL =
    configuredSocketUrl ||
    (configuredApiUrl ? configuredApiUrl.replace(/\/(?:api|v1)$/, "") : window.location.origin);

  socket = io(BACKEND_URL, {
    auth: { token: getAccessToken() },
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
    if (/token|jwt|expired|unauthorized/i.test(error.message || "")) {
      refreshSession()
        .then(({ accessToken }) => {
          socket.auth = { token: accessToken };
          socket.connect();
        })
        .catch(() => disconnectSocket());
    }
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

import io from "socket.io-client";
import { getAccessToken } from "./api/accessToken";
import { refreshSession } from "./api/api";

let socket;
let socketRefreshAttempted = false;

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
    // Start with polling — it's more reliable behind Render's proxy than a
    // raw WebSocket upgrade. Socket.IO will upgrade to WebSocket automatically
    // once polling is established, avoiding the "upgrade storm" on cold starts.
    transports: ["polling", "websocket"],
    withCredentials: true,
    reconnection: true,
    reconnectionDelay: 3000,       // start at 3 s (was 1 s)
    reconnectionDelayMax: 60000,   // cap at 60 s to avoid hammering a cold service
    randomizationFactor: 0.5,
    reconnectionAttempts: 10,      // give up after 10 tries (~10 min with backoff)
  });

  socket.on("connect", () => {
    socketRefreshAttempted = false;
    console.log("Socket connected:", socket.id);
  });

  socket.on("connect_error", (error) => {
    console.error("Socket connection error:", error);
    if (/token|jwt|expired|unauthorized/i.test(error.message || "")) {
      if (socketRefreshAttempted) {
        disconnectSocket();
        return;
      }
      socketRefreshAttempted = true;
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

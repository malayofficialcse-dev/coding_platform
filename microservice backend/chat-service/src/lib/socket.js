import { Server } from "socket.io";
import dotenv from "dotenv";
import { verifyAccessToken } from "../security/accessToken.js";

dotenv.config();

let io;
const userSockets = new Map();

export function initSocket(server) {
  const allowedOrigins = [
    process.env.FRONTEND_URL || "http://localhost:5173",
    "http://localhost:3000",
    "http://localhost:5173",
    "http://localhost:5174",
    "https://code-campus-malay1.onrender.com",
    "https://code-campus-htg4.vercel.app",
  ];

  io = new Server(server, {
    cors: {
      origin: allowedOrigins,
      methods: ["GET", "POST"],
      credentials: true,
      allowedHeaders: ["Content-Type", "Authorization"],
    },
    transports: ["websocket", "polling"],
  });

  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (typeof token !== "string" || !token) throw new Error("Access token is required.");
      const decoded = verifyAccessToken(token);
      const userId = decoded.userId || decoded.id;
      if (!userId) throw new Error("Access token has no user identity.");
      socket.data.userId = String(userId);
      next();
    } catch {
      next(new Error("Unauthorized."));
    }
  });

  io.on("connection", (socket) => {
    console.log(`[Chat Socket] Client connected: ${socket.id}`);

    const userId = socket.data.userId;
    const sockets = userSockets.get(userId) || new Set();
    sockets.add(socket.id);
    userSockets.set(userId, sockets);
    socket.join(userId);

    io.emit("getOnlineUsers", Array.from(userSockets.keys()));
    socket.on("getOnlineUsers", () => {
      socket.emit("getOnlineUsers", Array.from(userSockets.keys()));
    });

    socket.on("disconnect", async () => {
      const sockets = userSockets.get(userId);
      sockets?.delete(socket.id);
      if (!sockets?.size) {
        userSockets.delete(userId);
        const lastSeen = new Date();
        io.emit("userLastSeen", { userId, lastSeen });
      }
      io.emit("getOnlineUsers", Array.from(userSockets.keys()));
      console.log(`[Chat Socket] Client disconnected: ${socket.id}`);
    });
  });

  return io;
}

export function getReceiverSocketId(userId) {
  return userSockets.get(String(userId))?.values().next().value;
}

export function getSocket() {
  if (!io) throw new Error("Socket.io not initialized in Chat Service");
  return io;
}

export default { initSocket, getReceiverSocketId, getSocket };

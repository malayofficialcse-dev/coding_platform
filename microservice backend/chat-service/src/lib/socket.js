import { Server } from "socket.io";
import dotenv from "dotenv";
import User from "../models/User.js";

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

  io.on("connection", (socket) => {
    console.log(`[Chat Socket] Client connected: ${socket.id}`);

    const userId = socket.handshake.auth?.userId || socket.handshake.query?.userId;
    if (userId) {
      const normalizedUserId = String(userId);
      const sockets = userSockets.get(normalizedUserId) || new Set();
      sockets.add(socket.id);
      userSockets.set(normalizedUserId, sockets);
      socket.join(normalizedUserId);
    }

    io.emit("getOnlineUsers", Array.from(userSockets.keys()));
    socket.on("getOnlineUsers", () => {
      socket.emit("getOnlineUsers", Array.from(userSockets.keys()));
    });

    socket.on("disconnect", async () => {
      if (userId) {
        const normalizedUserId = String(userId);
        const sockets = userSockets.get(normalizedUserId);
        sockets?.delete(socket.id);
        if (!sockets?.size) {
          userSockets.delete(normalizedUserId);
          const lastSeen = new Date();
          try {
            await User.findByIdAndUpdate(normalizedUserId, { lastSeen });
            io.emit("userLastSeen", { userId: normalizedUserId, lastSeen });
          } catch (error) {
            console.error("Failed to update user last seen:", error);
          }
        }
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

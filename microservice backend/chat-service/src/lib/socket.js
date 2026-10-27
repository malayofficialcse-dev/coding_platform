import { Server } from "socket.io";
import dotenv from "dotenv";
import { verifyAccessToken } from "../security/accessToken.js";

dotenv.config();

let io;
const userSockets = new Map();
const activeCalls = new Map();

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

    // ── Call Signaling Events (1-to-1 WebRTC) ──────────────────────────────────
    socket.on("call:initiate", ({ targetUserId, callType = "video", callerInfo = {} }) => {
      const targetId = String(targetUserId || "");
      if (!targetId) return;

      const isTargetOnline = userSockets.has(targetId);
      if (!isTargetOnline) {
        socket.emit("call:user-offline", { targetUserId: targetId });
        return;
      }

      // Check if target is already in an active call
      if (activeCalls.has(targetId)) {
        socket.emit("call:busy", { calleeId: targetId });
        return;
      }

      console.log(`[Chat Socket Call] ${userId} calling ${targetId} (${callType})`);
      io.to(targetId).emit("call:incoming", {
        callerId: userId,
        callerInfo: {
          ...callerInfo,
          id: userId,
          _id: userId,
        },
        callType,
      });
    });

    socket.on("call:accept", ({ targetUserId }) => {
      const targetId = String(targetUserId || "");
      if (!targetId) return;
      activeCalls.set(userId, targetId);
      activeCalls.set(targetId, userId);
      console.log(`[Chat Socket Call] ${userId} accepted call from ${targetId}`);
      io.to(targetId).emit("call:accepted", { calleeId: userId });
    });

    socket.on("call:reject", ({ targetUserId, reason = "declined" }) => {
      const targetId = String(targetUserId || "");
      if (!targetId) return;
      activeCalls.delete(userId);
      activeCalls.delete(targetId);
      console.log(`[Chat Socket Call] ${userId} rejected call from ${targetId} (reason: ${reason})`);
      io.to(targetId).emit("call:rejected", { calleeId: userId, reason });
    });

    socket.on("call:busy", ({ targetUserId }) => {
      const targetId = String(targetUserId || "");
      if (!targetId) return;
      io.to(targetId).emit("call:busy", { calleeId: userId });
    });

    socket.on("call:signal", ({ targetUserId, signal }) => {
      const targetId = String(targetUserId || "");
      if (!targetId || !signal) return;
      io.to(targetId).emit("call:signal", {
        senderId: userId,
        signal,
      });
    });

    socket.on("call:end", ({ targetUserId }) => {
      const targetId = String(targetUserId || activeCalls.get(userId) || "");
      activeCalls.delete(userId);
      if (targetId) {
        activeCalls.delete(targetId);
        io.to(targetId).emit("call:ended", { senderId: userId });
      }
      console.log(`[Chat Socket Call] Call ended between ${userId} and ${targetId}`);
    });

    socket.on("disconnect", async () => {
      const sockets = userSockets.get(userId);
      sockets?.delete(socket.id);

      // If user had an active call, notify partner
      const callPartner = activeCalls.get(userId);
      if (callPartner) {
        io.to(callPartner).emit("call:ended", { senderId: userId, reason: "disconnected" });
        activeCalls.delete(callPartner);
        activeCalls.delete(userId);
      }

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

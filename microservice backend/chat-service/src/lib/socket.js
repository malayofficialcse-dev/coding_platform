import { Server } from "socket.io";
import dotenv from "dotenv";

dotenv.config();

let io;
const userSocketMap = {};

export function initSocket(server) {
  const allowedOrigins = [
    process.env.FRONTEND_URL || "http://localhost:5173",
    "http://localhost:3000",
    "http://localhost:5173",
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
      userSocketMap[userId] = socket.id;
      // Join user room for targeted notifications/events
      socket.join(userId.toString());
    }

    io.emit("getOnlineUsers", Object.keys(userSocketMap));

    socket.on("disconnect", () => {
      for (const [uid, sid] of Object.entries(userSocketMap)) {
        if (sid === socket.id) {
          delete userSocketMap[uid];
          break;
        }
      }
      io.emit("getOnlineUsers", Object.keys(userSocketMap));
      console.log(`[Chat Socket] Client disconnected: ${socket.id}`);
    });
  });

  return io;
}

export function getReceiverSocketId(userId) {
  return userSocketMap[userId];
}

export function getSocket() {
  if (!io) throw new Error("Socket.io not initialized in Chat Service");
  return io;
}

export default { initSocket, getReceiverSocketId, getSocket };

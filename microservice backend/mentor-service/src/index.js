import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import cors from "cors";
import http from "node:http";
import { Server } from "socket.io";
import { WebhookReceiver } from "livekit-server-sdk";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../.env") });
dotenv.config();

// Load env before importing the DB module, which creates its connection pool at import time.
const { initializeDatabase, pool } = await import("./db.js");
const { authenticate, decodeToken } = await import("./auth.js");
const { createMentorRouter, configureRealtime } = await import("./mentor.routes.js");

const app = express();
const server = http.createServer(app);
const allowedOrigins = (process.env.CLIENT_ORIGINS || "http://localhost:5173,http://localhost:3000").split(",").map((origin) => origin.trim());
const originPolicy = (origin, callback) => {
  if (!origin || allowedOrigins.includes(origin) || /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
    return callback(null, true);
  }
  return callback(null, false);
};
const io = new Server(server, { path: "/mentor-socket.io", cors: { origin: originPolicy, credentials: true }, maxHttpBufferSize: 1e6 });
const handleLiveKitWebhook = async (req, res) => {
  if (!process.env.LIVEKIT_API_KEY || !process.env.LIVEKIT_API_SECRET) return res.sendStatus(503);
  try {
    const receiver = new WebhookReceiver(process.env.LIVEKIT_API_KEY, process.env.LIVEKIT_API_SECRET);
    const event = await receiver.receive(req.body.toString("utf8"), req.get("Authorization"));
    const roomName = event.room?.name;
    if (roomName) {
      const session = (await pool.query("SELECT id FROM mentor_sessions WHERE room_name=$1", [roomName])).rows[0];
      if (session) {
        if (event.event === "room_started") {
          const started = await pool.query("UPDATE mentor_sessions SET status='live',started_at=COALESCE(started_at,now()),updated_at=now() WHERE id=$1 AND status='scheduled' RETURNING id", [session.id]);
          if (started.rowCount) io.emit("mentor:sessions-updated");
        }
        if (event.event === "room_finished") {
          await pool.query("UPDATE mentor_sessions SET status='ended',updated_at=now() WHERE id=$1 AND status IN ('scheduled','live')", [session.id]);
          io.to(`session:${session.id}`).emit("session:ended");
          io.emit("mentor:sessions-updated");
        }
        const identity = event.participant?.identity;
        if (identity && event.event === "participant_joined") await pool.query("UPDATE mentor_enrollments SET joined_at=COALESCE(joined_at,now()),left_at=NULL WHERE session_id=$1 AND user_id=$2", [session.id, identity]);
        if (identity && event.event === "participant_left") await pool.query("UPDATE mentor_enrollments SET left_at=now() WHERE session_id=$1 AND user_id=$2", [session.id, identity]);
      }
    }
    res.sendStatus(200);
  } catch (error) {
    console.warn("Rejected LiveKit webhook:", error.message);
    res.sendStatus(401);
  }
};
const liveKitWebhookBody = express.raw({ type: "application/webhook+json", limit: "1mb" });
app.post("/api/mentor/webhooks/livekit", liveKitWebhookBody, handleLiveKitWebhook);
app.post("/v1/mentor/webhooks/livekit", liveKitWebhookBody, handleLiveKitWebhook);
app.use(cors({ origin: originPolicy, credentials: true }));
app.use(express.json({ limit: "1mb" }));
app.get("/health", (_req, res) => res.json({ service: "Mentor Service", status: "UP" }));
const mentorRouter = createMentorRouter(io);
app.use("/api/mentor", authenticate, mentorRouter);
app.use("/v1/mentor", authenticate, mentorRouter);
app.use((error, _req, res, _next) => {
  console.error("[Mentor Service] Request failed:", error.message);
  res.status(500).json({ error: "Mentor service request failed." });
});

const port = Number(process.env.PORT || 5010);
await initializeDatabase();
if (process.env.NODE_ENV === "production" && !process.env.REDIS_URL) throw new Error("REDIS_URL is required for production Socket.IO scaling.");
await configureRealtime(io);
server.listen(port, () => console.log(`[Mentor Service] listening on ${port}`));

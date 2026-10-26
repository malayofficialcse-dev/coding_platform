import { Router } from "express";
import { randomUUID } from "node:crypto";
import axios from "axios";
import { AccessToken, RoomServiceClient } from "livekit-server-sdk";
import { createAdapter } from "@socket.io/redis-adapter";
import { createClient } from "redis";
import { pool } from "./db.js";
import { decodeToken, requireMentor, requireSuperAdmin } from "./auth.js";

const clean = (value, limit = 500) => String(value || "").trim().slice(0, limit);
const livekitApiUrl = () => process.env.LIVEKIT_URL?.replace(/^wss:/i, "https:").replace(/^ws:/i, "http:");
const validUuid = (value) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value));
const asyncRoute = (handler) => (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);
const isMember = async (sessionId, userId) => {
  const { rows } = await pool.query(`SELECT s.mentor_id, e.status FROM mentor_sessions s LEFT JOIN mentor_enrollments e ON e.session_id=s.id AND e.user_id=$2 WHERE s.id=$1`, [sessionId, userId]);
  return rows[0] && (rows[0].mentor_id === userId || rows[0].status === "enrolled") ? rows[0] : null;
};

export function createMentorRouter(io) {
  const router = Router();

  router.get("/me", asyncRoute(async (req, res) => {
    const { rows } = await pool.query("SELECT * FROM mentor_applications WHERE user_id=$1", [req.user.id]);
    res.json(rows[0] || null);
  }));

  router.post("/applications", asyncRoute(async (req, res) => {
    const expertiseSource = Array.isArray(req.body.expertise) ? req.body.expertise : String(req.body.expertise || "").split(",");
    const expertise = [...new Set(expertiseSource.map((x) => clean(x, 60)).filter(Boolean))].slice(0, 12);
    const years = Number(req.body.experienceYears);
    const bio = clean(req.body.bio, 3000);
    if (!req.user.email || expertise.length === 0 || !Number.isInteger(years) || years < 0 || years > 60 || bio.length < 30) {
      return res.status(400).json({ error: "Add at least one expertise area, valid experience years, and an introduction of at least 30 characters." });
    }
    const existing = await pool.query("SELECT status FROM mentor_applications WHERE user_id=$1", [req.user.id]);
    if (existing.rows[0]?.status === "approved") return res.status(409).json({ error: "This account is already an approved mentor." });
    const { rows } = await pool.query(`
      INSERT INTO mentor_applications(user_id,name,email,expertise,experience_years,bio,status,reviewer_id,review_note,reviewed_at)
      VALUES($1,$2,$3,$4,$5,$6,'pending',NULL,'',NULL)
      ON CONFLICT(user_id) DO UPDATE SET name=EXCLUDED.name,email=EXCLUDED.email,expertise=EXCLUDED.expertise,
      experience_years=EXCLUDED.experience_years,bio=EXCLUDED.bio,status='pending',reviewer_id=NULL,review_note='',reviewed_at=NULL,updated_at=now()
      WHERE mentor_applications.status <> 'approved' RETURNING *`,
    [req.user.id, req.user.name, req.user.email, expertise, years, bio]);
    io.emit("mentor:application-updated", { status: rows[0]?.status || "pending" });
    res.status(201).json(rows[0]);
  }));

  router.get("/admin/applications", requireSuperAdmin, asyncRoute(async (req, res) => {
    const status = ["pending", "approved", "rejected"].includes(req.query.status) ? req.query.status : "pending";
    const { rows } = await pool.query("SELECT * FROM mentor_applications WHERE status=$1 ORDER BY created_at ASC LIMIT 200", [status]);
    res.json(rows);
  }));

  router.patch("/admin/applications/:id", requireSuperAdmin, asyncRoute(async (req, res) => {
    if (!validUuid(req.params.id)) return res.status(400).json({ error: "Invalid application id." });
    const decision = req.body.decision;
    if (!["approved", "rejected"].includes(decision)) return res.status(400).json({ error: "Choose approve or reject." });
    const application = (await pool.query("SELECT * FROM mentor_applications WHERE id=$1", [req.params.id])).rows[0];
    if (!application) return res.status(404).json({ error: "Application not found." });
    if (application.status !== "pending") return res.status(409).json({ error: "This application has already been reviewed." });
    let roleGranted = false;
    if (decision === "approved") {
      const internalToken = process.env.INTERNAL_SERVICE_TOKEN;
      if (!internalToken) return res.status(503).json({ error: "Role approval is not configured. Set INTERNAL_SERVICE_TOKEN on both services." });
      try {
        await axios.patch(`${process.env.AUTH_SERVICE_URL || "http://localhost:5001"}/v1/auth/internal/users/${application.user_id}/role`,
          { role: "mentor" }, { headers: { "x-internal-service-token": internalToken }, timeout: 5000 });
        roleGranted = true;
      } catch (error) {
        console.error("Unable to grant approved mentor role:", error.response?.data || error.message);
        return res.status(502).json({ error: "Could not grant mentor access. The application remains pending; retry approval." });
      }
    }
    let rows;
    try {
      ({ rows } = await pool.query(`UPDATE mentor_applications SET status=$2,reviewer_id=$3,review_note=$4,reviewed_at=now(),updated_at=now() WHERE id=$1 RETURNING *`,
        [application.id, decision, req.user.id, clean(req.body.reviewNote, 1000)]));
    } catch (error) {
      if (roleGranted) await axios.patch(`${process.env.AUTH_SERVICE_URL || "http://localhost:5001"}/v1/auth/internal/users/${application.user_id}/role`,
        { role: "student" }, { headers: { "x-internal-service-token": process.env.INTERNAL_SERVICE_TOKEN }, timeout: 5000 }).catch(() => {});
      throw error;
    }
    io.emit("mentor:application-updated", { applicationId: application.id, status: decision });
    res.json(rows[0]);
  }));

  router.get("/sessions", asyncRoute(async (req, res) => {
    const { rows } = await pool.query(`SELECT s.*, u.name AS mentor_name,
      (SELECT count(*)::int FROM mentor_enrollments e WHERE e.session_id=s.id AND e.status='enrolled') AS enrolled_count,
      EXISTS(SELECT 1 FROM mentor_enrollments e WHERE e.session_id=s.id AND e.user_id=$1 AND e.status='enrolled') AS enrolled
      FROM mentor_sessions s LEFT JOIN mentor_applications u ON u.user_id=s.mentor_id
      WHERE s.status IN ('scheduled','live') AND (s.mentor_id=$1 OR s.scheduled_at > now()-interval '4 hours')
      ORDER BY s.scheduled_at ASC LIMIT 200`, [req.user.id]);
    res.json(rows);
  }));

  router.post("/sessions", requireMentor, asyncRoute(async (req, res) => {
    const title = clean(req.body.title, 120), topic = clean(req.body.topic, 100), description = clean(req.body.description, 2000);
    const format = req.body.format;
    const start = new Date(req.body.scheduledAt);
    const duration = Number(req.body.durationMinutes || 60);
    const capacity = Number(req.body.maxParticipants || (format === "one_to_one" ? 1 : 20));
    if (title.length < 4 || topic.length < 2 || !["one_to_one", "group_class", "small_group"].includes(format) || Number.isNaN(start.valueOf()) || start <= new Date() || !Number.isInteger(duration) || duration < 15 || duration > 240 || !Number.isInteger(capacity) || capacity < 1 || capacity > (format === "small_group" ? 6 : format === "one_to_one" ? 1 : 1000)) {
      return res.status(400).json({ error: "Check the title, topic, future start time, duration (15–240 minutes), format, and participant limit." });
    }
    const roomName = `cc-${randomUUID()}`;
    const { rows } = await pool.query(`INSERT INTO mentor_sessions(mentor_id,title,description,topic,format,scheduled_at,duration_minutes,max_participants,room_name)
      VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`, [req.user.id, title, description, topic, format, start, duration, capacity, roomName]);
    io.emit("mentor:sessions-updated");
    res.status(201).json(rows[0]);
  }));

  router.post("/sessions/:id/enroll", asyncRoute(async (req, res) => {
    if (!validUuid(req.params.id)) return res.status(400).json({ error: "Invalid session id." });
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const session = (await client.query("SELECT * FROM mentor_sessions WHERE id=$1 FOR UPDATE", [req.params.id])).rows[0];
      if (!session || !["scheduled", "live"].includes(session.status)) { await client.query("ROLLBACK"); return res.status(404).json({ error: "Session is unavailable." }); }
      if (session.mentor_id === req.user.id) { await client.query("COMMIT"); return res.json({ enrolled: true, host: true }); }
      const currentEnrollment = (await client.query("SELECT * FROM mentor_enrollments WHERE session_id=$1 AND user_id=$2 AND status='enrolled'", [session.id, req.user.id])).rows[0];
      if (currentEnrollment) { await client.query("COMMIT"); return res.json(currentEnrollment); }
      const count = Number((await client.query("SELECT count(*)::int AS count FROM mentor_enrollments WHERE session_id=$1 AND status='enrolled'", [session.id])).rows[0].count);
      if (count >= session.max_participants) { await client.query("ROLLBACK"); return res.status(409).json({ error: "This session is full." }); }
      const { rows } = await client.query(`INSERT INTO mentor_enrollments(session_id,user_id) VALUES($1,$2)
        ON CONFLICT(session_id,user_id) DO UPDATE SET status='enrolled' RETURNING *`, [session.id, req.user.id]);
      await client.query("COMMIT");
      io.emit("mentor:sessions-updated");
      res.status(201).json(rows[0]);
    } catch (error) { await client.query("ROLLBACK"); throw error; } finally { client.release(); }
  }));

  router.post("/sessions/:id/join-token", asyncRoute(async (req, res) => {
    if (!validUuid(req.params.id)) return res.status(400).json({ error: "Invalid session id." });
    const session = (await pool.query(`
      SELECT s.*, COALESCE(u.name, 'Mentor') AS mentor_name
      FROM mentor_sessions s
      LEFT JOIN mentor_applications u ON u.user_id = s.mentor_id
      WHERE s.id = $1
    `, [req.params.id])).rows[0];
    if (!session || session.status === "cancelled" || session.status === "ended") return res.status(404).json({ error: "Session is unavailable." });
    if (session.mentor_id !== req.user.id && !await isMember(session.id, req.user.id)) return res.status(403).json({ error: "Enroll in this session before joining." });
    const isHost = session.mentor_id === req.user.id;
    const now = Date.now(), scheduledStart = new Date(session.scheduled_at).getTime();
    const sessionStart = session.started_at ? new Date(session.started_at).getTime() : scheduledStart;
    const ends = sessionStart + session.duration_minutes * 60000;
    if ((!isHost && session.status !== "live" && now < scheduledStart - 15 * 60000) || now > ends + 30 * 60000) {
      return res.status(409).json({ error: isHost ? "This session's end time has passed." : "You can join 15 minutes before the scheduled time, or as soon as your mentor starts the session." });
    }

    if (isHost && session.status === "scheduled") {
      await pool.query("UPDATE mentor_sessions SET status='live',started_at=COALESCE(started_at,now()),updated_at=now() WHERE id=$1 AND status='scheduled'", [session.id]);
      io.emit("mentor:sessions-updated");
    }

    const hasLiveKit = Boolean(process.env.LIVEKIT_URL && process.env.LIVEKIT_API_KEY && process.env.LIVEKIT_API_SECRET);
    if (!hasLiveKit) {
      return res.json({
        url: null,
        token: null,
        mode: "browser_media",
        session: { id: session.id, title: session.title, topic: session.topic, format: session.format, mentorId: session.mentor_id, mentor_name: session.mentor_name }
      });
    }

    const canPublish = isHost;
    try {
      const roomService = new RoomServiceClient(livekitApiUrl(), process.env.LIVEKIT_API_KEY, process.env.LIVEKIT_API_SECRET);
      await roomService.createRoom({ name: session.room_name, maxParticipants: session.max_participants + 1, emptyTimeout: 300, departureTimeout: 30 });
      const accessToken = new AccessToken(process.env.LIVEKIT_API_KEY, process.env.LIVEKIT_API_SECRET,
        { identity: req.user.id, name: clean(req.user.name, 100), ttl: "15m" });
      accessToken.addGrant({ roomJoin: true, room: session.room_name, canPublish, canSubscribe: true, canPublishData: false });
      const token = await accessToken.toJwt();
      res.json({ url: process.env.LIVEKIT_URL, token, mode: "livekit", session: { id: session.id, title: session.title, topic: session.topic, format: session.format, mentorId: session.mentor_id, mentor_name: session.mentor_name } });
    } catch (error) {
      console.warn("LiveKit room service unavailable, falling back to browser media:", error.message);
      res.json({
        url: null,
        token: null,
        mode: "browser_media",
        session: { id: session.id, title: session.title, topic: session.topic, format: session.format, mentorId: session.mentor_id, mentor_name: session.mentor_name }
      });
    }
  }));

  router.post("/sessions/:id/end", requireMentor, asyncRoute(async (req, res) => {
    const session = (await pool.query("SELECT * FROM mentor_sessions WHERE id=$1 AND mentor_id=$2 AND status IN ('scheduled','live')", [req.params.id, req.user.id])).rows[0];
    if (!session) return res.status(404).json({ error: "Active session not found for this mentor." });
    if (session.status === "live" && process.env.LIVEKIT_URL && process.env.LIVEKIT_API_KEY && process.env.LIVEKIT_API_SECRET) {
      try { await new RoomServiceClient(livekitApiUrl(), process.env.LIVEKIT_API_KEY, process.env.LIVEKIT_API_SECRET).deleteRoom(session.room_name); }
      catch (error) { console.warn("Could not delete LiveKit room:", error.message); }
    }
    const { rows } = await pool.query("UPDATE mentor_sessions SET status='ended',updated_at=now() WHERE id=$1 RETURNING *", [session.id]);
    io.to(`session:${req.params.id}`).emit("session:ended");
    io.emit("mentor:sessions-updated");
    res.json(rows[0]);
  }));

  router.get("/sessions/:id/messages", asyncRoute(async (req, res) => {
    if (!await isMember(req.params.id, req.user.id)) return res.status(403).json({ error: "Join this session to view its chat." });
    const { rows } = await pool.query("SELECT * FROM mentor_chat_messages WHERE session_id=$1 ORDER BY created_at DESC LIMIT 100", [req.params.id]);
    res.json(rows.reverse());
  }));

  router.get("/sessions/:id/polls", asyncRoute(async (req, res) => {
    if (!await isMember(req.params.id, req.user.id)) return res.status(403).json({ error: "Join this session to view polls." });
    const { rows } = await pool.query(`SELECT p.*, COALESCE(json_agg(json_build_object('option_index',v.option_index,'count',v.count)) FILTER (WHERE v.option_index IS NOT NULL),'[]') AS results,
      (SELECT option_index FROM mentor_poll_votes WHERE poll_id=p.id AND user_id=$2) AS my_vote
      FROM mentor_polls p LEFT JOIN (SELECT poll_id,option_index,count(*)::int AS count FROM mentor_poll_votes GROUP BY poll_id,option_index) v ON v.poll_id=p.id
      WHERE p.session_id=$1 GROUP BY p.id ORDER BY p.created_at DESC`, [req.params.id, req.user.id]);
    res.json(rows);
  }));

  router.post("/sessions/:id/polls", requireMentor, asyncRoute(async (req, res) => {
    const session = (await pool.query("SELECT id FROM mentor_sessions WHERE id=$1 AND mentor_id=$2", [req.params.id, req.user.id])).rows[0];
    if (!session) return res.status(404).json({ error: "Only the session mentor can create a poll." });
    const question = clean(req.body.question, 300);
    const options = [...new Set((Array.isArray(req.body.options) ? req.body.options : []).map((x) => clean(x, 100)).filter(Boolean))].slice(0, 8);
    if (question.length < 3 || options.length < 2) return res.status(400).json({ error: "A poll needs a question and at least two options." });
    const { rows } = await pool.query("INSERT INTO mentor_polls(session_id,created_by,question,options) VALUES($1,$2,$3,$4) RETURNING *", [session.id, req.user.id, question, JSON.stringify(options)]);
    io.to(`session:${req.params.id}`).emit("session:poll", rows[0]);
    res.status(201).json(rows[0]);
  }));

  router.post("/polls/:id/vote", asyncRoute(async (req, res) => {
    const poll = (await pool.query(`SELECT p.* FROM mentor_polls p JOIN mentor_enrollments e ON e.session_id=p.session_id
      WHERE p.id=$1 AND p.active=true AND e.user_id=$2 AND e.status='enrolled'`, [req.params.id, req.user.id])).rows[0];
    if (!poll) return res.status(404).json({ error: "Active poll not found for your session." });
    const optionIndex = Number(req.body.optionIndex);
    if (!Number.isInteger(optionIndex) || optionIndex < 0 || optionIndex >= poll.options.length) return res.status(400).json({ error: "Choose a valid poll option." });
    await pool.query("INSERT INTO mentor_poll_votes(poll_id,user_id,option_index) VALUES($1,$2,$3) ON CONFLICT(poll_id,user_id) DO UPDATE SET option_index=EXCLUDED.option_index,created_at=now()", [poll.id, req.user.id, optionIndex]);
    const { rows } = await pool.query("SELECT option_index,count(*)::int AS count FROM mentor_poll_votes WHERE poll_id=$1 GROUP BY option_index", [poll.id]);
    io.to(`session:${poll.session_id}`).emit("session:poll-results", { pollId: poll.id, results: rows });
    res.json({ pollId: poll.id, results: rows });
  }));

  return router;
}

export async function configureRealtime(io) {
  if (process.env.REDIS_URL) {
    const pubClient = createClient({ url: process.env.REDIS_URL });
    const subClient = pubClient.duplicate();
    pubClient.on("error", (error) => console.error("Mentor Redis publisher error:", error.message));
    subClient.on("error", (error) => console.error("Mentor Redis subscriber error:", error.message));
    try {
      await Promise.all([pubClient.connect(), subClient.connect()]);
      io.adapter(createAdapter(pubClient, subClient, { key: process.env.SOCKET_IO_REDIS_KEY || "code-campus:mentor" }));
    } catch (error) {
      if (process.env.NODE_ENV === "production") throw error;
      console.warn("Mentor Redis adapter unavailable; realtime works on one instance only:", error.message);
    }
  }
  io.use((socket, next) => {
    const decoded = decodeToken(socket.handshake.auth?.token || "");
    if (!decoded) return next(new Error("Unauthorized"));
    socket.user = { id: String(decoded.userId || decoded.id), role: decoded.role || "student", name: decoded.name || "Code Campus member" };
    next();
  });
  io.on("connection", (socket) => {
    socket.data.messageTimes = [];
    socket.on("session:join", async ({ sessionId } = {}, callback = () => {}) => {
      if (!validUuid(sessionId) || !await isMember(sessionId, socket.user.id)) return callback({ error: "Session enrollment required." });
      socket.join(`session:${sessionId}`);
      socket.data.sessionId = sessionId;
      const room = io.sockets.adapter.rooms.get(`session:${sessionId}`);
      const peers = [];
      if (room) {
        for (const id of room) {
          const s = io.sockets.sockets.get(id);
          if (s?.user) peers.push({ userId: s.user.id, name: s.user.name, role: s.user.role });
        }
      }
      io.to(`session:${sessionId}`).emit("session:peer-joined", {
        userId: socket.user.id,
        name: clean(socket.user.name, 100),
        role: socket.user.role,
        peers,
      });
      callback({ ok: true, peers });
    });
    socket.on("session:signal", ({ sessionId, targetUserId, signal } = {}) => {
      if (!validUuid(sessionId) || !signal) return;
      io.to(`session:${sessionId}`).emit("session:signal", {
        senderId: socket.user.id,
        targetUserId,
        signal,
      });
    });
    socket.on("session:request-stream", ({ sessionId } = {}) => {
      if (!validUuid(sessionId)) return;
      io.to(`session:${sessionId}`).emit("session:request-stream", {
        studentId: socket.user.id,
        studentName: clean(socket.user.name, 100),
      });
    });
    socket.on("disconnect", () => {
      if (socket.data?.sessionId) {
        io.to(`session:${socket.data.sessionId}`).emit("session:peer-left", {
          userId: socket.user.id,
        });
      }
    });
    socket.on("session:raise-hand", async ({ sessionId } = {}, callback = () => {}) => {
      if (!validUuid(sessionId) || !await isMember(sessionId, socket.user.id)) return callback({ error: "Session enrollment required." });
      io.to(`session:${sessionId}`).emit("session:hand-raised", { userId: socket.user.id, userName: clean(socket.user.name, 100) });
      callback({ ok: true });
    });
    socket.on("session:lower-hand", async ({ sessionId } = {}, callback = () => {}) => {
      if (!validUuid(sessionId)) return callback({ error: "Invalid session." });
      io.to(`session:${sessionId}`).emit("session:hand-lowered", { userId: socket.user.id });
      callback({ ok: true });
    });
    socket.on("session:question", async ({ sessionId, body } = {}, callback = () => {}) => {
      try {
        if (!validUuid(sessionId) || !await isMember(sessionId, socket.user.id)) return callback({ error: "Session enrollment required." });
        const text = clean(body, 500);
        if (!text) return callback({ error: "Question cannot be empty." });
        const question = { id: Date.now(), user_name: clean(socket.user.name, 100), body: text, created_at: new Date().toISOString() };
        io.to(`session:${sessionId}`).emit("session:question", question);
        callback({ ok: true });
      } catch { callback({ error: "Could not send question." }); }
    });
    socket.on("session:chat", async ({ sessionId, body } = {}, callback = () => {}) => {
      try {
        if (!validUuid(sessionId) || !await isMember(sessionId, socket.user.id)) return callback({ error: "Session enrollment required." });
        const now = Date.now();
        socket.data.messageTimes = socket.data.messageTimes.filter((sentAt) => now - sentAt < 10000);
        if (socket.data.messageTimes.length >= 8) return callback({ error: "Please slow down before sending another message." });
        const text = clean(body, 2000);
        if (!text) return callback({ error: "Message cannot be empty." });
        const { rows } = await pool.query("INSERT INTO mentor_chat_messages(session_id,user_id,user_name,body) VALUES($1,$2,$3,$4) RETURNING *", [sessionId, socket.user.id, clean(socket.user.name, 100), text]);
        socket.data.messageTimes.push(now);
        io.to(`session:${sessionId}`).emit("session:chat", rows[0]);
        callback({ ok: true });
      } catch { callback({ error: "Could not send message." }); }
    });
  });
}

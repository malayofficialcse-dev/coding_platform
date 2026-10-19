import express from "express";
import cors from "cors";
import morgan from "morgan";
import dotenv from "dotenv";
import { createProxyMiddleware } from "http-proxy-middleware";
import rateLimit from "express-rate-limit";
import { RedisStore } from "rate-limit-redis";
import Redis from "ioredis";
import { getServices } from "./config/services.js";
import { verifyJwtSafely } from "./security/jwt.js";
import { mountGraphQL } from "./graphql/index.js";

import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../.env") });
dotenv.config();

const app = express();
const PORT = process.env.API_GATEWAY_PORT || 5100;

const SERVICES = getServices();

// ---- Redis Client (graceful: works without Redis too) ----
let redis = null;
try {
  redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379", {
    lazyConnect: true,
    enableOfflineQueue: false,
    maxRetriesPerRequest: 1,
  });
  redis.on("error", (err) => {
    console.warn("[Gateway Redis] Connection error:", err.message, "— falling back to in-memory rate limiting");
  });
  await redis.connect().catch(() => {
    redis = null;
  });
  if (redis) console.log("[Gateway Redis] Connected ✓");
} catch {
  redis = null;
  console.warn("[Gateway Redis] Unavailable — using in-memory rate limiting");
}

// 1. CORS Configuration
const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:5173",
  "https://code-campus-malay1.onrender.com",
  "https://code-campus-htg4.vercel.app",
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(null, true); // Allow dev origins dynamically
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "x-user-id", "x-user-role", "x-user-name", "x-user-email", "x-user-permissions"],
  })
);

// 2. Logging
app.use(morgan("dev"));

// 3. Global Rate Limiter — Redis-backed, falls back to memory if Redis unavailable
const limiterConfig = {
  windowMs: 15 * 60 * 1000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests from this IP, please try again later." },
};

if (redis) {
  limiterConfig.store = new RedisStore({
    sendCommand: (...args) => redis.call(...args),
  });
}

const limiter = rateLimit(limiterConfig);
app.use(limiter);

// 4. Token Decoder & Header Enrichment Middleware
const enrichUserHeaders = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.split(" ")[1];
    const decoded = verifyJwtSafely(token);
    if (decoded) {
      req.headers["x-user-id"]          = decoded.userId || decoded.id || "";
      req.headers["x-user-role"]        = decoded.role || "user";
      req.headers["x-user-email"]       = decoded.email || "";
      req.headers["x-user-name"]        = decoded.name  || "";
      req.headers["x-user-username"]    = decoded.username || "";
      req.headers["x-user-permissions"] = JSON.stringify(decoded.permissions || {});
    }
  }
  next();
};

app.use(enrichUserHeaders);
await mountGraphQL(app);

// 5. Health Check Endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    gateway: "Code Campus API Gateway",
    timestamp: new Date().toISOString(),
    services: SERVICES,
  });
});

// Helper to create proxy with header forwarding
const createServiceProxy = (target) => {
  return createProxyMiddleware({
    target,
    changeOrigin: true,
    pathRewrite: (_path, req) => req.originalUrl,
    on: {
      proxyReq: (proxyReq, req) => {
        if (req.headers["x-user-id"]) {
          proxyReq.setHeader("x-user-id", req.headers["x-user-id"]);
        }
        if (req.headers["x-user-role"]) {
          proxyReq.setHeader("x-user-role", req.headers["x-user-role"]);
        }
        if (req.headers["x-user-email"]) {
          proxyReq.setHeader("x-user-email", req.headers["x-user-email"]);
        }
        if (req.headers["x-user-name"]) {
          proxyReq.setHeader("x-user-name", req.headers["x-user-name"]);
        }
        if (req.headers["x-user-username"]) {
          proxyReq.setHeader("x-user-username", req.headers["x-user-username"]);
        }
        if (req.headers["x-user-permissions"]) {
          proxyReq.setHeader("x-user-permissions", req.headers["x-user-permissions"]);
        }
      },
      error: (err, req, res) => {
        console.error(`[Gateway Proxy Error] Target: ${target}`, err.message);
        if (!res.headersSent) {
          res.status(503).json({
            error: "Service Temporarily Unavailable",
            targetService: target,
            details: err.message,
          });
        }
      },
    },
  });
};

// 6. Microservice Routes
app.use("/api/auth",       createServiceProxy(SERVICES.auth));
app.use("/api/users",      createServiceProxy(SERVICES.user));
app.use("/api/social",     createServiceProxy(SERVICES.user));
app.use("/api/mentor", createServiceProxy(SERVICES.mentor));
app.use("/api/admin/rbac", createServiceProxy(SERVICES.user)); // RBAC admin endpoints
app.use("/api/posts",      createServiceProxy(SERVICES.post));
app.use("/api/admin/posts",createServiceProxy(SERVICES.post));
app.use("/api/exams",      createServiceProxy(SERVICES.exam));
app.use("/api/attempts",   createServiceProxy(SERVICES.exam));
app.use("/api/admin/exams",createServiceProxy(SERVICES.exam));
app.use("/api/courses",    createServiceProxy(SERVICES.course));
app.use("/api/enrollments",createServiceProxy(SERVICES.enrollment));
app.use("/api/coding",     createServiceProxy(SERVICES.coding));
app.use("/api/notifications", createServiceProxy(SERVICES.notification));
app.use("/api/messages",   createServiceProxy(SERVICES.chat));

// 7. WebSocket Proxy for Socket.IO (/socket.io) to Chat/Socket Service
const wsProxy = createProxyMiddleware({
  target: SERVICES.chat,
  changeOrigin: true,
  ws: true,
});
app.use("/socket.io", wsProxy);

const mentorWsProxy = createProxyMiddleware({
  target: SERVICES.mentor,
  changeOrigin: true,
  ws: true,
  pathRewrite: (_path, req) => req.originalUrl,
});
app.use("/mentor-socket.io", mentorWsProxy);

// 8. 404 Handler for Unmapped Gateway Routes
app.use((req, res) => {
  res.status(404).json({ error: `API route ${req.originalUrl} not found on Gateway.` });
});

const server = app.listen(PORT, () => {
  console.log(`=================================================`);
  console.log(` 🚀 Code Campus API Gateway running on port ${PORT}`);
  console.log(` 🌐 Forwarding requests to 10 microservices`);
  console.log(`=================================================`);
});

// Support WebSocket Upgrade on HTTP Server
server.on("upgrade", (req, socket, head) => {
  if (req.url?.startsWith("/mentor-socket.io")) return mentorWsProxy.upgrade(req, socket, head);
  if (req.url?.startsWith("/socket.io")) return wsProxy.upgrade(req, socket, head);
  socket.destroy();
});

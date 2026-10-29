import express from "express";
import cors from "cors";
import morgan from "morgan";
import dotenv from "dotenv";
import { createProxyMiddleware } from "http-proxy-middleware";
import rateLimit from "express-rate-limit";
import { RedisStore } from "rate-limit-redis";
import Redis from "ioredis";
import { getServices } from "./config/services.js";
import { mountGraphQL } from "./graphql/index.js";

import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../.env") });
dotenv.config();

const app = express();
const PORT = process.env.API_GATEWAY_PORT || 5100;

const SERVICES = getServices();
app.set("trust proxy", process.env.TRUST_PROXY === "true" ? 1 : false);

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
const allowedOrigins = (process.env.CLIENT_ORIGINS || [
  "http://localhost:3000",
  "http://192.168.1.5:5173",
  "http://172.28.32.1:5173",
  "http://localhost:5173",
  "http://localhost:5174",
  "https://code-campus-malay1.onrender.com",
  "https://code-campus-htg4.vercel.app",
].join(",")).split(",").map((origin) => origin.trim()).filter(Boolean);

const isAllowedOrigin = (origin) => {
  if (!origin) return true;
  if (allowedOrigins.includes(origin)) return true;
  if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) return true;
  return false;
};

app.use(
  cors({
    origin: (origin, callback) => {
      if (isAllowedOrigin(origin)) {
        callback(null, true);
      } else {
        callback(null, false);
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    exposedHeaders: ["API-Version"],
  })
);

app.use("/v1", (_req, res, next) => {
  res.set("API-Version", "1");
  next();
});

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
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  ...(redis && {
    store: new RedisStore({
      sendCommand: (...args) => redis.call(...args),
      prefix: "rl:auth:",
    }),
  }),
  message: { error: "Too many authentication requests. Try again later." },
});
app.use("/api/auth", authLimiter);
app.use("/v1/auth", authLimiter);

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

const createServiceProxy = (target) => {
  return createProxyMiddleware({
    target,
    changeOrigin: true,
    pathRewrite: (_path, req) => req.originalUrl,
    on: {
      proxyRes: (proxyRes) => {
        for (const headerName of Object.keys(proxyRes.headers)) {
          if (headerName.startsWith("access-control-")) {
            delete proxyRes.headers[headerName];
          }
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
app.use("/api/auth", createServiceProxy(SERVICES.auth));
app.use("/v1/auth", createServiceProxy(SERVICES.auth));
app.use("/api/users", createServiceProxy(SERVICES.user));
app.use("/v1/users", createServiceProxy(SERVICES.user));
app.use("/api/social", createServiceProxy(SERVICES.user));
app.use("/v1/social", createServiceProxy(SERVICES.user));
app.use("/api/mentor", createServiceProxy(SERVICES.mentor));
app.use("/v1/mentor", createServiceProxy(SERVICES.mentor));
app.use("/api/admin/rbac", createServiceProxy(SERVICES.user)); // RBAC admin endpoints
app.use("/v1/admin/rbac", createServiceProxy(SERVICES.user));
app.use("/api/posts", createServiceProxy(SERVICES.post));
app.use("/v1/posts", createServiceProxy(SERVICES.post));
app.use("/api/admin/posts", createServiceProxy(SERVICES.post));
app.use("/v1/admin/posts", createServiceProxy(SERVICES.post));
app.use("/api/exams", createServiceProxy(SERVICES.exam));
app.use("/v1/exams", createServiceProxy(SERVICES.exam));
app.use("/api/attempts", createServiceProxy(SERVICES.exam));
app.use("/v1/attempts", createServiceProxy(SERVICES.exam));
app.use("/api/admin/exams", createServiceProxy(SERVICES.exam));
app.use("/v1/admin/exams", createServiceProxy(SERVICES.exam));
app.use("/api/courses", createServiceProxy(SERVICES.course));
app.use("/v1/courses", createServiceProxy(SERVICES.course));
app.use("/api/enrollments", createServiceProxy(SERVICES.enrollment));
app.use("/v1/enrollments", createServiceProxy(SERVICES.enrollment));
app.use("/api/coding", createServiceProxy(SERVICES.coding));
app.use("/v1/coding", createServiceProxy(SERVICES.coding));
app.use("/api/notifications", createServiceProxy(SERVICES.notification));
app.use("/v1/notifications", createServiceProxy(SERVICES.notification));
app.use("/api/messages", createServiceProxy(SERVICES.chat));
app.use("/v1/messages", createServiceProxy(SERVICES.chat));

// AI Service — RAG Chatbot
app.use("/api/ai", createServiceProxy(SERVICES.ai));
app.use("/v1/ai", createServiceProxy(SERVICES.ai));

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
  console.log(` 🔀 Forwarding requests to 11 microservices`);
  console.log(`=================================================`);
});

// Support WebSocket Upgrade on HTTP Server
server.on("upgrade", (req, socket, head) => {
  if (req.url?.startsWith("/mentor-socket.io")) return mentorWsProxy.upgrade(req, socket, head);
  if (req.url?.startsWith("/socket.io")) return wsProxy.upgrade(req, socket, head);
  socket.destroy();
});

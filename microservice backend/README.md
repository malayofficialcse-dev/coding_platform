# Code-Campus Microservices Architecture

Welcome to the **Microservices Backend** for Code-Campus. It contains 10 domain-isolated services behind an **API Gateway**, including a dedicated mentor application and live session service.

---

## 🏗️ Architecture & Service Registry

```
                         [ React Frontend Client ]
                                     │
                        (Port 5100 local / 5000 Docker)
                                     ▼
                    ┌─────────────────────────────────┐
                    │       API GATEWAY (:5000)       │
                    │  • Reverse Proxy & Routing      │
                    │  • Access Token Verification    │
                    │  • Rate Limiting & CORS         │
                    │  • WebSocket Upgrades           │
                    └────────────────┬────────────────┘
                                     │
        ┌─────────────┬──────────────┼──────────────┬─────────────┐
        ▼             ▼              ▼              ▼             ▼
  ┌───────────┐ ┌───────────┐  ┌───────────┐  ┌───────────┐ ┌───────────┐
  │   Auth    │ │   User    │  │   Post    │  │   Exam    │ │  Course   │
  │  Service  │ │  Service  │  │& Dashboard│  │  Service  │ │  Service  │
  │  (:5001)  │ │  (:5002)  │  │  (:5003)  │  │  (:5004)  │ │  (:5005)  │
  └───────────┘ └───────────┘  └───────────┘  └───────────┘ └───────────┘
        │             │              │              │             │
        ▼             ▼              ▼              ▼             ▼
  ┌───────────┐ ┌───────────┐  ┌───────────┐  ┌───────────┐
  │Enrollment │ │  Coding   │  │Notificat- │  │   Chat    │
  │  Service  │ │  Service  │  │ion Service│  │  Service  │
  │  (:5006)  │ │  (:5007)  │  │  (:5008)  │  │  (:5009)  │
  └───────────┘ └───────────┘  └───────────┘  └───────────┘
```

### Port Mapping & Service Directory

| Service Name | Port | Description & Responsibilities | Key Routes |
|---|---|---|---|
| **API Gateway** | `5100` local, `5000` Docker | Central Reverse Proxy & WS Tunnel | `/v1/*`, legacy `/api/*`, `/socket.io`, `/health` |
| **Auth Service** | `5001` | JWT Auth, Registration, Login | `/v1/auth/register`, `/v1/auth/login`, `/v1/auth/me` |
| **User Service** | `5002` | User Profiles, Follows, Directory | `/v1/users`, `/v1/social`, `/v1/admin/rbac` |
| **Post Service** | `5003` | Posts, Comments, Feeds, **Dashboard Controller** | `/v1/posts`, `/v1/admin/posts` |
| **Exam Service** | `5004` | Exam Banks, Scoring, Anti-Cheat | `/v1/exams`, `/v1/attempts`, `/v1/admin/exams` |
| **Course Service** | `5005` | Courses, Modules, Topics | `/v1/courses` |
| **Enrollment Service** | `5006` | Course Enrollments & Expiry | `/v1/enrollments` |
| **Coding Service** | `5007` | Code Execution & Plagiarism | `/v1/coding` |
| **Notification Service** | `5008` | Notifications & Event Alerts | `/v1/notifications` |
| **Chat Service** | `5009` | Direct Messaging & Socket.IO | `/v1/messages`, `/socket.io` |
| **Mentor Service** | `5010` | Mentor approval, sessions, LiveKit tokens, room chat and polls | `/v1/mentor/*`, `/mentor-socket.io` |

### REST API versioning

Use `/v1/*` for REST API integrations. All existing REST services are mounted
under version 1 at the gateway and inside their owning service. The former
`/api/*` routes remain available as compatibility aliases while clients migrate.
Versioned responses include `API-Version: 1`, exposed to browser clients by
CORS. The Auth service applies the same authentication rate limit to both
prefixes. Operational health checks and WebSocket endpoints remain unversioned.

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Node.js**: v18.0.0 or higher
- **MongoDB**: MongoDB connection URI (Atlas or local)
- **Docker & Docker Compose** (Optional, for containerized deployment)

### 2. Environment Setup
Set `JWT_SECRET` to the same cryptographically random value of at least 64 characters in the gateway and every service environment. Generate one with `node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"` and rotate any previously configured value; authentication rejects missing or shorter secrets. Set `CLIENT_ORIGINS` to the comma-separated, exact list of trusted browser origins. Access tokens last 10 minutes by default; refresh sessions rotate opaque, HttpOnly cookies with a 7-day idle and 30-day absolute lifetime. For separate-site UI and API deployments, configure `REFRESH_COOKIE_SAME_SITE=none` and `REFRESH_COOKIE_SECURE=true` (HTTPS is required). Never expose or store access tokens in localStorage. See [AUTH_TOKEN_FLOW.md](./AUTH_TOKEN_FLOW.md) for the complete lifecycle and diagram. Merge `INTERNAL_SERVICE_TOKEN` from [.env.example](./.env.example) into the environment; use a long random secret shared by the Auth and Mentor services. Add LiveKit Cloud `LIVEKIT_URL`, `LIVEKIT_API_KEY`, and `LIVEKIT_API_SECRET` there to enable real video. Never put the LiveKit API secret in the frontend environment.

RabbitMQ carries `like`, `comment`, `repost`, `follow`, and `message` notification events to the Notification Service. Set `RABBITMQ_URL` in this `.env` to the broker URL and credentials. Docker Compose defaults to `host.docker.internal:5672` so it can use the RabbitMQ container already running on the Docker host; override the full URL when the broker is on another host or Docker network. Local Node development defaults to `amqp://guest:guest@localhost:5672`.

### 3. Local Development (All Services in 1 Command)
From the root folder:
```bash
cd "microservice backend"
npm run install:all
npm run dev
```
This runs `concurrently` across all 10 services with colored terminal outputs.

The new Mentor Service creates its PostgreSQL schema on startup. For local development, it uses the same PostgreSQL server as the other services at `127.0.0.1:5432`; create a separate `mentor_db` database or set `MENTOR_DATABASE_URL` in `.env`. Docker Compose overrides this URL to use its private PostgreSQL container. Redis is used for multi-instance Socket.IO delivery. Without LiveKit credentials, mentor applications and schedules work, but joining a video room returns a setup message.

### Load local demo content

With MongoDB running locally, populate each microservice collection with 20
linked demo records:

```powershell
cd "microservice backend"
npm.cmd run seed:demo
```

The seeder is safe to rerun and only inserts records that are not already
present. It defaults to the local `code_campus` database and refuses remote
databases unless `--allow-remote` is explicitly passed, for example
`npm.cmd run seed:demo -- --allow-remote`.
Use this local-only demo account to sign in:

- Email: `admin@demo.codecampus.local`
- Password: `CampusDemo2026!`

Do not use these demo credentials in production.

### Standalone React frontend

The separate `frontend/` folder contains a React + Tailwind CSS app for this
microservices backend. Start the gateway and services first, then open a second
PowerShell window:

```powershell
cd "microservice backend\frontend"
npm.cmd install
npm.cmd run dev
```

Open the Vite URL printed in the terminal (normally `http://localhost:5173`).
The development server proxies API requests to the local gateway at
`http://localhost:5100` (separate from the existing server on port 5000).
See [frontend/README.md](./frontend/README.md) for
available pages and deployment configuration.

### 4. Running with Docker Compose
To spin up all services in isolated Docker containers:
```bash
cd "microservice backend"
docker-compose up --build
```
To stop the services:
```bash
docker-compose down
```

---

## 🔍 Verification & Health Checks

You can verify the gateway and individual microservices via `curl` or browser:

```bash
# 1. API Gateway Health Check (local)
curl http://localhost:5100/health

# Docker Compose maps the gateway to port 5000 instead

# 2. Individual Service Health Checks
curl http://localhost:5001/health  # Auth Service
curl http://localhost:5002/health  # User Service
curl http://localhost:5003/health  # Post Service
curl http://localhost:5004/health  # Exam Service
curl http://localhost:5005/health  # Course Service
curl http://localhost:5006/health  # Enrollment Service
curl http://localhost:5007/health  # Coding Service
curl http://localhost:5008/health  # Notification Service
curl http://localhost:5009/health  # Chat Service
```

---

## 🔗 React Client Configuration
The root `client` app uses `/api` as its default API base and the Vite development proxy forwards API and Socket.IO traffic to the local gateway at `http://localhost:5100`. Override the proxy target with `VITE_API_PROXY_TARGET` when running the gateway elsewhere. For production builds, set `VITE_API_URL` to the API gateway origin (with or without the `/api` suffix); set `VITE_SOCKET_URL` if Socket.IO is hosted on a different origin.

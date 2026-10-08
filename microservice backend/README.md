# Code-Campus Microservices Architecture

Welcome to the enterprise-grade **Microservices Backend** for Code-Campus. This project decomposes the monolithic application into 9 domain-isolated, independently deployable services organized behind an **API Gateway**.

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
                    │  • Token Header Enrichment      │
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
| **API Gateway** | `5100` local, `5000` Docker | Central Reverse Proxy & WS Tunnel | `/api/*`, `/socket.io`, `/health` |
| **Auth Service** | `5001` | JWT Auth, Registration, Login | `/api/auth/register`, `/api/auth/login`, `/api/auth/me` |
| **User Service** | `5002` | User Profiles, Follows, Directory | `/api/users`, `/api/users/follow/:id`, `/api/users/search` |
| **Post Service** | `5003` | Posts, Comments, Feeds, **Dashboard Controller** | `/api/posts`, `/api/posts/feed`, `/api/posts/admin/*`, `/api/posts/dashboard/metrics` |
| **Exam Service** | `5004` | Exam Banks, Scoring, Anti-Cheat | `/api/exams`, `/api/attempts`, `/api/exams/:id/analytics` |
| **Course Service** | `5005` | Courses, Modules, Topics | `/api/courses`, `/api/courses/:id/topics` |
| **Enrollment Service** | `5006` | Course Enrollments & Expiry | `/api/enrollments`, `/api/enrollments/my` |
| **Coding Service** | `5007` | Code Execution & Plagiarism | `/api/coding/problems`, `/api/coding/submit/:id` |
| **Notification Service** | `5008` | Notifications & Event Alerts | `/api/notifications`, `/api/notifications/unread-count` |
| **Chat Service** | `5009` | Direct Messaging & Socket.IO | `/api/messages`, `/api/messages/users`, `/socket.io` |

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Node.js**: v18.0.0 or higher
- **MongoDB**: MongoDB connection URI (Atlas or local)
- **Docker & Docker Compose** (Optional, for containerized deployment)

### 2. Environment Setup
The environment file `.env` is already configured in `microservice backend/.env` based on your project settings.

### 3. Local Development (All Services in 1 Command)
From the root folder:
```bash
cd "microservice backend"
npm run install:all
npm run dev
```
This runs `concurrently` across all 10 services with colored terminal outputs.

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

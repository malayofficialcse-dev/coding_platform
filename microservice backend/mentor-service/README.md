# Mentor service

This service owns mentor applications, super admin decisions, session schedules, enrollment, LiveKit join tokens, persisted room chat, and polls. It has its own PostgreSQL database. The API gateway proxies `/v1/mentor/*`; legacy `/api/mentor/*` routes remain available during migration. Room sockets use `/mentor-socket.io` and Redis pub/sub.

## Local setup

1. Copy `../.env.example` to `../.env` only if you are creating a fresh local environment. Merge these values into an existing `.env` rather than overwriting it.
2. Set `JWT_SECRET` to the same cryptographically random value of at least 64 characters in the gateway and every service that verifies JWTs. Generate one with `node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"`.
3. Set `INTERNAL_SERVICE_TOKEN` to a long random value. Auth and mentor services must use the same value; notification and chat use it for their private service calls.
4. Create a LiveKit Cloud project and set `LIVEKIT_URL`, `LIVEKIT_API_KEY`, and `LIVEKIT_API_SECRET`. The API secret stays in the service environment; it must never be added to the browser env. Configure the LiveKit webhook to `https://your-domain/v1/mentor/webhooks/livekit` for attendance and room-end events.
5. Start services and databases with `docker compose up --build` from the `microservice backend` directory, or install the service packages using the root `install:all` script and start it with `npm run dev:mentor`.
6. Sign up using **Apply as a mentor**, then sign in as a super admin and open **Mentor sessions** to review the pending application. After approval, the applicant signs in again to receive the mentor role.

## Authentication layers

- **Bearer JWT:** the Auth Service issues the app token. The Mentor Service verifies it itself; it does not trust gateway-injected user identity headers.
- **Role authorization:** mentor-only operations require the `mentor` role; review operations require `super_admin`.
- **Service-to-service token:** mentor approval calls a private Auth Service endpoint using `INTERNAL_SERVICE_TOKEN` to grant the mentor role.
- **Socket authentication:** Socket.IO clients provide their bearer token in the handshake auth payload. The service verifies it and checks session membership before joining a room.
- **LiveKit access token:** the service mints a 15-minute token scoped to a single room, with publishing grants based on participant role and session format.
- **Webhook signature verification:** LiveKit webhooks are verified with the LiveKit server credentials before attendance and session state are updated.

For local development, `MENTOR_DATABASE_URL` defaults to the same PostgreSQL server used by the other services (`127.0.0.1:5432`) and a separate `mentor_db` database. Docker Compose supplies its own private database URL. The service API listens on `5010`. Set the production `REDIS_URL` to the Redis connection URL (for Upstash, use the `rediss://` TLS URL), not the `redis-cli` command. The service also accepts the `redis-cli --tls -u <url>` form and converts it to a TLS URL. In production, keep the mentor database private, use managed LiveKit or a correctly deployed SFU/TURN topology, set exact `CLIENT_ORIGINS`, and replace all development secrets.

## Render deployment checks

- Set `INTERNAL_SERVICE_TOKEN` on both the Mentor Service and Auth Service to the same long random value. If it is missing from Mentor, approving an application returns `503` and does not change the application status.
- Set Mentor Service's `AUTH_SERVICE_URL` to the deployed Auth Service base URL (for example, `https://<auth-service>.onrender.com`). The default `localhost` URL is only suitable for local development.
- Set Auth Service's `CLIENT_ORIGINS` to a comma-separated list of the exact frontend origins, including `https://codecampus-eosin.vercel.app` if that is the deployed frontend. Auth rejects refresh requests with `403` when the request's `Origin` is not in this list. For cross-site refresh cookies, also set `REFRESH_COOKIE_SAME_SITE=none` and `REFRESH_COOKIE_SECURE=true`.
- The frontend's general `/socket.io` connection is routed to Chat Service, not Mentor Service. A `502` on that path means the Gateway cannot reach its configured `CHAT_SERVICE_URL`; check that service's Render deployment and URL. Mentor room sockets use `/mentor-socket.io` and require `MENTOR_SERVICE_URL` to point to the deployed Mentor Service.

## Endpoints

- `GET/POST /v1/mentor/applications` and `GET /v1/mentor/me`
- `GET/PATCH /v1/mentor/admin/applications` (super admin only)
- `GET/POST /v1/mentor/sessions`, `POST /sessions/:id/enroll`, `POST /sessions/:id/join-token`, and `POST /sessions/:id/end`
- `GET /v1/mentor/sessions/:id/messages` and `/polls`, Socket.IO event `session:chat`, `POST /v1/mentor/polls/:id/vote`

Room tokens are scoped to one room and expire after 15 minutes. The server enforces enrollment/capacity and controls publishing: learners cannot publish in a large group class, while 1:1 and small group attendees may use camera and screen sharing.

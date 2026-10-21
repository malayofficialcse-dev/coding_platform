# Mentor service

This service owns mentor applications, super admin decisions, session schedules, enrollment, LiveKit join tokens, persisted room chat, and polls. It has its own PostgreSQL database. The API gateway proxies `/api/mentor/*`; room sockets use `/mentor-socket.io` and Redis pub/sub.

## Local setup

1. Copy `../.env.example` to `../.env` only if you are creating a fresh local environment. Merge these values into an existing `.env` rather than overwriting it.
2. Set `JWT_SECRET` to the same cryptographically random value of at least 64 characters in the gateway and every service that verifies JWTs. Generate one with `node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"`.
3. Set `INTERNAL_SERVICE_TOKEN` to a long random value. Auth and mentor services must use the same value; notification and chat use it for their private service calls.
4. Create a LiveKit Cloud project and set `LIVEKIT_URL`, `LIVEKIT_API_KEY`, and `LIVEKIT_API_SECRET`. The API secret stays in the service environment; it must never be added to the browser env. Configure the LiveKit webhook to `https://your-domain/api/mentor/webhooks/livekit` for attendance and room-end events.
5. Start services and databases with `docker compose up --build` from the `microservice backend` directory, or install the service packages using the root `install:all` script and start it with `npm run dev:mentor`.
6. Sign up using **Apply as a mentor**, then sign in as a super admin and open **Mentor sessions** to review the pending application. After approval, the applicant signs in again to receive the mentor role.

## Authentication layers

- **Bearer JWT:** the Auth Service issues the app token. The Mentor Service verifies it itself; it does not trust gateway-injected user identity headers.
- **Role authorization:** mentor-only operations require the `mentor` role; review operations require `super_admin`.
- **Service-to-service token:** mentor approval calls a private Auth Service endpoint using `INTERNAL_SERVICE_TOKEN` to grant the mentor role.
- **Socket authentication:** Socket.IO clients provide their bearer token in the handshake auth payload. The service verifies it and checks session membership before joining a room.
- **LiveKit access token:** the service mints a 15-minute token scoped to a single room, with publishing grants based on participant role and session format.
- **Webhook signature verification:** LiveKit webhooks are verified with the LiveKit server credentials before attendance and session state are updated.

For local development, `MENTOR_DATABASE_URL` defaults to the same PostgreSQL server used by the other services (`127.0.0.1:5432`) and a separate `mentor_db` database. Docker Compose supplies its own private database URL. The service API listens on `5010`. In production, keep the mentor database private, use managed LiveKit or a correctly deployed SFU/TURN topology, set exact `CLIENT_ORIGINS`, and replace all development secrets.

## Endpoints

- `GET/POST /api/mentor/applications` and `GET /api/mentor/me`
- `GET/PATCH /api/mentor/admin/applications` (super admin only)
- `GET/POST /api/mentor/sessions`, `POST /sessions/:id/enroll`, `POST /sessions/:id/join-token`, and `POST /sessions/:id/end`
- `GET /api/mentor/sessions/:id/messages` and `/polls`, Socket.IO event `session:chat`, `POST /api/mentor/polls/:id/vote`

Room tokens are scoped to one room and expire after 15 minutes. The server enforces enrollment/capacity and controls publishing: learners cannot publish in a large group class, while 1:1 and small group attendees may use camera and screen sharing.

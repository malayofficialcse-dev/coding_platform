# Mentor service

This service owns mentor applications, super admin decisions, session schedules, enrollment, LiveKit join tokens, persisted room chat, and polls. It has its own PostgreSQL database. The API gateway proxies `/api/mentor/*`; room sockets use `/mentor-socket.io` and Redis pub/sub.

## Local setup

1. Copy `../.env.example` to `../.env` only if you are creating a fresh local environment. Merge these values into an existing `.env` rather than overwriting it.
2. Set `INTERNAL_SERVICE_TOKEN` to a long random value. Auth and mentor services must use the same value.
3. Create a LiveKit Cloud project and set `LIVEKIT_URL`, `LIVEKIT_API_KEY`, and `LIVEKIT_API_SECRET`. The API secret stays in the service environment; it must never be added to the browser env. Configure the LiveKit webhook to `https://your-domain/api/mentor/webhooks/livekit` for attendance and room-end events.
4. Start services and databases with `docker compose up --build` from the `microservice backend` directory, or install the service packages using the root `install:all` script and start it with `npm run dev:mentor`.
5. Sign up using **Apply as a mentor**, then sign in as a super admin and open **Mentor sessions** to review the pending application. After approval, the applicant signs in again to receive the mentor role.

For local development, `MENTOR_DATABASE_URL` defaults to the same PostgreSQL server used by the other services (`127.0.0.1:5432`) and a separate `mentor_db` database. Docker Compose supplies its own private database URL. The service API listens on `5010`. In production, keep the mentor database private, use managed LiveKit or a correctly deployed SFU/TURN topology, set exact `CLIENT_ORIGINS`, and replace all development secrets.

## Endpoints

- `GET/POST /api/mentor/applications` and `GET /api/mentor/me`
- `GET/PATCH /api/mentor/admin/applications` (super admin only)
- `GET/POST /api/mentor/sessions`, `POST /sessions/:id/enroll`, `POST /sessions/:id/join-token`, and `POST /sessions/:id/end`
- `GET /api/mentor/sessions/:id/messages` and `/polls`, Socket.IO event `session:chat`, `POST /api/mentor/polls/:id/vote`

Room tokens are scoped to one room and expire after 15 minutes. The server enforces enrollment/capacity and controls publishing: learners cannot publish in a large group class, while 1:1 and small group attendees may use camera and screen sharing.

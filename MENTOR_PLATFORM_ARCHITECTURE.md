# Mentor platform: production architecture

## Product flow

1. Signup offers **Student** or **Apply as a mentor**. A mentor application collects identity, expertise, experience, a short teaching plan, and optional verification documents. The account is created with ordinary student privileges; the browser must never choose the account's privileged role.
2. The mentor service stores the application as `pending` and notifies the super admin panel. The applicant sees its review status and cannot create or host sessions.
3. A super admin approves or declines the application. Approval is an audited, idempotent operation: the mentor service updates application status and asks the auth service to grant the `mentor` role. The role change is made through a private service-to-service endpoint, never by trusting browser headers. The applicant then signs in again to receive a token with the approved role.
4. Approved mentors create scheduled sessions. A session has a title, topic, description, start/end time, capacity, audience mode, and status. Students discover sessions, enroll, and join only during the allowed time window.
5. The mentor or an authorized participant joins the room. The mentor can publish camera, microphone, and screen-share tracks; students subscribe. Session chat, polls, attendance, and moderation events are authenticated, persisted, and scoped to that session.

## Realtime stack recommendation

- **LiveKit SFU** for camera, microphone, and screen sharing. Use LiveKit Cloud first for operational simplicity; keep the application behind LiveKit's SDK/API boundary so it can move to a self-hosted cluster if cost, data residency, or control later requires it. A peer-to-peer mesh does not scale well for group video. LiveKit's SFU forwards published media to subscribers and supports adaptive stream behavior. [LiveKit SFU design](https://docs.livekit.io/reference/internals/livekit-sfu/)
- **LiveKit server SDK** in the mentor service to mint short-lived room tokens after checking application role, enrollment, time window, and capacity. Never expose the API secret to the browser. Tokens include room and participant permissions. [LiveKit tokens and grants](https://docs.livekit.io/home/server/generating-tokens)
- **PostgreSQL** owned by the mentor service for applications, sessions, enrollment, attendance, polls, votes, and durable chat history. Use migrations, constraints, and an outbox for notifications; do not share tables across service boundaries.
- **Socket.IO + Redis adapter** for persisted chat, poll delivery/results, Q&A, hand raises, and moderation events. The existing app already uses Socket.IO and Redis for chat. LiveKit data packets can carry ephemeral in-room state, but durable messages and poll results should also be written to the service database. [LiveKit realtime data](https://docs.livekit.io/frontends/build/media-data/)
- **Object storage** for optional recordings, with explicit consent, retention policy, and access checks. LiveKit Egress can record to MP4 or HLS; self-hosting requires deploying and scaling Egress separately. [LiveKit Egress](https://docs.livekit.io/transport/self-hosting/egress/)

## Session modes

- **1:1 mentoring:** one mentor and one learner; both may publish audio/video.
- **1:N class:** one mentor publishes; enrolled learners subscribe and use text chat, polls, and raise-hand controls. Learner publishing is disabled unless the mentor invites them to speak.
- **N:1 small group:** one mentor with a small, configured number of learners. Each learner may publish. Enforce a small cap (for example, 4–6 learners) because every camera track increases bandwidth and SFU load.

## Service boundaries

- `auth-service` remains the source of truth for credentials, account state, and effective role. Public registration always creates a student account. Only an authenticated super admin can approve, and only a private mentor-service-to-auth-service call can grant or revoke the `mentor` role.
- New `mentor-service` owns mentor applications, schedules, sessions, enrollments, LiveKit token issuance, persisted chat/polls, attendance, and LiveKit webhooks. It uses its own PostgreSQL database and Redis namespace.
- `api-gateway` verifies the user's JWT and proxies `/api/mentor/*`; the mentor service validates identity and authorization again. Admin review endpoints require `super_admin`.
- The web client has applicant, mentor dashboard, student discovery, session room, and super admin review pages. Existing `/mentorship` matching/request UI should be removed only when this replacement path is available end to end.

## Production controls required before launch

HTTPS/WSS and TURN connectivity; short-lived scoped room tokens; session capacity and schedule enforcement on the server; rate limits and moderation; audit log for application decisions and role changes; account suspension/revocation handling; consent and recording retention; database migrations/backups; observability for join failures, packet loss, and session capacity; load tests with the target participant counts; and a LiveKit Cloud or self-hosting operations budget.

## Current repository gaps

The old profile matching and mentorship request routes have been retired. `/mentorship` now hosts the application review, session scheduling, discovery, and enrollment UI. The new mentor service stores its data in its own database, while auth remains the source of effective role. The mentor service grants the mentor role through an internal-token protected auth endpoint. Public registration always creates a student; applicants receive mentor capabilities only after approval and signing in again.

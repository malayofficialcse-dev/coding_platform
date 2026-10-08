# Code Campus frontend

This is a separate React + Vite + Tailwind CSS frontend for the microservices
backend. It does not modify or depend on the existing `client` application.

## Run locally

Start the microservices and API gateway from the parent directory, then open a
second PowerShell window:

```powershell
cd "microservice backend\frontend"
npm install
npm run dev
```

Open the Vite URL printed in the terminal (normally `http://localhost:5173`).
The development server proxies `/api` and `/health` to the gateway at
`http://localhost:5100`.

The existing monolithic backend may use port `5000`; the local microservices
gateway uses port `5100` to avoid conflicting with it. Docker Compose keeps its
existing gateway port mapping on `5000`. If the gateway is running elsewhere,
set `VITE_API_PROXY_TARGET` for the Vite server, or set `VITE_API_URL` to the
gateway API base (for example, `https://api.example.com/api`) when building for
deployment.

## Available screens

- Overview with live gateway, course, assessment, and coding-practice summaries
- Course catalog, course curriculum, and enrollment
- Timed assessments and assessment history
- Coding challenges and code submissions
- Community feed, posts, likes, and comments
- Account profile and enrolled courses
- Notifications and direct messages
- Admin content overview and course/assessment creation

Authentication uses the gateway’s bearer-token API. Day/night mode is saved in
local storage. The shared stylesheet enforces a 4px radius across the interface.

## Build

```powershell
npm run build
```

To make authenticated routes and services available, configure the backend
environment as described in the parent microservices README.

# Code Campus Client

## Local development

Run `npm run dev` from this directory. Vite loads `.env.development`, which points
the API, Socket.IO, and development proxy at the local API Gateway
(`http://localhost:5100`). The gateway forwards requests to the local services
on their configured ports. Start the backend services before using the app.

## Production

Set `VITE_API_URL` to the public API Gateway URL ending in `/v1` and
`VITE_SOCKET_URL` to the public gateway origin in the production hosting
provider's build environment (for example, Vercel). These values are injected
at build time; rebuild and redeploy after changing them. Do not set production
URLs to localhost.

// import { defineConfig } from 'vite'
// import react from '@vitejs/plugin-react'

// // https://vite.dev/config/
// export default defineConfig({
//   plugins: [react()],
// })



import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import process from "node:process";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, ".", "");
  const apiTarget = env.VITE_API_PROXY_TARGET || "http://localhost:5100";

  if (process.env.VERCEL === "1") {
    const apiUrl = env.VITE_API_URL;
    let apiOrigin;

    try {
      apiOrigin = new URL(apiUrl).origin;
    } catch {
      throw new Error(
        "Vercel deployment requires VITE_API_URL to be the public API Gateway URL, for example https://<gateway>.onrender.com/v1."
      );
    }

    if (["localhost", "127.0.0.1", "::1"].includes(new URL(apiUrl).hostname)) {
      throw new Error(
        `VITE_API_URL is set to ${apiOrigin}, which is not reachable by deployed users. Set it to the public API Gateway URL in Vercel.`
      );
    }
  }

  return {
    plugins: [react()],
    server: {
      proxy: {
        "/v1": {
          target: apiTarget,
          changeOrigin: true,
        },
        "/api": {
          target: apiTarget,
          changeOrigin: true,
        },
        "/socket.io": {
          target: apiTarget,
          ws: true,
          changeOrigin: true,
        },
      },
    },
  };
});

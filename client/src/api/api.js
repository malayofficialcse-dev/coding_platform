import axios from "axios";
import { clearAccessToken, getAccessToken, setAccessToken } from "./accessToken";

const configuredApiUrl = import.meta.env.VITE_API_URL?.replace(/\/+$/, "");
export const apiBaseUrl = configuredApiUrl
  ? configuredApiUrl.endsWith("/v1")
    ? configuredApiUrl
    : configuredApiUrl.endsWith("/api")
      ? `${configuredApiUrl.slice(0, -4)}/v1`
      : `${configuredApiUrl}/v1`
  : "/v1";

export const getOAuthUrl = (provider) => `${apiBaseUrl}/auth/${provider}`;

const api = axios.create({
  baseURL: apiBaseUrl,
  // 90 s — Render free instances can take 50+ s to cold-start; 30 s was too short
  timeout: 90000,
  withCredentials: true,
  headers: {
    Accept: "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let refreshPromise;
let refreshSessionInvalid = false;
let refreshRetryAfter = 0;

export function resetRefreshSessionState() {
  refreshSessionInvalid = false;
  refreshRetryAfter = 0;
}

export async function refreshSession() {
  if (refreshSessionInvalid) {
    throw new Error("Refresh session is invalid. Sign in again.");
  }
  if (Date.now() < refreshRetryAfter) {
    throw new Error("Session refresh is temporarily delayed.");
  }
  if (!refreshPromise) {
    const sendRefresh = () => axios.post(`${apiBaseUrl}/auth/refresh`, {}, {
      withCredentials: true,
      timeout: 15000,
    }).then(({ data }) => {
      if (!data?.accessToken || !data?.user) {
        throw new Error("Refresh response did not include a valid session.");
      }
      resetRefreshSessionState();
      setAccessToken(data.accessToken);
      window.dispatchEvent(new CustomEvent("code-campus:session-refreshed", {
        detail: data.user,
      }));
      return data;
    });
    const locks = globalThis.navigator?.locks;
    const refresh = locks
      ? locks.request("code-campus-refresh-token", { mode: "exclusive" }, sendRefresh)
      : sendRefresh();
    refreshPromise = refresh.catch((error) => {
      const status = error.response?.status;
      if (status === 401) refreshSessionInvalid = true;
      if (status === 429) {
        const retrySeconds = Number(error.response.headers?.["retry-after"]);
        const rateLimitSeconds = Number(error.response.headers?.["ratelimit-reset"]);
        const delayMs = (retrySeconds || rateLimitSeconds || 60) * 1000;
        refreshRetryAfter = Date.now() + Math.min(Math.max(delayMs, 5000), 15 * 60 * 1000);
      } else if (status && status >= 500) {
        refreshRetryAfter = Date.now() + 5000;
      }
      throw error;
    }).finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const request = error.config;
    const isAuthEndpoint = /\/auth\/(login|register|refresh|logout)(?:\?|$)/.test(request?.url || "");

    // 1. Automatic retry for cold-starting Render services (502, 503, 504, timeout)
    const isIdempotent = (request?.method || "get").toLowerCase() === "get";
    const status = error.response?.status;
    const isColdStartError =
      [502, 503, 504].includes(status) ||
      error.code === "ECONNABORTED" ||
      /timeout|network error|warming up/i.test(error.message || "");

    // Render free instances can take close to a minute to wake. Keep GETs
    // alive long enough to survive that startup window and honor Retry-After
    // when the gateway explicitly tells us when to try again.
    const maxColdStartRetries = 8;
    if (isIdempotent && isColdStartError && request && (request._retryCount || 0) < maxColdStartRetries) {
      request._retryCount = (request._retryCount || 0) + 1;
      const retryAfterSeconds = Number(error.response?.headers?.["retry-after"]);
      const backoff = Math.min(3000 * (2 ** (request._retryCount - 1)), 30000);
      const delay = Number.isFinite(retryAfterSeconds) && retryAfterSeconds > 0
        ? Math.min(retryAfterSeconds * 1000, 30000)
        : backoff;
      console.warn(`[API] Service unavailable (${status || error.code}). Retrying in ${Math.ceil(delay / 1000)}s... (attempt ${request._retryCount}/${maxColdStartRetries})`);
      await new Promise((resolve) => setTimeout(resolve, delay));
      return api(request);
    }

    // 2. Token refresh handling on 401
    if (error.response?.status === 401 && request && !request._retried && !isAuthEndpoint) {
      request._retried = true;
      try {
        const { accessToken } = await refreshSession();
        request.headers.Authorization = `Bearer ${accessToken}`;
        return api(request);
      } catch (refreshError) {
        clearAccessToken();
        localStorage.removeItem("user");
        const isAuthPage = ["/login", "/signup"].includes(window.location.pathname);
        if (!isAuthPage) window.location.assign("/login");
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

export default api;

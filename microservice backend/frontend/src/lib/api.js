const configuredApiUrl = (import.meta.env.VITE_API_URL || "").replace(/\/+$/, "");
const API_BASE = configuredApiUrl
  ? configuredApiUrl.endsWith("/v1")
    ? configuredApiUrl
    : configuredApiUrl.endsWith("/api")
      ? `${configuredApiUrl.slice(0, -4)}/v1`
      : `${configuredApiUrl}/v1`
  : "/v1";
let accessToken = null;
let refreshPromise = null;

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

async function refreshSession() {
  if (!refreshPromise) {
    const sendRefresh = () => fetch(`${API_BASE}/auth/refresh`, {
        method: "POST",
        credentials: "include",
        headers: { Accept: "application/json" },
      }).then(async (response) => {
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new ApiError(result.error || "Sign in again.", response.status);
      if (!result.accessToken || !result.user) throw new Error("Refresh response did not include a valid session.");
      accessToken = result.accessToken;
      saveUser(result.user);
      return result;
      });
    const locks = globalThis.navigator?.locks;
    const refresh = locks
      ? locks.request("code-campus-refresh-token", { mode: "exclusive" }, sendRefresh)
      : sendRefresh();
    refreshPromise = refresh.finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

export async function api(path, options = {}) {
  const isGatewayHealth = path === "/../health";
  const requestPath = isGatewayHealth ? "/health" : path;
  const baseUrl = isGatewayHealth ? API_BASE.replace(/\/v1$/, "") : API_BASE;
  const makeRequest = () => {
    const headers = new Headers(options.headers || {});
    if (options.body && !(options.body instanceof FormData)) {
      headers.set("Content-Type", "application/json");
    }
    if (accessToken) headers.set("Authorization", `Bearer ${accessToken}`);
    return fetch(`${baseUrl}${requestPath}`, {
      ...options,
      credentials: "include",
      headers,
      body:
        options.body && !(options.body instanceof FormData)
          ? JSON.stringify(options.body)
          : options.body,
    });
  };

  let response = await makeRequest();
  const isAuthEndpoint = /\/auth\/(login|register|refresh|logout)(?:\?|$)/.test(path);
  if (response.status === 401 && !isAuthEndpoint) {
    try {
      await refreshSession();
      response = await makeRequest();
    } catch (error) {
      clearSession();
      throw error;
    }
  }

  const contentType = response.headers.get("content-type") || "";
  const payload = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    const isHtml =
      typeof payload === "string" &&
      (contentType.includes("text/html") || /<!doctype html|<html/i.test(payload));
    const message = isHtml
      ? "The request reached a web server instead of the API. Check that the microservices gateway is running and restart the frontend dev server."
      : payload && typeof payload === "object"
        ? payload.message || payload.error || "The request could not be completed."
        : payload || "The request could not be completed.";
    throw new ApiError(message, response.status);
  }

  return payload;
}

function saveUser(user) {
  localStorage.setItem("code-campus-user", JSON.stringify(user));
}

export function saveSession(token, user) {
  if (!token) throw new Error("An access token is required to save a session.");
  accessToken = token;
  saveUser(user);
}

export function clearSession() {
  accessToken = null;
  localStorage.removeItem("code-campus-user");
}

export function getSavedUser() {
  try {
    const user = localStorage.getItem("code-campus-user");
    return user ? JSON.parse(user) : null;
  } catch {
    return null;
  }
}

export function hasSession() {
  return Boolean(accessToken);
}

export { refreshSession };

export function getItems(payload, keys = []) {
  if (Array.isArray(payload)) return payload;
  for (const key of keys) {
    if (Array.isArray(payload?.[key])) return payload[key];
  }
  return [];
}

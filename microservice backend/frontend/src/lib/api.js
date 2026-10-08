const API_BASE = (import.meta.env.VITE_API_URL || "/api").replace(/\/$/, "");
const TOKEN_KEY = "code-campus-token";

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export async function api(path, options = {}) {
  const token = localStorage.getItem(TOKEN_KEY);
  const headers = new Headers(options.headers || {});
  const isGatewayHealth = path === "/../health";
  const requestPath = isGatewayHealth ? "/health" : path;
  const baseUrl = isGatewayHealth ? API_BASE.replace(/\/api$/, "") : API_BASE;

  if (options.body && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const response = await fetch(`${baseUrl}${requestPath}`, {
    ...options,
    headers,
    body:
      options.body && !(options.body instanceof FormData)
        ? JSON.stringify(options.body)
        : options.body,
  });

  const contentType = response.headers.get("content-type") || "";
  const payload = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    const isHtml =
      typeof payload === "string" &&
      (contentType.includes("text/html") || /<!doctype html|<html/i.test(payload));
    const message = isHtml
      ? "The request reached a web server instead of the API. Check that the microservices gateway is running on port 5100 and restart the frontend dev server."
      :
      payload && typeof payload === "object"
        ? payload.message || payload.error || "The request could not be completed."
        : payload || "The request could not be completed.";
    throw new ApiError(message, response.status);
  }

  return payload;
}

export function saveSession(token, user) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem("code-campus-user", JSON.stringify(user));
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
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
  return Boolean(localStorage.getItem(TOKEN_KEY));
}

export function getItems(payload, keys = []) {
  if (Array.isArray(payload)) return payload;
  for (const key of keys) {
    if (Array.isArray(payload?.[key])) return payload[key];
  }
  return [];
}

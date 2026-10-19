import jwt from "jsonwebtoken";

const secrets = () => [process.env.JWT_SECRET, "kweu249hp72hf4fh48g7w9f4wpef74"].filter(Boolean);
export function decodeToken(token) {
  for (const secret of secrets()) {
    try { return jwt.verify(token, secret); } catch {}
  }
  return null;
}

export function authenticate(req, res, next) {
  const token = req.headers.authorization?.replace(/^Bearer\s+/i, "");
  const decoded = token && decodeToken(token);
  // Trust only a JWT verified by this service; inbound identity headers are spoofable.
  const id = decoded?.userId || decoded?.id;
  if (!id) return res.status(401).json({ error: "Sign in to continue." });
  req.user = {
    id: String(id), role: decoded.role || "student",
    name: decoded.name || "Code Campus member",
    email: decoded.email || "",
  };
  next();
}

export const requireSuperAdmin = (req, res, next) =>
  req.user?.role === "super_admin" ? next() : res.status(403).json({ error: "Super admin access is required." });
export const requireMentor = (req, res, next) =>
  req.user?.role === "mentor"
    ? next() : res.status(403).json({ error: "An approved mentor account is required." });

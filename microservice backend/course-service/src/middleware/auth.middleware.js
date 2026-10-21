import { verifyAccessToken } from "../security/accessToken.js";

export const protect = (req, res, next) => {
  const match = req.headers.authorization?.match(/^Bearer\s+(\S+)$/i);
  if (!match) return res.status(401).json({ error: "Access denied. No token provided." });
  try {
    const decoded = verifyAccessToken(match[1]);
    req.user = {
      _id: decoded.userId || decoded.id,
      id: decoded.userId || decoded.id,
      role: decoded.role || "user",
      email: decoded.email || "",
      name: decoded.name || "",
      permissions: decoded.permissions || {},
    };
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired token." });
  }
};

export const requireAdmin = (req, res, next) => {
  if (!req.user || !["admin", "super_admin"].includes(req.user.role)) {
    return res.status(403).json({ error: "Forbidden: Admin privileges required." });
  }
  next();
};

export const requirePermission = (module, action = "view") => (req, res, next) => {
  if (!req.user) return res.status(401).json({ error: "Unauthorized." });
  const { role, permissions } = req.user;
  if (["super_admin", "admin"].includes(role)) return next();
  if (role === "course_coordinator" && module === "courses") return next();
  if (permissions?.[module]?.[action]) return next();
  return res.status(403).json({
    error: `Forbidden: Missing required permission for ${module}:${action}.`,
  });
};

export default { protect, requireAdmin, requirePermission };

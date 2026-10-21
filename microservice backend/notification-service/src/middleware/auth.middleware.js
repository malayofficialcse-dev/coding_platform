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
    };
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired token." });
  }
};

export const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ error: "Forbidden: Admin privileges required." });
  }
  next();
};

export default { protect, requireAdmin };

import jwt from "jsonwebtoken";

const verifyJwt = (token) => {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 64) {
    throw new Error("JWT_SECRET must be configured with at least 64 characters.");
  }
  return jwt.verify(token, secret);
};

export const protect = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const match = authHeader?.match(/^Bearer\s+(\S+)$/i);
  if (!match) {
    return res.status(401).json({ error: "Access denied. No token provided." });
  }

  try {
    const decoded = verifyJwt(match[1]);
    const userId = decoded.userId || decoded.id || decoded._id;
    if (!userId) return res.status(401).json({ error: "Invalid or expired token." });
    req.user = {
      _id:         userId,
      id:          userId,
      role:        decoded.role        || "user",
      email:       decoded.email       || "",
      name:        decoded.name        || "",
      permissions: decoded.permissions || {},
    };
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token." });
  }
};

export const requireRole = (...roles) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ error: "Unauthorized." });
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ error: `Forbidden. Requires role: ${roles.join(" or ")}.` });
  }
  next();
};

export const requireAdmin = (req, res, next) =>
  requireRole("admin", "super_admin")(req, res, next);

export const requirePermission = (module, action) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ error: "Unauthorized." });
  const role = req.user.role;
  if (role === "super_admin" || role === "admin") return next();
  const perm = req.user.permissions?.[module];
  if (perm && perm[action]) return next();
  return res.status(403).json({ error: `Forbidden. Missing permission: ${module}:${action}.` });
};

export default { protect, requireRole, requireAdmin, requirePermission };

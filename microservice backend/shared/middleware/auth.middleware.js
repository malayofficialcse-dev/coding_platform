import jwt from "jsonwebtoken";

const getJwtSecrets = () => [
  process.env.JWT_SECRET,
].filter((secret) => secret && secret.length >= 64);

const verifyJwt = (token) => {
  const secrets = getJwtSecrets();
  for (const secret of secrets) {
    try {
      return jwt.verify(token, secret);
    } catch {}
  }
  throw new Error("Invalid or expired token.");
};

export const protect = (req, res, next) => {
  // 1. Check if user info was already enriched by API Gateway
  const gatewayUserId = req.headers["x-user-id"];
  if (gatewayUserId) {
    req.user = {
      _id: gatewayUserId,
      id: gatewayUserId,
      role: req.headers["x-user-role"] || "user",
      email: req.headers["x-user-email"] || "",
      name: req.headers["x-user-name"] || "",
      username: req.headers["x-user-username"] || "",
      permissions: (() => {
        try { return JSON.parse(req.headers["x-user-permissions"] || "{}"); } catch { return {}; }
      })(),
    };
    return next();
  }

  // 2. Fallback to direct Bearer token verification
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Access denied. No token provided." });
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = verifyJwt(token);
    req.user = {
      _id: decoded.userId || decoded.id,
      id: decoded.userId || decoded.id,
      role: decoded.role || "user",
      email: decoded.email,
      name: decoded.name || "",
      permissions: decoded.permissions || {},
    };
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token." });
  }
};

export const requireRole = (...roles) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ error: "Unauthorized." });
  if (req.user.role === "super_admin") return next();
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ error: `Forbidden: Requires role: ${roles.join(" or ")}.` });
  }
  next();
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
  if (role === "exam_coordinator" && module === "exams") return next();
  if (role === "course_coordinator" && module === "courses") return next();
  if (role === "feed_coordinator" && module === "feed") return next();

  if (permissions?.[module]?.[action]) return next();

  return res.status(403).json({
    error: `Forbidden: Missing required permission for ${module}:${action}.`,
  });
};

export default { protect, requireRole, requireAdmin, requirePermission };

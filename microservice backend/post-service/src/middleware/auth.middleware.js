import jwt from "jsonwebtoken";

const getJwtSecrets = () => [
  process.env.JWT_SECRET,
].filter((secret) => secret && secret.length >= 64);

const verifyTokenSafely = (token) => {
  const secrets = getJwtSecrets();
  for (const secret of secrets) {
    try {
      return jwt.verify(token, secret);
    } catch { }
  }
  return null;
};

export const protect = (req, res, next) => {
  // 1. Check if user info was already enriched by API Gateway
  const gatewayUserId = req.headers["x-user-id"];
  if (gatewayUserId) {
    let permissions = {};
    try {
      if (req.headers["x-user-permissions"]) {
        permissions = typeof req.headers["x-user-permissions"] === "string"
          ? JSON.parse(req.headers["x-user-permissions"])
          : req.headers["x-user-permissions"];
      }
    } catch {
      permissions = {};
    }

    req.user = {
      _id: gatewayUserId,
      id: gatewayUserId,
      role: req.headers["x-user-role"] || "user",
      email: req.headers["x-user-email"] || "",
      name: req.headers["x-user-name"] || "",
      username: req.headers["x-user-username"] || "",
      permissions,
    };
    return next();
  }

  // 2. Fallback to direct Bearer token verification
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Access denied. No token provided." });
  }

  const token = authHeader.split(" ")[1];
  const decoded = verifyTokenSafely(token);
  if (!decoded) {
    return res.status(401).json({ error: "Invalid or expired token." });
  }

  req.user = {
    _id: decoded.userId || decoded.id,
    id: decoded.userId || decoded.id,
    role: decoded.role || "user",
    email: decoded.email || "",
    name: decoded.name || "",
    permissions: decoded.permissions || {},
  };
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
  if (role === "feed_coordinator" && module === "feed") return next();

  if (permissions?.[module]?.[action]) return next();

  return res.status(403).json({
    error: `Forbidden: Missing required permission for ${module}:${action}.`,
  });
};

export default { protect, requireAdmin, requirePermission };

import jwt from "jsonwebtoken";

const getJwtSecrets = () => [
  process.env.JWT_SECRET,
  "replace-with-a-long-random-secret",
  "kweu249hp72hf4fh48g7w9f4wpef74",
  "default_jwt_secret",
].filter(Boolean);

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
  const gatewayUserId = req.headers["x-user-id"];
  if (gatewayUserId) {
    req.user = {
      _id:         gatewayUserId,
      id:          gatewayUserId,
      role:        req.headers["x-user-role"]     || "user",
      email:       req.headers["x-user-email"]    || "",
      name:        req.headers["x-user-name"]     || "",
      username:    req.headers["x-user-username"] || "",
      permissions: (() => {
        try { return JSON.parse(req.headers["x-user-permissions"] || "{}"); } catch { return {}; }
      })(),
    };
    return next();
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Access denied. No token provided." });
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = verifyJwt(token);
    req.user = {
      _id:         decoded.userId || decoded.id,
      id:          decoded.userId || decoded.id,
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

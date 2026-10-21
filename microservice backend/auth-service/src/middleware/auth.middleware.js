import jwt from "jsonwebtoken";

const ACCESS_TOKEN_ISSUER = "code-campus-auth";
const ACCESS_TOKEN_AUDIENCE = "code-campus-api";

const verifyJwt = (token) => {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 64) {
    throw new Error("JWT_SECRET must be configured with at least 64 characters.");
  }
  const decoded = jwt.verify(token, secret, {
    algorithms: ["HS256"],
    issuer: ACCESS_TOKEN_ISSUER,
    audience: ACCESS_TOKEN_AUDIENCE,
  });
  if (decoded.tokenUse !== "access") throw new Error("Invalid access token.");
  return decoded;
};

/**
 * Attach req.user from either the API Gateway enriched headers or a Bearer JWT.
 */
export const protect = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const match = authHeader?.match(/^Bearer\s+(\S+)$/i);
  if (!match) {
    return res.status(401).json({ error: "Access denied. No token provided." });
  }

  try {
    const decoded = verifyJwt(match[1]);
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

/** Allow only specific roles */
export const requireRole = (...roles) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ error: "Unauthorized." });
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ error: `Forbidden. Requires role: ${roles.join(" or ")}.` });
  }
  next();
};

/** Super-admin shortcut */
export const requireAdmin = (req, res, next) =>
  requireRole("admin", "super_admin")(req, res, next);

/** Require a permission on a module, e.g. requirePermission("exams","create") */
export const requirePermission = (module, action) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ error: "Unauthorized." });
  const role = req.user.role;
  // super_admin always passes
  if (role === "super_admin" || role === "admin") return next();
  const perm = req.user.permissions?.[module];
  if (perm && perm[action]) return next();
  return res.status(403).json({ error: `Forbidden. Missing permission: ${module}:${action}.` });
};

export default { protect, requireRole, requireAdmin, requirePermission };

import jwt from "jsonwebtoken";

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
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "default_jwt_secret");
    req.user = {
      _id: decoded.userId || decoded.id,
      id: decoded.userId || decoded.id,
      role: decoded.role || "user",
      email: decoded.email,
    };
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token." });
  }
};

export const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ error: "Forbidden: Admin privileges required." });
  }
  next();
};

export default { protect, requireAdmin };

import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { createHash, randomBytes, randomUUID, timingSafeEqual } from "node:crypto";
import User from "../models/User.js";
import RefreshSession from "../models/RefreshSession.js";
import { sequelize } from "../config/db.js";

const ACCESS_TOKEN_ISSUER = "code-campus-auth";
const ACCESS_TOKEN_AUDIENCE = "code-campus-api";
const getAccessTokenTtl = () => {
  const ttl = process.env.ACCESS_TOKEN_TTL || "10m";
  const match = /^([1-9]\d*)(s|m)$/i.exec(ttl);
  const durationSeconds = match
    ? Number(match[1]) * (match[2].toLowerCase() === "m" ? 60 : 1)
    : Number.NaN;
  if (!Number.isSafeInteger(durationSeconds) || durationSeconds > 15 * 60) {
    throw new Error("ACCESS_TOKEN_TTL must be a duration between 1 second and 15 minutes.");
  }
  return ttl;
};
const REFRESH_COOKIE_NAME = "refresh_token";
const DAY_MS = 24 * 60 * 60 * 1000;
const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 64) {
    throw new Error("JWT_SECRET must be configured with at least 64 characters.");
  }
  return secret;
};

const getTtlDays = (name, fallback, max) => {
  const configured = process.env[name] || String(fallback);
  const value = /^\d+$/.test(configured) ? Number(configured) : Number.NaN;
  if (!Number.isSafeInteger(value) || value < 1 || value > max) {
    throw new Error(`${name} must be between 1 and ${max} days.`);
  }
  return value;
};

const getCookieOptions = () => {
  const production = process.env.NODE_ENV === "production";
  const sameSite = process.env.REFRESH_COOKIE_SAME_SITE || (production ? "none" : "lax");
  if (!["strict", "lax", "none"].includes(sameSite)) {
    throw new Error("REFRESH_COOKIE_SAME_SITE must be strict, lax, or none.");
  }
  if (production && process.env.REFRESH_COOKIE_SECURE === "false") {
    throw new Error("REFRESH_COOKIE_SECURE cannot be false in production.");
  }
  const secure = production || process.env.REFRESH_COOKIE_SECURE === "true";
  if (sameSite === "none" && !secure) {
    throw new Error("Secure refresh cookies are required in production and with SameSite=None.");
  }
  return {
    httpOnly: true,
    secure,
    sameSite,
    path: "/",
  };
};

const hashRefreshToken = (token) => createHash("sha256").update(token).digest("hex");
const getRefreshTokenFromRequest = (req) => {
  const cookieHeader = req.headers.cookie || "";
  const cookie = cookieHeader
    .split(";")
    .map((entry) => entry.trim())
    .find((entry) => entry.startsWith(`${REFRESH_COOKIE_NAME}=`));
  return cookie ? cookie.slice(REFRESH_COOKIE_NAME.length + 1) : "";
};

export const serializeUser = (user) => ({
  id: user.id,
  _id: user.id,
  name: user.name,
  username: user.username,
  email: user.email,
  role: user.role,
  college: user.college,
  degree: user.degree,
  yearOfPassing: user.yearOfPassing,
  profileImage: user.profileImage,
  bannerImage: user.bannerImage,
  permissions: user.permissions || {},
  isActive: user.isActive,
  authProvider: user.authProvider || "local",
});

export const generateAccessToken = (user) => {
  const userId = user.id || user._id;
  return jwt.sign(
    {
      tokenUse: "access",
      userId,
      id: userId,
      email: user.email,
      role: user.role,
      name: user.name,
      username: user.username,
      permissions: user.permissions || {},
    },
    getJwtSecret(),
    {
      algorithm: "HS256",
      issuer: ACCESS_TOKEN_ISSUER,
      audience: ACCESS_TOKEN_AUDIENCE,
      expiresIn: getAccessTokenTtl(),
      jwtid: randomUUID(),
    }
  );
};

const setRefreshCookie = (res, token, expiresAt) => {
  const maxAge = Math.max(0, expiresAt.getTime() - Date.now());
  res.cookie(REFRESH_COOKIE_NAME, token, {
    ...getCookieOptions(),
    maxAge,
    expires: expiresAt,
  });
};

const clearRefreshCookie = (res) => {
  res.clearCookie(REFRESH_COOKIE_NAME, getCookieOptions());
};

const assertAllowedOrigin = (req) => {
  const origin = req.get("Origin");
  if (!origin) return false;
  const allowedOrigins = (process.env.CLIENT_ORIGINS || [
    "http://localhost:3000",
    "http://localhost:5173",
    "https://code-campus-malay1.onrender.com",
    "https://code-campus-htg4.vercel.app",
  ].join(",")).split(",").map((value) => value.trim()).filter(Boolean);
  return allowedOrigins.includes(origin);
};

export const validateAuthConfiguration = () => {
  getJwtSecret();
  getAccessTokenTtl();
  getTtlDays("REFRESH_TOKEN_IDLE_DAYS", 7, 30);
  getTtlDays("REFRESH_TOKEN_ABSOLUTE_DAYS", 30, 90);
  getCookieOptions();
};

export const createSession = async (user, req, res) => {
  const now = Date.now();
  const idleExpiry = now + getTtlDays("REFRESH_TOKEN_IDLE_DAYS", 7, 30) * DAY_MS;
  const absoluteExpiry = now + getTtlDays("REFRESH_TOKEN_ABSOLUTE_DAYS", 30, 90) * DAY_MS;
  const expiresAt = new Date(Math.min(idleExpiry, absoluteExpiry));
  const absoluteExpiresAt = new Date(absoluteExpiry);
  const refreshToken = randomBytes(64).toString("base64url");
  const tokenHash = hashRefreshToken(refreshToken);

  await RefreshSession.create({
    userId: user.id,
    familyId: randomUUID(),
    tokenHash,
    expiresAt,
    absoluteExpiresAt,
    userAgent: req.get("User-Agent")?.slice(0, 512) || null,
    ipAddress: req.ip?.slice(0, 64) || null,
  });

  setRefreshCookie(res, refreshToken, expiresAt);
  return { accessToken: generateAccessToken(user), user: serializeUser(user) };
};

const revokeUserRefreshSessions = async (userId) => {
  await RefreshSession.update(
    { revokedAt: new Date() },
    { where: { userId, revokedAt: null } }
  );
};

export const DEFAULT_PERMISSIONS = {
  admin: {
    exams: { create: true, edit: true, delete: true, view: true },
    courses: { create: true, edit: true, delete: true, view: true },
    feed: { create: true, edit: true, delete: true, view: true },
    coding: { create: true, edit: true, delete: true, view: true },
    users: { create: true, edit: true, delete: true, view: true },
    analytics: { create: true, edit: true, delete: true, view: true },
  },
  exam_coordinator: {
    exams: { create: true, edit: true, delete: true, view: true },
    courses: { create: false, edit: false, delete: false, view: false },
    feed: { create: false, edit: false, delete: false, view: false },
    coding: { create: false, edit: false, delete: false, view: false },
    users: { create: false, edit: false, delete: false, view: false },
    analytics: { create: false, edit: false, delete: false, view: false },
  },
  course_coordinator: {
    exams: { create: false, edit: false, delete: false, view: false },
    courses: { create: true, edit: true, delete: true, view: true },
    feed: { create: false, edit: false, delete: false, view: false },
    coding: { create: false, edit: false, delete: false, view: false },
    users: { create: false, edit: false, delete: false, view: false },
    analytics: { create: false, edit: false, delete: false, view: false },
  },
  feed_coordinator: {
    exams: { create: false, edit: false, delete: false, view: false },
    courses: { create: false, edit: false, delete: false, view: false },
    feed: { create: true, edit: true, delete: true, view: true },
    coding: { create: false, edit: false, delete: false, view: false },
    users: { create: false, edit: false, delete: false, view: false },
    analytics: { create: false, edit: false, delete: false, view: false },
  },
  teacher: {
    exams: { create: true, edit: true, delete: false, view: true },
    courses: { create: true, edit: true, delete: false, view: true },
    feed: { create: true, edit: false, delete: false, view: true },
    coding: { create: true, edit: true, delete: false, view: true },
    users: { create: false, edit: false, delete: false, view: true },
    analytics: { create: false, edit: false, delete: false, view: true },
  },
  student: {
    exams: { create: false, edit: false, delete: false, view: true },
    courses: { create: false, edit: false, delete: false, view: true },
    feed: { create: true, edit: false, delete: false, view: true },
    coding: { create: false, edit: false, delete: false, view: true },
    users: { create: false, edit: false, delete: false, view: true },
    analytics: { create: false, edit: false, delete: false, view: false },
  },
  user: {
    exams: { create: false, edit: false, delete: false, view: true },
    courses: { create: false, edit: false, delete: false, view: true },
    feed: { create: true, edit: false, delete: false, view: true },
    coding: { create: false, edit: false, delete: false, view: true },
    users: { create: false, edit: false, delete: false, view: true },
    analytics: { create: false, edit: false, delete: false, view: false },
  },
};

export const register = async (req, res) => {
  try {
    const { name, email, password, college, degree, yearOfPassing, username } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email and password are required." });
    }

    const cleanEmail = email.toLowerCase().trim();
    let existing = await User.findOne({ where: { email: cleanEmail } });
    if (existing) {
      return res.status(400).json({ message: "User already exists" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    // Public signup must never grant privileged roles from client input.
    // Mentor access is granted only after an administrator approves an application.
    const assignedRole = "student";
    const assignedPerms = DEFAULT_PERMISSIONS[assignedRole] || DEFAULT_PERMISSIONS.student;

    const user = await User.create({
      name,
      username: username || cleanEmail.split("@")[0] + "_" + Math.floor(Math.random() * 1000),
      email: cleanEmail,
      password: hashedPassword,
      role: assignedRole,
      college: college || "",
      degree: degree || "",
      yearOfPassing: yearOfPassing || "",
      permissions: assignedPerms,
    });

    const session = await createSession(user, req, res);
    res.status(201).json(session);
  } catch (err) {
    console.error("[Auth Service Register Error]:", err);
    res.status(500).json({ message: "Server error during registration." });
  }
};

// Private mentor-service integration: only promote or revoke the mentor role.
// This endpoint is not a public role-management API.
export const setApprovedMentorRole = async (req, res) => {
  const configured = process.env.INTERNAL_SERVICE_TOKEN || "";
  const supplied = req.headers["x-internal-service-token"] || "";
  const expected = Buffer.from(configured);
  const actual = Buffer.from(String(supplied));
  if (!configured || expected.length !== actual.length || !timingSafeEqual(expected, actual)) {
    return res.status(403).json({ message: "Internal service authorization failed." });
  }
  if (!["mentor", "student"].includes(req.body.role)) {
    return res.status(400).json({ message: "Only mentor access may be granted or revoked here." });
  }
  try {
    const user = await User.findByPk(req.params.id);
    if (!user || user.role === "super_admin") return res.status(404).json({ message: "Account not found." });
    user.role = req.body.role;
    await user.save();

    // Synchronize role change to user_db as well
    try {
      const { Sequelize } = await import("sequelize");
      const userDbUrl = process.env.USER_DATABASE_URL || "postgresql://postgres:malay21@127.0.0.1:5432/user_db";
      const uSeq = new Sequelize(userDbUrl, { dialect: "postgres", logging: false });
      await uSeq.query('UPDATE "users" SET role = :role, "updatedAt" = now() WHERE id = :id', {
        replacements: { role: req.body.role, id: user.id }
      });
      await uSeq.close();
    } catch (uErr) {
      console.warn("[Auth Service] Sync to user_db notice:", uErr.message);
    }

    res.json({ id: user.id, role: user.role });
  } catch (error) {
    res.status(500).json({ message: "Could not update mentor access." });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const cleanEmail = email.toLowerCase().trim();
    const user = await User.findOne({ where: { email: cleanEmail } });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    if (user.isActive === false) {
      return res.status(403).json({ message: "Your account is deactivated. Please contact an administrator." });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    res.json(await createSession(user, req, res));
  } catch (err) {
    console.error("[Auth Service Login Error]:", err);
    res.status(500).json({ message: "Server error during login." });
  }
};

export const refreshSession = async (req, res) => {
  if (!assertAllowedOrigin(req)) {
    return res.status(403).json({ error: "Request origin is not allowed." });
  }

  const rawToken = getRefreshTokenFromRequest(req);
  if (!rawToken) return res.status(401).json({ error: "Refresh session is missing or expired." });

  const tokenHash = hashRefreshToken(rawToken);
  let result = null;
  try {
    await sequelize.transaction(async (transaction) => {
      const session = await RefreshSession.findOne({
        where: { tokenHash },
        transaction,
        lock: transaction.LOCK.UPDATE,
      });
      if (!session) return;

      const now = new Date();
      if (session.revokedAt) {
        await RefreshSession.update(
          { revokedAt: now },
          { where: { familyId: session.familyId, revokedAt: null }, transaction }
        );
        result = { replayDetected: true };
        return;
      }
      if (session.expiresAt <= now || session.absoluteExpiresAt <= now) {
        await RefreshSession.update(
          { revokedAt: now },
          { where: { familyId: session.familyId, revokedAt: null }, transaction }
        );
        result = { invalid: true };
        return;
      }

      const user = await User.findByPk(session.userId, { transaction, lock: transaction.LOCK.UPDATE });
      if (!user || user.isActive === false) {
        await RefreshSession.update(
          { revokedAt: now },
          { where: { familyId: session.familyId, revokedAt: null }, transaction }
        );
        result = { invalid: true };
        return;
      }

      const nextRefreshToken = randomBytes(64).toString("base64url");
      const nextTokenHash = hashRefreshToken(nextRefreshToken);
      const idleExpiry = now.getTime() + getTtlDays("REFRESH_TOKEN_IDLE_DAYS", 7, 30) * DAY_MS;
      const expiresAt = new Date(Math.min(idleExpiry, session.absoluteExpiresAt.getTime()));

      await session.update({ revokedAt: now, replacedByHash: nextTokenHash }, { transaction });
      await RefreshSession.create({
        userId: session.userId,
        familyId: session.familyId,
        tokenHash: nextTokenHash,
        expiresAt,
        absoluteExpiresAt: session.absoluteExpiresAt,
        userAgent: req.get("User-Agent")?.slice(0, 512) || null,
        ipAddress: req.ip?.slice(0, 64) || null,
      }, { transaction });
      result = {
        refreshToken: nextRefreshToken,
        expiresAt,
        accessToken: generateAccessToken(user),
        user: serializeUser(user),
      };
    });
  } catch (error) {
    console.error("[Auth Service Refresh Error]:", error);
    return res.status(500).json({ error: "Could not refresh the session." });
  }

  if (!result || result.invalid || result.replayDetected) {
    clearRefreshCookie(res);
    return res.status(401).json({ error: "Refresh session is invalid or expired. Sign in again." });
  }

  setRefreshCookie(res, result.refreshToken, result.expiresAt);
  return res.json({ accessToken: result.accessToken, user: result.user });
};

export const logout = async (req, res) => {
  if (!assertAllowedOrigin(req)) {
    return res.status(403).json({ error: "Request origin is not allowed." });
  }
  try {
    const rawToken = getRefreshTokenFromRequest(req);
    if (rawToken) {
      await RefreshSession.update(
        { revokedAt: new Date() },
        { where: { tokenHash: hashRefreshToken(rawToken), revokedAt: null } }
      );
    }
  } catch (error) {
    console.error("[Auth Service Logout Error]:", error);
    return res.status(500).json({ error: "Could not revoke the session." });
  }
  clearRefreshCookie(res);
  return res.sendStatus(204);
};

export const logoutAll = async (req, res) => {
  if (!assertAllowedOrigin(req)) {
    return res.status(403).json({ error: "Request origin is not allowed." });
  }
  try {
    await revokeUserRefreshSessions(req.user._id || req.user.id);
    clearRefreshCookie(res);
    return res.sendStatus(204);
  } catch (error) {
    console.error("[Auth Service Logout All Error]:", error);
    return res.status(500).json({ error: "Could not revoke all sessions." });
  }
};

export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Current and new passwords are required" });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ message: "New password must be at least 8 characters" });
    }

    const userId = req.user?._id || req.user?.id;
    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ message: "User not found" });
    if (!(await bcrypt.compare(currentPassword, user.password))) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }

    user.password = await bcrypt.hash(newPassword, await bcrypt.genSalt(10));
    await user.save();
    await revokeUserRefreshSessions(userId);

    res.json({ message: "Password updated successfully" });
  } catch (err) {
    console.error("[Auth Service Password Update Error]:", err);
    res.status(500).json({ message: "Could not update password" });
  }
};

export const me = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const user = await User.findByPk(userId, {
      attributes: { exclude: ["password"] },
    });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    if (user.isActive === false) {
      return res.status(403).json({ error: "Your account is deactivated." });
    }

    res.json(serializeUser(user));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const updateProfileImage = async (req, res) => {
  try {
    const imageUrl = req.file?.path || req.file?.secure_url || req.file?.url || req.file?.location;
    if (!imageUrl) {
      return res.status(400).json({ error: "No image uploaded" });
    }

    const userId = req.user?._id || req.user?.id;
    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    user.profileImage = imageUrl;
    await user.save();

    res.json({ profileImage: user.profileImage, user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const updateBannerImage = async (req, res) => {
  try {
    const imageUrl = req.file?.path || req.file?.secure_url || req.file?.url || req.file?.location;
    if (!imageUrl) return res.status(400).json({ error: "No banner image uploaded" });

    const userId = req.user?._id || req.user?.id;
    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    user.bannerImage = imageUrl;
    await user.save();

    const sanitized = user.toObject();
    delete sanitized.password;
    res.json({ bannerImage: user.bannerImage, user: sanitized });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const verifyToken = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1] || req.body?.token;
    if (!token) return res.status(400).json({ valid: false, message: "No token provided" });

    const decoded = jwt.verify(token, getJwtSecret(), {
      algorithms: ["HS256"],
      issuer: ACCESS_TOKEN_ISSUER,
      audience: ACCESS_TOKEN_AUDIENCE,
    });
    if (decoded.tokenUse !== "access") {
      return res.status(401).json({ valid: false, message: "Invalid access token." });
    }
    const user = await User.findByPk(decoded.userId || decoded.id, {
      attributes: { exclude: ["password"] },
    });
    if (!user) return res.status(404).json({ valid: false, message: "User not found" });

    res.json({ valid: true, user });
  } catch (err) {
    res.status(401).json({ valid: false, error: err.message });
  }
};
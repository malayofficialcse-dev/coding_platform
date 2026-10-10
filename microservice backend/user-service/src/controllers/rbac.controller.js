/**
 * Super-Admin RBAC Controller
 * All endpoints here require the caller to have role === "super_admin".
 */
import bcrypt from "bcryptjs";
import User from "../models/User.js";

const MODULES = ["exams", "courses", "feed", "coding", "users", "analytics"];

// Default permissions per role
const DEFAULT_PERMISSIONS = {
  exam_coordinator: {
    exams:     { create: true,  edit: true,  delete: true,  view: true },
    courses:   { create: false, edit: false, delete: false, view: true },
    feed:      { create: false, edit: false, delete: false, view: true },
    coding:    { create: false, edit: false, delete: false, view: true },
    users:     { create: false, edit: false, delete: false, view: true },
    analytics: { create: false, edit: false, delete: false, view: true },
  },
  course_coordinator: {
    exams:     { create: false, edit: false, delete: false, view: true },
    courses:   { create: true,  edit: true,  delete: true,  view: true },
    feed:      { create: false, edit: false, delete: false, view: true },
    coding:    { create: false, edit: false, delete: false, view: true },
    users:     { create: false, edit: false, delete: false, view: true },
    analytics: { create: false, edit: false, delete: false, view: true },
  },
  feed_coordinator: {
    exams:     { create: false, edit: false, delete: false, view: true },
    courses:   { create: false, edit: false, delete: false, view: true },
    feed:      { create: true,  edit: true,  delete: true,  view: true },
    coding:    { create: false, edit: false, delete: false, view: true },
    users:     { create: false, edit: false, delete: false, view: true },
    analytics: { create: false, edit: false, delete: false, view: true },
  },
  student: {
    exams:     { create: false, edit: false, delete: false, view: true },
    courses:   { create: false, edit: false, delete: false, view: true },
    feed:      { create: true,  edit: false, delete: false, view: true },
    coding:    { create: false, edit: false, delete: false, view: true },
    users:     { create: false, edit: false, delete: false, view: true },
    analytics: { create: false, edit: false, delete: false, view: false },
  },
};

/**
 * GET /api/admin/rbac/users
 * List all managed users (not super_admins)
 */
export const listManagedUsers = async (req, res) => {
  try {
    const page  = parseInt(req.query.page)  || 1;
    const limit = parseInt(req.query.limit) || 20;
    const search = req.query.search || "";
    const roleFilter = req.query.role || "";

    const query = { role: { $ne: "super_admin" } };
    if (search) {
      query.$or = [
        { name:     { $regex: search, $options: "i" } },
        { email:    { $regex: search, $options: "i" } },
        { username: { $regex: search, $options: "i" } },
      ];
    }
    if (roleFilter) query.role = roleFilter;

    const [users, total] = await Promise.all([
      User.find(query)
          .select("-password")
          .sort({ createdAt: -1 })
          .skip((page - 1) * limit)
          .limit(limit),
      User.countDocuments(query),
    ]);

    res.json({ users, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * POST /api/admin/rbac/users
 * Create a new user (by super admin)
 */
export const createManagedUser = async (req, res) => {
  try {
    const { name, email, password, role, college, degree, yearOfPassing, permissions } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "name, email and password are required." });
    }
    if (role === "super_admin") {
      return res.status(400).json({ message: "Cannot create another super_admin via this endpoint." });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) return res.status(400).json({ message: "User already exists." });

    const hashedPassword = await bcrypt.hash(password, 10);
    const defaultPerms   = DEFAULT_PERMISSIONS[role] || DEFAULT_PERMISSIONS.student;
    const finalPerms     = permissions || defaultPerms;

    const user = new User({
      name,
      username:      email.split("@")[0] + "_" + Math.floor(Math.random() * 1000),
      email:         email.toLowerCase(),
      password:      hashedPassword,
      role:          role || "student",
      college:       college || "",
      degree:        degree  || "",
      yearOfPassing: yearOfPassing || "",
      createdBy:     req.user._id || req.user.id,
      permissions:   finalPerms,
    });

    await user.save();

    const { password: _pw, ...safeUser } = user.toObject();
    res.status(201).json({ message: "User created successfully.", user: safeUser });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * GET /api/admin/rbac/users/:id
 */
export const getManagedUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * PUT /api/admin/rbac/users/:id
 * Update role and/or permissions
 */
export const updateManagedUser = async (req, res) => {
  try {
    const { role, permissions, isActive, name, college, degree, yearOfPassing } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: "User not found" });
    if (user.role === "super_admin") {
      return res.status(403).json({ error: "Cannot modify a super_admin." });
    }

    if (role)          user.role    = role;
    if (name)          user.name    = name;
    if (college !== undefined) user.college = college;
    if (degree  !== undefined) user.degree  = degree;
    if (yearOfPassing !== undefined) user.yearOfPassing = yearOfPassing;
    if (isActive !== undefined) user.isActive = isActive;

    // Merge permissions if provided
    if (permissions) {
      for (const mod of MODULES) {
        if (permissions[mod]) {
          user.permissions[mod] = { ...((user.permissions[mod] || {})), ...permissions[mod] };
        }
      }
    } else if (role && DEFAULT_PERMISSIONS[role]) {
      // Auto-apply defaults when role changes and no explicit permissions
      user.permissions = DEFAULT_PERMISSIONS[role];
    }

    await user.save();
    const { password: _pw, ...safeUser } = user.toObject();
    res.json({ message: "User updated.", user: safeUser });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * DELETE /api/admin/rbac/users/:id  (soft deactivate)
 */
export const deactivateManagedUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: "User not found" });
    if (user.role === "super_admin") {
      return res.status(403).json({ error: "Cannot deactivate a super_admin." });
    }
    user.isActive = false;
    await user.save();
    res.json({ message: "User deactivated." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * PATCH /api/admin/rbac/users/:id/permissions
 * Fine-grained permission update for a single module
 */
export const updateUserPermissions = async (req, res) => {
  try {
    const { module: mod, create, edit, delete: del, view } = req.body;
    if (!MODULES.includes(mod)) {
      return res.status(400).json({ error: `Unknown module: ${mod}` });
    }
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: "User not found" });
    if (user.role === "super_admin") {
      return res.status(403).json({ error: "Cannot modify super_admin permissions." });
    }

    if (!user.permissions) user.permissions = {};
    if (!user.permissions[mod]) user.permissions[mod] = {};

    if (create !== undefined) user.permissions[mod].create = !!create;
    if (edit   !== undefined) user.permissions[mod].edit   = !!edit;
    if (del    !== undefined) user.permissions[mod].delete = !!del;
    if (view   !== undefined) user.permissions[mod].view   = !!view;

    user.markModified("permissions");
    await user.save();
    res.json({ message: "Permissions updated.", permissions: user.permissions });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * GET /api/admin/rbac/stats
 */
export const getRbacStats = async (req, res) => {
  try {
    const pipeline = [
      { $group: { _id: "$role", count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ];
    const roleCounts = await User.aggregate(pipeline);
    const total      = await User.countDocuments();
    const active     = await User.countDocuments({ isActive: true });
    res.json({ total, active, inactive: total - active, roleCounts });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

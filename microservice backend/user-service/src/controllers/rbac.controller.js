import bcrypt from "bcryptjs";
import User, { Op } from "../models/User.js";
import { sequelize } from "../config/db.js";

const MODULES = ["exams", "courses", "feed", "coding", "users", "analytics"];

const DEFAULT_PERMISSIONS = {
  admin: {
    exams:     { create: true,  edit: true,  delete: true,  view: true },
    courses:   { create: true,  edit: true,  delete: true,  view: true },
    feed:      { create: true,  edit: true,  delete: true,  view: true },
    coding:    { create: true,  edit: true,  delete: true,  view: true },
    users:     { create: true,  edit: true,  delete: true,  view: true },
    analytics: { create: true,  edit: true,  delete: true,  view: true },
  },
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
  teacher: {
    exams:     { create: true,  edit: true,  delete: false, view: true },
    courses:   { create: true,  edit: true,  delete: false, view: true },
    feed:      { create: true,  edit: false, delete: false, view: true },
    coding:    { create: true,  edit: true,  delete: false, view: true },
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
  user: {
    exams:     { create: false, edit: false, delete: false, view: true },
    courses:   { create: false, edit: false, delete: false, view: true },
    feed:      { create: true,  edit: false, delete: false, view: true },
    coding:    { create: false, edit: false, delete: false, view: true },
    users:     { create: false, edit: false, delete: false, view: true },
    analytics: { create: false, edit: false, delete: false, view: false },
  },
};

export const listManagedUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const search = req.query.search || "";
    const roleFilter = req.query.role || "";

    const where = {
      role: { [Op.ne]: "super_admin" },
    };

    if (search) {
      const searchPattern = `%${search}%`;
      where[Op.or] = [
        { name: { [Op.iLike]: searchPattern } },
        { email: { [Op.iLike]: searchPattern } },
        { username: { [Op.iLike]: searchPattern } },
      ];
    }

    if (roleFilter) {
      where.role = roleFilter;
    }

    const { count: total, rows: users } = await User.findAndCountAll({
      where,
      attributes: { exclude: ["password"] },
      order: [["createdAt", "DESC"]],
      offset: (page - 1) * limit,
      limit,
    });

    res.json({
      users: users.map((u) => u.toObject()),
      total,
      page,
      pages: Math.ceil(total / limit),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const createManagedUser = async (req, res) => {
  try {
    const { name, email, password, role, college, degree, yearOfPassing, permissions } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "name, email and password are required." });
    }
    if (role === "super_admin") {
      return res.status(400).json({ message: "Cannot create another super_admin via this endpoint." });
    }

    const cleanEmail = email.toLowerCase().trim();
    const existing = await User.findOne({ where: { email: cleanEmail } });
    if (existing) return res.status(400).json({ message: "User already exists." });

    const hashedPassword = await bcrypt.hash(password, 10);
    const defaultPerms = DEFAULT_PERMISSIONS[role] || DEFAULT_PERMISSIONS.student;
    const finalPerms = permissions || defaultPerms;

    const user = await User.create({
      name,
      username: cleanEmail.split("@")[0] + "_" + Math.floor(Math.random() * 1000),
      email: cleanEmail,
      password: hashedPassword,
      role: role || "student",
      college: college || "",
      degree: degree || "",
      yearOfPassing: yearOfPassing || "",
      createdBy: req.user?._id || req.user?.id || null,
      permissions: finalPerms,
    });

    const safeUser = user.toObject();
    delete safeUser.password;
    res.status(201).json({ message: "User created successfully.", user: safeUser });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getManagedUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id, {
      attributes: { exclude: ["password"] },
    });
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user.toObject());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const updateManagedUser = async (req, res) => {
  try {
    const { role, permissions, isActive, name, email, college, degree, yearOfPassing, password } = req.body;
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ error: "User not found" });
    if (user.role === "super_admin") {
      return res.status(403).json({ error: "Cannot modify a super_admin." });
    }

    if (role) user.role = role;
    if (name) user.name = name;
    if (email) user.email = email.toLowerCase();
    if (college !== undefined) user.college = college;
    if (degree !== undefined) user.degree = degree;
    if (yearOfPassing !== undefined) user.yearOfPassing = yearOfPassing;
    if (isActive !== undefined) user.isActive = isActive;

    if (password && password.trim()) {
      user.password = await bcrypt.hash(password.trim(), 10);
    }

    const currentPerms = { ...(user.permissions || {}) };

    if (permissions) {
      for (const mod of MODULES) {
        if (permissions[mod]) {
          currentPerms[mod] = {
            view: !!permissions[mod].view,
            create: !!permissions[mod].create,
            edit: !!permissions[mod].edit,
            delete: !!permissions[mod].delete,
          };
        }
      }
      user.permissions = currentPerms;
    } else if (role && DEFAULT_PERMISSIONS[role]) {
      user.permissions = DEFAULT_PERMISSIONS[role];
    }

    await user.save();
    const safeUser = user.toObject();
    delete safeUser.password;
    res.json({ message: "User updated successfully.", user: safeUser });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const deactivateManagedUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
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

export const deleteUserPermanently = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ error: "User not found" });
    if (user.role === "super_admin") {
      return res.status(403).json({ error: "Cannot delete a super_admin." });
    }
    await User.destroy({ where: { id: req.params.id } });
    res.json({ message: "User permanently deleted." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const updateUserPermissions = async (req, res) => {
  try {
    const { permissions } = req.body;
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ error: "User not found" });
    if (user.role === "super_admin") {
      return res.status(403).json({ error: "Cannot modify super_admin permissions." });
    }

    const currentPerms = { ...(user.permissions || {}) };

    if (permissions) {
      for (const mod of MODULES) {
        if (permissions[mod]) {
          currentPerms[mod] = {
            view: !!permissions[mod].view,
            create: !!permissions[mod].create,
            edit: !!permissions[mod].edit,
            delete: !!permissions[mod].delete,
          };
        }
      }
      user.permissions = currentPerms;
      await user.save();
      return res.json({ message: "Permissions updated successfully.", permissions: user.permissions });
    }

    const { module: mod, create, edit, delete: del, view } = req.body;
    if (!MODULES.includes(mod)) {
      return res.status(400).json({ error: `Unknown module: ${mod}` });
    }
    if (!currentPerms[mod]) currentPerms[mod] = {};

    if (create !== undefined) currentPerms[mod].create = !!create;
    if (edit !== undefined) currentPerms[mod].edit = !!edit;
    if (del !== undefined) currentPerms[mod].delete = !!del;
    if (view !== undefined) currentPerms[mod].view = !!view;

    user.permissions = currentPerms;
    await user.save();
    res.json({ message: "Permissions updated successfully.", permissions: user.permissions });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getRbacStats = async (req, res) => {
  try {
    const roleStats = await User.findAll({
      where: { role: { [Op.ne]: "super_admin" } },
      attributes: ["role", [sequelize.fn("COUNT", sequelize.col("id")), "count"]],
      group: ["role"],
      raw: true,
    });

    const roleCounts = roleStats.map((r) => ({ _id: r.role, count: parseInt(r.count, 10) }));
    const total = await User.count({ where: { role: { [Op.ne]: "super_admin" } } });
    const active = await User.count({
      where: { role: { [Op.ne]: "super_admin" }, isActive: true },
    });

    res.json({ total, active, inactive: total - active, roleCounts });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

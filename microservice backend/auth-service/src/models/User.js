import mongoose from "mongoose";

const ROLES = [
  "student",
  "exam_coordinator",
  "course_coordinator",
  "feed_coordinator",
  "super_admin",
  // legacy / compat
  "admin",
  "teacher",
  "user",
];

const MODULE_PERMISSIONS = {
  type: new mongoose.Schema(
    {
      create: { type: Boolean, default: false },
      edit:   { type: Boolean, default: false },
      delete: { type: Boolean, default: false },
      view:   { type: Boolean, default: true },
    },
    { _id: false }
  ),
  default: () => ({}),
};

const userSchema = new mongoose.Schema(
  {
    name:          { type: String, required: true },
    username:      { type: String, unique: true, sparse: true },
    email:         { type: String, required: true, unique: true, lowercase: true, trim: true },
    password:      { type: String, required: true },
    role:          { type: String, enum: ROLES, default: "student" },
    college:       { type: String, default: "" },
    degree:        { type: String, default: "" },
    yearOfPassing: { type: String, default: "" },
    profileImage:  { type: String, default: "" },
    bannerImage:   { type: String, default: "" },
    isActive:      { type: Boolean, default: true },
    createdBy:     { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    // Granular per-module CRUD permissions (set by super_admin)
    permissions: {
      exams:    MODULE_PERMISSIONS,
      courses:  MODULE_PERMISSIONS,
      feed:     MODULE_PERMISSIONS,
      coding:   MODULE_PERMISSIONS,
      users:    MODULE_PERMISSIONS,
      analytics:MODULE_PERMISSIONS,
    },
    followers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    following: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true }
);

export { ROLES };
export default mongoose.models.User || mongoose.model("User", userSchema);

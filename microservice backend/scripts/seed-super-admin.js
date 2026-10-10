/**
 * seed-super-admin.js
 * 
 * Run once to create the initial super_admin account.
 * Usage: node scripts/seed-super-admin.js
 * 
 * Set MONGO_URI in env before running.
 */
import path from "path";
import { createRequire } from "module";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const authRequire = createRequire(
  new URL("../auth-service/package.json", import.meta.url)
);
const mongoose = authRequire("mongoose");
const bcrypt = authRequire("bcryptjs");
const dotenv = authRequire("dotenv");

dotenv.config({ path: path.resolve(__dirname, "../.env") });

const SUPER_ADMIN = {
  name:     "Super Admin",
  email:    "superadmin@codecampus.io",
  password: "SuperAdmin@2024!",
  username: "super_admin",
  role:     "super_admin",
};

const FULL_PERMISSIONS = {
  exams:     { create: true, edit: true, delete: true, view: true },
  courses:   { create: true, edit: true, delete: true, view: true },
  feed:      { create: true, edit: true, delete: true, view: true },
  coding:    { create: true, edit: true, delete: true, view: true },
  users:     { create: true, edit: true, delete: true, view: true },
  analytics: { create: true, edit: true, delete: true, view: true },
};

const userSchema = new mongoose.Schema(
  {
    name:          String,
    username:      { type: String, unique: true, sparse: true },
    email:         { type: String, unique: true, lowercase: true },
    password:      String,
    role:          String,
    college:       { type: String, default: "" },
    degree:        { type: String, default: "" },
    yearOfPassing: { type: String, default: "" },
    profileImage:  { type: String, default: "" },
    bannerImage:   { type: String, default: "" },
    isActive:      { type: Boolean, default: true },
    permissions:   { type: mongoose.Schema.Types.Mixed, default: {} },
    followers:     [{ type: mongoose.Schema.Types.ObjectId }],
    following:     [{ type: mongoose.Schema.Types.ObjectId }],
  },
  { timestamps: true }
);

const User = mongoose.models.User || mongoose.model("User", userSchema);

async function seed() {
  const uri = process.env.MONGO_URI || process.env.AUTH_DB_URI;
  if (!uri) {
    console.error("❌  MONGO_URI not set in .env");
    process.exit(1);
  }

  await mongoose.connect(uri);
  console.log("✅  Connected to MongoDB");

  const existing = await User.findOne({ email: SUPER_ADMIN.email });
  if (existing) {
    console.log("ℹ️   Super admin already exists:", existing.email);
    await mongoose.disconnect();
    return;
  }

  const hashed = await bcrypt.hash(SUPER_ADMIN.password, 12);
  const admin  = new User({
    ...SUPER_ADMIN,
    password:    hashed,
    permissions: FULL_PERMISSIONS,
  });
  await admin.save();

  console.log("🎉  Super admin created!");
  console.log("    Email:   ", SUPER_ADMIN.email);
  console.log("    Password:", SUPER_ADMIN.password);
  console.log("    Role:    ", SUPER_ADMIN.role);
  console.log("\n⚠️   Change the password after first login!");

  await mongoose.disconnect();
}

seed().catch(err => {
  console.error("Seed error:", err);
  process.exit(1);
});

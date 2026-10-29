/**
 * seed-super-admin.js
 * 
 * Run once to create or update the initial super_admin account
 * across PostgreSQL (auth_db, user_db) and MongoDB Atlas.
 * Usage: set SUPER_ADMIN_EMAIL and a unique SUPER_ADMIN_PASSWORD (16+ characters),
 * then run node scripts/seed-super-admin.js.
 */
import path from "path";
import { createRequire } from "module";
import { fileURLToPath } from "url";
import crypto from "crypto";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const authRequire = createRequire(
  new URL("../auth-service/package.json", import.meta.url)
);
const bcrypt = authRequire("bcryptjs");
const dotenv = authRequire("dotenv");

let mongoose = null;
try {
  const postRequire = createRequire(
    new URL("../post-service/package.json", import.meta.url)
  );
  mongoose = postRequire("mongoose");
} catch {
  // mongoose not present in auth-service
}

// Load microservices root .env
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const SUPER_ADMIN = {
  name: process.env.SUPER_ADMIN_NAME?.trim() || "Super Admin",
  email: process.env.SUPER_ADMIN_EMAIL?.trim().toLowerCase(),
  password: process.env.SUPER_ADMIN_PASSWORD,
  username: process.env.SUPER_ADMIN_USERNAME?.trim() || "super_admin",
  role: "super_admin",
};

const FULL_PERMISSIONS = {
  exams:     { create: true, edit: true, delete: true, view: true },
  courses:   { create: true, edit: true, delete: true, view: true },
  feed:      { create: true, edit: true, delete: true, view: true },
  coding:    { create: true, edit: true, delete: true, view: true },
  users:     { create: true, edit: true, delete: true, view: true },
  analytics: { create: true, edit: true, delete: true, view: true },
};

// Optional Mongo user schema for backward compatibility
let MongoUser = null;
if (mongoose) {
  const mongoUserSchema = new mongoose.Schema(
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
    },
    { timestamps: true }
  );

  MongoUser = mongoose.models.User || mongoose.model("User", mongoUserSchema);
}

async function seed() {
  if (!SUPER_ADMIN.email || !SUPER_ADMIN.email.includes("@")) {
    throw new Error("Set SUPER_ADMIN_EMAIL to a valid administrator email before running this script.");
  }
  if (!SUPER_ADMIN.password || SUPER_ADMIN.password.length < 16) {
    throw new Error("Set SUPER_ADMIN_PASSWORD to a unique secret of at least 16 characters before running this script.");
  }

  const [
    { default: AuthUser },
    { connectDB: connectAuthDb, sequelize: authSequelize },
    { default: RefreshSession },
    { default: UserProfile },
    { connectDB: connectUserDb, sequelize: userSequelize },
  ] = await Promise.all([
    import("../auth-service/src/models/User.js"),
    import("../auth-service/src/config/db.js"),
    import("../auth-service/src/models/RefreshSession.js"),
    import("../user-service/src/models/User.js"),
    import("../user-service/src/config/db.js"),
  ]);

  console.log("🚀 Starting Super Admin seeding...\n");

  const hashedPassword = await bcrypt.hash(SUPER_ADMIN.password, 12);
  const commonId = crypto.randomUUID();

  // 1. Seed Auth Service (PostgreSQL auth_db)
  try {
    await connectAuthDb();
    let authUser = await AuthUser.findOne({ where: { email: SUPER_ADMIN.email } });
    if (!authUser) {
      authUser = await AuthUser.create({
        id: commonId,
        name: SUPER_ADMIN.name,
        username: SUPER_ADMIN.username,
        email: SUPER_ADMIN.email,
        password: hashedPassword,
        role: SUPER_ADMIN.role,
        permissions: FULL_PERMISSIONS,
        isActive: true,
      });
      console.log("✅ Super Admin created in auth_db (PostgreSQL)");
    } else {
      await authUser.update({
        role: SUPER_ADMIN.role,
        password: hashedPassword,
        permissions: FULL_PERMISSIONS,
        isActive: true,
      });
      console.log("ℹ️  Super Admin updated in auth_db (PostgreSQL)");
    }
    await RefreshSession.update(
      { revokedAt: new Date() },
      { where: { userId: authUser.id, revokedAt: null } }
    );
    console.log("✅ Existing super-admin refresh sessions revoked");
  } catch (err) {
    console.error("❌ Error seeding auth_db:", err.message);
    throw err;
  }

  // 2. Seed User Service (PostgreSQL user_db)
  try {
    await connectUserDb();
    let profileUser = await UserProfile.findOne({ where: { email: SUPER_ADMIN.email } });
    if (!profileUser) {
      profileUser = await UserProfile.create({
        id: commonId,
        name: SUPER_ADMIN.name,
        username: SUPER_ADMIN.username,
        email: SUPER_ADMIN.email,
        password: hashedPassword,
        role: SUPER_ADMIN.role,
        permissions: FULL_PERMISSIONS,
        isActive: true,
      });
      console.log("✅ Super Admin profile created in user_db (PostgreSQL)");
    } else {
      await profileUser.update({
        role: SUPER_ADMIN.role,
        password: hashedPassword,
        permissions: FULL_PERMISSIONS,
        isActive: true,
      });
      console.log("ℹ️  Super Admin profile updated in user_db (PostgreSQL)");
    }
  } catch (err) {
    console.error("❌ Error seeding user_db:", err.message);
    throw err;
  }

  // 3. Seed MongoDB (for any services/monolith referencing Mongo users)
  const mongoUri = process.env.MONGO_URI;
  if (mongoUri && mongoose && MongoUser) {
    try {
      await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 5000 });
      let mUser = await MongoUser.findOne({ email: SUPER_ADMIN.email });
      if (!mUser) {
        await MongoUser.create({
          name: SUPER_ADMIN.name,
          username: SUPER_ADMIN.username,
          email: SUPER_ADMIN.email,
          password: hashedPassword,
          role: SUPER_ADMIN.role,
          permissions: FULL_PERMISSIONS,
          isActive: true,
        });
        console.log("✅ Super Admin created in MongoDB");
      } else {
        await MongoUser.updateOne(
          { email: SUPER_ADMIN.email },
          {
            $set: {
              role: SUPER_ADMIN.role,
              password: hashedPassword,
              permissions: FULL_PERMISSIONS,
              isActive: true,
            }
          }
        );
        console.log("ℹ️  Super Admin updated in MongoDB");
      }
      await mongoose.disconnect();
    } catch (err) {
      console.warn("⚠️  MongoDB seed skipped/failed:", err.message);
    }
  }

  console.log("\n==========================================");
  console.log("🎉 Super Admin setup complete!");
  console.log("   Administrator credentials were read from the environment.");
  console.log("   Role:     ", SUPER_ADMIN.role);
  console.log("==========================================\n");

  await authSequelize.close();
  await userSequelize.close();
  process.exit(0);
}

seed().catch(err => {
  console.error("Fatal Seed Error:", err);
  process.exit(1);
});

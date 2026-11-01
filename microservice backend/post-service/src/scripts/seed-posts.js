import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import mongoose from "mongoose";
import axios from "axios";
import User from "../models/User.js";
import Post from "../models/Post.js";
import Comment from "../models/Comment.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });

const MONGO_URI =
  process.env.POST_MONGO_URI ||
  process.env.MONGO_URI ||
  "mongodb://127.0.0.1:27017/post_db";

const USER_SERVICE_URL = process.env.USER_SERVICE_URL || "http://localhost:5002";

async function main() {
  console.log("Connecting to MongoDB:", MONGO_URI ? "URI Provided" : "No URI");
  await mongoose.connect(MONGO_URI, { dbName: process.env.POST_DB_NAME || "post_db" });
  console.log("Connected to MongoDB successfully.");

  // 1. Fetch users from user-service and local MongoDB
  let users = [];
  try {
    const res = await axios.get(`${USER_SERVICE_URL}/v1/users?limit=100`, { timeout: 3000 });
    const fetched = res.data?.users || res.data || [];
    console.log(`Fetched ${fetched.length} users from user-service.`);
    for (const u of fetched) {
      const uId = String(u.id || u._id);
      await User.findByIdAndUpdate(
        uId,
        {
          _id: uId,
          name: u.name || u.username || "Code Campus Member",
          username: u.username || "",
          email: u.email || "",
          profileImage: u.profileImage || "",
          role: u.role || "student",
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    }
  } catch (err) {
    console.warn("Could not fetch directly from user-service (service might be sleeping):", err.message);
  }

  // Find all users mirrored in MongoDB
  users = await User.find({}).lean();
  console.log(`Found ${users.length} users in post-service MongoDB:`);
  users.forEach((u) => console.log(`- ${u.name || u.username} (@${u.username}) [${u._id}]`));

  return users;
}

main().then(() => mongoose.disconnect()).catch(err => {
  console.error("Fatal error:", err);
  mongoose.disconnect();
});

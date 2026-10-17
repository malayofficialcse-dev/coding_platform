/**
 * migrate-from-mongo.js
 *
 * Migrates existing data from the default MongoDB "test" database to:
 * 1. "course_db" (courses)
 * 2. "coding_problems_db" (coding problems)
 * 3. "post_db" (posts, comments)
 * 4. "chat_db" (messages)
 * 5. "notification_db" (notifications)
 * 6. PostgreSQL "exam_db" (exams)
 *
 * Usage: node scripts/migrate-from-mongo.js
 */

import path from "path";
import crypto from "crypto";
import { fileURLToPath } from "url";
import { createRequire } from "module";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const postRequire = createRequire(
  new URL("../post-service/package.json", import.meta.url)
);
const { MongoClient } = postRequire("mongodb");
const dotenv = postRequire("dotenv");

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const MONGO_URI =
  process.env.MONGO_URI;
function mongoIdToUuid(mongoId) {
  const hash = crypto.createHash("md5").update(String(mongoId)).digest("hex");
  return [
    hash.substring(0, 8),
    hash.substring(8, 12),
    "4" + hash.substring(13, 16),
    "8" + hash.substring(17, 20),
    hash.substring(20, 32),
  ].join("-");
}

async function migrate() {
  console.log("==================================================");
  console.log("🚀 Starting Data Migration from MongoDB 'test' DB");
  console.log("==================================================\n");

  const client = new MongoClient(MONGO_URI, { serverSelectionTimeoutMS: 10000 });
  await client.connect();
  console.log("✅ Connected to MongoDB Atlas cluster\n");

  const sourceDb = client.db("test");

  // 1. Migrate Courses -> course_db.courses
  const courses = await sourceDb.collection("courses").find({}).toArray();
  if (courses.length > 0) {
    const targetDb = client.db("course_db");
    const targetCol = targetDb.collection("courses");
    let count = 0;
    for (const c of courses) {
      await targetCol.replaceOne({ _id: c._id }, c, { upsert: true });
      count++;
    }
    console.log(`✅ Migrated ${count} courses to 'course_db.courses'`);
    courses.forEach((c) => console.log(`   - "${c.title}" (ID: ${c._id})`));
  } else {
    console.log("ℹ️  No courses found in source 'test.courses'");
  }

  // 2. Migrate Coding Problems -> coding_problems_db.codingproblems
  const problems = await sourceDb.collection("codingproblems").find({}).toArray();
  if (problems.length > 0) {
    const targetDb = client.db("coding_problems_db");
    const targetCol = targetDb.collection("codingproblems");
    let count = 0;
    for (const p of problems) {
      await targetCol.replaceOne({ _id: p._id }, p, { upsert: true });
      count++;
    }
    console.log(`\n✅ Migrated ${count} coding problems to 'coding_problems_db.codingproblems'`);
  } else {
    console.log("ℹ️  No coding problems found in source 'test.codingproblems'");
  }

  // 3. Migrate Posts & Comments -> post_db
  const posts = await sourceDb.collection("posts").find({}).toArray();
  if (posts.length > 0) {
    const targetDb = client.db("post_db");
    const targetCol = targetDb.collection("posts");
    for (const p of posts) {
      await targetCol.replaceOne({ _id: p._id }, p, { upsert: true });
    }
    console.log(`\n✅ Migrated ${posts.length} posts to 'post_db.posts'`);
  }

  const comments = await sourceDb.collection("comments").find({}).toArray();
  if (comments.length > 0) {
    const targetDb = client.db("post_db");
    const targetCol = targetDb.collection("comments");
    for (const c of comments) {
      await targetCol.replaceOne({ _id: c._id }, c, { upsert: true });
    }
    console.log(`✅ Migrated ${comments.length} comments to 'post_db.comments'`);
  }

  // 4. Migrate Messages -> chat_db
  const messages = await sourceDb.collection("messages").find({}).toArray();
  if (messages.length > 0) {
    const targetDb = client.db("chat_db");
    const targetCol = targetDb.collection("messages");
    for (const m of messages) {
      await targetCol.replaceOne({ _id: m._id }, m, { upsert: true });
    }
    console.log(`\n✅ Migrated ${messages.length} messages to 'chat_db.messages'`);
  }

  // 5. Migrate Notifications -> notification_db
  const notifications = await sourceDb.collection("notifications").find({}).toArray();
  if (notifications.length > 0) {
    const targetDb = client.db("notification_db");
    const targetCol = targetDb.collection("notifications");
    for (const n of notifications) {
      await targetCol.replaceOne({ _id: n._id }, n, { upsert: true });
    }
    console.log(`\n✅ Migrated ${notifications.length} notifications to 'notification_db.notifications'`);
  }

  // 6. Migrate Exams -> PostgreSQL exam_db.exams
  const exams = await sourceDb.collection("exams").find({}).toArray();
  if (exams.length > 0) {
    try {
      const examRequire = createRequire(
        new URL("../exam-service/package.json", import.meta.url)
      );
      const { Sequelize } = examRequire("sequelize");
      const pgUrl =
        process.env.EXAM_DATABASE_URL ||
        "postgresql://postgres:malay21@localhost:5432/exam_db";
      const sequelize = new Sequelize(pgUrl, { dialect: "postgres", logging: false });
      await sequelize.authenticate();

      // Dynamically import Exam model
      const { default: Exam } = await import("../exam-service/src/models/Exam.js");

      let count = 0;
      for (const e of exams) {
        const uuid = mongoIdToUuid(e._id);
        const existing = await Exam.findByPk(uuid);
        if (!existing) {
          await Exam.create({
            id: uuid,
            title: e.title || "Untitled Exam",
            description: e.description || "",
            duration: Number(e.duration) || 30,
            questions: Array.isArray(e.questions) ? e.questions : [],
            author: e.author ? String(e.author) : null,
          });
          count++;
        }
      }
      console.log(`\n✅ Migrated ${count} exams to PostgreSQL 'exam_db.exams'`);
      await sequelize.close();
    } catch (err) {
      console.warn("⚠️  PostgreSQL exam migration note:", err.message);
    }
  }

  await client.close();
  console.log("\n==================================================");
  console.log("🎉 Migration Completed Successfully!");
  console.log("==================================================\n");
}

migrate().catch((err) => {
  console.error("Migration Error:", err);
  process.exit(1);
});

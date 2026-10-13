import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

async function check() {
  await mongoose.connect(process.env.MONGO_URI);
  const exams = await mongoose.connection.db.collection("exams").find({}).toArray();
  console.log("Found", exams.length, "exams:");
  for (const e of exams) {
    console.log(`- ID: ${e._id}, Title: "${e.title}", Duration: ${e.duration}m, Questions: ${e.questions?.length || 0}`);
  }
  process.exit(0);
}

check().catch(err => { console.error(err); process.exit(1); });

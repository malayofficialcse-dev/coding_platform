import mongoose from "mongoose";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../.env") });
dotenv.config();

const ATLAS_URI =
  process.env.MONGO_URI ||
  "mongodb://maitymalay334_db_user:malayCode21@ac-m8w7vpt-shard-00-00.vvosns0.mongodb.net:27017,ac-m8w7vpt-shard-00-01.vvosns0.mongodb.net:27017,ac-m8w7vpt-shard-00-02.vvosns0.mongodb.net:27017/?ssl=true&authSource=admin&retryWrites=true&w=majority";
const LOCAL_URI = "mongodb://127.0.0.1:27017/code_campus";

// Failing students with target low scores (passing threshold is 12 / 30, i.e., 40%)
const FAILING_STUDENTS = [
  {
    name: "Tanmay Joshi",
    username: "tanmay_j",
    email: "tanmay.joshi@campus.edu",
    college: "Modern Engineering College",
    degree: "B.Tech Electrical Engg",
    yearOfPassing: "2026",
    minScore: 5,
    maxScore: 9,
  },
  {
    name: "Divya Nair",
    username: "divya_n",
    email: "divya.nair@campus.edu",
    college: "Apex Institute of Tech",
    degree: "B.Tech Mechanical Engg",
    yearOfPassing: "2025",
    minScore: 7,
    maxScore: 11,
  },
  {
    name: "Kunal Chawla",
    username: "kunal_c",
    email: "kunal.chawla@campus.edu",
    college: "Pioneer Tech Academy",
    degree: "B.Tech Civil Engg",
    yearOfPassing: "2026",
    minScore: 4,
    maxScore: 8,
  },
  {
    name: "Ritu Singhania",
    username: "ritu_s",
    email: "ritu.singhania@campus.edu",
    college: "National Degree College",
    degree: "BCA",
    yearOfPassing: "2025",
    minScore: 6,
    maxScore: 10,
  },
  {
    name: "Manish Tiwari",
    username: "manish_t",
    email: "manish.tiwari@campus.edu",
    college: "Global Tech Campus",
    degree: "B.Tech Instrumentation",
    yearOfPassing: "2026",
    minScore: 3,
    maxScore: 7,
  },
  {
    name: "Pooja Hegde",
    username: "pooja_h",
    email: "pooja.hegde@campus.edu",
    college: "City Science Institute",
    degree: "B.Sc Electronics",
    yearOfPassing: "2025",
    minScore: 8,
    maxScore: 11,
  },
];

async function seedFailingData(targetUri, label) {
  console.log(`\n======================================================`);
  console.log(`Seeding Failing Students & Attempts to: ${label}`);
  console.log(`======================================================`);

  let conn;
  try {
    conn = await mongoose.createConnection(targetUri, {
      serverSelectionTimeoutMS: 8000,
    }).asPromise();
    console.log(`✓ Connected to ${label}`);
  } catch (err) {
    console.error(`✗ Connection failed to ${label}:`, err.message);
    return;
  }

  try {
    const usersColl = conn.collection("users");
    const examsColl = conn.collection("exams");
    const attemptsColl = conn.collection("attempts");

    const exams = await examsColl.find({}).toArray();
    console.log(`Found ${exams.length} exams in ${label}`);
    if (exams.length === 0) {
      console.log("No exams found. Skipping.");
      await conn.close();
      return;
    }

    const hashedPassword = await bcrypt.hash("Student@123", 10);
    const failUsers = [];

    // 1. Create or fetch failing student users
    for (const fs of FAILING_STUDENTS) {
      let existing = await usersColl.findOne({ email: fs.email });
      if (!existing) {
        const doc = {
          name: fs.name,
          username: fs.username,
          email: fs.email,
          password: hashedPassword,
          role: "student",
          college: fs.college,
          degree: fs.degree,
          yearOfPassing: fs.yearOfPassing,
          profileImage: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(fs.name)}`,
          bannerImage: "",
          isActive: true,
          permissions: {
            exams: { create: false, edit: false, delete: false, view: true },
            courses: { create: false, edit: false, delete: false, view: true },
            feed: { create: true, edit: false, delete: false, view: true },
            coding: { create: false, edit: false, delete: false, view: true },
            users: { create: false, edit: false, delete: false, view: true },
            analytics: { create: false, edit: false, delete: false, view: false },
          },
          followers: [],
          following: [],
          createdAt: new Date(Date.now() - 20 * 24 * 3600 * 1000),
          updatedAt: new Date(),
        };
        const ins = await usersColl.insertOne(doc);
        existing = { _id: ins.insertedId, ...doc };
        console.log(`  + Created failing student: ${fs.name} (${fs.email})`);
      } else {
        console.log(`  = Existing failing student: ${fs.name} (${fs.email})`);
      }
      failUsers.push({ ...existing, minScore: fs.minScore, maxScore: fs.maxScore });
    }

    // 2. For each exam, ensure at least 2 to 4 failing attempts exist
    let failAttemptsCreated = 0;

    for (const exam of exams) {
      const questions = Array.isArray(exam.questions) ? exam.questions : [];
      if (questions.length === 0) continue;

      // Passing marks is 12 (40% of 30)
      const passingMarks = Math.ceil(questions.length * 0.4);

      // Select 2 to 4 failing students to attempt this exam
      const selectedFailingStudents = [...failUsers]
        .sort(() => 0.5 - Math.random())
        .slice(0, Math.floor(Math.random() * 3) + 2); // 2 to 4 students

      for (const student of selectedFailingStudents) {
        const existingAttempt = await attemptsColl.findOne({
          exam: exam._id,
          user: student._id,
        });

        if (existingAttempt) {
          // If existing attempt exists, verify if it's already failing
          if (existingAttempt.score >= passingMarks) {
            // Update to a failing score
            const failScore = Math.floor(Math.random() * (student.maxScore - student.minScore + 1)) + student.minScore;
            await attemptsColl.updateOne(
              { _id: existingAttempt._id },
              { $set: { score: failScore } }
            );
            console.log(`  ~ Updated existing attempt for ${student.name} to FAIL score: ${failScore}/${questions.length}`);
          }
          continue;
        }

        // Generate failing score guaranteed < passingMarks (e.g. 4 to 10)
        const targetScore = Math.min(
          passingMarks - 1,
          Math.floor(Math.random() * (student.maxScore - student.minScore + 1)) + student.minScore
        );

        // Pick indices of questions that will be answered correctly
        const correctIndices = new Set();
        while (correctIndices.size < targetScore) {
          correctIndices.add(Math.floor(Math.random() * questions.length));
        }

        const answers = questions.map((q, qIdx) => {
          if (correctIndices.has(qIdx) && q.answer) {
            return q.answer;
          }
          // Pick a wrong option
          const wrongOpts = Array.isArray(q.options)
            ? q.options.filter((opt) => opt !== q.answer)
            : [];
          return wrongOpts.length > 0
            ? wrongOpts[Math.floor(Math.random() * wrongOpts.length)]
            : "Option B";
        });

        // Failing students often trigger some warnings or timeouts
        const warningsCount = Math.random() < 0.4 ? Math.floor(Math.random() * 3) + 1 : 0;
        const autoSubmitted = Math.random() < 0.25; // 25% ran out of time
        const cheatingLogged = warningsCount >= 3;

        const daysAgo = Math.floor(Math.random() * 12) + 1;
        const attemptDate = new Date(Date.now() - daysAgo * 24 * 3600 * 1000);

        await attemptsColl.insertOne({
          exam: exam._id,
          user: student._id,
          answers,
          score: targetScore,
          warningsCount,
          autoSubmitted,
          cheatingLogged,
          createdAt: attemptDate,
          updatedAt: attemptDate,
        });

        failAttemptsCreated++;
      }
    }

    console.log(`\n✓ ${label} Summary:`);
    console.log(`  - New FAILING attempts inserted: ${failAttemptsCreated}`);
    const totalAttempts = await attemptsColl.countDocuments({});
    console.log(`  - Total attempts in database now: ${totalAttempts}`);
  } catch (err) {
    console.error(`Error in ${label}:`, err);
  } finally {
    await conn.close();
  }
}

async function main() {
  console.log("Seeding Failing Students and Exam Results...");
  await seedFailingData(ATLAS_URI, "MongoDB Atlas Cloud");
  try {
    await seedFailingData(LOCAL_URI, "Localhost MongoDB");
  } catch (err) {
    console.log("Localhost MongoDB skipped or unreachable.");
  }
  console.log("\nDone! Failing student attempts are now active.");
  process.exit(0);
}

main();

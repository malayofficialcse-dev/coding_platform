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

const STUDENTS = [
  {
    name: "Aarav Sharma",
    username: "aarav_sharma",
    email: "aarav.sharma@campus.edu",
    college: "IIT Bombay",
    degree: "B.Tech Computer Science",
    yearOfPassing: "2025",
    proficiency: 0.93,
  },
  {
    name: "Priya Patel",
    username: "priya_patel",
    email: "priya.patel@campus.edu",
    college: "BITS Pilani",
    degree: "B.Tech Information Systems",
    yearOfPassing: "2025",
    proficiency: 0.88,
  },
  {
    name: "Rohan Verma",
    username: "rohan_verma",
    email: "rohan.verma@campus.edu",
    college: "NIT Trichy",
    degree: "B.Tech Electronics & Comm",
    yearOfPassing: "2026",
    proficiency: 0.77,
  },
  {
    name: "Sneha Roy",
    username: "sneha_roy",
    email: "sneha.roy@campus.edu",
    college: "Jadavpur University",
    degree: "B.E. Computer Science",
    yearOfPassing: "2025",
    proficiency: 0.83,
  },
  {
    name: "Ananya Iyer",
    username: "ananya_iyer",
    email: "ananya.iyer@campus.edu",
    college: "IIT Madras",
    degree: "Dual Degree Data Science",
    yearOfPassing: "2026",
    proficiency: 0.95,
  },
  {
    name: "Vikram Malhotra",
    username: "vikram_m",
    email: "vikram.malhotra@campus.edu",
    college: "DTU Delhi",
    degree: "B.Tech Software Engineering",
    yearOfPassing: "2025",
    proficiency: 0.72,
  },
  {
    name: "Kavya Reddy",
    username: "kavya_reddy",
    email: "kavya.reddy@campus.edu",
    college: "IIIT Hyderabad",
    degree: "B.Tech Computer Science",
    yearOfPassing: "2026",
    proficiency: 0.86,
  },
  {
    name: "Arjun Das",
    username: "arjun_das",
    email: "arjun.das@campus.edu",
    college: "Heritage Institute of Technology",
    degree: "B.Tech Information Tech",
    yearOfPassing: "2026",
    proficiency: 0.58,
  },
  {
    name: "Ishita Sen",
    username: "ishita_sen",
    email: "ishita.sen@campus.edu",
    college: "St. Xavier's College",
    degree: "B.Sc Computer Science",
    yearOfPassing: "2025",
    proficiency: 0.65,
  },
  {
    name: "Rahul Mukherjee",
    username: "rahul_m",
    email: "rahul.mukherjee@campus.edu",
    college: "Kalyani Govt Engineering",
    degree: "B.Tech Computer Science",
    yearOfPassing: "2026",
    proficiency: 0.52,
  },
];

async function seedToUri(targetUri, label) {
  console.log(`\n========================================`);
  console.log(`Seeding Students & Attempts to: ${label}`);
  console.log(`URI: ${targetUri.replace(/:[^:]*@/, ":****@")}`);
  console.log(`========================================`);

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

    // 1. Fetch available exams
    const exams = await examsColl.find({}).toArray();
    console.log(`Found ${exams.length} exams in ${label}`);
    if (exams.length === 0) {
      console.log(`No exams found in ${label}. Skipping attempt seeding.`);
      await conn.close();
      return;
    }

    // 2. Hash default password
    const hashedPassword = await bcrypt.hash("Student@123", 10);

    // 3. Ensure student accounts exist
    const studentUsers = [];
    for (const s of STUDENTS) {
      let existing = await usersColl.findOne({ email: s.email });
      if (!existing) {
        const doc = {
          name: s.name,
          username: s.username,
          email: s.email,
          password: hashedPassword,
          role: "student",
          college: s.college,
          degree: s.degree,
          yearOfPassing: s.yearOfPassing,
          profileImage: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(s.name)}`,
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
          createdAt: new Date(Date.now() - 30 * 24 * 3600 * 1000),
          updatedAt: new Date(),
        };
        const ins = await usersColl.insertOne(doc);
        existing = { _id: ins.insertedId, ...doc, proficiency: s.proficiency };
        console.log(`  + Created student: ${s.name} (${s.email})`);
      } else {
        existing.proficiency = s.proficiency;
        console.log(`  = Existing student found: ${s.name} (${s.email})`);
      }
      studentUsers.push(existing);
    }

    // Also include any other student users already in the DB
    const otherStudents = await usersColl
      .find({
        role: "student",
        email: { $nin: STUDENTS.map((s) => s.email) },
      })
      .toArray();
    for (const os of otherStudents) {
      os.proficiency = 0.75;
      studentUsers.push(os);
      console.log(`  + Included existing student: ${os.name || os.email}`);
    }

    console.log(`\nGenerating exam attempts for ${studentUsers.length} students across ${exams.length} exams...`);

    let attemptsCreated = 0;
    let attemptsSkipped = 0;

    for (const student of studentUsers) {
      // Each student attempts 5 to 9 exams
      const numExamsToAttempt = Math.min(exams.length, Math.floor(Math.random() * 4) + 6);
      // Shuffle exams for varied participation
      const shuffledExams = [...exams].sort(() => 0.5 - Math.random()).slice(0, numExamsToAttempt);

      for (let eIdx = 0; eIdx < shuffledExams.length; eIdx++) {
        const exam = shuffledExams[eIdx];
        const existingAttempt = await attemptsColl.findOne({
          exam: exam._id,
          user: student._id,
        });

        if (existingAttempt) {
          attemptsSkipped++;
          continue;
        }

        const questions = Array.isArray(exam.questions) ? exam.questions : [];
        if (questions.length === 0) continue;

        let score = 0;
        const answers = [];

        for (const q of questions) {
          const isCorrect = Math.random() < (student.proficiency || 0.75);
          if (isCorrect && q.answer) {
            answers.push(q.answer);
            score++;
          } else {
            // Pick a wrong option
            const wrongOpts = Array.isArray(q.options)
              ? q.options.filter((opt) => opt !== q.answer)
              : [];
            const chosenWrong =
              wrongOpts.length > 0
                ? wrongOpts[Math.floor(Math.random() * wrongOpts.length)]
                : "Option A";
            answers.push(chosenWrong);
          }
        }

        const warningsCount = Math.random() < 0.15 ? Math.floor(Math.random() * 2) + 1 : 0;
        const autoSubmitted = Math.random() < 0.08;
        const cheatingLogged = false;

        // Timestamp spread over the last 14 days
        const daysAgo = Math.floor(Math.random() * 14) + 1;
        const hoursOffset = Math.floor(Math.random() * 12);
        const attemptDate = new Date(Date.now() - (daysAgo * 24 + hoursOffset) * 3600 * 1000);

        const attemptDoc = {
          exam: exam._id,
          user: student._id,
          answers,
          score,
          warningsCount,
          autoSubmitted,
          cheatingLogged,
          createdAt: attemptDate,
          updatedAt: attemptDate,
        };

        await attemptsColl.insertOne(attemptDoc);
        attemptsCreated++;
      }
    }

    console.log(`\n✓ Results for ${label}:`);
    console.log(`  - Total students: ${studentUsers.length}`);
    console.log(`  - New attempts inserted: ${attemptsCreated}`);
    console.log(`  - Existing attempts preserved: ${attemptsSkipped}`);
    const totalNow = await attemptsColl.countDocuments({});
    console.log(`  - Total attempts in database: ${totalNow}`);
  } catch (err) {
    console.error(`Error during seeding in ${label}:`, err);
  } finally {
    await conn.close();
  }
}

async function main() {
  console.log("Starting Student & Exam Attempt Seeding Process...");
  // 1. Seed to Atlas
  await seedToUri(ATLAS_URI, "MongoDB Atlas Cloud");

  // 2. Seed to Local MongoDB
  try {
    await seedToUri(LOCAL_URI, "Localhost MongoDB");
  } catch (err) {
    console.log("Localhost MongoDB not reachable or skipped.");
  }

  console.log("\nAll student and exam attempt seeding operations completed!");
  process.exit(0);
}

main();

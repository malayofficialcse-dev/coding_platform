import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

import AuthUser from "../auth-service/src/models/User.js";
import Course from "../course-service/src/models/Course.js";
import Enrollment from "../enrollment-service/src/models/Enrollment.js";
import Exam from "../exam-service/src/models/Exam.js";
import Attempt from "../exam-service/src/models/Attempt.js";
import CodingProblem from "../coding-service/src/models/CodingProblem.js";
import CodingSubmission from "../coding-service/src/models/CodingSubmission.js";
import Post from "../post-service/src/models/Post.js";
import Comment from "../post-service/src/models/Comment.js";
import Notification from "../notification-service/src/models/Notification.js";
import Message from "../chat-service/src/models/Message.js";

const root = path.dirname(fileURLToPath(import.meta.url));
const authRequire = createRequire(
  new URL("../auth-service/package.json", import.meta.url),
);
const dotenv = authRequire("dotenv");
const authMongoose = authRequire("mongoose");

const envPath = path.resolve(root, "..", ".env");
if (existsSync(envPath)) dotenv.config({ path: envPath });

const mongoUri =
  process.env.MONGO_URI || "mongodb://127.0.0.1:27017/code_campus";
const allowRemote = process.argv.includes("--allow-remote");
const demoPassword = "CampusDemo2026!";
const recordCount = 20;
const groups = [
  "General Feed",
  "Python Learners",
  "JavaScript Hub",
  "Java Specialists",
  "Algorithms & DS",
  "Web Dev Bootcamp",
];
const topics = [
  "Arrays",
  "Strings",
  "Hash Maps",
  "Sorting",
  "Two Pointers",
  "Stacks",
  "Queues",
  "Linked Lists",
  "Binary Trees",
  "Graphs",
  "Recursion",
  "Dynamic Programming",
  "Greedy Algorithms",
  "Binary Search",
  "Sliding Window",
  "Bit Manipulation",
  "Heaps",
  "Tries",
  "Backtracking",
  "Complexity Analysis",
];
const languages = ["JavaScript", "Python", "Java", "C++"];
const firstNames = [
  "Avery", "Jordan", "Morgan", "Riley", "Casey", "Taylor", "Quinn",
  "Drew", "Reese", "Jamie", "Rowan", "Skyler", "Emerson", "Finley",
  "Hayden", "Parker", "Sage", "Cameron", "Dakota", "Alex",
];
const lastNames = [
  "Morgan", "Bennett", "Rivera", "Kim", "Patel", "Brooks", "Chen",
  "Reed", "Foster", "Shah", "Murphy", "Ellis", "Cooper", "Singh",
  "Bailey", "Turner", "Wright", "Flores", "Perry", "Hayes",
];
const courseSubjects = [
  "Modern JavaScript Foundations",
  "Python for Data Engineering",
  "Cloud-Native Application Design",
  "Microservices with Node.js",
  "Algorithms for Technical Interviews",
  "Practical SQL and Data Modeling",
  "Building Accessible React Interfaces",
  "Java and Object-Oriented Design",
  "Operating Systems Essentials",
  "API Design and Integration",
  "Version Control with Git",
  "Containerization with Docker",
  "Kubernetes for Application Teams",
  "Secure Web Application Basics",
  "Testing Strategies for Developers",
  "TypeScript in Production",
  "Distributed Systems Fundamentals",
  "CI/CD and Release Engineering",
  "Data Structures in Practice",
  "Observability and Application Health",
];
const examSubjects = [
  "JavaScript Fundamentals",
  "Python Core Concepts",
  "HTTP and REST APIs",
  "Relational Database Design",
  "React Component Patterns",
  "Object-Oriented Programming",
  "Git Collaboration",
  "Big-O Complexity",
  "Cloud Architecture Basics",
  "Secure Coding Principles",
  "Testing and Quality",
  "Linux Command Line",
  "Data Structures Review",
  "Async Programming",
  "Container Fundamentals",
  "TypeScript Essentials",
  "Service Boundaries",
  "Query Optimization",
  "Web Accessibility",
  "System Design Basics",
];
const postTexts = [
  "I started writing down one thing I learned after each coding session. It makes progress much easier to see.",
  "What’s your favorite way to break a large feature into smaller, testable tasks?",
  "Today’s reminder: readable code is a kindness to the next person who has to maintain it.",
  "I’m revisiting data structures this week. Which topic took you the longest to understand?",
  "A small debugging habit that helps me: verify the input shape before investigating the whole pipeline.",
  "Just finished a focused practice session. Ten minutes of review made the concepts stick.",
  "How do you keep API errors useful for both developers and end users?",
  "I’ve been learning to add accessibility checks earlier instead of treating them as final polish.",
  "Pairing on a tricky problem helped me see a completely different approach.",
  "A good commit message makes it much easier to understand why a change was made.",
  "What’s one tool or workflow improvement that saved you time this month?",
  "This week I’m focusing on tests that describe behavior rather than implementation details.",
  "I found it helpful to draw the service boundaries before starting an integration.",
  "Taking short breaks between practice problems has improved my focus.",
  "Which project helped you understand a new programming language best?",
  "I’m collecting examples of clear, helpful code reviews. What makes feedback useful to you?",
  "Small, steady improvements beat a perfect plan that never gets started.",
  "Documenting assumptions near an API contract prevented a confusing integration bug.",
  "I’m trying to explain each solution out loud before writing code. It catches gaps early.",
  "What’s your current learning goal? Share it so we can cheer each other on.",
];

function stableId(namespace, index) {
  const hex = createHash("sha256")
    .update(`code-campus-demo:${namespace}:${index}`)
    .digest("hex")
    .slice(0, 24);
  return new authMongoose.Types.ObjectId(hex);
}

function daysAgo(days) {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

function userId(index) {
  return stableId("users", index);
}

function courseId(index) {
  return stableId("courses", index);
}

function examId(index) {
  return stableId("exams", index);
}

function problemId(index) {
  return stableId("coding-problems", index);
}

function postId(index) {
  return stableId("posts", index);
}

function commentId(index) {
  return stableId("comments", index);
}

function userName(index) {
  return `${firstNames[index]} ${lastNames[index]}`;
}

function makeCourses() {
  return Array.from({ length: recordCount }, (_, index) => ({
    _id: courseId(index),
    title: courseSubjects[index],
    description: `A practical learning track covering ${courseSubjects[
      index
    ].toLowerCase()} through guided modules, hands-on examples, and focused exercises.`,
    image: "",
    topics: [
      {
        title: "Foundations",
        order: 1,
        subtopics: [
          {
            title: "Learning objectives and core concepts",
            body: `Start with the key ideas behind ${courseSubjects[index].toLowerCase()}.`,
            order: 1,
          },
          {
            title: "Set up a productive development workflow",
            body: "Prepare a small project and follow the examples in this module.",
            order: 2,
          },
        ],
      },
      {
        title: "Build and apply",
        order: 2,
        subtopics: [
          {
            title: "Work through a practical example",
            body: "Apply the concepts in a small, realistic exercise.",
            order: 1,
          },
          {
            title: "Review and check your work",
            body: "Review the result, test important cases, and note what you learned.",
            order: 2,
          },
        ],
      },
      {
        title: "Next steps",
        order: 3,
        subtopics: [
          {
            title: "Connect the concepts",
            body: "Bring the pieces together and identify useful follow-up topics.",
            order: 1,
          },
        ],
      },
    ],
    createdAt: daysAgo(index + 1),
    updatedAt: daysAgo(index + 1),
  }));
}

function makeExams() {
  return Array.from({ length: recordCount }, (_, index) => {
    const subject = examSubjects[index];
    return {
      _id: examId(index),
      title: `${subject} — Knowledge Check`,
      description: `A short practice assessment covering key concepts in ${subject.toLowerCase()}.`,
      duration: 15 + (index % 4) * 5,
      author: userId(0),
      questions: [
        {
          question: `Which approach is most useful when learning ${subject.toLowerCase()}?`,
          options: [
            "Break the topic into small concepts and practice them",
            "Skip examples and memorize terminology only",
            "Avoid checking assumptions",
            "Wait until the end to review",
          ],
          answer: "Break the topic into small concepts and practice them",
        },
        {
          question: "What is a good next step after completing a practice exercise?",
          options: [
            "Review the result and test another case",
            "Delete the exercise without checking it",
            "Ignore unexpected output",
            "Avoid documenting what you learned",
          ],
          answer: "Review the result and test another case",
        },
      ],
      createdAt: daysAgo(index + 1),
      updatedAt: daysAgo(index + 1),
    };
  });
}

function makeProblems() {
  return Array.from({ length: recordCount }, (_, index) => ({
    _id: problemId(index),
    title: `Standard Input Warm-up ${String(index + 1).padStart(2, "0")}`,
    description:
      "Read the supplied line from standard input and print it unchanged. This warm-up checks your editor, selected language, and test-case workflow before moving on to more advanced challenges.",
    difficulty: ["Easy", "Medium", "Hard"][index % 3],
    dsaTopic: topics[index],
    sampleTestCases: [
      { input: "hello campus", output: "hello campus", visible: true },
      { input: "practice makes progress", output: "practice makes progress", visible: true },
    ],
    testCases: [
      { input: "hello campus", output: "hello campus", visible: true },
      { input: "practice makes progress", output: "practice makes progress", visible: true },
      { input: `demo case ${index + 1}`, output: `demo case ${index + 1}`, visible: false },
    ],
    createdBy: userId(0),
    createdAt: daysAgo(index + 1),
    updatedAt: daysAgo(index + 1),
  }));
}

function makePosts() {
  return Array.from({ length: recordCount }, (_, index) => ({
    _id: postId(index),
    author: userId(index),
    group: groups[index % groups.length],
    text: postTexts[index],
    codeBlocks:
      index % 5 === 0
        ? [
            {
              language: "javascript",
              code: `const learningGoal = "${topics[index]}";\nconsole.log(\`Today I practiced: \${learningGoal}\`);`,
            },
          ]
        : [],
    images: [],
    likes: [
      userId((index + 1) % recordCount),
      userId((index + 2) % recordCount),
    ],
    comments: [commentId(index)],
    createdAt: daysAgo(index),
    updatedAt: daysAgo(index),
  }));
}

function makeComments() {
  return Array.from({ length: recordCount }, (_, index) => ({
    _id: commentId(index),
    author: userId((index + 3) % recordCount),
    post: postId(index),
    text: [
      "Thanks for sharing this. I’m going to try it in my next practice session.",
      "Breaking the problem into smaller pieces helped me too.",
      "Great reminder. I’ve added this to my learning notes.",
      "I’d love to hear what you discover as you keep exploring this topic.",
    ][index % 4],
    createdAt: daysAgo(Math.max(index - 1, 0)),
    updatedAt: daysAgo(Math.max(index - 1, 0)),
  }));
}

function makeEnrollments() {
  return Array.from({ length: recordCount }, (_, index) => ({
    _id: stableId("enrollments", index),
    user: userId(index),
    course: courseId(index),
    enrolledAt: daysAgo(index),
    expiresAt: new Date(Date.now() + 89 * 24 * 60 * 60 * 1000),
    createdAt: daysAgo(index),
    updatedAt: daysAgo(index),
  }));
}

function makeAttempts() {
  return Array.from({ length: recordCount }, (_, index) => ({
    _id: stableId("attempts", index),
    exam: examId(index),
    user: userId(index),
    answers: [
      "Break the topic into small concepts and practice them",
      "Review the result and test another case",
    ],
    score: index % 3 === 0 ? 1 : 2,
    warningsCount: 0,
    autoSubmitted: false,
    cheatingLogged: false,
    createdAt: daysAgo(index),
    updatedAt: daysAgo(index),
  }));
}

function makeSubmissions() {
  return Array.from({ length: recordCount }, (_, index) => ({
    _id: stableId("coding-submissions", index),
    user: userId(index),
    problem: problemId(index),
    code: 'const fs = require("fs");\nconst input = fs.readFileSync(0, "utf8").trim();\nconsole.log(input);',
    language: "javascript",
    result: "Accepted",
    passedCount: 3,
    totalCount: 3,
    plagiarism: 0,
    details: [
      {
        index: 0,
        input: "hello campus",
        expectedOutput: "hello campus",
        userOutput: "hello campus",
        status: "Passed",
        visible: true,
      },
      {
        index: 1,
        input: "practice makes progress",
        expectedOutput: "practice makes progress",
        userOutput: "practice makes progress",
        status: "Passed",
        visible: true,
      },
      {
        index: 2,
        input: `demo case ${index + 1}`,
        expectedOutput: `demo case ${index + 1}`,
        userOutput: `demo case ${index + 1}`,
        status: "Passed",
        visible: false,
      },
    ],
    createdAt: daysAgo(index),
    updatedAt: daysAgo(index),
  }));
}

function makeUsers(passwordHash) {
  return Array.from({ length: recordCount }, (_, index) => {
    const next = (index + 1) % recordCount;
    const previous = (index + recordCount - 1) % recordCount;
    return {
      _id: userId(index),
      name: userName(index),
      username: index === 0 ? "campusadmin" : `learner${String(index).padStart(2, "0")}`,
      email:
        index === 0
          ? "admin@demo.codecampus.local"
          : `learner${String(index).padStart(2, "0")}@demo.codecampus.local`,
      password: passwordHash,
      role: index === 0 ? "admin" : "student",
      college: [
        "Northstar Institute",
        "Riverside Technical College",
        "Summit University",
        "Lakeside School of Computing",
      ][index % 4],
      degree: ["Computer Science", "Information Systems", "Software Engineering"][index % 3],
      yearOfPassing: String(2026 + (index % 4)),
      profileImage: "",
      followers: [userId(next), userId(previous)],
      following:
        index === 0
          ? [userId(1), userId(2), userId(3)]
          : [userId(next)],
      createdAt: daysAgo(index + 1),
      updatedAt: daysAgo(index + 1),
    };
  });
}

function makeNotifications() {
  return Array.from({ length: recordCount }, (_, index) => ({
    _id: stableId("notifications", index),
    recipient: userId(index),
    sender: userId((index + 1) % recordCount),
    type: ["like", "comment", "follow", "message", "system"][index % 5],
    post: postId(index),
    comment: commentId(index),
    title: [
      "A learner liked your post",
      "New comment in your learning group",
      "Someone followed your learning journey",
      "You have a new message",
      "Your weekly learning tip is ready",
    ][index % 5],
    description:
      "Keep your momentum going. Visit Code Campus to continue learning and connect with your community.",
    actionUrl: "/community",
    read: index % 4 === 0,
    createdAt: daysAgo(index),
    updatedAt: daysAgo(index),
  }));
}

function makeMessages() {
  return Array.from({ length: recordCount }, (_, index) => ({
    _id: stableId("messages", index),
    senderId: userId(index % 2 === 0 ? index : (index + 1) % recordCount),
    receiverId: userId(index % 2 === 0 ? (index + 1) % recordCount : index),
    text: [
      "Hi! What are you learning this week?",
      "I found a useful way to organize my practice notes.",
      "Would you like to compare approaches to this problem?",
      "Thanks for the encouragement. I’m keeping at it!",
    ][index % 4],
    image: "",
    createdAt: daysAgo(recordCount - index),
    updatedAt: daysAgo(recordCount - index),
  }));
}

async function upsertDemoRecords(Model, records) {
  const operations = records.map((record) => ({
    updateOne: {
      filter: { _id: record._id },
      update: { $setOnInsert: record },
      upsert: true,
    },
  }));
  const result = await Model.bulkWrite(operations, {
    ordered: true,
    timestamps: false,
  });
  return {
    inserted: result.upsertedCount || 0,
    alreadySeeded: result.matchedCount || 0,
  };
}

async function main() {
  const parsedUri = new URL(mongoUri);
  const localHosts = new Set(["localhost", "127.0.0.1", "::1"]);
  if (!localHosts.has(parsedUri.hostname) && !allowRemote) {
    throw new Error(
      "Refusing to seed a remote database. Use --allow-remote only if this is an intentional demo database.",
    );
  }

  const serviceConnections = [
    {
      name: "auth",
      require: createRequire(new URL("../auth-service/package.json", import.meta.url)),
    },
    {
      name: "course",
      require: createRequire(new URL("../course-service/package.json", import.meta.url)),
    },
    {
      name: "enrollment",
      require: createRequire(new URL("../enrollment-service/package.json", import.meta.url)),
    },
    {
      name: "exam",
      require: createRequire(new URL("../exam-service/package.json", import.meta.url)),
    },
    {
      name: "coding",
      require: createRequire(new URL("../coding-service/package.json", import.meta.url)),
    },
    {
      name: "post",
      require: createRequire(new URL("../post-service/package.json", import.meta.url)),
    },
    {
      name: "notification",
      require: createRequire(new URL("../notification-service/package.json", import.meta.url)),
    },
    {
      name: "chat",
      require: createRequire(new URL("../chat-service/package.json", import.meta.url)),
    },
  ].map(({ name, require }) => ({ name, mongoose: require("mongoose") }));

  console.log(
    `Connecting to ${parsedUri.hostname}/${parsedUri.pathname.replace(/^\//, "") || "default database"}...`,
  );
  await Promise.all(
    serviceConnections.map(({ mongoose }) =>
      mongoose.connect(mongoUri, {
        serverSelectionTimeoutMS: 5000,
        maxPoolSize: 5,
      }),
    ),
  );

  try {
    const passwordHash = await authRequire("bcryptjs").hash(demoPassword, 10);
    const users = makeUsers(passwordHash);
    const courses = makeCourses();
    const exams = makeExams();
    const problems = makeProblems();
    const posts = makePosts();
    const comments = makeComments();

    const collections = [
      ["users", AuthUser, users],
      ["courses", Course, courses],
      ["enrollments", Enrollment, makeEnrollments()],
      ["exams", Exam, exams],
      ["exam attempts", Attempt, makeAttempts()],
      ["coding problems", CodingProblem, problems],
      ["coding submissions", CodingSubmission, makeSubmissions()],
      ["posts", Post, posts],
      ["comments", Comment, comments],
      ["notifications", Notification, makeNotifications()],
      ["messages", Message, makeMessages()],
    ];

    console.log("Adding 20 stable demo records to each collection:");
    for (const [label, Model, records] of collections) {
      const result = await upsertDemoRecords(Model, records);
      console.log(
        `  ${label}: ${result.inserted} inserted, ${result.alreadySeeded} already present`,
      );
    }

    console.log("\nDemo sign-in:");
    console.log("  Email:    admin@demo.codecampus.local");
    console.log(`  Password: ${demoPassword}`);
    console.log("This is a local demo account. Do not use it in production.");
  } finally {
    await Promise.all(
      serviceConnections.map(({ mongoose }) => mongoose.disconnect()),
    );
  }
}

main().catch((error) => {
  console.error(`Demo seeding failed: ${error.message}`);
  process.exitCode = 1;
});

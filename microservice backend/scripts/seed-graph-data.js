import path from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const userRequire = createRequire(
  new URL("../user-service/package.json", import.meta.url)
);
const dotenv = userRequire("dotenv");
const neo4j = userRequire("neo4j-driver");

dotenv.config({ path: path.resolve(__dirname, "../.env") });

const driver = neo4j.driver(
  process.env.NEO4J_URI || "bolt://127.0.0.1:7687",
  neo4j.auth.basic(
    process.env.NEO4J_USER || "neo4j",
    process.env.NEO4J_PASSWORD || "cc_neo4j_pass"
  )
);

async function seedGraph() {
  const [
    { default: User },
    { connectDB, closeDB },
  ] = await Promise.all([
    import("../user-service/src/models/User.js"),
    import("../user-service/src/config/db.js"),
  ]);
  const session = driver.session(
    process.env.NEO4J_DATABASE
      ? { database: process.env.NEO4J_DATABASE }
      : undefined
  );

  try {
    console.log("Connecting to PostgreSQL user shards and Neo4j graph...");
    await connectDB();
    await session.run("RETURN 1");
    console.log("Connected to all user database shards and Neo4j.");

    const users = await User.findAll({ raw: true });
    console.log(`Syncing ${users.length} users into Neo4j...`);

    for (const user of users) {
      await session.run(
        `MERGE (u:User {id: $id})
         SET u.name = $name, u.username = $username, u.role = $role`,
        {
          id: String(user.id),
          name: user.name || "User",
          username: user.username || "",
          role: user.role || "student",
        }
      );

      const collegeName = user.college && user.college.trim()
        ? user.college.trim()
        : "Code Campus University";
      await session.run(
        `MATCH (u:User {id: $id})
         MERGE (c:College {name: $college})
         MERGE (u)-[:STUDIES_AT]->(c)`,
        { id: String(user.id), college: collegeName }
      );
    }

    console.log("✅ Synced all users and colleges into Neo4j graph!");

    if (users.length >= 3) {
      const superAdmin = users.find((user) => user.role === "super_admin") || users[0];
      const teacher = users.find((user) => user.role === "teacher") || users[1];
      const student = users.find((user) => user.email === "abc@gmail.com") || users[users.length - 1];
      const coordinator = users.find((user) => user.role?.includes("coordinator")) || users[2];

      const sampleFollows = [
        [superAdmin.id, teacher.id],
        [teacher.id, superAdmin.id],
        [teacher.id, student.id],
        [teacher.id, coordinator.id],
        [coordinator.id, superAdmin.id],
      ];

      for (const [fromId, toId] of sampleFollows) {
        if (fromId && toId && fromId !== toId) {
          await session.run(
            `MATCH (a:User {id: $fromId}), (b:User {id: $toId})
             MERGE (a)-[r:FOLLOWS]->(b)
             ON CREATE SET r.createdAt = datetime()`,
            { fromId: String(fromId), toId: String(toId) }
          );
        }
      }
      console.log("✅ Seeded sample graph connections!");
    }
  } finally {
    await session.close();
    await driver.close();
    await closeDB();
  }
}

seedGraph().catch((err) => {
  console.error("❌ Seed error:", err);
  process.exitCode = 1;
});

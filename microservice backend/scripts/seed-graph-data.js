import path from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const userRequire = createRequire(
  new URL("../user-service/package.json", import.meta.url)
);
const dotenv = userRequire("dotenv");
const { Sequelize } = userRequire("sequelize");
const neo4j = userRequire("neo4j-driver");

dotenv.config({ path: path.resolve(__dirname, "../.env") });

const userSequelize = new Sequelize(
  process.env.USER_DATABASE_URL || "postgresql://postgres:malay21@localhost:5432/user_db",
  { dialect: "postgres", logging: false }
);

const driver = neo4j.driver(
  process.env.NEO4J_URI || "bolt://127.0.0.1:7687",
  neo4j.auth.basic(
    process.env.NEO4J_USER || "neo4j",
    process.env.NEO4J_PASSWORD || "cc_neo4j_pass"
  )
);

async function seedGraph() {
  const session = driver.session();
  try {
    console.log("Connecting to PostgreSQL user_db and Neo4j graph...");
    await userSequelize.authenticate();
    await session.run("RETURN 1");
    console.log("Connected to both databases.");

    const [users] = await userSequelize.query('SELECT * FROM "users"');
    console.log(`Syncing ${users.length} users into Neo4j...`);

    for (const u of users) {
      await session.run(
        `MERGE (u:User {id: $id})
         SET u.name = $name, u.username = $username, u.role = $role`,
        {
          id: String(u.id),
          name: u.name || "User",
          username: u.username || "",
          role: u.role || "student",
        }
      );

      const collegeName = u.college && u.college.trim() ? u.college.trim() : "Code Campus University";
      await session.run(
        `MATCH (u:User {id: $id})
         MERGE (c:College {name: $college})
         MERGE (u)-[:STUDIES_AT]->(c)`,
        { id: String(u.id), college: collegeName }
      );
    }

    console.log("✅ Synced all users and colleges into Neo4j graph!");

    // Create a few realistic follow relationships so that 1st, 2nd, and 3rd degree connections exist
    // Super Admin <-> teacher <-> exam_coordinator <-> student
    if (users.length >= 3) {
      const superAdmin = users.find((u) => u.role === "super_admin") || users[0];
      const teacher = users.find((u) => u.role === "teacher") || users[1];
      const student = users.find((u) => u.email === "abc@gmail.com") || users[users.length - 1];
      const coordinator = users.find((u) => u.role?.includes("coordinator")) || users[2];

      const sampleFollows = [
        [superAdmin.id, teacher.id],
        [teacher.id, superAdmin.id],
        [teacher.id, student.id],
        [teacher.id, coordinator.id],
        [coordinator.id, superAdmin.id],
      ];

      for (const [a, b] of sampleFollows) {
        if (a && b && a !== b) {
          await session.run(
            `MATCH (a:User {id: $a}), (b:User {id: $b})
             MERGE (a)-[r:FOLLOWS]->(b)
             ON CREATE SET r.createdAt = datetime()`,
            { a: String(a), b: String(b) }
          );
        }
      }
      console.log("✅ Seeded sample graph connections!");
    }

    process.exit(0);
  } catch (err) {
    console.error("❌ Seed error:", err);
    process.exit(1);
  } finally {
    await session.close();
    await driver.close();
  }
}

seedGraph();

/**
 * neon-init-schemas.js
 * ─────────────────────────────────────────────────────────────
 * One-time bootstrap script: creates all PostgreSQL schemas on
 * Neon so each microservice has its own isolated namespace inside
 * the single "neondb" database.
 *
 * Run once with:
 *   node scripts/neon-init-schemas.js
 * ─────────────────────────────────────────────────────────────
 */

import pg from "pg";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "../.env") });

const { Pool } = pg;

const NEON_URL =
  process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;

if (!NEON_URL || NEON_URL.includes("localhost")) {
  console.error("❌  DATABASE_URL_UNPOOLED is not set or still points to localhost.");
  console.error("    Make sure the root .env contains the Neon connection strings.");
  process.exit(1);
}

const pool = new Pool({ connectionString: NEON_URL });

const SCHEMAS = [
  "auth_schema",
  "user_schema",
  "enrollment_schema",
  "exam_schema",
  "coding_schema",
  "mentor_schema",
];

async function run() {
  const client = await pool.connect();
  try {
    console.log("🔗  Connected to Neon (neondb)");
    for (const schema of SCHEMAS) {
      await client.query(`CREATE SCHEMA IF NOT EXISTS "${schema}"`);
      console.log(`  ✅  Schema "${schema}" is ready`);
    }
    console.log("\n🎉  All schemas initialized successfully on Neon!");
    console.log(
      "    Each microservice will now create its tables inside its own schema automatically."
    );
  } finally {
    client.release();
    await pool.end();
  }
}

run().catch((err) => {
  console.error("❌  Schema init failed:", err.message);
  process.exit(1);
});


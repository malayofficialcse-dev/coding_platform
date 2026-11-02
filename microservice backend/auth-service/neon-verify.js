/**
 * neon-verify.js — Verifies all service connections to Neon
 * Run from auth-service directory: node neon-verify.js
 */

import pg from "pg";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "../.env") });

const { Pool } = pg;

const SERVICES = [
  { name: "auth-service", env: "AUTH_DATABASE_URL", schema: "auth_schema" },
  { name: "user-service", env: "USER_DATABASE_URL", schema: "user_schema" },
  { name: "enrollment-service", env: "ENROLLMENT_DATABASE_URL", schema: "enrollment_schema" },
  { name: "exam-service", env: "EXAM_DATABASE_URL", schema: "exam_schema" },
  { name: "coding-service", env: "CODING_DATABASE_URL", schema: "coding_schema" },
  { name: "mentor-service", env: "MENTOR_DATABASE_URL", schema: "mentor_schema" },
];

async function verifyAll() {
  console.log("🔍  Verifying Neon connections for all PostgreSQL microservices...\n");
  let allOk = true;

  for (const svc of SERVICES) {
    const url = (process.env[svc.env] || "").replace(/^"|"$/g, "");
    if (!url) {
      console.log(`  ❌  ${svc.name}: ${svc.env} is not set`);
      allOk = false;
      continue;
    }

    const pool = new Pool({ connectionString: url, ssl: { rejectUnauthorized: false } });
    try {
      const client = await pool.connect();
      // Set the schema for this connection
      await client.query(`SET search_path TO ${svc.schema}, public`);
      const res = await client.query("SELECT current_schema() AS schema, current_database() AS db, now() AS ts");
      const { schema, db } = res.rows[0];
      client.release();
      console.log(`  ✅  ${svc.name}: connected [db=${db}, schema=${schema}]`);
    } catch (err) {
      console.log(`  ❌  ${svc.name}: FAILED — ${err.message}`);
      allOk = false;
    } finally {
      await pool.end();
    }
  }

  console.log(allOk
    ? "\n🎉  All services verified! PostgreSQL is fully migrated to Neon."
    : "\n⚠️   Some services failed. Check the errors above."
  );
}

verifyAll().catch(console.error);

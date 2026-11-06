import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import pg from "pg";

const { Pool } = pg;
const here = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(here, "../../.env") });
dotenv.config();

const schema = process.env.ENROLLMENT_DB_SCHEMA || "enrollment_schema";
const count = Math.max(1, Number(process.env.ENROLLMENT_SHARD_COUNT || 1));
const fallback = process.env.ENROLLMENT_PRIMARY_DATABASE_URL || process.env.ENROLLMENT_DATABASE_URL || process.env.DATABASE_URL;
const sqlPath = (name) => path.resolve(here, "../../database/migrations/enrollment", name);

const urlForShard = (id) => process.env[`ENROLLMENT_SHARD_${id}_WRITE_DATABASE_URL`] || (id === 0 ? fallback : "");

const apply = async (url, file) => {
  if (!url) throw new Error(`Missing Neon URL for ${file}.`);
  const pool = new Pool({ connectionString: url, ssl: url.includes("neon.tech") ? { rejectUnauthorized: false } : undefined });
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(`SET search_path TO ${schema}, public`);
    await client.query(await fs.readFile(sqlPath(file), "utf8"));
    await client.query("COMMIT");
    console.log(`[Neon migration] ${file} applied`);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
};

for (let shard = 0; shard < count; shard += 1) await apply(urlForShard(shard), "001_neon_enrollment.sql");
await apply(process.env.CERTIFICATE_DIRECTORY_DATABASE_URL || fallback, "002_neon_certificate_directory.sql");

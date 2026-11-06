import crypto from "crypto";
import dotenv from "dotenv";
import pg from "pg";
import { fileURLToPath } from "url";

dotenv.config({ path: fileURLToPath(new URL("../../.env", import.meta.url)) });
dotenv.config();

const { Pool } = pg;
const schema = process.env.ENROLLMENT_DB_SCHEMA || "enrollment_schema";
const shardCount = Math.max(1, Number(process.env.ENROLLMENT_SHARD_COUNT || 1));
const sourceUrl = process.env.ENROLLMENT_SHARD_0_WRITE_DATABASE_URL || process.env.ENROLLMENT_PRIMARY_DATABASE_URL || process.env.ENROLLMENT_DATABASE_URL;

const urlForShard = (id) => process.env[`ENROLLMENT_SHARD_${id}_WRITE_DATABASE_URL`];
const shardForUser = (userId) => crypto.createHash("sha256").update(String(userId)).digest().readUInt32BE(0) % shardCount;
const poolFor = (url) => new Pool({ connectionString: url, ssl: url.includes("neon.tech") ? { rejectUnauthorized: false } : undefined });
const useSchema = async (client) => client.query(`SET search_path TO ${schema}, public`);

if (!sourceUrl) throw new Error("No source Neon URL configured.");
if (shardCount < 2) throw new Error("Set ENROLLMENT_SHARD_COUNT=2 or higher before running the shard backfill.");

const source = poolFor(sourceUrl);
const sourceClient = await source.connect();
const targetPools = new Map();
try {
  await useSchema(sourceClient);
  const { rows } = await sourceClient.query(`
    SELECT "id", "user", "course", "shardId", "enrolledAt", "expiresAt",
      "completedSubtopics", "progress", "completedAt", "certificateNumber",
      "certificateIssuedAt", "certificateRecipientName", "certificateCeoName",
      "createdAt", "updatedAt"
    FROM enrollments
  `);
  console.log(`[Shard backfill] Read ${rows.length} enrollment(s) from shard 0.`);

  for (const row of rows) {
    const targetShard = shardForUser(row.user);
    if (targetShard === 0) continue;
    const targetUrl = urlForShard(targetShard);
    if (!targetUrl) throw new Error(`Missing ENROLLMENT_SHARD_${targetShard}_WRITE_DATABASE_URL.`);
    if (!targetPools.has(targetShard)) targetPools.set(targetShard, poolFor(targetUrl));
    const targetClient = await targetPools.get(targetShard).connect();
    try {
      await useSchema(targetClient);
      await targetClient.query(`
        INSERT INTO enrollments
          ("id", "user", course, "shardId", "enrolledAt", "expiresAt",
           "completedSubtopics", progress, "completedAt", "certificateNumber",
           "certificateIssuedAt", "certificateRecipientName", "certificateCeoName",
           "createdAt", "updatedAt")
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
        ON CONFLICT ("id") DO UPDATE SET
          "shardId" = EXCLUDED."shardId",
          "updatedAt" = EXCLUDED."updatedAt"
      `, [row.id, row.user, row.course, targetShard, row.enrolledAt, row.expiresAt,
        row.completedSubtopics, row.progress, row.completedAt, row.certificateNumber,
        row.certificateIssuedAt, row.certificateRecipientName, row.certificateCeoName,
        row.createdAt, row.updatedAt]);
    } finally {
      targetClient.release();
    }
  }
  console.log("[Shard backfill] Completed. Verify row counts before serving traffic.");
} finally {
  sourceClient.release();
  await source.end();
  await Promise.all([...targetPools.values()].map((pool) => pool.end()));
}

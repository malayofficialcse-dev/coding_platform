import crypto from "crypto";
import { shardCount } from "../config/db.js";

export const normalizeId = (value) => value === undefined || value === null || String(value).trim() === "" ? null : String(value);

export const resolveShardId = (userId) => {
  const normalized = normalizeId(userId);
  if (!normalized) throw new Error("userId is required to resolve an enrollment shard.");
  if (shardCount === 1) return 0;
  return crypto.createHash("sha256").update(normalized).digest().readUInt32BE(0) % shardCount;
};

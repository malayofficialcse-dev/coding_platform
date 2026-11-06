import { createHash } from "node:crypto";

const SHARD_ENV_PATTERN = /^USER_SHARD_(\d+)_DATABASE_URL$/;

export const getUserShardUrls = (env = process.env) => {
  const configured = Object.entries(env)
    .map(([key, value]) => {
      const match = SHARD_ENV_PATTERN.exec(key);
      return match && value ? { index: Number(match[1]), url: value.replace(/^"|"$/g, "") } : null;
    })
    .filter(Boolean)
    .sort((left, right) => left.index - right.index);

  if (!configured.length) {
    const url = (
      env.USER_DATABASE_URL ||
      env.DATABASE_URL ||
      "postgresql://127.0.0.1:5432/user_db"
    ).replace(/^"|"$/g, "");
    return [url];
  }

  configured.forEach((shard, index) => {
    if (shard.index !== index) {
      throw new Error("User database shard URLs must be numbered consecutively from USER_SHARD_0_DATABASE_URL.");
    }
  });

  if (configured.length < 2) {
    throw new Error("Configure at least two USER_SHARD_n_DATABASE_URL values to enable user database sharding.");
  }

  if (new Set(configured.map(({ url }) => url)).size !== configured.length) {
    throw new Error("Each user database shard must use a distinct database URL.");
  }

  return configured.map(({ url }) => url);
};

export const getUserShardIndex = (userId, shardCount) => {
  if (typeof userId !== "string" || !userId.trim()) {
    throw new Error("A user ID is required to select a user database shard.");
  }
  if (!Number.isInteger(shardCount) || shardCount < 1) {
    throw new Error("The user database must have at least one configured shard.");
  }

  const hashPrefix = createHash("sha256")
    .update(userId.trim().toLowerCase())
    .digest()
    .readUInt32BE(0);
  return hashPrefix % shardCount;
};

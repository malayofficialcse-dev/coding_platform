import { createClient } from "redis";

const memoryCache = new Map();
let redisClient = null;
let redisConnectionAttempted = false;

const getRedis = async () => {
  if (!process.env.REDIS_URL || redisConnectionAttempted) return redisClient;
  redisConnectionAttempted = true;

  try {
    const client = createClient({
      url: process.env.REDIS_URL,
      socket: { reconnectStrategy: false },
    });
    client.on("error", (error) => console.warn("[Redis] Cache connection error:", error.message));
    await client.connect();
    redisClient = client;
    console.log("[Redis] Post cache connected");
  } catch (error) {
    console.warn("[Redis] Unavailable, using in-memory cache:", error.message);
  }

  return redisClient;
};

export const getCached = async (key) => {
  const redis = await getRedis();
  if (redis) {
    const value = await redis.get(key);
    return value ? JSON.parse(value) : null;
  }

  const entry = memoryCache.get(key);
  if (!entry || entry.expiresAt < Date.now()) {
    memoryCache.delete(key);
    return null;
  }
  return entry.value;
};

export const setCached = async (key, value, ttlSeconds = 30) => {
  const redis = await getRedis();
  if (redis) {
    await redis.set(key, JSON.stringify(value), { EX: ttlSeconds });
    return;
  }
  memoryCache.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 });
};

export const deleteCachedPrefix = async (prefix) => {
  const redis = await getRedis();
  for (const key of memoryCache.keys()) {
    if (key.startsWith(prefix)) memoryCache.delete(key);
  }
  if (!redis) return;

  const keys = [];
  for await (const key of redis.scanIterator({ MATCH: `${prefix}*`, COUNT: 100 })) keys.push(key);
  if (keys.length) await redis.del(keys);
};

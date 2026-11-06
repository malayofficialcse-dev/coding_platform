import { getAllShardConnections, getCertificateDirectoryConnection } from "../config/db.js";

const check = async (connection) => {
  const started = Date.now();
  try { await connection.authenticate(); return { status: "UP", latencyMs: Date.now() - started }; }
  catch (error) { return { status: "DOWN", latencyMs: Date.now() - started, error: error.message }; }
};

export const getDatabaseHealth = async () => ({
  shards: await Promise.all(getAllShardConnections().map(async ({ shardId, write, read, readUrl, writeUrl }) => ({
    shardId,
    readFromReplica: readUrl !== writeUrl,
    primary: await check(write),
    read: await check(read),
  }))),
  certificateDirectory: await check(getCertificateDirectoryConnection()),
});

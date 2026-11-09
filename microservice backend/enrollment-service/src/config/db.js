import { Sequelize } from "sequelize";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });
dotenv.config();

const clean = (value) => String(value || "").replace(/^"|"$/g, "").trim();
const baseUrl = clean(process.env.ENROLLMENT_DATABASE_URL || process.env.DATABASE_URL);
const neonSchema = clean(process.env.ENROLLMENT_DB_SCHEMA || "enrollment_schema");

if (!baseUrl) {
  throw new Error("ENROLLMENT_DATABASE_URL must be configured for the Neon Enrollment Service.");
}

export const shardCount = Math.max(1, Number(process.env.ENROLLMENT_SHARD_COUNT || 1));
export const syncDatabase = process.env.ENROLLMENT_DB_SYNC === "true";

const isNeon = (url) => url.includes("neon.tech");

const createConnection = (url, label) => {
  const connectionString = clean(url);
  if (!connectionString) throw new Error(`Missing Neon database URL for ${label}.`);
  return new Sequelize(connectionString, {
    dialect: "postgres",
    dialectOptions: {
      ssl: isNeon(connectionString) ? { require: true, rejectUnauthorized: false } : false,
    },
    logging: false,
    pool: {
      max: Number(process.env.ENROLLMENT_DB_POOL_MAX || 10),
      min: Number(process.env.ENROLLMENT_DB_POOL_MIN || 0),
      acquire: Number(process.env.ENROLLMENT_DB_POOL_ACQUIRE_MS || 30000),
      idle: Number(process.env.ENROLLMENT_DB_POOL_IDLE_MS || 10000),
      afterCreate: (connection, done) => connection.query(
        `SET search_path TO ${neonSchema}, public`,
        (error) => done(error, connection)
      ),
    },
    retry: { max: 2 },
    applicationName: `code-campus-enrollment-${label}`,
  });
};

const urlFor = (shardId, kind) => {
  const shardSpecific = clean(process.env[`ENROLLMENT_SHARD_${shardId}_${kind}_DATABASE_URL`]);
  if (shardSpecific) return shardSpecific;
  if (shardId === 0 && kind === "WRITE") return clean(process.env.ENROLLMENT_PRIMARY_DATABASE_URL) || clean(process.env.ENROLLMENT_WRITE_DATABASE_URL) || baseUrl;
  if (shardId === 0 && kind === "READ") return clean(process.env.ENROLLMENT_READ_DATABASE_URL) || clean(process.env.ENROLLMENT_PRIMARY_DATABASE_URL) || baseUrl;
  return "";
};

const connections = new Map();
for (let shardId = 0; shardId < shardCount; shardId += 1) {
  const writeUrl = urlFor(shardId, "WRITE");
  if (!writeUrl) throw new Error(`ENROLLMENT_SHARD_${shardId}_WRITE_DATABASE_URL is required.`);
  const readUrl = urlFor(shardId, "READ") || writeUrl;
  connections.set(shardId, {
    write: createConnection(writeUrl, `shard-${shardId}-primary`),
    read: createConnection(readUrl, `shard-${shardId}-read`),
    writeUrl,
    readUrl,
  });
}

let directoryConnection;
export const getShardConnection = (shardId, mode = "write") => {
  const shard = connections.get(Number(shardId));
  if (!shard) throw new Error(`Unknown enrollment shard ${shardId}.`);
  return shard[mode === "read" ? "read" : "write"];
};

export const getAllShardConnections = () => [...connections.entries()].map(([shardId, shard]) => ({ shardId, ...shard }));
export const getCertificateDirectoryConnection = () => {
  if (!directoryConnection) directoryConnection = createConnection(
    process.env.CERTIFICATE_DIRECTORY_DATABASE_URL || process.env.ENROLLMENT_PRIMARY_DATABASE_URL || baseUrl,
    "certificate-directory"
  );
  return directoryConnection;
};

export const connectDB = async () => {
  const describe = (url) => {
    try {
      const parsed = new URL(url);
      return `${parsed.hostname}/${parsed.pathname.replace(/^\//, "") || "database"}`;
    } catch {
      return "configured Neon endpoint";
    }
  };

  const shardConnections = getAllShardConnections();
  for (const { shardId, write, read, writeUrl, readUrl } of shardConnections) {
    await write.authenticate();
    console.log(
      `[Enrollment Service] Connected to ${shardId === 0 ? "main database" : `sharding database ${shardId}`} ` +
      `(${describe(writeUrl)})`
    );
    if (readUrl !== writeUrl) {
      await read.authenticate();
      console.log(
        `[Enrollment Service] Connected to read replica for ${shardId === 0 ? "main database" : `sharding database ${shardId}`} ` +
        `(${describe(readUrl)})`
      );
    } else {
      console.log(
        `[Enrollment Service] No separate read replica configured for ${shardId === 0 ? "main database" : `sharding database ${shardId}`}; ` +
        "reads will use its primary"
      );
    }
  }
  await getCertificateDirectoryConnection().authenticate();
  console.log(`[Enrollment Service] Connected to certificate directory on Neon`);
  console.log(`[Enrollment Service] Neon PostgreSQL ready (${shardCount} shard(s))`);
};

export default connectDB;

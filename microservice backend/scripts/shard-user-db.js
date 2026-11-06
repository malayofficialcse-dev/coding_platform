import path from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";
import { getUserShardUrls } from "../shared/userSharding.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const userRequire = createRequire(
  new URL("../user-service/package.json", import.meta.url)
);
const dotenv = userRequire("dotenv");
const { Sequelize } = userRequire("sequelize");

dotenv.config({ path: path.resolve(__dirname, "../.env") });

const sourceUrl = (process.env.USER_DATABASE_URL || "").replace(/^"|"$/g, "");
const shardUrls = getUserShardUrls();

if (!sourceUrl) {
  throw new Error("Set USER_DATABASE_URL to the existing user database before running this migration.");
}
if (shardUrls.length < 2) {
  throw new Error("Configure at least two USER_SHARD_n_DATABASE_URL values before running this migration.");
}
if (shardUrls.includes(sourceUrl)) {
  throw new Error("USER_DATABASE_URL must point to the source database, not one of the configured user shards.");
}

const sourceIsNeon = sourceUrl.includes("neon.tech");
const source = new Sequelize(sourceUrl, {
  dialect: "postgres",
  dialectOptions: {
    ssl: sourceIsNeon ? { require: true, rejectUnauthorized: false } : false,
  },
  logging: false,
  pool: {
    afterCreate: sourceIsNeon
      ? (conn, done) => {
          conn.query("SET search_path TO user_schema, public", (err) => done(err, conn));
        }
      : undefined,
  },
});

const run = async () => {
  const [
    { default: User },
    { connectDB, closeDB },
  ] = await Promise.all([
    import("../user-service/src/models/User.js"),
    import("../user-service/src/config/db.js"),
  ]);

  try {
    await source.authenticate();
    await connectDB();
    const [sourceUsers] = await source.query('SELECT * FROM "users"');
    let copied = 0;
    let alreadyCurrent = 0;

    for (const sourceUser of sourceUsers) {
      const existing = await User.findByPk(sourceUser.id);
      if (existing) {
        await existing.update(sourceUser);
        alreadyCurrent += 1;
        continue;
      }

      const duplicate = await User.findOne({
        where: { email: sourceUser.email },
      });
      if (duplicate) {
        throw new Error("A user email exists on a different shard with a conflicting ID; resolve the conflict before retrying.");
      }

      await User.create(sourceUser);
      copied += 1;
    }

    console.log(`User sharding migration complete: ${copied} copied, ${alreadyCurrent} already present.`);
    console.log("The source database was left unchanged.");
  } finally {
    await source.close();
    await closeDB();
  }
};

run().catch((error) => {
  console.error("[User DB Sharding Migration Error]:", error.message);
  process.exitCode = 1;
});

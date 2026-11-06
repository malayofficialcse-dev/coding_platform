import { Sequelize } from "sequelize";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { getUserShardUrls } from "./userSharding.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });
dotenv.config();

const dbUrls = getUserShardUrls();

export const userShardSequelize = dbUrls.map((dbUrl) => {
  const isNeon = dbUrl.includes("neon.tech");

  return new Sequelize(dbUrl, {
    dialect: "postgres",
    dialectOptions: {
      ssl: isNeon ? { require: true, rejectUnauthorized: false } : false,
    },
    logging: false,
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000,
      afterCreate: isNeon
        ? (conn, done) => {
            conn.query("SET search_path TO user_schema, public", (err) => done(err, conn));
          }
        : undefined,
    },
  });
});

export const sequelize = userShardSequelize[0];

export const connectDB = async () => {
  for (const [index, shard] of userShardSequelize.entries()) {
    await shard.authenticate();
    if (shard.options.dialectOptions.ssl) {
      await shard.query("CREATE SCHEMA IF NOT EXISTS user_schema");
    }
    await shard.sync({ alter: true });
    console.log(`[User Service] PostgreSQL connected — user shard ${index + 1}/${userShardSequelize.length}`);
  }
};

export const closeDB = async () => {
  await Promise.all(userShardSequelize.map((shard) => shard.close()));
};

export default connectDB;

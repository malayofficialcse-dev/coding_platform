import { Sequelize } from "sequelize";

const dbUrl = (
  process.env.CODING_DATABASE_URL ||
  process.env.DATABASE_URL ||
  "postgresql://postgres:malay21@127.0.0.1:5432/coding_db"
).replace(/^"|"$/g, "");

const isNeon = dbUrl.includes("neon.tech");

export const sequelize = new Sequelize(dbUrl, {
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
          conn.query("SET search_path TO coding_schema, public", (err) => done(err, conn));
        }
      : undefined,
  },
});

export const connectPg = async () => {
  try {
    await sequelize.authenticate();
    await sequelize.sync({ alter: true });
    console.log("[Coding Service] PostgreSQL connected — Neon (coding_schema)");
  } catch (err) {
    console.error(`[Coding Service PG Error]: ${err.message}`);
  }
};

export default connectPg;

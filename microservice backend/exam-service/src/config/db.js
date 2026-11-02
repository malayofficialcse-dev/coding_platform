import { Sequelize } from "sequelize";

const dbUrl = (
  process.env.EXAM_DATABASE_URL ||
  process.env.DATABASE_URL ||
  "postgresql://postgres:malay21@127.0.0.1:5432/exam_db"
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
          conn.query("SET search_path TO exam_schema, public", (err) => done(err, conn));
        }
      : undefined,
  },
});

export const connectDB = async () => {
  try {
    await sequelize.authenticate();
    await sequelize.sync({ alter: true });
    console.log("[Exam Service] PostgreSQL connected — Neon (exam_schema)");
  } catch (err) {
    console.error(`[Exam Service DB Error]: ${err.message}`);
  }
};

export default connectDB;

import { Sequelize } from "sequelize";

const dbUrl =
  process.env.EXAM_DATABASE_URL ||
  process.env.DATABASE_URL ||
  "postgres://cc_exam:cc_exam_pass@127.0.0.1:5435/exam_db";

export const sequelize = new Sequelize(dbUrl, {
  dialect: "postgres",
  logging: false,
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
});

export const connectDB = async () => {
  try {
    await sequelize.authenticate();
    await sequelize.sync({ alter: true });
    console.log("[Exam Service] PostgreSQL connected — exam_db");
  } catch (err) {
    console.error(`[Exam Service DB Error]: ${err.message}`);
  }
};

export default connectDB;

import { Sequelize } from "sequelize";

const dbUrl =
  process.env.ENROLLMENT_DATABASE_URL ||
  process.env.DATABASE_URL ||
  "postgresql://postgres:malay21@127.0.0.1:5432/enrollment_db";

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
    console.log("[Enrollment Service] PostgreSQL connected — enrollment_db");
  } catch (err) {
    console.error(`[Enrollment Service DB Error]: ${err.message}`);
  }
};

export default connectDB;

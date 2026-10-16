import mongoose from "mongoose";

export const connectMongo = async () => {
  const uri =
    process.env.CODING_MONGO_URI ||
    process.env.MONGO_URI ||
    "mongodb://127.0.0.1:27019/coding_problems_db";

  try {
    const conn = await mongoose.connect(uri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`[Coding Service] MongoDB connected — coding_problems_db (${conn.connection.name})`);
    return conn;
  } catch (err) {
    console.error(`[Coding Service Mongo Error]: ${err.message}`);
  }
};

export default connectMongo;

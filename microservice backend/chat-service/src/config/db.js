import mongoose from "mongoose";

export const connectDB = async () => {
  const uri =
    process.env.CHAT_MONGO_URI ||
    process.env.MONGO_URI ||
    "mongodb://127.0.0.1:27017/chat_db";
  try {
    const conn = await mongoose.connect(uri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    console.log(`[Chat Service] MongoDB Connected: ${conn.connection.host} (${conn.connection.name})`);
    return conn;
  } catch (err) {
    console.error(`[Chat Service DB Error] Connection failed: ${err.message}`);
    process.exit(1);
  }
};

export default connectDB;

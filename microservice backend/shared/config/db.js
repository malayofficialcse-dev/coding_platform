import mongoose from "mongoose";

export const connectDB = async (customUri) => {
  const uri = customUri || process.env.MONGO_URI || "mongodb://127.0.0.1:27017/code_campus";
  try {
    const conn = await mongoose.connect(uri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    console.log(`[Database] MongoDB Connected: ${conn.connection.host} (${conn.connection.name})`);
    return conn;
  } catch (err) {
    console.error(`[Database Error] Connection failed: ${err.message}`);
    process.exit(1);
  }
};

export default connectDB;

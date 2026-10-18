import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    // _id is a String (UUID) to match the PostgreSQL user-service's primary key
    _id: { type: String, required: true },
    name: { type: String, default: "Code Campus Member" },
    username: { type: String, default: "" },
    email: { type: String, default: "" },
    role: { type: String, default: "student" },
    profileImage: { type: String, default: "" },
  },
  { timestamps: true }
);

export default mongoose.models.User || mongoose.model("User", userSchema);

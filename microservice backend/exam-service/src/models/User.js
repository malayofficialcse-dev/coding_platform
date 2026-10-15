import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    username: { type: String, unique: true, sparse: true },
    email: { type: String, required: true },
    role: { type: String, default: "student" },
    college: { type: String, default: "" },
    degree: { type: String, default: "" },
    yearOfPassing: { type: String, default: "" },
    profileImage: { type: String, default: "" },
  },
  { timestamps: true }
);

export default mongoose.models.User || mongoose.model("User", userSchema);

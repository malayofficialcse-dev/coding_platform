import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    username: { type: String, unique: true, sparse: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, select: false },
    role: { type: String, enum: ["user", "admin", "student", "teacher"], default: "student" },
    college: { type: String, default: "" },
    degree: { type: String, default: "" },
    yearOfPassing: { type: String, default: "" },
    profileImage: { type: String, default: "" },
    followers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    following: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true }
);

userSchema.index({ name: 1 });
userSchema.index({ createdAt: -1 });

export default mongoose.models.User || mongoose.model("User", userSchema);

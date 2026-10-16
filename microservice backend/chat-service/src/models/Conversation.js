import mongoose from "mongoose";

const conversationSchema = new mongoose.Schema(
  {
    participants: [{ type: String, required: true }], // user UUIDs (strings, not ObjectId)
    lastMessage: { type: mongoose.Schema.Types.ObjectId, ref: "Message", default: null },
    lastMessageAt: { type: Date, default: Date.now },
    isGroup: { type: Boolean, default: false },
    groupName: { type: String, default: "" },
    groupAvatar: { type: String, default: "" },
  },
  { timestamps: true }
);

conversationSchema.index({ participants: 1 });
conversationSchema.index({ lastMessageAt: -1 });

export default mongoose.models.Conversation || mongoose.model("Conversation", conversationSchema);

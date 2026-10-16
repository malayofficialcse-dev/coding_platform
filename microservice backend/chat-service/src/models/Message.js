import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    senderId:        { type: String, required: true },    // UUID string (PostgreSQL user_db)
    receiverId:      { type: String, required: true },    // UUID string (PostgreSQL user_db)
    conversationId:  { type: mongoose.Schema.Types.ObjectId, ref: "Conversation", default: null },
    text:            { type: String, default: "" },
    image:           { type: String, default: "" },
    read:            { type: Boolean, default: false },
  },
  { timestamps: true }
);

messageSchema.index({ senderId: 1, receiverId: 1 });
messageSchema.index({ conversationId: 1, createdAt: -1 });

export default mongoose.models.Message || mongoose.model("Message", messageSchema);

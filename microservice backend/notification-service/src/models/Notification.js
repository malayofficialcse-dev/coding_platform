import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    recipient:    { type: String, required: true },   // UUID string (PostgreSQL user_db)
    eventId:      { type: String },
    sender:       { type: String, required: true },   // UUID string (PostgreSQL user_db)
    senderName:   { type: String, default: "" },
    senderAvatar: { type: String, default: "" },
    type: {
      type: String,
      enum: ["like", "comment", "follow", "repost", "message", "system", "exam"],
      required: true,
    },
    // Reference IDs stored as strings (cross-service UUIDs or MongoDB ObjectId strings)
    refPostId:    { type: String, default: null },
    refCommentId: { type: String, default: null },
    refMessageId: { type: String, default: null },
    post:         { type: String, default: null },
    comment:      { type: String, default: null },
    message:      { type: String, default: null },
    title:        { type: String, required: true },
    description:  { type: String, default: "" },
    actionUrl:    { type: String, default: "" },
    read:         { type: Boolean, default: false },
    deliveredAt:  { type: Date, default: null },
  },
  { timestamps: true }
);

notificationSchema.index({ recipient: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, read: 1 });
notificationSchema.index({ eventId: 1 }, { unique: true, sparse: true });

export default mongoose.models.Notification || mongoose.model("Notification", notificationSchema);

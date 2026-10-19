import { DataTypes, Model } from "sequelize";
import { sequelize } from "../config/db.js";

class MentorshipRequest extends Model {}

MentorshipRequest.init({
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  requesterId: { type: DataTypes.UUID, allowNull: false, field: "requester_id" },
  mentorId: { type: DataTypes.UUID, allowNull: false, field: "mentor_id" },
  goal: { type: DataTypes.STRING(180), allowNull: false },
  message: { type: DataTypes.TEXT, allowNull: false, defaultValue: "" },
  status: { type: DataTypes.ENUM("pending", "accepted", "declined", "cancelled"), allowNull: false, defaultValue: "pending" },
  respondedAt: { type: DataTypes.DATE, allowNull: true, field: "responded_at" },
}, {
  sequelize,
  modelName: "MentorshipRequest",
  tableName: "mentorship_requests",
  timestamps: true,
  indexes: [
    { fields: ["requester_id", "status"] },
    { fields: ["mentor_id", "status"] },
  ],
});

export default MentorshipRequest;

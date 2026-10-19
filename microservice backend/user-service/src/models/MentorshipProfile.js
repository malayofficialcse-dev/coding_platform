import { DataTypes, Model } from "sequelize";
import { sequelize } from "../config/db.js";

class MentorshipProfile extends Model {}

MentorshipProfile.init({
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  userId: { type: DataTypes.UUID, allowNull: false, unique: true, field: "user_id" },
  mode: { type: DataTypes.ENUM("seeking", "mentor", "both"), allowNull: false, defaultValue: "seeking" },
  headline: { type: DataTypes.STRING(120), allowNull: false, defaultValue: "" },
  bio: { type: DataTypes.TEXT, allowNull: false, defaultValue: "" },
  skills: { type: DataTypes.JSONB, allowNull: false, defaultValue: [] },
  interests: { type: DataTypes.JSONB, allowNull: false, defaultValue: [] },
  goals: { type: DataTypes.JSONB, allowNull: false, defaultValue: [] },
  mentoringTopics: { type: DataTypes.JSONB, allowNull: false, defaultValue: [] },
  preferredLanguages: { type: DataTypes.JSONB, allowNull: false, defaultValue: [] },
  availability: { type: DataTypes.STRING(120), allowNull: false, defaultValue: "Flexible" },
  capacity: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 3 },
  active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
}, {
  sequelize,
  modelName: "MentorshipProfile",
  tableName: "mentorship_profiles",
  timestamps: true,
  indexes: [{ fields: ["mode", "active"] }],
});

export default MentorshipProfile;

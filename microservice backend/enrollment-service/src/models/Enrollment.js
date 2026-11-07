import { DataTypes, Model } from "sequelize";
import { getShardConnection, shardCount, syncDatabase } from "../config/db.js";

const models = new Map();
const fields = {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  user: { type: DataTypes.STRING, allowNull: false },
  course: { type: DataTypes.STRING, allowNull: false },
  shardId: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  enrolledAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  expiresAt: { type: DataTypes.DATE, allowNull: false },
  completedSubtopics: { type: DataTypes.JSONB, defaultValue: [] },
  progress: { type: DataTypes.INTEGER, defaultValue: 0, validate: { min: 0, max: 100 } },
  completedAt: { type: DataTypes.DATE, allowNull: true, defaultValue: null },
  certificateNumber: { type: DataTypes.STRING, allowNull: true, defaultValue: null },
  certificateIssuedAt: { type: DataTypes.DATE, allowNull: true, defaultValue: null },
  certificateRecipientName: { type: DataTypes.STRING, allowNull: true, defaultValue: null },
  certificateCeoName: { type: DataTypes.STRING, defaultValue: "Malay Maity" },
  enrollmentNumber: { type: DataTypes.STRING, allowNull: true, defaultValue: null },
};

export const getEnrollmentModel = (shardId, mode = "write") => {
  const normalized = Number(shardId);
  const key = `${normalized}:${mode}`;
  if (models.has(key)) return models.get(key);
  class Enrollment extends Model {
    get _id() { return this.getDataValue("id"); }
    toObject() { const value = this.toJSON(); value._id = value.id; return value; }
  }
  Enrollment.init(fields, {
    sequelize: getShardConnection(normalized, mode),
    modelName: `EnrollmentShard${normalized}${mode === "read" ? "Read" : "Write"}`,
    tableName: "enrollments",
    timestamps: true,
    indexes: [
      { fields: ["user", "course"], unique: true },
      { fields: ["user", "createdAt"] },
      { fields: ["certificateNumber"], unique: true },
      { fields: ["enrollmentNumber"] },
    ],
  });
  models.set(key, Enrollment);
  return Enrollment;
};

export const syncEnrollmentModels = async () => {
  for (let shardId = 0; shardId < shardCount; shardId += 1) {
    try {
      const Model = getEnrollmentModel(shardId, "write");
      await Model.sync();
      const conn = getShardConnection(shardId, "write");
      await conn.query(`
        ALTER TABLE enrollments ADD COLUMN IF NOT EXISTS "enrollmentNumber" VARCHAR(255);
        CREATE INDEX IF NOT EXISTS "enrollments_enrollment_number_idx" ON enrollments("enrollmentNumber");
      `);
    } catch (err) {
      console.warn(`[syncEnrollmentModels Shard ${shardId}]:`, err.message);
    }
  }
};

export default getEnrollmentModel;

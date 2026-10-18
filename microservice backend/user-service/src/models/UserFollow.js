import { DataTypes, Model } from "sequelize";
import { sequelize } from "../config/db.js";

/**
 * UserFollow — persists follow relationships in PostgreSQL.
 * Neo4j is still used for graph queries (degrees, paths, recommendations).
 * This table is the source of truth for who follows whom.
 */
class UserFollow extends Model {}

UserFollow.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    followerId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: "follower_id",
    },
    followingId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: "following_id",
    },
  },
  {
    sequelize,
    modelName: "UserFollow",
    tableName: "user_follows",
    timestamps: true,
    indexes: [
      { unique: true, fields: ["follower_id", "following_id"] },
      { fields: ["follower_id"] },
      { fields: ["following_id"] },
    ],
  }
);

export default UserFollow;

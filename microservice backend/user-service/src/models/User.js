import { randomUUID } from "node:crypto";
import { DataTypes, Model, Op } from "sequelize";
import { userShardSequelize } from "../config/db.js";
import { getUserShardIndex } from "../../../shared/userSharding.js";

export const ROLES = [
  "student",
  "exam_coordinator",
  "course_coordinator",
  "feed_coordinator",
  "super_admin",
  "admin",
  "teacher",
  "user",
];

class UserRecord extends Model {
  get _id() {
    return this.getDataValue("id");
  }

  toObject() {
    const raw = this.toJSON();
    raw._id = raw.id;
    return raw;
  }
}

const defineUserModel = (sequelize) => {
  class ShardedUser extends UserRecord {}

  ShardedUser.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      username: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: true,
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        set(value) {
          this.setDataValue("email", value ? value.toLowerCase().trim() : value);
        },
      },
      password: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      googleId: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: true,
      },
      githubId: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: true,
      },
      authProvider: {
        type: DataTypes.STRING,
        defaultValue: "local",
      },
      role: {
        type: DataTypes.STRING,
        defaultValue: "student",
      },
      college: {
        type: DataTypes.STRING,
        defaultValue: "",
      },
      degree: {
        type: DataTypes.STRING,
        defaultValue: "",
      },
      yearOfPassing: {
        type: DataTypes.STRING,
        defaultValue: "",
      },
      profileImage: {
        type: DataTypes.TEXT,
        defaultValue: "/default-avatar.svg",
      },
      bannerImage: {
        type: DataTypes.TEXT,
        defaultValue: "/default-banner.svg",
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      createdBy: {
        type: DataTypes.UUID,
        allowNull: true,
        defaultValue: null,
      },
      permissions: {
        type: DataTypes.JSONB,
        defaultValue: {},
      },
    },
    {
      sequelize,
      modelName: "User",
      tableName: "users",
      timestamps: true,
      indexes: [
        { unique: true, fields: ["email"] },
        { unique: true, fields: ["username"] },
        { fields: ["name"] },
      ],
    }
  );

  return ShardedUser;
};

const userModels = userShardSequelize.map(defineUserModel);
const shardForId = (id) => userModels[getUserShardIndex(String(id), userModels.length)];
const getRows = (rows) => rows.flat();

const readValue = (row, field) => (
  typeof row.get === "function" ? row.get(field) : row[field]
);

const compareByOrder = (rows, order) => {
  const clauses = Array.isArray(order?.[0]) ? order : [];
  if (!clauses.length) return rows;

  return rows.sort((left, right) => {
    for (const [field, direction] of clauses) {
      if (typeof field !== "string") continue;
      const leftValue = readValue(left, field);
      const rightValue = readValue(right, field);
      if (leftValue === rightValue) continue;

      const multiplier = String(direction).toUpperCase() === "DESC" ? -1 : 1;
      if (leftValue == null) return -1 * multiplier;
      if (rightValue == null) return multiplier;
      return (leftValue > rightValue ? 1 : -1) * multiplier;
    }
    return 0;
  });
};

const User = {
  async findByPk(id, options) {
    if (id == null) return null;
    return shardForId(id).findByPk(id, options);
  },

  async findById(id, options) {
    return this.findByPk(id, options);
  },

  async findOne(options = {}) {
    const id = options.where?.id;
    if (typeof id === "string") {
      return shardForId(id).findOne(options);
    }
    const users = await Promise.all(userModels.map((model) => model.findOne(options)));
    return users.find(Boolean) || null;
  },

  async findAll(options = {}) {
    const { limit, offset = 0, order, ...queryOptions } = options;
    const shardOptions = { ...queryOptions };
    if (order) {
      shardOptions.order = order;
    }
    if (Number.isInteger(limit)) {
      shardOptions.limit = limit + offset;
    }

    const rowsByShard = await Promise.all(
      userModels.map((model) => model.findAll(shardOptions))
    );
    const rows = compareByOrder(getRows(rowsByShard), order);
    return Number.isInteger(limit)
      ? rows.slice(offset, offset + limit)
      : rows.slice(offset);
  },

  async findAndCountAll(options = {}) {
    const [count, rows] = await Promise.all([
      this.count({ where: options.where }),
      this.findAll(options),
    ]);
    return { count, rows };
  },

  async findOrCreate(options = {}) {
    const { where = {}, defaults = {}, ...createOptions } = options;
    const existing = await this.findOne({ where });
    if (existing) {
      return [existing, false];
    }

    return [await this.create({ ...where, ...defaults }, createOptions), true];
  },

  async count(options = {}) {
    const shardOptions = { ...options };
    delete shardOptions.limit;
    delete shardOptions.offset;
    delete shardOptions.order;
    const counts = await Promise.all(
      userModels.map((model) => model.count(shardOptions))
    );
    return counts.reduce((total, count) => total + count, 0);
  },

  async create(values, options) {
    const userValues = { ...values, id: values.id || randomUUID() };
    for (const field of ["email", "username", "googleId", "githubId"]) {
      if (userValues[field] == null || userValues[field] === "") continue;
      const existing = await this.findOne({ where: { [field]: userValues[field] } });
      if (existing) {
        const error = new Error(`A user with this ${field} already exists.`);
        error.name = "SequelizeUniqueConstraintError";
        throw error;
      }
    }
    return shardForId(userValues.id).create(userValues, options);
  },

  async relocate(instance, values) {
    const target = shardForId(values.id || instance.id);
    if (instance.constructor.sequelize === target.sequelize) {
      return instance.update(values);
    }

    const relocated = await target.create(values);
    await instance.destroy();
    return relocated;
  },

  async update(values, options = {}) {
    const id = options.where?.id;
    const models = typeof id === "string" ? [shardForId(id)] : userModels;
    const results = await Promise.all(models.map((model) => model.update(values, options)));
    return [results.reduce((total, [count]) => total + count, 0)];
  },

  async destroy(options = {}) {
    const id = options.where?.id;
    const models = typeof id === "string" ? [shardForId(id)] : userModels;
    const counts = await Promise.all(models.map((model) => model.destroy(options)));
    return counts.reduce((total, count) => total + count, 0);
  },

  async sync(options) {
    await Promise.all(userModels.map((model) => model.sync(options)));
  },
};

export { Op };
export default User;

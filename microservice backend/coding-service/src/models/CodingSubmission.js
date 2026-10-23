import { DataTypes, Model, Op } from "sequelize";
import { sequelize } from "../config/pgDb.js";
import CodingProblem from "./CodingProblem.js";
import User from "./User.js";

class CodingSubmission extends Model {
  get _id() {
    return this.getDataValue("id");
  }

  toObject() {
    const raw = this.toJSON();
    raw._id = raw.id;
    return raw;
  }

  static async findById(id) {
    if (!id) return null;
    return await CodingSubmission.findByPk(id);
  }

  /**
   * Compatibility wrapper for Mongoose-style .find({ ... }).sort(...).limit(...)
   */
  static find(filter = {}) {
    const where = {};
    if (typeof filter.user === "string") where.user = filter.user;
    else if (Array.isArray(filter.user?.$in)) where.user = { [Op.in]: filter.user.$in.map(String) };
    if (filter.problem) where.problem = String(filter.problem);
    if (filter.result) where.result = filter.result;

    const queryState = {
      where,
      order: [["createdAt", "DESC"]],
      limit: undefined,
      populateUser: false,
      populateProblem: false,
    };

    const queryPromise = {
      sort(orderObj) {
        if (orderObj && orderObj.createdAt === -1) {
          queryState.order = [["createdAt", "DESC"]];
        } else if (orderObj && orderObj.createdAt === 1) {
          queryState.order = [["createdAt", "ASC"]];
        }
        return queryPromise;
      },
      limit(n) {
        queryState.limit = n;
        return queryPromise;
      },
      select() {
        return queryPromise;
      },
      lean() {
        return queryPromise;
      },
      populate() {
        const path = arguments[0];
        if (path === "user") queryState.populateUser = true;
        if (path === "problem") queryState.populateProblem = true;
        return queryPromise;
      },
      then(onFulfilled, onRejected) {
        return CodingSubmission.findAll({
          where: queryState.where,
          order: queryState.order,
          limit: queryState.limit,
        })
          .then(async (results) => {
            const list = results.map((r) => r.toObject());
            if (queryState.populateProblem) {
              const problemIds = [...new Set(list.map((s) => s.problem))];
              if (problemIds.length) {
                const problems = await CodingProblem.find({ _id: { $in: problemIds } })
                  .select("title difficulty dsaTopic")
                  .lean();
                const probMap = new Map(problems.map((p) => [String(p._id), p]));
                list.forEach((sub) => {
                  sub.problem = probMap.get(String(sub.problem)) || { _id: sub.problem, title: "Problem" };
                });
              }
            }
            if (queryState.populateUser) {
              const userIds = [...new Set(list.map((s) => s.user))];
              if (userIds.length) {
                const users = await User.collection.find({ _id: { $in: userIds } }, {
                  projection: { name: 1, username: 1, email: 1, profileImage: 1, college: 1, degree: 1, yearOfPassing: 1 },
                }).toArray();
                const userMap = new Map(users.map((user) => [String(user._id), user]));
                list.forEach((sub) => {
                  sub.user = userMap.get(String(sub.user)) || { _id: sub.user };
                });
              }
            }
            return list;
          })
          .then(onFulfilled, onRejected);
      },
    };

    return queryPromise;
  }

}

CodingSubmission.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    user: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    problem: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    code: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    language: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    result: {
      type: DataTypes.STRING,
      defaultValue: "Wrong Answer",
    },
    passedCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    totalCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    plagiarism: {
      type: DataTypes.FLOAT,
      defaultValue: 0,
    },
    details: {
      type: DataTypes.JSONB,
      defaultValue: [],
    },
    logicScore: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    logicDetails: {
      type: DataTypes.JSONB,
      defaultValue: {},
    },
  },
  {
    sequelize,
    modelName: "CodingSubmission",
    tableName: "coding_submissions",
    timestamps: true,
    indexes: [
      { fields: ["user", "createdAt"] },
      { fields: ["problem", "createdAt"] },
      { fields: ["result"] },
      { fields: ["result", "user", "problem"] },
    ],
  }
);
export default CodingSubmission;

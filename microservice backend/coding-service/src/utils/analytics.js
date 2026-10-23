import { QueryTypes } from "sequelize";
import { sequelize } from "../config/pgDb.js";
import CodingProblem from "../models/CodingProblem.js";
import User from "../models/User.js";

const clean = (value) => (typeof value === "string" ? value.trim() : "");

async function groupedSubmissionCounts(where = "", replacements = {}) {
  return sequelize.query(
    `SELECT "user" AS user_id,
            COUNT(*)::int AS total_submissions,
            COUNT(*) FILTER (WHERE result = 'Accepted')::int AS accepted_submissions,
            MAX("createdAt") AS last_submission_at
       FROM coding_submissions
       ${where}
      GROUP BY "user"`,
    { replacements, type: QueryTypes.SELECT }
  );
}

async function acceptedUserProblemPairs(userIds) {
  if (!userIds.length) return [];
  return sequelize.query(
    `SELECT "user" AS user_id, "problem" AS problem_id
       FROM coding_submissions
      WHERE result = 'Accepted' AND "user" IN (:userIds)
      GROUP BY "user", "problem"`,
    { replacements: { userIds }, type: QueryTypes.SELECT }
  );
}

async function loadUsers(ids, filter = {}) {
  if (!ids.length) return [];
  return User.collection.find({ _id: { $in: ids }, ...filter }, {
    projection: { name: 1, email: 1, username: 1, profileImage: 1, college: 1, degree: 1, yearOfPassing: 1 },
  }).toArray();
}

export async function getLeaderboard({ college, degree, yearOfPassing } = {}) {
  const filter = {};
  if (college) filter.college = college;
  if (degree) filter.degree = degree;
  if (yearOfPassing) filter.yearOfPassing = yearOfPassing;

  // Resolve academic filters in Mongo first, then aggregate only those SQL rows.
  const academicUsers = Object.keys(filter).length
    ? await User.collection.find(filter, { projection: { _id: 1 } }).toArray()
    : null;
  const allowedIds = academicUsers?.map((user) => String(user._id)) || null;
  if (allowedIds?.length === 0) return [];

  const rows = allowedIds
    ? await groupedSubmissionCounts('WHERE "user" IN (:userIds)', { userIds: allowedIds })
    : await groupedSubmissionCounts();
  const userIds = rows.map((row) => String(row.user_id));
  const [users, acceptedPairs] = await Promise.all([
    loadUsers(userIds, filter),
    acceptedUserProblemPairs(userIds),
  ]);
  const userMap = new Map(users.map((user) => [String(user._id), user]));
  const problemIds = [...new Set(acceptedPairs.map((pair) => String(pair.problem_id)))];
  const problems = problemIds.length
    ? await CodingProblem.find({ _id: { $in: problemIds } }).select("difficulty").lean()
    : [];
  const difficultyByProblem = new Map(problems.map((problem) => [String(problem._id), clean(problem.difficulty).toLowerCase()]));
  const solvedByUser = new Map();
  for (const pair of acceptedPairs) {
    const id = String(pair.user_id);
    const difficulty = difficultyByProblem.get(String(pair.problem_id));
    const solved = solvedByUser.get(id) || new Set();
    if (difficulty) solved.add(`${difficulty}:${pair.problem_id}`);
    solvedByUser.set(id, solved);
  }

  return rows.flatMap((row) => {
    const id = String(row.user_id);
    const user = userMap.get(id);
    if (!user) return [];
    const solved = [...(solvedByUser.get(id) || [])];
    const countDifficulty = (name) => solved.filter((item) => item.startsWith(`${name}:`)).length;
    return [{
      _id: id,
      userId: id,
      name: user.name,
      email: user.email,
      avatar: user.profileImage,
      college: user.college,
      degree: user.degree,
      yearOfPassing: user.yearOfPassing,
      totalSubmissions: Number(row.total_submissions),
      acceptedCount: Number(row.accepted_submissions),
      basicSolved: countDifficulty("basic"),
      easySolved: countDifficulty("easy"),
      mediumSolved: countDifficulty("medium"),
      hardSolved: countDifficulty("hard"),
      lastSubmissionAt: row.last_submission_at,
    }];
  }).sort((a, b) => b.acceptedCount - a.acceptedCount);
}

export async function getAcademicAnalytics() {
  const [counts, pairs] = await Promise.all([
    groupedSubmissionCounts(),
    sequelize.query(
      `SELECT "user" AS user_id, "problem" AS problem_id
         FROM coding_submissions
        WHERE result = 'Accepted'
        GROUP BY "user", "problem"`,
      { type: QueryTypes.SELECT }
    ),
  ]);
  const users = await loadUsers(counts.map((row) => String(row.user_id)));
  const userMap = new Map(users.map((user) => [String(user._id), user]));
  const countMap = new Map(counts.map((row) => [String(row.user_id), row]));

  const grouped = {
    college: new Map(),
    batch: new Map(),
    department: new Map(),
  };
  const solvedUsers = new Map();
  for (const pair of pairs) {
    const key = String(pair.user_id);
    if (!solvedUsers.has(key)) solvedUsers.set(key, new Set());
    solvedUsers.get(key).add(String(pair.problem_id));
  }

  const add = (kind, label, userId, row) => {
    const value = clean(label);
    if (!value) return;
    let item = grouped[kind].get(value);
    if (!item) {
      item = { label: value, totalSubmissions: 0, acceptedSubmissions: 0, students: new Set(), solvers: new Set() };
      grouped[kind].set(value, item);
    }
    item.totalSubmissions += Number(row.total_submissions);
    item.acceptedSubmissions += Number(row.accepted_submissions);
    item.students.add(userId);
    if ((solvedUsers.get(userId)?.size || 0) > 0) item.solvers.add(userId);
  };

  for (const [userId, row] of countMap) {
    const user = userMap.get(userId);
    if (!user) continue;
    add("college", user.college, userId, row);
    add("batch", user.yearOfPassing, userId, row);
    add("department", user.degree, userId, row);
  }

  const format = (kind, key) => [...grouped[kind].values()].map((item) => ({
    [key]: item.label,
    totalSubmissions: item.totalSubmissions,
    acceptedSubmissions: item.acceptedSubmissions,
    totalStudents: item.students.size,
    uniqueSolvers: item.solvers.size,
    acceptanceRate: item.totalSubmissions
      ? Math.round((item.acceptedSubmissions / item.totalSubmissions) * 1000) / 10
      : 0,
  })).sort((a, b) => b.acceptedSubmissions - a.acceptedSubmissions);

  const colleges = [...new Set(users.map((user) => clean(user.college)).filter(Boolean))].sort();
  const departments = [...new Set(users.map((user) => clean(user.degree)).filter(Boolean))].sort();
  const batches = [...new Set(users.map((user) => clean(user.yearOfPassing)).filter(Boolean))].sort();
  return {
    colleges,
    departments,
    batches,
    collegeStats: format("college", "college"),
    batchStats: format("batch", "batch").sort((a, b) => a.batch.localeCompare(b.batch)),
    departmentStats: format("department", "department"),
  };
}

export async function getOverallAnalytics() {
  const [summaryRows, verdictRows, languageRows, solvedRows, activeRows] = await Promise.all([
    sequelize.query(
      `SELECT COUNT(*)::int AS total,
              COUNT(*) FILTER (WHERE result = 'Accepted')::int AS accepted
         FROM coding_submissions`,
      { type: QueryTypes.SELECT }
    ),
    sequelize.query('SELECT result AS name, COUNT(*)::int AS count FROM coding_submissions GROUP BY result', { type: QueryTypes.SELECT }),
    sequelize.query('SELECT LOWER(language) AS name, COUNT(*)::int AS count FROM coding_submissions GROUP BY LOWER(language)', { type: QueryTypes.SELECT }),
    sequelize.query('SELECT "problem" AS id FROM coding_submissions WHERE result = \'Accepted\' GROUP BY "problem"', { type: QueryTypes.SELECT }),
    sequelize.query('SELECT "user" AS id FROM coding_submissions GROUP BY "user"', { type: QueryTypes.SELECT }),
  ]);
  const summary = summaryRows[0] || { total: 0, accepted: 0 };

  const problemIds = solvedRows.map((row) => String(row.id));
  const problems = problemIds.length
    ? await CodingProblem.find({ _id: { $in: problemIds } }).select("difficulty").lean()
    : [];
  const difficultySolved = { basic: 0, easy: 0, medium: 0, hard: 0 };
  const solvedByDifficulty = new Map();
  for (const problem of problems) {
    const difficulty = clean(problem.difficulty).toLowerCase();
    if (difficultySolved[difficulty] !== undefined) solvedByDifficulty.set(difficulty, (solvedByDifficulty.get(difficulty) || 0) + 1);
  }
  for (const [difficulty, count] of solvedByDifficulty) difficultySolved[difficulty] = count;

  return {
    totalSubmissions: Number(summary?.total || 0),
    totalAccepted: Number(summary?.accepted || 0),
    acceptanceRate: summary?.total ? Math.round((summary.accepted / summary.total) * 100) : 0,
    uniqueProblemsSolved: solvedRows.length,
    activeUsersCount: activeRows.length,
    difficultySolved,
    verdicts: Object.fromEntries(verdictRows.map((row) => [row.name || "Unknown", Number(row.count)])),
    languages: Object.fromEntries(languageRows.map((row) => [row.name || "other", Number(row.count)])),
  };
}

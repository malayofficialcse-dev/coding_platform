import { Op } from "sequelize";
import User from "../models/User.js";
import MentorshipProfile from "../models/MentorshipProfile.js";
import MentorshipRequest from "../models/MentorshipRequest.js";
import { dispatchNotification } from "../utils/serviceClient.js";

const userIdOf = (req) => String(req.user?._id || req.user?.id || "");
const normalizeList = (value, max = 20) => [...new Set(
  (Array.isArray(value) ? value : String(value || "").split(","))
    .map((item) => String(item).trim().slice(0, 60))
    .filter(Boolean)
) ].slice(0, max);

const profileFields = ["mode", "headline", "bio", "skills", "interests", "goals", "mentoringTopics", "preferredLanguages", "availability", "capacity", "active"];
const listFields = new Set(["skills", "interests", "goals", "mentoringTopics", "preferredLanguages"]);
const userAttributes = ["id", "name", "username", "profileImage", "college", "role"];

export const getMyMentorshipProfile = async (req, res) => {
  try {
    const profile = await MentorshipProfile.findOne({ where: { userId: userIdOf(req) } });
    res.json(profile || null);
  } catch (error) {
    res.status(500).json({ error: "Could not load mentorship profile", details: error.message });
  }
};

export const saveMyMentorshipProfile = async (req, res) => {
  try {
    const allowedModes = ["seeking", "mentor", "both"];
    const mode = allowedModes.includes(req.body.mode) ? req.body.mode : "seeking";
    const values = { mode };
    for (const key of profileFields) {
      if (key === "mode" || req.body[key] === undefined) continue;
      if (listFields.has(key)) values[key] = normalizeList(req.body[key]);
      else if (key === "capacity") values.capacity = Math.min(20, Math.max(0, Number.parseInt(req.body.capacity, 10) || 0));
      else if (key === "active") values.active = req.body.active === true || req.body.active === "true";
      else values[key] = String(req.body[key] || "").trim().slice(0, key === "bio" ? 1200 : 120);
    }
    const [profile] = await MentorshipProfile.findOrCreate({
      where: { userId: userIdOf(req) },
      defaults: { userId: userIdOf(req), ...values },
    });
    await profile.update(values);
    res.json(profile);
  } catch (error) {
    res.status(500).json({ error: "Could not save mentorship profile", details: error.message });
  }
};

const overlaps = (left = [], right = []) => {
  const rightValues = new Set(right.map((value) => String(value).trim().toLowerCase()));
  return left.filter((value) => rightValues.has(String(value).trim().toLowerCase()));
};

export const getMentorMatches = async (req, res) => {
  try {
    const currentId = userIdOf(req);
    const mine = await MentorshipProfile.findOne({ where: { userId: currentId, active: true } });
    if (!mine || !["seeking", "both"].includes(mine.mode)) {
      return res.json({ needsProfile: true, matches: [] });
    }
    const profiles = await MentorshipProfile.findAll({
      where: { active: true, mode: { [Op.in]: ["mentor", "both"] }, userId: { [Op.ne]: currentId } },
      order: [["updatedAt", "DESC"]],
      limit: 200,
    });
    const currentUser = await User.findByPk(currentId, { attributes: ["college"] });
    const existingRequests = await MentorshipRequest.findAll({
      where: { requesterId: currentId, status: { [Op.in]: ["pending", "accepted"] } },
      attributes: ["mentorId", "status"],
    });
    const requestByMentor = new Map(existingRequests.map((request) => [request.mentorId, request.status]));
    const userIds = profiles.map((profile) => profile.userId);
    const acceptedRequests = userIds.length ? await MentorshipRequest.findAll({
      where: { mentorId: { [Op.in]: userIds }, status: "accepted" },
      attributes: ["mentorId"],
    }) : [];
    const acceptedCounts = new Map();
    acceptedRequests.forEach((request) => acceptedCounts.set(request.mentorId, (acceptedCounts.get(request.mentorId) || 0) + 1));
    const users = userIds.length ? await User.findAll({ where: { id: { [Op.in]: userIds } }, attributes: userAttributes }) : [];
    const userById = new Map(users.map((user) => [String(user.id), user.toObject()]));

    const matches = profiles.map((profile) => {
      const mentor = userById.get(String(profile.userId));
      if (!mentor || (acceptedCounts.get(profile.userId) || 0) >= profile.capacity) return null;
      const topicMatches = overlaps(mine.goals, profile.mentoringTopics);
      const skillMatches = overlaps(mine.skills, profile.skills);
      const interestMatches = overlaps(mine.interests, profile.interests);
      const languageMatches = overlaps(mine.preferredLanguages, profile.preferredLanguages);
      const reasons = [
        ...topicMatches.map((topic) => `Can help with ${topic}`),
        ...skillMatches.map((skill) => `Both know ${skill}`),
        ...interestMatches.slice(0, 2).map((interest) => `Shared interest: ${interest}`),
        ...(mentor.college && mentor.college === currentUser?.college ? ["Same college"] : []),
      ];
      const score = topicMatches.length * 5 + skillMatches.length * 3 + interestMatches.length * 2 + languageMatches.length;
      return {
        profile: profile.toJSON(),
        mentor,
        score,
        reasons: reasons.length ? reasons : ["Available to mentor students"],
        requestStatus: requestByMentor.get(String(profile.userId)) || null,
        capacityRemaining: Math.max(0, profile.capacity - (acceptedCounts.get(profile.userId) || 0)),
      };
    }).filter(Boolean).sort((a, b) => b.score - a.score || a.mentor.name.localeCompare(b.mentor.name));
    res.json({ needsProfile: false, matches });
  } catch (error) {
    res.status(500).json({ error: "Could not find mentor matches", details: error.message });
  }
};

export const getMentorshipRequests = async (req, res) => {
  try {
    const currentId = userIdOf(req);
    const box = req.query.box === "outgoing" ? "outgoing" : req.query.box === "connections" ? "connections" : "incoming";
    const where = box === "outgoing" ? { requesterId: currentId }
      : box === "connections" ? { status: "accepted", [Op.or]: [{ requesterId: currentId }, { mentorId: currentId }] }
      : { mentorId: currentId };
    if (box === "connections") where.status = "accepted";
    const requests = await MentorshipRequest.findAll({ where, order: [["updatedAt", "DESC"]], limit: 100 });
    const counterpartIds = requests.map((request) =>
      box === "incoming" ? request.requesterId : request.mentorId === currentId ? request.requesterId : request.mentorId
    );
    const users = counterpartIds.length ? await User.findAll({ where: { id: { [Op.in]: counterpartIds } }, attributes: userAttributes }) : [];
    const userById = new Map(users.map((user) => [String(user.id), user.toObject()]));
    res.json(requests.map((request) => ({
      ...request.toJSON(),
      counterpart: userById.get(box === "incoming" ? String(request.requesterId) : String(request.mentorId === currentId ? request.requesterId : request.mentorId)) || null,
    })));
  } catch (error) {
    res.status(500).json({ error: "Could not load mentorship requests", details: error.message });
  }
};

export const createMentorshipRequest = async (req, res) => {
  try {
    const requesterId = userIdOf(req);
    const mentorId = String(req.body.mentorId || "");
    const goal = String(req.body.goal || "").trim().slice(0, 180);
    const message = String(req.body.message || "").trim().slice(0, 1200);
    if (!mentorId || mentorId === requesterId || !goal) return res.status(400).json({ error: "Choose a mentor and describe your goal." });
    const requesterProfile = await MentorshipProfile.findOne({ where: { userId: requesterId, active: true, mode: { [Op.in]: ["seeking", "both"] } } });
    if (!requesterProfile) return res.status(400).json({ error: "Create an active student mentorship profile before requesting a mentor." });
    const mentor = await User.findByPk(mentorId, { attributes: userAttributes });
    if (!mentor) return res.status(404).json({ error: "Mentor account not found." });
    const mentorProfile = await MentorshipProfile.findOne({ where: { userId: mentorId, active: true, mode: { [Op.in]: ["mentor", "both"] } } });
    if (!mentorProfile) return res.status(404).json({ error: "This user is not currently accepting mentorship requests." });
    const activeCount = await MentorshipRequest.count({ where: { mentorId, status: "accepted" } });
    if (activeCount >= mentorProfile.capacity) return res.status(409).json({ error: "This mentor is currently at capacity." });
    const existing = await MentorshipRequest.findOne({ where: { requesterId, mentorId, status: { [Op.in]: ["pending", "accepted"] } } });
    if (existing) return res.status(409).json({ error: "You already have an open request or connection with this mentor." });
    const request = await MentorshipRequest.create({ requesterId, mentorId, goal, message });
    const requester = await User.findByPk(requesterId, { attributes: userAttributes });
    await dispatchNotification({
      recipientId: mentorId, senderId: requesterId, senderName: requester?.name || requester?.username || "A student",
      senderAvatar: requester?.profileImage || "", type: "mentorship", title: "New mentorship request",
      description: `${requester?.name || "A student"} is looking for help with ${goal}`,
      actionUrl: "/mentorship?tab=requests",
    });
    res.status(201).json(request);
  } catch (error) {
    res.status(500).json({ error: "Could not send mentorship request", details: error.message });
  }
};

export const updateMentorshipRequest = async (req, res) => {
  try {
    const currentId = userIdOf(req);
    const request = await MentorshipRequest.findByPk(req.params.id);
    if (!request) return res.status(404).json({ error: "Mentorship request not found." });
    const nextStatus = req.body.status;
    if (request.status !== "pending") return res.status(409).json({ error: "This request has already been answered." });
    if (request.mentorId === currentId && ["accepted", "declined"].includes(nextStatus)) {
      if (nextStatus === "accepted") {
        const mentorProfile = await MentorshipProfile.findOne({ where: { userId: currentId } });
        const activeCount = await MentorshipRequest.count({ where: { mentorId: currentId, status: "accepted" } });
        if (!mentorProfile?.active || activeCount >= mentorProfile.capacity) {
          return res.status(409).json({ error: "You are currently at mentorship capacity." });
        }
      }
      request.status = nextStatus;
    } else if (request.requesterId === currentId && nextStatus === "cancelled") {
      request.status = nextStatus;
    } else {
      return res.status(403).json({ error: "You cannot update this request." });
    }
    request.respondedAt = new Date();
    await request.save();
    if (["accepted", "declined"].includes(nextStatus)) {
      const responder = await User.findByPk(currentId, { attributes: userAttributes });
      await dispatchNotification({
        recipientId: request.requesterId, senderId: currentId, senderName: responder?.name || "Your mentor",
        senderAvatar: responder?.profileImage || "", type: "mentorship",
        title: nextStatus === "accepted" ? "Your mentorship request was accepted" : "Your mentorship request was declined",
        description: nextStatus === "accepted" ? "You can now contact your mentor from your connections." : "You can explore other mentor matches.",
        actionUrl: "/mentorship?tab=connections",
      });
    }
    res.json(request);
  } catch (error) {
    res.status(500).json({ error: "Could not update mentorship request", details: error.message });
  }
};

export const getMentorshipContacts = async (req, res) => {
  try {
    const currentId = String(req.params.id || userIdOf(req));
    if (currentId !== userIdOf(req)) return res.status(403).json({ error: "You can only load your own mentorship contacts." });
    const requests = await MentorshipRequest.findAll({
      where: { status: "accepted", [Op.or]: [{ requesterId: currentId }, { mentorId: currentId }] },
      attributes: ["requesterId", "mentorId"],
    });
    const ids = [...new Set(requests.map((request) => String(request.requesterId === currentId ? request.mentorId : request.requesterId)))];
    const users = ids.length ? await User.findAll({ where: { id: { [Op.in]: ids } }, attributes: userAttributes }) : [];
    res.json(users.map((user) => user.toObject()));
  } catch (error) {
    res.status(500).json({ error: "Could not load mentorship contacts", details: error.message });
  }
};

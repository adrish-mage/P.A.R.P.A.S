const mongoose = require("mongoose");
const StudentProfile = require("../models/StudentProfile");
const SkillProfile = require("../models/SkillProfile");
const IndustryOpportunity = require("../models/IndustryOpportunity");
const matchingClient = require("./matchingClient");
async function generateIntelligentMatching({ userId }) {
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    const error = new Error("Invalid user ID");
    error.statusCode = 400;
    throw error;
  }
  const studentProfile = await StudentProfile.findOne({
    userId,
    isActive: true,
  }).select("_id").lean();
  if (!studentProfile) {
    const error = new Error("Active student profile not found");
    error.statusCode = 404;
    throw error;
  }
  const skillProfile = await SkillProfile.findOne({
    studentId: studentProfile._id,
  }).select("skills").lean();
  if (!skillProfile) {
    const error = new Error("Skill profile not found");
    error.statusCode = 404;
    throw error;
  }
  const now = new Date();
  const opportunities = await IndustryOpportunity.find({
    isActive: true,
    $or: [
      { applicationDeadline: { $exists: false } },
      { applicationDeadline: null },
      { applicationDeadline: { $gte: now } },
    ],
  }).select("_id title requiredSkills").lean();
  const studentSkills = skillProfile.skills.map((skill) => ({
    skillId: String(skill.skillId),
    score: skill.score,
  }));
  const opportunityPayload = opportunities.map((opportunity) => ({
    opportunityId: String(opportunity._id),
    title: opportunity.title,
    requiredSkills: opportunity.requiredSkills.map((skill) => ({
      skillId: String(skill.skillId),
      minScore: skill.minScore ?? null,
      required: skill.required,
      weight: skill.weight,
    })),
  }));
  return matchingClient.getIntelligentMatching({
    studentSkills,
    opportunities: opportunityPayload,
  });
}
module.exports = { generateIntelligentMatching };

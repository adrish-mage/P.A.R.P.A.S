const mongoose = require("mongoose");
const StudentProfile = require("../models/StudentProfile");
const SkillProfile = require("../models/SkillProfile");
const IndustryOpportunity = require("../models/IndustryOpportunity");
const matchingClient = require("./matchingClient");

async function generateOpportunitySkillGap({ userId, opportunityId }) {
  if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(opportunityId)) {
    const error = new Error("Invalid user or opportunity ID");
    error.statusCode = 400;
    throw error;
  }

  const student = await StudentProfile.findOne({ userId, isActive: true }).select("_id").lean();
  if (!student) {
    const error = new Error("Active student profile not found");
    error.statusCode = 404;
    throw error;
  }

  const [skillProfile, opportunity] = await Promise.all([
    SkillProfile.findOne({ studentId: student._id }).select("skills").populate("skills.skillId", "name canonicalName").lean(),
    IndustryOpportunity.findOne({ _id: opportunityId, isActive: true }).populate("organisationId", "name").populate("requiredSkills.skillId", "name canonicalName").lean(),
  ]);
  if (!skillProfile) {
    const error = new Error("Skill profile not found");
    error.statusCode = 404;
    throw error;
  }
  if (!opportunity) {
    const error = new Error("Opportunity not found");
    error.statusCode = 404;
    throw error;
  }

  const result = await matchingClient.getSkillGap({
    studentSkills: skillProfile.skills.map((skill) => ({ skillId: String(skill.skillId?._id || skill.skillId), score: skill.score })),
    targetRoleSkills: opportunity.requiredSkills.map((skill) => ({
      skillId: String(skill.skillId?._id || skill.skillId),
      targetLevel: skill.minScore || 10,
      weight: skill.weight,
    })),
  });

  return {
    opportunityId: String(opportunity._id),
    title: opportunity.title,
    organisationName: opportunity.organisationId?.name || "Organisation",
    skillGaps: (result.skillGaps || []).map((gap) => {
      const skill = opportunity.requiredSkills.find((required) => String(required.skillId?._id || required.skillId) === String(gap.skillId));
      return {
        ...gap,
        skillName: skill?.skillId?.canonicalName || skill?.skillId?.name || "Skill",
      };
    }),
    matchScore: result.matchScore ?? 0,
  };
}

module.exports = { generateOpportunitySkillGap };
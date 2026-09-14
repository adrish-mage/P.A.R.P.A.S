const mongoose = require("mongoose");
const Organisation = require("../models/Organisation");
const IndustryOpportunity = require("../models/IndustryOpportunity");
const StudentProfile = require("../models/StudentProfile");
const SkillProfile = require("../models/SkillProfile");

async function generateCandidateOpportunityMatch({ organisationUserId, studentId, opportunityId }) {
  if (!mongoose.Types.ObjectId.isValid(studentId) || !mongoose.Types.ObjectId.isValid(opportunityId)) {
    const error = new Error("Invalid student or opportunity ID");
    error.statusCode = 400;
    throw error;
  }

  const organisation = await Organisation.findOne({ userId: organisationUserId, isVerified: true, isActive: true }).select("_id").lean();
  if (!organisation) {
    const error = new Error("Verified organisation account required");
    error.statusCode = 403;
    throw error;
  }

  const [student, opportunity, skillProfile] = await Promise.all([
    StudentProfile.findOne({ _id: studentId, isActive: true }).select("_id").lean(),
    IndustryOpportunity.findOne({ _id: opportunityId, organisationId: organisation._id, isActive: true }).populate("requiredSkills.skillId", "name").lean(),
    SkillProfile.findOne({ studentId }).select("skills").lean(),
  ]);

  if (!student) {
    const error = new Error("Active student profile not found");
    error.statusCode = 404;
    throw error;
  }
  if (!opportunity) {
    const error = new Error("Opportunity not found for this organisation");
    error.statusCode = 404;
    throw error;
  }

  const studentSkills = new Map((skillProfile?.skills || []).map((skill) => [String(skill.skillId), skill]));
  const skills = opportunity.requiredSkills.map((required) => {
    const requiredScore = Number(required.minScore || 0);
    const candidateSkill = studentSkills.get(String(required.skillId?._id || required.skillId));
    const candidateScore = Number(candidateSkill?.score || 0);
    return {
      skillId: String(required.skillId?._id || required.skillId),
      name: required.skillId?.name || "Skill",
      required: requiredScore,
      candidate: candidateScore,
      gap: candidateScore - requiredScore,
      meets: candidateScore >= requiredScore,
      weight: Number(required.weight || 1),
    };
  });

  const totalWeight = skills.reduce((total, skill) => total + skill.weight, 0);
  const score = totalWeight
    ? Math.round(skills.reduce((total, skill) => total + Math.min(1, skill.required ? skill.candidate / skill.required : 1) * skill.weight, 0) / totalWeight * 100)
    : 0;

  return { studentId: String(student._id), opportunityId: String(opportunity._id), score, skills };
}

module.exports = { generateCandidateOpportunityMatch };

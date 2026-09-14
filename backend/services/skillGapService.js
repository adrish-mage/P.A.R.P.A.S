const mongoose = require("mongoose");
const StudentProfile = require("../models/StudentProfile");
const SkillProfile = require("../models/SkillProfile");
const CareerRole = require("../models/CareerRole");
const matchingClient = require("./matchingClient");
async function generateSkillGap({ userId, careerRoleId }) {
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    const error = new Error("Invalid user ID");
    error.statusCode = 400;
    throw error;
  }
  if (!mongoose.Types.ObjectId.isValid(careerRoleId)) {
    const error = new Error("Invalid career role ID");
    error.statusCode = 400;
    throw error;
  }
  const studentProfile = await StudentProfile.findOne({
    userId,
    isActive: true,
  }).lean();
  if (!studentProfile) {
    const error = new Error("Active student profile not found");
    error.statusCode = 404;
    throw error;
  }
  const skillProfile = await SkillProfile.findOne({
    studentId: studentProfile._id,
  }).lean();
  if (!skillProfile) {
    const error = new Error("Skill profile not found");
    error.statusCode = 404;
    throw error;
  }
  const careerRole = await CareerRole.findOne({
    _id: careerRoleId,
    isActive: true,
  }).lean();
  if (!careerRole) {
    const error = new Error("Active career role not found");
    error.statusCode = 404;
    throw error;
  }
  const studentSkills = skillProfile.skills.map((skill) => ({
    skillId: String(skill.skillId),
    score: skill.score,
  }));
  const targetRoleSkills = careerRole.skills.map((skill) => ({
    skillId: String(skill.skillId),
    targetLevel: skill.targetLevel,
    weight: skill.weight,
  }));
  const result = await matchingClient.getSkillGap({studentSkills, targetRoleSkills,});
  return {
    careerRoleId: String(careerRole._id),
    careerRoleName: careerRole.name,
    skillGaps: result.skillGaps || [],
    matchScore: result.matchScore ?? 0,
  };
}
module.exports = {generateSkillGap,};
const mongoose = require("mongoose");
const StudentProfile = require("../models/StudentProfile");
const SkillProfile = require("../models/SkillProfile");
const CareerRole = require("../models/CareerRole");
const LearningOpportunity = require("../models/LearningOpportunity");
const GrowthMap = require("../models/GrowthMap");
const matchingClient = require("./matchingClient");
async function generateGrowthMap({
  userId,
  careerRoleId,
}) {
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
  })
    .select("_id")
    .lean();
  if (!studentProfile) {
    const error = new Error("Active student profile not found");
    error.statusCode = 404;
    throw error;
  }
  const skillProfile = await SkillProfile.findOne({
    studentId: studentProfile._id,
  })
    .select("skills")
    .lean();
  if (!skillProfile) {
    const error = new Error("Skill profile not found");
    error.statusCode = 404;
    throw error;
  }
  const careerRole = await CareerRole.findOne({
    _id: careerRoleId,
    isActive: true,
  })
    .select("name skills")
    .lean();
  if (!careerRole) {
    const error = new Error("Active career role not found");
    error.statusCode = 404;
    throw error;
  }
  const now = new Date();
  const learningOpportunities =
    await LearningOpportunity.find({
      isActive: true,
      $or: [
        { registrationDeadline: { $exists: false } },
        { registrationDeadline: null },
        { registrationDeadline: { $gte: now } },
      ],
    })
      .select("title skills")
      .lean();
  const studentSkills = skillProfile.skills.map(
    (skill) => ({
      skillId: String(skill.skillId),
      score: skill.score,
    })
  );
  const targetRoleSkills = careerRole.skills.map(
    (skill) => ({
      skillId: String(skill.skillId),
      targetLevel: skill.targetLevel,
      weight: skill.weight,
    })
  );
  const opportunities =
    learningOpportunities.map(
      (opportunity) => ({
        opportunityId: String(opportunity._id),
        title: opportunity.title,
        skills: opportunity.skills.map(
          (skill) => ({
            skillId: String(skill.skillId),
            targetLevel: skill.targetLevel ?? null,
            required: skill.required,
            weight: skill.weight,
          })
        ),
      })
    );
  const result =
    await matchingClient.getGrowthMapRecommendations({
      studentSkills,
      targetRoleSkills,
      learningOpportunities: opportunities,
    });
  const skillGaps = (result.skillGaps || []).map(
    ({ skillId, currentScore, targetScore, gap, priority }) => ({
      skillId,
      currentScore,
      targetScore,
      gap,
      priority,
    })
  );
  const existingGrowthMap = await GrowthMap.findOne({ studentId: studentProfile._id }).select("version").lean();
  const growthMap = await GrowthMap.findOneAndUpdate(
    { studentId: studentProfile._id },
    {
      $set: {
        target: {
          type: "career_role",
          roleId: careerRole._id,
          roleName: careerRole.name,
        },
        skillGaps,
        recommendations: result.recommendations || [],
        generatedAt: new Date(),
        version: (existingGrowthMap?.version || 0) + 1,
      },
      $setOnInsert: {
        studentId: studentProfile._id,
        generatedBy: "python-predictive",
      },
    },
    { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
  );
  return growthMap;
}
module.exports = {generateGrowthMap,};
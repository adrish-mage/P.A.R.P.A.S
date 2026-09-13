const mongoose = require("mongoose");
const Institution = require("../models/Institution");
const InstitutionMembership = require("../models/InstitutionMembership");
const StudentProfile = require("../models/StudentProfile");
const SkillProfile = require("../models/SkillProfile");
const matchingClient = require("./matchingClient");
async function generatePlacementInsights({ userId, institutionId, cohort }) {
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    const error = new Error("Invalid user ID");
    error.statusCode = 400;
    throw error;
  }
  if (!mongoose.Types.ObjectId.isValid(institutionId)) {
    const error = new Error("Invalid institution ID");
    error.statusCode = 400;
    throw error;
  }
  const parsedCohort = Number(cohort);
  if (!Number.isInteger(parsedCohort) || parsedCohort < 1900 || parsedCohort > 2200) {
    const error = new Error("cohort must be a valid graduation year");
    error.statusCode = 400;
    throw error;
  }
  const institution = await Institution.findOne({
    _id: institutionId,
    userId,
    isActive: true,
  }).select("_id").lean();
  if (!institution) {
    const error = new Error("Active institution not found for this user");
    error.statusCode = 403;
    throw error;
  }
  const memberships = await InstitutionMembership.find({
    institutionId,
    status: "active",
    "studentDetails.graduationYear": parsedCohort,
  }).select("userId").lean();
  if (!memberships.length) {
    return matchingClient.getPlacementInsights({
      institutionId: String(institutionId),
      cohort: String(parsedCohort),
      students: [],
    });
  }
  const userIds = memberships.map((membership) => membership.userId);
  const studentProfiles = await StudentProfile.find({
    userId: { $in: userIds },
    isActive: true,
  }).select("_id userId").lean();
  const studentByUserId = new Map(
    studentProfiles.map((student) => [String(student.userId), student])
  );
  const studentIds = studentProfiles.map((student) => student._id);
  const skillProfiles = await SkillProfile.find({
    studentId: { $in: studentIds },
  }).select("studentId skills").lean();
  const skillProfileByStudentId = new Map(
    skillProfiles.map((profile) => [String(profile.studentId), profile])
  );
  const students = [];
  for (const userIdRef of userIds) {
    const student = studentByUserId.get(String(userIdRef));
    if (!student) continue;
    const skillProfile = skillProfileByStudentId.get(String(student._id));
    const skills = skillProfile?.skills || [];
    const readinessScore = skills.length
      ? (skills.reduce((sum, skill) => sum + skill.score, 0) / skills.length) * 10
      : 0;
    const skillGaps = skills
      .filter((skill) => skill.score < 5)
      .map((skill) => ({
        skillId: String(skill.skillId),
        gap: round(10 - skill.score, 4),
        weight: 1,
      }));
    students.push({
      studentId: String(student._id),
      readinessScore: round(readinessScore, 4),
      skillGaps,
    });
  }
  return matchingClient.getPlacementInsights({
    institutionId: String(institutionId),
    cohort: String(parsedCohort),
    students,
  });
}
function round(value, decimals) {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}
module.exports = { generatePlacementInsights };

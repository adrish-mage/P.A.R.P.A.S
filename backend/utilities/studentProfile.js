const StudentProfile = require("../models/StudentProfile");

async function findStudentProfileId(userId) {
  const profile = await StudentProfile.findOne({ userId }).select("_id");
  return profile?._id || null;
}

module.exports = { findStudentProfileId };
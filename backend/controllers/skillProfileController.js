const SkillProfile = require("../models/SkillProfile");
const { findStudentProfileId } = require("../utilities/studentProfile");

async function createSkillProfile(req, res) {
  try {
    const studentId = await findStudentProfileId(req.user.id);
    if (!studentId) return res.status(404).json({ message: "Student profile not found" });
    const existing = await SkillProfile.findOne({ studentId });
    if (existing) {
      return res.status(409).json({ message: "Skill profile already exists for this user" });
    }
    const { userId, studentId: ignoredStudentId, ...data } = req.body;
    const skillProfile = await SkillProfile.create({ ...data, studentId });
    return res.status(201).json(skillProfile);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

async function getSkillProfile(req, res) {
  try {
    if (String(req.user.id) !== String(req.params.userId)) return res.status(403).json({ message: "You can only view your own skill profile" });
    const studentId = await findStudentProfileId(req.user.id);
    const skillProfile = await SkillProfile.findOne({ studentId }).populate("skills.skillId", "name canonicalName aliases");
    if (!skillProfile) {
      return res.status(404).json({ message: "Skill profile not found" });
    }
    return res.status(200).json(skillProfile);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

async function updateSkillProfile(req, res) {
  try {
    if (String(req.user.id) !== String(req.params.userId)) return res.status(403).json({ message: "You can only update your own skill profile" });
    const studentId = await findStudentProfileId(req.user.id);
    const { userId, studentId: ignoredStudentId, ...data } = req.body;
    const skillProfile = await SkillProfile.findOneAndUpdate(
      { studentId },
      data,
      { new: true, runValidators: true }
    ).populate("skills.skillId", "name canonicalName aliases");
    if (!skillProfile) {
      return res.status(404).json({ message: "Skill profile not found" });
    }
    return res.status(200).json(skillProfile);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

async function deleteSkillProfile(req, res) {
  try {
    if (String(req.user.id) !== String(req.params.userId)) return res.status(403).json({ message: "You can only delete your own skill profile" });
    const studentId = await findStudentProfileId(req.user.id);
    const skillProfile = await SkillProfile.findOneAndDelete({ studentId });
    if (!skillProfile) {
      return res.status(404).json({ message: "Skill profile not found" });
    }
    return res.status(200).json({ message: "Skill profile deleted" });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

module.exports = {
  createSkillProfile,
  getSkillProfile,
  updateSkillProfile,
  deleteSkillProfile,
};

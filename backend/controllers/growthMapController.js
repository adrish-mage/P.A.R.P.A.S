const GrowthMap = require("../models/GrowthMap");
const matchingClient = require("../services/matchingClient");
const { findStudentProfileId } = require("../utilities/studentProfile");

async function createGrowthMap(req, res) {
  try {
    const studentId = await findStudentProfileId(req.user.id);
    if (!studentId) return res.status(404).json({ message: "Student profile not found" });
    const existing = await GrowthMap.findOne({ studentId });
    if (existing) {
      return res.status(409).json({ message: "Growth map already exists for this user" });
    }
    const { userId, targetRole, currentSkills, ...data } = req.body;
    const growthMap = await GrowthMap.create({
      ...data,
      studentId,
      target: data.target || { type: "career_role", roleName: targetRole, roleId: data.roleId },
    });
    return res.status(201).json(growthMap);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

async function getGrowthMap(req, res) {
  try {
    if (String(req.user.id) !== String(req.params.userId)) return res.status(403).json({ message: "You can only view your own growth map" });
    const studentId = await findStudentProfileId(req.user.id);
    const growthMap = await GrowthMap.findOne({ studentId });
    if (!growthMap) {
      return res.status(404).json({ message: "Growth map not found" });
    }
    return res.status(200).json(growthMap);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

async function updateGrowthMap(req, res) {
  try {
    if (String(req.user.id) !== String(req.params.userId)) return res.status(403).json({ message: "You can only update your own growth map" });
    const studentId = await findStudentProfileId(req.user.id);
    const { userId, targetRole, currentSkills, ...data } = req.body;
    const growthMap = await GrowthMap.findOneAndUpdate(
      { studentId },
      data,
      { new: true, runValidators: true }
    );
    if (!growthMap) {
      return res.status(404).json({ message: "Growth map not found" });
    }
    return res.status(200).json(growthMap);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

async function deleteGrowthMap(req, res) {
  try {
    if (String(req.user.id) !== String(req.params.userId)) return res.status(403).json({ message: "You can only delete your own growth map" });
    const studentId = await findStudentProfileId(req.user.id);
    const growthMap = await GrowthMap.findOneAndDelete({ studentId });
    if (!growthMap) {
      return res.status(404).json({ message: "Growth map not found" });
    }
    return res.status(200).json({ message: "Growth map deleted" });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

module.exports = {
  createGrowthMap,
  getGrowthMap,
  updateGrowthMap,
  deleteGrowthMap,
};

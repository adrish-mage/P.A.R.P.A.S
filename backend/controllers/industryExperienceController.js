const IndustryExperience = require("../models/IndustryExperience");
const { findStudentProfileId } = require("../utilities/studentProfile");

async function createIndustryExperienceEntry(req, res) {
  try {
    const studentId = await findStudentProfileId(req.user.id);
    if (!studentId) return res.status(404).json({ message: "Student profile not found" });
    const { userId, ...data } = req.body;
    const entry = await IndustryExperience.create({ ...data, studentId });
    return res.status(201).json(entry);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

async function getIndustryExperienceByUser(req, res) {
  try {
    if (String(req.user.id) !== String(req.params.userId)) return res.status(403).json({ message: "You can only view your own records" });
    const studentId = await findStudentProfileId(req.user.id);
    const entries = await IndustryExperience.find({ studentId });
    return res.status(200).json(entries);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

async function getIndustryExperienceById(req, res) {
  try {
    const entry = await IndustryExperience.findById(req.params.id);
    if (!entry) {
      return res.status(404).json({ message: "Industry experience entry not found" });
    }
    return res.status(200).json(entry);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

async function updateIndustryExperienceEntry(req, res) {
  try {
    const studentId = await findStudentProfileId(req.user.id);
    const { userId, studentId: ignoredStudentId, ...data } = req.body;
    const entry = await IndustryExperience.findOneAndUpdate({ _id: req.params.id, studentId }, data, {
      new: true,
      runValidators: true,
    });
    if (!entry) {
      return res.status(404).json({ message: "Industry experience entry not found" });
    }
    return res.status(200).json(entry);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

async function deleteIndustryExperienceEntry(req, res) {
  try {
    const studentId = await findStudentProfileId(req.user.id);
    const entry = await IndustryExperience.findOneAndDelete({ _id: req.params.id, studentId });
    if (!entry) {
      return res.status(404).json({ message: "Industry experience entry not found" });
    }
    return res.status(200).json({ message: "Industry experience entry deleted" });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

module.exports = {
  createIndustryExperienceEntry,
  getIndustryExperienceByUser,
  getIndustryExperienceById,
  updateIndustryExperienceEntry,
  deleteIndustryExperienceEntry,
};

const Training = require("../models/Training");
const { findStudentProfileId } = require("../utilities/studentProfile");

async function createTrainingEntry(req, res) {
  try {
    const studentId = await findStudentProfileId(req.user.id);
    if (!studentId) return res.status(404).json({ message: "Student profile not found" });
    const { userId, ...data } = req.body;
    const entry = await Training.create({ ...data, studentId });
    return res.status(201).json(entry);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

async function getTrainingByUser(req, res) {
  try {
    if (String(req.user.id) !== String(req.params.userId)) return res.status(403).json({ message: "You can only view your own records" });
    const studentId = await findStudentProfileId(req.user.id);
    const entries = await Training.find({ studentId });
    return res.status(200).json(entries);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

async function getTrainingById(req, res) {
  try {
    const entry = await Training.findById(req.params.id);
    if (!entry) {
      return res.status(404).json({ message: "Training entry not found" });
    }
    return res.status(200).json(entry);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

async function updateTrainingEntry(req, res) {
  try {
    const studentId = await findStudentProfileId(req.user.id);
    const { userId, studentId: ignoredStudentId, ...data } = req.body;
    const entry = await Training.findOneAndUpdate({ _id: req.params.id, studentId }, data, {
      new: true,
      runValidators: true,
    });
    if (!entry) {
      return res.status(404).json({ message: "Training entry not found" });
    }
    return res.status(200).json(entry);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

async function deleteTrainingEntry(req, res) {
  try {
    const studentId = await findStudentProfileId(req.user.id);
    const entry = await Training.findOneAndDelete({ _id: req.params.id, studentId });
    if (!entry) {
      return res.status(404).json({ message: "Training entry not found" });
    }
    return res.status(200).json({ message: "Training entry deleted" });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

module.exports = {
  createTrainingEntry,
  getTrainingByUser,
  getTrainingById,
  updateTrainingEntry,
  deleteTrainingEntry,
};

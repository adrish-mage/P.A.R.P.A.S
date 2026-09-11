const AcademicRecord = require("../models/AcademicRecord");
const { findStudentProfileId } = require("../utilities/studentProfile");

async function createAcademicRecord(req, res) {
  try {
    const studentId = await findStudentProfileId(req.user.id);
    if (!studentId) return res.status(404).json({ message: "Student profile not found" });
    const { userId, ...data } = req.body;
    const entry = await AcademicRecord.create({ ...data, studentId });
    return res.status(201).json(entry);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

async function getAcademicRecordsByUser(req, res) {
  try {
    if (String(req.user.id) !== String(req.params.userId)) return res.status(403).json({ message: "You can only view your own records" });
    const studentId = await findStudentProfileId(req.user.id);
    if (!studentId) return res.status(404).json({ message: "Student profile not found" });
    const entries = await AcademicRecord.find({ studentId });
    return res.status(200).json(entries);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

async function getAcademicRecordById(req, res) {
  try {
    const entry = await AcademicRecord.findById(req.params.id);
    if (!entry) return res.status(404).json({ message: "Academic record not found" });
    return res.status(200).json(entry);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

async function updateAcademicRecord(req, res) {
  try {
    const studentId = await findStudentProfileId(req.user.id);
    const { userId, studentId: ignoredStudentId, ...data } = req.body;
    const entry = await AcademicRecord.findOneAndUpdate({ _id: req.params.id, studentId }, data, {
      new: true,
      runValidators: true,
    });
    if (!entry) return res.status(404).json({ message: "Academic record not found" });
    return res.status(200).json(entry);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

async function deleteAcademicRecord(req, res) {
  try {
    const studentId = await findStudentProfileId(req.user.id);
    const entry = await AcademicRecord.findOneAndDelete({ _id: req.params.id, studentId });
    if (!entry) return res.status(404).json({ message: "Academic record not found" });
    return res.status(200).json({ message: "Academic record deleted" });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

module.exports = {
  createAcademicRecord,
  getAcademicRecordsByUser,
  getAcademicRecordById,
  updateAcademicRecord,
  deleteAcademicRecord,
};

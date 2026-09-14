const Project = require("../models/Project");
const Verification = require("../models/Verification");
const { findStudentProfileId } = require("../utilities/studentProfile");

async function createProjectEntry(req, res) {
  try {
    const studentId = await findStudentProfileId(req.user.id);
    if (!studentId) return res.status(404).json({ message: "Student profile not found" });
    const { userId, ...data } = req.body;
    const entry = await Project.create({ ...data, studentId });
    return res.status(201).json(entry);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

async function getProjectsByUser(req, res) {
  try {
    if (String(req.user.id) !== String(req.params.userId)) return res.status(403).json({ message: "You can only view your own records" });
    const studentId = await findStudentProfileId(req.user.id);
    const entries = await Project.find({ studentId }).populate("skills.skillId", "name canonicalName aliases").lean();
    const verifications = await Verification.find({
      studentId,
      targetType: "project",
      targetId: { $in: entries.map((entry) => entry._id) },
    }).sort({ verifiedAt: -1 }).lean();
    const verificationByProject = new Map();
    for (const verification of verifications) {
      if (!verificationByProject.has(String(verification.targetId))) {
        verificationByProject.set(String(verification.targetId), verification);
      }
    }
    const result = entries.map((entry) => {
      const verification = verificationByProject.get(String(entry._id));
      return {
        ...entry,
        verificationStatus: verification?.status === "verified" ? "Verified" : verification?.status === "rejected" ? "Rejected" : "Pending",
        verificationId: verification?._id || null,
      };
    });
    return res.status(200).json(result);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

async function getProjectById(req, res) {
  try {
    const entry = await Project.findById(req.params.id);
    if (!entry) {
      return res.status(404).json({ message: "Project not found" });
    }
    return res.status(200).json(entry);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

async function updateProjectEntry(req, res) {
  try {
    const studentId = await findStudentProfileId(req.user.id);
    const { userId, studentId: ignoredStudentId, ...data } = req.body;
    const entry = await Project.findOneAndUpdate({ _id: req.params.id, studentId }, data, {
      new: true,
      runValidators: true,
    });
    if (!entry) {
      return res.status(404).json({ message: "Project not found" });
    }
    return res.status(200).json(entry);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

async function deleteProjectEntry(req, res) {
  try {
    const studentId = await findStudentProfileId(req.user.id);
    const entry = await Project.findOneAndDelete({ _id: req.params.id, studentId });
    if (!entry) {
      return res.status(404).json({ message: "Project not found" });
    }
    return res.status(200).json({ message: "Project deleted" });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

module.exports = {
  createProjectEntry,
  getProjectsByUser,
  getProjectById,
  updateProjectEntry,
  deleteProjectEntry,
};

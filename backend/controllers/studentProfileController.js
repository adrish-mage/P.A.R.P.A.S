const StudentProfile = require("../models/StudentProfile");
const Institution = require("../models/Institution");
const AffiliationApplication = require("../models/AffiliationApplication");

async function getByUser(req, res) {
  try {
    const profile = await StudentProfile.findOne({ userId: req.params.userId });
    if (!profile) return res.status(404).json({ message: "Student profile not found" });
    return res.status(200).json(profile);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

async function updateProfile(req, res) {
  try {
    const { institutionLink, ...rest } = req.body;
    const profile = await StudentProfile.findOneAndUpdate({ userId: req.params.userId }, rest, {
      new: true,
      runValidators: true,
    });
    if (!profile) return res.status(404).json({ message: "Student profile not found" });
    return res.status(200).json(profile);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

async function consentToLink(req, res) {
  return res.status(410).json({ message: "Institution consent is replaced by affiliation applications" });
}

async function requestLink(req, res) {
  try {
    const { institutionId, rollNo, enrollmentId, course, admissionYear } = req.body;
    const institution = await Institution.findOne({ _id: institutionId, isVerified: true, isActive: true });
    if (!institution) return res.status(404).json({ message: "Verified institution not found" });
    if (!rollNo || !enrollmentId || !course || !admissionYear) {
      return res.status(400).json({ message: "rollNo, enrollmentId, course, and admissionYear are required" });
    }
    const profile = await StudentProfile.findOne({ userId: req.params.userId });
    if (!profile) return res.status(404).json({ message: "Student profile not found" });
    let application = await AffiliationApplication.findOne({
      applicantUserId: profile.userId,
      affiliationType: "institution",
      affiliationId: institution._id,
    });
    if (application?.status === "approved") {
      return res.status(409).json({ message: "You are already linked to this institution" });
    }
    if (application?.status === "pending") {
      return res.status(409).json({ message: "A verification request is already pending for this institution" });
    }
    if (application) {
      application.status = "pending";
      application.approvals = [];
      application.membershipId = undefined;
      application.reviewedAt = undefined;
      application.completedAt = undefined;
      await application.save();
    } else {
      application = await AffiliationApplication.create({
        applicantUserId: profile.userId,
        affiliationType: "institution",
        affiliationId: institution._id,
      });
    }
    profile.institutionLink = {
      institutionId: institution._id,
      status: "Pending",
      rollNo,
      enrollmentId,
      course,
      admissionYear,
    };
    await profile.save();
    return res.status(201).json({ ...profile.toObject(), affiliationApplication: application });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: "A verification request is already pending for this institution" });
    }
    return res.status(500).json({ message: err.message });
  }
}

async function approveLink(req, res) {
  return res.status(410).json({ message: "Institution approval is handled through affiliation applications" });
}

module.exports = { getByUser, updateProfile, consentToLink, requestLink, approveLink };

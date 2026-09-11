const mongoose = require("mongoose");
const Institution = require("../models/Institution");
const StudentProfile = require("../models/StudentProfile");
const ProfessionalProfile = require("../models/ProfessionalProfile");
const InstitutionMembership = require("../models/InstitutionMembership");
const AffiliationApplication = require("../models/AffiliationApplication");
const AffiliationInvite = require("../models/AffiliationInvite");
const User = require("../models/User");

async function listVerified(req, res) {
  try {
    const list = await Institution.find({ isVerified: true, isActive: true })
      .select("name code isVerified")
      .sort({ name: 1 });
    return res.status(200).json(list);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

async function getInstitution(req, res) {
  try {
    const inst = await Institution.findById(req.params.id);
    if (!inst) return res.status(404).json({ message: "Institution not found" });
    return res.status(200).json(inst);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

async function listPending(req, res) {
  try {
    const list = await Institution.find({ isVerified: false, isActive: true });
    return res.status(200).json(list);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

async function verifyInstitution(req, res) {
  try {
    const { decision, note } = req.body;
    if (!["Verified", "Rejected"].includes(decision)) {
      return res.status(400).json({ message: "decision must be Verified or Rejected" });
    }
    const inst = await Institution.findByIdAndUpdate(req.params.id, { isVerified: decision === "Verified" }, { new: true });
    if (!inst) return res.status(404).json({ message: "Institution not found" });

    if (decision === "Verified") {
      await User.findByIdAndUpdate(inst.userId, { onboardingStatus: "in_progress" });
    }
    return res.status(200).json(inst);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

async function linkStudents(req, res) {
  try {
    const institution = await Institution.findById(req.params.id);
    if (!institution || !institution.isVerified || !institution.isActive) {
      return res.status(403).json({ message: "Institution must be Verified before linking students" });
    }

    const { students } = req.body;
    const results = [];

    for (const s of students) {
      const user = await User.findOne({ email: s.email, accountType: "individual" });
      const studentProfile = user ? await StudentProfile.findOne({ userId: user._id }).select("_id") : null;
      if (!user || !studentProfile) {
        results.push({ email: s.email, status: "NoMatch-ManualRequestRequired" });
        continue;
      }

      const existing = await AffiliationApplication.findOne({
        applicantUserId: user._id,
        affiliationType: "institution",
        affiliationId: institution._id,
      }).sort({ createdAt: -1 });
      if (existing) {
        results.push({
          email: s.email,
          status: existing.status === "pending" ? "AlreadyPending" : existing.status === "approved" ? "AlreadyLinked" : existing.status,
          applicationId: existing._id,
        });
        continue;
      }

      const application = await AffiliationApplication.create({
        applicantUserId: user._id,
        affiliationType: "institution",
        affiliationId: institution._id,
      });
      results.push({ email: s.email, status: application.status, applicationId: application._id });
    }

    return res.status(200).json({ results });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

async function listStudentRequests(req, res) {
  try {
    const applications = await AffiliationApplication.find({
      affiliationType: "institution",
      affiliationId: req.params.id,
      status: { $in: ["pending", "approved"] },
    }).populate("applicantUserId", "name email");
    const userIds = applications.map((application) => application.applicantUserId?._id).filter(Boolean);
    const profiles = await StudentProfile.find({ userId: { $in: userIds } }).select("userId institutionLink").lean();
    const profileByUserId = new Map(profiles.map((profile) => [String(profile.userId), profile]));
    return res.status(200).json(
      applications.map((application) => ({
        ...application.toObject(),
        studentDetails: profileByUserId.get(String(application.applicantUserId?._id))?.institutionLink || null,
      }))
    );
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

async function decideStudentRequest(req, res) {
  try {
    const { decision, note } = req.body;
    if (!["Verified", "Rejected"].includes(decision)) {
      return res.status(400).json({ message: "decision must be Verified or Rejected" });
    }
    const application = await AffiliationApplication.findOne({
      applicantUserId: req.params.userId,
      affiliationType: "institution",
      affiliationId: req.params.id,
      status: "pending",
    });
    if (!application) return res.status(404).json({ message: "Pending student request not found" });
    if (decision === "Rejected") {
      application.status = "rejected";
      application.reviewedAt = new Date();
      application.approvals.push({ approverUserId: req.user.id, decision: "rejected", comments: note });
      await application.save();
      await StudentProfile.findOneAndUpdate(
        { userId: application.applicantUserId },
        { $set: { "institutionLink.status": "Rejected", "institutionLink.verificationNote": note } },
        { runValidators: true }
      );
      return res.status(200).json(application);
    }
    const membershipId = new mongoose.Types.ObjectId();
    application.status = "approved";
    application.reviewedAt = new Date();
    application.completedAt = new Date();
    application.membershipId = membershipId;
    application.approvals.push({ approverUserId: req.user.id, decision: "approved", comments: note });
    await application.save();
    const membership = await InstitutionMembership.create({
      _id: membershipId,
      userId: application.applicantUserId,
      institutionId: application.affiliationId,
      applicationId: application._id,
      approvedByUserId: req.user.id,
      approvedAt: new Date(),
    });
    await StudentProfile.findOneAndUpdate(
      { userId: application.applicantUserId },
      { $set: { "institutionLink.status": "Linked", "institutionLink.verificationNote": note } },
      { runValidators: true }
    );
    return res.status(200).json(membership);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

async function inviteProfessional(req, res) {
  try {
    const institution = await Institution.findById(req.params.id);
    if (!institution || !institution.isVerified || !institution.isActive) {
      return res.status(403).json({ message: "Institution must be Verified before inviting" });
    }

    const { email, role } = req.body;
    if (!["Faculty", "TPO"].includes(role)) {
      return res.status(400).json({ message: "role must be Faculty or TPO" });
    }

    const user = await User.findOne({ email, accountType: "individual" });
    const professionalProfile = user ? await ProfessionalProfile.findOne({ userId: user._id }).select("_id") : null;
    if (!user || !professionalProfile) {
      return res.status(404).json({ message: "No Professional account found for that email yet" });
    }

    const invite = await AffiliationInvite.create({
      inviterUserId: institution.userId,
      inviteeUserId: user._id,
      affiliationType: "institution",
      affiliationId: institution._id,
      message: `Institution role: ${role}`,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });
    return res.status(201).json(invite);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

async function listLinkedProfessionals(req, res) {
  try {
    const role = req.query.role;
    const studentProfiles = await StudentProfile.find().select("userId").lean();
    const studentUserIds = studentProfiles.map((profile) => profile.userId);
    const professionalQuery = { userId: { $nin: studentUserIds } };
    if (["Faculty", "TPO"].includes(role)) professionalQuery.role = role;
    const professionalProfiles = await ProfessionalProfile.find(professionalQuery).select("userId").lean();
    const professionals = await InstitutionMembership.find({
      institutionId: req.params.id,
      status: "active",
      userId: { $in: professionalProfiles.map((profile) => profile.userId) },
    })
      .populate("userId", "name email")
      .populate("institutionId", "name code isVerified");
    return res.status(200).json(professionals);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

module.exports = {
  getInstitution,
  listVerified,
  listPending,
  verifyInstitution,
  linkStudents,
  listStudentRequests,
  decideStudentRequest,
  inviteProfessional,
  listLinkedProfessionals,
};

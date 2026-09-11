const Organisation = require("../models/Organisation");
const ProfessionalProfile = require("../models/ProfessionalProfile");
const OrganisationMembership = require("../models/OrganisationMembership");
const AffiliationInvite = require("../models/AffiliationInvite");
const User = require("../models/User");
const StudentProfile = require("../models/StudentProfile");
const SkillProfile = require("../models/SkillProfile");

async function getOrganisation(req, res) {
  try {
    const org = await Organisation.findById(req.params.id);
    if (!org) return res.status(404).json({ message: "Organisation not found" });
    return res.status(200).json(org);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

async function listPending(req, res) {
  try {
    const list = await Organisation.find({ isVerified: false, isActive: true });
    return res.status(200).json(list);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

async function listCandidates(req, res) {
  try {
    const organisation = await Organisation.findOne({ userId: req.user.id, isVerified: true, isActive: true });
    if (!organisation) return res.status(403).json({ message: "Verified organisation account required" });
    const query = String(req.query.q || "").trim().toLowerCase();
    const profiles = await StudentProfile.find({ isActive: true }).populate("userId", "name email").lean();
    const skillProfiles = await SkillProfile.find({ studentId: { $in: profiles.map((profile) => profile._id) } })
      .populate("skills.skillId", "name aliases")
      .lean();
    const skillsByStudent = new Map(skillProfiles.map((profile) => [String(profile.studentId), profile.skills || []]));
    const candidates = profiles.map((profile) => ({
      userId: profile.userId?._id,
      name: profile.userId?.name,
      email: profile.userId?.email,
      bio: profile.bio,
      institutionLink: profile.institutionLink,
      skills: skillsByStudent.get(String(profile._id)) || [],
    })).filter((candidate) => {
      if (!query) return true;
      const skillText = candidate.skills.map((skill) => `${skill.skillId?.name || ""} ${(skill.skillId?.aliases || []).join(" ")}`).join(" ");
      return `${candidate.name || ""} ${candidate.email || ""} ${candidate.bio || ""} ${skillText}`.toLowerCase().includes(query);
    });
    return res.status(200).json(candidates);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

async function verifyOrganisation(req, res) {
  try {
    const { decision, note } = req.body;
    if (!["Verified", "Rejected"].includes(decision)) {
      return res.status(400).json({ message: "decision must be Verified or Rejected" });
    }
    const org = await Organisation.findByIdAndUpdate(req.params.id, { isVerified: decision === "Verified" }, { new: true });
    if (!org) return res.status(404).json({ message: "Organisation not found" });

    if (decision === "Verified") {
      await User.findByIdAndUpdate(org.userId, { onboardingStatus: "in_progress" });
    }
    return res.status(200).json(org);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

async function inviteEmployee(req, res) {
  try {
    const org = await Organisation.findById(req.params.id);
    if (!org || !org.isVerified || !org.isActive) {
      return res.status(403).json({ message: "Organisation must be Verified before inviting" });
    }

    const { email } = req.body;
    const user = await User.findOne({ email, accountType: "Professional" });
    if (!user) {
      return res.status(404).json({ message: "No Professional account found for that email yet" });
    }

    const invite = await AffiliationInvite.create({
      inviterUserId: org.userId,
      inviteeUserId: user._id,
      affiliationType: "organisation",
      affiliationId: org._id,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });
    return res.status(201).json(invite);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

module.exports = { getOrganisation, listPending, listCandidates, verifyOrganisation, inviteEmployee };

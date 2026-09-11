const mongoose = require("mongoose");
const OrganisationMembership = require("../models/OrganisationMembership");
const InstitutionMembership = require("../models/InstitutionMembership");
const AffiliationInvite = require("../models/AffiliationInvite");
const AffiliationApplication = require("../models/AffiliationApplication");
const Organisation = require("../models/Organisation");
const ProfessionalProfile = require("../models/ProfessionalProfile");

async function listForUser(req, res) {
  try {
    if (String(req.user.id) !== String(req.params.userId)) return res.status(403).json({ message: "You can only view your own memberships" });
    const [memberships, invites] = await Promise.all([
      OrganisationMembership.find({ userId: req.params.userId }).populate("organisationId", "name code isVerified"),
      AffiliationInvite.find({ inviteeUserId: req.params.userId, status: "pending" }).populate("affiliationId", "name code isVerified"),
    ]);
    return res.status(200).json([...memberships, ...invites]);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

async function acceptInvite(req, res) {
  try {
    const invite = await AffiliationInvite.findOne({ _id: req.params.id, inviteeUserId: req.user.id, status: "pending" });
    if (!invite) return res.status(404).json({ message: "Invite not found" });
    const membershipId = new mongoose.Types.ObjectId();
    const application = await AffiliationApplication.create({
      applicantUserId: req.user.id,
      affiliationType: "organisation",
      affiliationId: invite.affiliationId,
      status: "approved",
      approvals: [{ approverUserId: invite.inviterUserId, decision: "approved" }],
      membershipId,
      reviewedAt: new Date(),
      completedAt: new Date(),
    });
    let membership;
    if (invite.affiliationType === "institution") {
      membership = await InstitutionMembership.create({
        _id: membershipId,
        userId: req.user.id,
        institutionId: invite.affiliationId,
        applicationId: application._id,
        approvedByUserId: invite.inviterUserId,
        approvedAt: new Date(),
      });
    } else {
      membership = await OrganisationMembership.create({
        _id: membershipId,
        userId: req.user.id,
        organisationId: invite.affiliationId,
        applicationId: application._id,
        approvedByUserId: invite.inviterUserId,
        approvedAt: new Date(),
      });
    }
    invite.status = "accepted";
    invite.respondedAt = new Date();
    invite.membershipId = membership._id;
    await invite.save();
    await ProfessionalProfile.findOneAndUpdate(
      { userId: req.user.id },
      { $set: { role: invite.message?.replace("Institution role: ", "") || "Employee", linkedEntityType: invite.affiliationType, linkedEntityId: invite.affiliationId, linkStatus: "Linked" } },
      { runValidators: true }
    );
    return res.status(200).json(membership);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

async function declineInvite(req, res) {
  try {
    const invite = await AffiliationInvite.findOneAndUpdate(
      { _id: req.params.id, inviteeUserId: req.user.id, status: "pending" },
      { status: "rejected", respondedAt: new Date() },
      { new: true, runValidators: true }
    );
    if (!invite) return res.status(404).json({ message: "Invite not found" });
    return res.status(200).json(invite);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

module.exports = { listForUser, acceptInvite, declineInvite };

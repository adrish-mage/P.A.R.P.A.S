const crypto = require("crypto");
const Verification = require("../models/Verification");
const VerificationRequest = require("../models/VerificationRequest");
const StudentProfile = require("../models/StudentProfile");
const ProfessionalProfile = require("../models/ProfessionalProfile");
const Institution = require("../models/Institution");
const Organisation = require("../models/Organisation");

const ENTRY_MODELS = {
  Project: require("../models/Project"),
  SkillEvidence: require("../models/SkillEvidence"),
};

function createAnonymousRequestId() {
  const secret = process.env.VERIFICATION_SECRET || process.env.JWT_SECRET;
  if (!secret) throw Object.assign(new Error("VERIFICATION_SECRET must be configured"), { status: 500 });
  return crypto.createHmac("sha256", secret).update(crypto.randomBytes(32)).digest("hex");
}

async function requestVerification({ entryType, targetType, entryId, targetId, verifierUserId, verificationLevel = "faculty", message, studentUserId }) {
  const Model = ENTRY_MODELS[entryType] || ENTRY_MODELS[targetType === "skill_evidence" ? "SkillEvidence" : "Project"];
  const resolvedTargetType = targetType || (entryType === "SkillEvidence" ? "skill_evidence" : "project");
  const resolvedTargetId = targetId || entryId;
  const resolvedVerifierId = verifierUserId;
  if (!Model) {
    const err = new Error(`Unknown verification target: ${entryType || targetType}`);
    err.status = 400;
    throw err;
  }

  const student = await StudentProfile.findOne({ userId: studentUserId }).select("_id");
  const entry = await Model.findOne({ _id: resolvedTargetId, studentId: student?._id });
  if (!entry) {
    const err = new Error("Entry not found for this student");
    err.status = 404;
    throw err;
  }
  if (!resolvedVerifierId) throw Object.assign(new Error("verifierUserId is required"), { status: 400 });
  const existingRequest = await VerificationRequest.findOne({
    studentId: student._id,
    targetType: resolvedTargetType,
    targetId: entry._id,
    verifierUserId: resolvedVerifierId,
    status: { $in: ["pending", "processing", "completed"] },
  });
  if (existingRequest) return existingRequest;
  return VerificationRequest.create({
    studentId: student._id,
    targetType: resolvedTargetType,
    targetId: entry._id,
    verifierUserId: resolvedVerifierId,
    anonymousRequestId: createAnonymousRequestId(),
    verificationLevel,
    message,
  });
}

async function decideVerification({ targetType, targetId, anonymousRequestId, verifierUserId, action, reason, verificationScore, verifierMembershipId, verifierRoleAssignmentId }) {
  const resolvedTargetType = targetType || "project";
  const request = await VerificationRequest.findOne({
    ...(anonymousRequestId ? { anonymousRequestId } : { targetType: resolvedTargetType, targetId }),
    verifierUserId,
    status: { $in: ["pending", "processing"] },
  });
  if (!request) {
    const err = new Error("Verification request not found");
    err.status = 404;
    throw err;
  }
  const isApproved = action === "Endorsed" || action === "verified" || action === "approve";
  if (!isApproved && action !== "Rejected" && action !== "rejected") {
    const err = new Error('action must be "Endorsed" or "Rejected"');
    err.status = 400;
    throw err;
  }
  const existingRecord = await Verification.findOne({ requestId: request._id });
  if (existingRecord) {
    if (request.status !== "completed" && request.status !== "rejected") {
      request.status = existingRecord.status === "verified" ? "completed" : "rejected";
      request.respondedAt = request.respondedAt || new Date();
      request.verificationId = existingRecord._id;
      await request.save();
    }
    return {
      request: { _id: request._id, status: request.status },
      record: { _id: existingRecord._id, targetType: existingRecord.targetType, targetId: existingRecord.targetId, status: existingRecord.status, comments: existingRecord.comments },
    };
  }
  const record = await Verification.create({
    requestId: request._id,
    targetType: request.targetType,
    targetId: request.targetId,
    studentId: request.studentId,
    verifierUserId: request.verifierUserId,
    verificationLevel: request.verificationLevel,
    status: isApproved ? "verified" : "rejected",
    verificationScore: isApproved ? verificationScore : undefined,
    comments: isApproved ? reason : (reason || "Verification rejected"),
    verifiedAt: isApproved ? new Date() : undefined,
    verifierMembershipId: isApproved ? (verifierMembershipId || request._id) : undefined,
    verifierRoleAssignmentId: isApproved ? (verifierRoleAssignmentId || request._id) : undefined,
  });
  if (isApproved) {
    request.status = "processing";
    await request.save();
  }
  request.status = isApproved ? "completed" : "rejected";
  request.respondedAt = new Date();
  request.verificationId = record._id;
  await request.save();
  return {
    request: { _id: request._id, status: request.status },
    record: { _id: record._id, targetType: record.targetType, targetId: record.targetId, status: record.status, comments: record.comments },
  };
}

module.exports = { requestVerification, decideVerification, ENTRY_MODELS };

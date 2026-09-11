const { requestVerification, decideVerification } = require("../services/verificationService");
const Verification = require("../models/Verification");
const VerificationRequest = require("../models/VerificationRequest");
const StudentProfile = require("../models/StudentProfile");
const { ENTRY_MODELS } = require("../services/verificationService");

async function postRequest(req, res) {
  try {
    const entry = await requestVerification({ ...req.body, verifierUserId: req.body.verifierUserId, studentUserId: req.user.id });
    return res.status(200).json(entry);
  } catch (err) {
    return res.status(err.status || 500).json({ message: err.message });
  }
}

async function postDecision(req, res) {
  try {
    const result = await decideVerification({ ...req.body, verifierUserId: req.user.id });
    return res.status(200).json(result);
  } catch (err) {
    return res.status(err.status || 500).json({ message: err.message });
  }
}

async function getAuditTrail(req, res) {
  try {
    const targetType = req.params.entryType === "SkillEvidence" ? "skill_evidence" : "project";
    const student = await StudentProfile.findOne({ userId: req.user.id }).select("_id");
    const Model = targetType === "skill_evidence" ? ENTRY_MODELS.SkillEvidence : ENTRY_MODELS.Project;
    const ownsTarget = await Model.exists({ _id: req.params.entryId, studentId: student?._id });
    if (!ownsTarget) return res.status(403).json({ message: "You can only view your own verification audit" });
    const [records, pendingRequests] = await Promise.all([
      Verification.find({ targetType, targetId: req.params.entryId })
      .populate("verifierUserId", "name email")
      .sort({ createdAt: 1 }),
      VerificationRequest.find({ studentId: student._id, targetType, targetId: req.params.entryId, status: { $in: ["pending", "processing"] } })
        .populate("verifierUserId", "name email")
        .sort({ createdAt: 1 }),
    ]);
    const existingRequestIds = new Set(records.map((record) => String(record.requestId)));
    const activeRequests = pendingRequests
      .filter((request) => !existingRequestIds.has(String(request._id)))
      .map((request) => ({
        _id: request._id,
        status: request.status,
        verifierUserId: request.verifierUserId,
        requestId: request._id,
      }));
    return res.status(200).json([...records, ...activeRequests]);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

async function getInbox(req, res) {
  try {
    if (String(req.user.id) !== String(req.params.endorserId)) return res.status(403).json({ message: "You can only view your own verification inbox" });
    const inbox = await VerificationRequest.find({ verifierUserId: req.user.id, status: { $in: ["pending", "processing"] } }).sort({ createdAt: -1 });
    const anonymousRequests = await Promise.all(inbox.map(async (request) => {
      const Model = request.targetType === "skill_evidence" ? ENTRY_MODELS.SkillEvidence : ENTRY_MODELS.Project;
      const target = await Model.findById(request.targetId).select("-studentId").lean();
      return {
      _id: request._id,
      requestToken: request.anonymousRequestId,
      targetType: request.targetType,
      targetId: request.targetId,
      message: request.message,
      status: request.status,
      createdAt: request.createdAt,
      target,
      };
    }));
    return res.status(200).json(anonymousRequests);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

module.exports = { postRequest, postDecision, getAuditTrail, getInbox };

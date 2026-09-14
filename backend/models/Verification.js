const mongoose = require("mongoose");

const verificationSchema = new mongoose.Schema(
  {
    requestId: { type: mongoose.Schema.Types.ObjectId, ref: "VerificationRequest", required: true, immutable: true },
    targetType: { type: String, enum: ["skill_evidence", "project", "training"], required: true, immutable: true },
    targetId: { type: mongoose.Schema.Types.ObjectId, required: true, immutable: true },
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: "StudentProfile", required: true, immutable: true },
    verifierUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, immutable: true },
    verificationLevel: { type: String, enum: ["faculty", "institution", "organisation"], required: true, immutable: true },
    verifierMembershipId: { type: mongoose.Schema.Types.ObjectId, immutable: true },
    verifierRoleAssignmentId: { type: mongoose.Schema.Types.ObjectId, immutable: true },
    status: { type: String, enum: ["pending", "verified", "rejected"], required: true, default: "pending" },
    verificationScore: { type: Number, min: 1, max: 10 },
    comments: { type: String, trim: true, maxlength: 2000 },
    verifiedAt: Date,
  },
  { timestamps: true, strict: "throw" }
);
verificationSchema.index({ targetType: 1, targetId: 1, verifierUserId: 1, createdAt: -1 });
verificationSchema.index({ studentId: 1, targetType: 1, targetId: 1, status: 1 });
verificationSchema.index({ verifierUserId: 1, status: 1, createdAt: -1 });
verificationSchema.index({ requestId: 1 }, { unique: true });
verificationSchema.pre("validate", function (next) {
  if (this.status === "verified" && !this.verifiedAt) return next(new Error("verified verification requires verifiedAt"));
  if (this.status !== "verified" && this.verifiedAt) return next(new Error("verifiedAt is only allowed for verified verification"));
  if (this.status !== "verified" && this.verificationScore != null) return next(new Error("verificationScore is only allowed for verified verification"));
  if (this.status === "verified" && !this.verifierMembershipId) return next(new Error("verified verification requires verifierMembershipId"));
  if (this.status === "verified" && !this.verifierRoleAssignmentId) return next(new Error("verified verification requires verifierRoleAssignmentId"));
  if (this.status === "rejected" && !this.comments) return next(new Error("rejected verification requires comments"));
  next();
});
verificationSchema.statics.allowedTransitions = {
  pending: ["verified", "rejected"],
  verified: [],
  rejected: [],
};
verificationSchema.statics.canTransition = function (from, to) {
  return this.allowedTransitions[from]?.includes(to) || false;
};
verificationSchema.pre(["findOneAndUpdate", "updateOne"], async function (next) {
  const update = this.getUpdate() || {};
  const nextStatus = update.status ?? update.$set?.status;
  if (!nextStatus) return next();
  const current = await this.model.findOne(this.getQuery()).select("status").lean();
  if (!current || current.status === nextStatus) return next();
  if (!this.model.canTransition(current.status, nextStatus)) {
    return next(new Error(`invalid verification transition: ${current.status} -> ${nextStatus}`));
  }
  next();
});
module.exports = mongoose.model("Verification", verificationSchema);

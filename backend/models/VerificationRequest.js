const mongoose = require("mongoose");

const verificationRequestSchema = new mongoose.Schema(
  {
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: "StudentProfile", required: true, immutable: true },
    targetType: { type: String, enum: ["skill_evidence", "project"], required: true, immutable: true },
    targetId: { type: mongoose.Schema.Types.ObjectId, required: true, immutable: true },
    verifierUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, immutable: true },
    anonymousRequestId: { type: String, required: true, unique: true, immutable: true },
    verificationLevel: { type: String, enum: ["faculty", "institution", "organisation"], required: true, immutable: true },
    status: { type: String, enum: ["pending", "processing", "completed", "rejected"], default: "pending" },
    message: { type: String, trim: true, maxlength: 2000 },
    respondedAt: Date,
    verificationId: { type: mongoose.Schema.Types.ObjectId, ref: "Verification" },
  },
  { timestamps: true, strict: "throw" }
);
verificationRequestSchema.index(
  { studentId: 1, targetType: 1, targetId: 1, verifierUserId: 1 },
  { unique: true, partialFilterExpression: { status: { $in: ["pending", "processing", "completed"] } } }
);
verificationRequestSchema.index({ studentId: 1, targetType: 1, targetId: 1, status: 1 });
verificationRequestSchema.index({ verifierUserId: 1, status: 1, createdAt: -1 });
verificationRequestSchema.pre("validate", function (next) {
  if (["pending", "processing"].includes(this.status) && (this.respondedAt || this.verificationId)) {
    return next(new Error("active verification request cannot have respondedAt or verificationId"));
  }
  if (["completed", "rejected"].includes(this.status) && !this.respondedAt) {
    return next(new Error(`${this.status} verification request requires respondedAt`));
  }
  if (this.status === "completed" && !this.verificationId) {
    return next(new Error("completed verification request requires verificationId"));
  }
  if (this.status !== "completed" && this.verificationId) {
    return next(new Error("verificationId is only allowed for completed requests"));
  }
  next();
});
verificationRequestSchema.statics.allowedTransitions = {
  pending: ["processing", "rejected"],
  processing: ["completed", "rejected"],
  completed: [],
  rejected: [],
};
verificationRequestSchema.statics.canTransition = function (from, to) {
  return this.allowedTransitions[from]?.includes(to) || false;
};
verificationRequestSchema.pre(["findOneAndUpdate", "updateOne"], async function (next) {
  const update = this.getUpdate() || {};
  const nextStatus = update.status ?? update.$set?.status;
  if (!nextStatus) return next();
  const current = await this.model.findOne(this.getQuery()).select("status").lean();
  if (!current || current.status === nextStatus) return next();
  if (!this.model.canTransition(current.status, nextStatus)) {
    return next(new Error(`invalid verification request transition: ${current.status} -> ${nextStatus}`));
  }
  next();
});
module.exports = mongoose.model("VerificationRequest", verificationRequestSchema);

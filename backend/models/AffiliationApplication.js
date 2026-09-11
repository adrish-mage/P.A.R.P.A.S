const mongoose = require("mongoose");

const approvalSchema = new mongoose.Schema(
  {
    approverUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    decision: {
      type: String,
      enum: ["approved", "rejected"],
      required: true,
    },
    comments: {
      type: String,
      trim: true,
      maxlength: 2000,
    },
    decidedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
);
const affiliationApplicationSchema = new mongoose.Schema(
  {
    applicantUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      immutable: true,
    },
    affiliationType: {
      type: String,
      enum: ["institution", "organisation"],
      required: true,
      immutable: true,
    },
    affiliationId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      immutable: true,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "withdrawn"],
      default: "pending",
    },
    approvals: {
      type: [approvalSchema],
      default: [],
    },
    membershipId: {
      type: mongoose.Schema.Types.ObjectId,
    },
    reviewedAt: Date,
    completedAt: Date,
  },
  { timestamps: true, strict: "throw" }
);
affiliationApplicationSchema.index(
  { applicantUserId: 1, affiliationType: 1, affiliationId: 1 },
  { unique: true, partialFilterExpression: { status: "pending" } }
);
affiliationApplicationSchema.index({ affiliationType: 1, affiliationId: 1, status: 1 });
affiliationApplicationSchema.index({ applicantUserId: 1, status: 1, createdAt: -1 });
affiliationApplicationSchema.pre("validate", function (next) {
  if (this.status === "pending" && this.membershipId) {
    return next(new Error("pending affiliation application cannot have membershipId"));
  }
  if (this.status === "approved" && !this.membershipId) {
    return next(new Error("approved affiliation application requires membershipId"));
  }
  if (this.status === "pending" && (this.reviewedAt || this.completedAt)) {
    return next(new Error("pending affiliation application cannot have review/completion timestamps"));
  }
  if (this.status === "rejected" && !this.reviewedAt) {
    return next(new Error("rejected affiliation application requires reviewedAt"));
  }
  if (this.status === "withdrawn" && !this.reviewedAt) {
    return next(new Error("withdrawn affiliation application requires reviewedAt"));
  }
  if (this.status === "approved" && !this.reviewedAt) {
    return next(new Error("approved affiliation application requires reviewedAt"));
  }
  if (this.status === "approved" && !this.completedAt) {
    return next(new Error("approved affiliation application requires completedAt"));
  }
  const approvers = new Set();
  let hasApprovedDecision = false;
  let hasRejectedDecision = false;
  for (const approval of this.approvals) {
    const key = String(approval.approverUserId);
    if (approvers.has(key)) {
      return next(new Error("an affiliation application cannot contain multiple decisions by the same approver"));
    }
    approvers.add(key);
    hasApprovedDecision ||= approval.decision === "approved";
    hasRejectedDecision ||= approval.decision === "rejected";
  }
  if (this.status === "approved" && !hasApprovedDecision) {
    return next(new Error("approved affiliation application requires at least one approved decision"));
  }
  if (this.status === "rejected" && !hasRejectedDecision) {
    return next(new Error("rejected affiliation application requires at least one rejected decision"));
  }
  next();
});
affiliationApplicationSchema.statics.allowedTransitions = {
  pending: ["approved", "rejected", "withdrawn"],
  approved: [],
  rejected: [],
  withdrawn: [],
};
affiliationApplicationSchema.statics.canTransition = function (from, to) {
  return this.allowedTransitions[from]?.includes(to) || false;
};
affiliationApplicationSchema.pre(["findOneAndUpdate", "updateOne"], async function (next) {
  const update = this.getUpdate() || {};
  const nextStatus = update.status ?? update.$set?.status;
  if (!nextStatus) return next();
  const current = await this.model.findOne(this.getQuery()).select("status").lean();
  if (!current || current.status === nextStatus) return next();
  if (!this.model.canTransition(current.status, nextStatus)) {
    return next(new Error(`invalid affiliation application transition: ${current.status} -> ${nextStatus}`));
  }
  next();
});
module.exports = mongoose.model("AffiliationApplication", affiliationApplicationSchema);

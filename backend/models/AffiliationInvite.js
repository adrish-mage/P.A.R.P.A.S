const mongoose = require("mongoose");

const affiliationInviteSchema = new mongoose.Schema(
  {
    inviterUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      immutable: true,
    },
    inviteeUserId: {
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
      enum: ["pending", "accepted", "rejected", "expired"],
      default: "pending",
    },
    message: {
      type: String,
      trim: true,
      maxlength: 2000,
    },
    expiresAt: {
      type: Date,
      required: true,
      immutable: true,
    },
    respondedAt: Date,
    membershipId: {
      type: mongoose.Schema.Types.ObjectId,
    },
  },
  { timestamps: true, strict: "throw" }
);
affiliationInviteSchema.index(
  { inviteeUserId: 1, affiliationType: 1, affiliationId: 1 },
  {
    unique: true,
    partialFilterExpression: { status: { $in: ["pending", "accepted"] } },
  }
);
affiliationInviteSchema.index({ inviteeUserId: 1, status: 1, createdAt: -1 });
affiliationInviteSchema.index({ affiliationType: 1, affiliationId: 1, status: 1 });
affiliationInviteSchema.index({ expiresAt: 1, status: 1 });
affiliationInviteSchema.pre("validate", function (next) {
  if (this.inviterUserId && this.inviteeUserId && String(this.inviterUserId) === String(this.inviteeUserId)) {
    return next(new Error("users cannot invite themselves to an affiliation"));
  }
  if (this.expiresAt && this.createdAt && this.expiresAt <= this.createdAt) {
    return next(new Error("expiresAt must be after createdAt"));
  }
  if (this.status === "pending") {
    if (this.expiresAt <= new Date()) {
      return next(new Error("pending invite must have an expiration time in the future"));
    }
    if (this.respondedAt || this.membershipId) {
      return next(new Error("pending invite cannot have respondedAt or membershipId"));
    }
  } else if (["accepted", "rejected"].includes(this.status)) {
    if (!this.respondedAt) {
      return next(new Error(`${this.status} invite requires respondedAt`));
    }
  }
  if (this.status === "accepted" && !this.membershipId) {
    return next(new Error("accepted invite requires membershipId"));
  }
  if (this.status !== "accepted" && this.membershipId) {
    return next(new Error("membershipId is only allowed for accepted invites"));
  }
  if (this.status === "expired" && this.respondedAt) {
    return next(new Error("expired invite should not have respondedAt"));
  }
  next();
});
affiliationInviteSchema.statics.allowedTransitions = {
  pending: ["accepted", "rejected", "expired"],
  accepted: [],
  rejected: [],
  expired: [],
};
affiliationInviteSchema.statics.canTransition = function (from, to) {
  return this.allowedTransitions[from]?.includes(to) || false;
};
affiliationInviteSchema.pre(["findOneAndUpdate", "updateOne"], async function (next) {
  const update = this.getUpdate() || {};
  const nextStatus = update.status ?? update.$set?.status;
  if (!nextStatus) return next();
  const current = await this.model.findOne(this.getQuery()).select("status").lean();
  if (!current || current.status === nextStatus) return next();
  if (!this.model.canTransition(current.status, nextStatus)) {
    return next(new Error(`invalid affiliation invite transition: ${current.status} -> ${nextStatus}`));
  }
  next();
});
module.exports = mongoose.model("AffiliationInvite", affiliationInviteSchema);

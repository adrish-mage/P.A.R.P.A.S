const mongoose = require("mongoose");

const roleAssignmentSchema = new mongoose.Schema(
  {
    roleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Role",
      required: true,
    },
    assignedByUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    assignedAt: {
      type: Date,
      default: Date.now,
    },
    revokedByUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    revokedAt: Date,
  },
  { _id: true }
);

const organisationMembershipSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      immutable: true,
    },
    organisationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organisation",
      required: true,
      immutable: true,
    },
    applicationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AffiliationApplication",
      required: true,
      immutable: true,
    },
    roles: {
      type: [roleAssignmentSchema],
      default: [],
      validate: {
        validator: (roles) => {
          const activeRoleIds = roles
            .filter((role) => !role.revokedAt)
            .map((role) => String(role.roleId));
          return new Set(activeRoleIds).size === activeRoleIds.length;
        },
        message: "a membership cannot have duplicate active role assignments",
      },
    },
    designation: {
      type: String,
      trim: true,
      maxlength: 160,
    },
    department: {
      type: String,
      trim: true,
      maxlength: 160,
    },
    membershipType: {
      type: String,
      enum: ["employee", "contractor", "consultant", "intern", "other"],
      default: "employee",
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
    endedAt: Date,
    approvedByUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      immutable: true,
    },
    approvedAt: {
      type: Date,
      required: true,
      immutable: true,
    },
  },
  { timestamps: true, strict: "throw" }
);

organisationMembershipSchema.index({ applicationId: 1 }, { unique: true });
organisationMembershipSchema.index({ userId: 1, organisationId: 1 }, { unique: true });
organisationMembershipSchema.index({ organisationId: 1, status: 1 });
organisationMembershipSchema.pre("validate", function (next) {
  if (this.status === "active" && this.endedAt) {
    return next(new Error("active membership cannot have endedAt"));
  }
  if (this.status === "inactive" && !this.endedAt) {
    return next(new Error("inactive membership requires endedAt"));
  }
  if (this.endedAt && this.joinedAt && this.endedAt < this.joinedAt) {
    return next(new Error("endedAt cannot be before joinedAt"));
  }
  if (this.status === "inactive" && this.roles.some((role) => !role.revokedAt)) {
    return next(new Error("inactive membership cannot have active role assignments"));
  }
  for (const role of this.roles) {
    if (role.revokedAt && !role.revokedByUserId) {
      return next(new Error("revoked role assignment requires revokedByUserId"));
    }
    if (!role.revokedAt && role.revokedByUserId) {
      return next(new Error("revokedByUserId requires revokedAt"));
    }
    if (role.revokedAt && role.assignedAt && role.revokedAt < role.assignedAt) {
      return next(new Error("revokedAt cannot be before assignedAt"));
    }
  }
  next();
});
organisationMembershipSchema.statics.allowedTransitions = { active: ["inactive"], inactive: ["active"] };
organisationMembershipSchema.statics.canTransition = function (from, to) {
  return this.allowedTransitions[from]?.includes(to) || false;
};
organisationMembershipSchema.pre(["findOneAndUpdate", "updateOne"], async function (next) {
  const update = this.getUpdate() || {};
  const nextStatus = update.status ?? update.$set?.status;
  if (!nextStatus) return next();
  const current = await this.model.findOne(this.getQuery()).select("status").lean();
  if (!current || current.status === nextStatus) return next();
  if (!this.model.canTransition(current.status, nextStatus)) return next(new Error(`invalid membership transition: ${current.status} -> ${nextStatus}`));
  next();
});
module.exports = mongoose.model("OrganisationMembership", organisationMembershipSchema);

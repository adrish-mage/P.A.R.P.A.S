const mongoose = require("mongoose");

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const userSchema = new mongoose.Schema(
  {
    accountType: {
      type: String,
      enum: ["individual", "institution", "organisation"],
      required: true,
      immutable: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 120,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 254,
      match: EMAIL_REGEX,
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
    identityVerification: {
      status: {
        type: String,
        enum: ["not_started", "pending", "verified", "failed"],
        default: "not_started",
      },
      provider: {
        type: String,
        enum: ["digilocker", "other"],
        required: function () {
          return this.identityVerification?.status !== "not_started";
        },
      },
      verifiedAt: Date,
    },
    onboardingStatus: {
      type: String,
      enum: ["pending", "in_progress", "completed"],
      default: "pending",
    },
    onboardingCompletedAt: Date,
    isActive: {
      type: Boolean,
      default: true,
    },
    deactivatedAt: Date,
  },
  {
    timestamps: true,
    strict: "throw",
  }
);
userSchema.pre("validate", function (next) {
  const verification = this.identityVerification;
  if (verification?.status === "verified" && !verification.verifiedAt) {
    return next(new Error("verified identity verification requires verifiedAt"));
  }
  if (verification?.status !== "verified" && verification?.verifiedAt) {
    return next(new Error("verifiedAt is only allowed for verified identity verification"));
  }
  if (this.onboardingStatus === "completed" && !this.onboardingCompletedAt) {
    return next(new Error("completed onboarding requires onboardingCompletedAt"));
  }
  if (this.onboardingStatus !== "completed" && this.onboardingCompletedAt) {
    return next(new Error("onboardingCompletedAt is only allowed when onboarding is completed"));
  }
  if (!this.isActive && !this.deactivatedAt) return next(new Error("inactive user requires deactivatedAt"));
  if (this.isActive && this.deactivatedAt) return next(new Error("active user cannot have deactivatedAt"));
  next();
});
userSchema.statics.assertOnboardingReady = function (user) {
  if (user.accountType === "individual" && user.identityVerification?.status !== "verified") {
    throw new Error("individual onboarding cannot be completed before identity verification");
  }
};
module.exports = mongoose.model("User", userSchema);

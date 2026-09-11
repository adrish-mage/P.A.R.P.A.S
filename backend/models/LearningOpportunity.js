const mongoose = require("mongoose");

const URL_REGEX = /^https?:\/\/[^\s]+$/i;
const skillRequirementSchema = new mongoose.Schema(
  {
    skillId: { type: mongoose.Schema.Types.ObjectId, ref: "Skill", required: true },
    targetLevel: { type: Number, min: 1, max: 10 },
    required: { type: Boolean, default: true },
    weight: { type: Number, min: 0.0001, default: 1 },
  },
  { _id: false, strict: "throw" }
);
const learningOpportunitySchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, minlength: 1, maxlength: 250 },
    description: { type: String, trim: true, maxlength: 5000 },
    provider: {
      type: {
        type: String,
        enum: ["institution", "organisation", "external"],
        required: true,
      },
      id: {
        type: mongoose.Schema.Types.ObjectId,
        required: function () { return this.provider?.type !== "external"; },
      },
      externalProviderName: {
        type: String,
        trim: true,
        maxlength: 200,
        required: function () { return this.provider?.type === "external"; },
      },
    },
    type: {
      type: String,
      enum: ["course", "workshop", "certification", "bootcamp", "hands_on_training", "mentorship"],
      required: true,
    },
    skills: {
      type: [skillRequirementSchema],
      default: [],
      validate: { validator: (skills) => new Set(skills.map((s) => String(s.skillId))).size === skills.length, message: "a learning opportunity cannot map the same skill more than once" },
    },
    deliveryMode: { type: String, enum: ["online", "offline", "hybrid"] },
    startDate: Date,
    endDate: Date,
    registrationDeadline: Date,
    websiteUrl: {
      type: String, trim: true, maxlength: 2048,
      validate: { validator: (value) => !value || URL_REGEX.test(value), message: "websiteUrl must be a valid HTTP(S) URL" },
    },
    isActive: { type: Boolean, default: true },
    deactivatedAt: Date,
  },
  { timestamps: true, strict: "throw" }
);
learningOpportunitySchema.index({ "provider.type": 1, "provider.id": 1 });
learningOpportunitySchema.index({ isActive: 1, registrationDeadline: 1 });
learningOpportunitySchema.index({ "skills.skillId": 1, isActive: 1 });
learningOpportunitySchema.pre("validate", function (next) {
  if (this.provider?.type === "external" && this.provider.id) return next(new Error("external provider must not have provider.id"));
  if (this.provider?.type !== "external" && this.provider.externalProviderName) return next(new Error("internal provider must not have externalProviderName"));
  if (this.startDate && this.endDate && this.endDate < this.startDate) {
    return next(new Error("endDate cannot be before startDate"));
  }
  if (this.registrationDeadline && this.startDate && this.registrationDeadline > this.startDate) {
    return next(new Error("registrationDeadline cannot be after startDate"));
  }
  next();
});
learningOpportunitySchema.pre("validate", function (next) {
  if (!this.isActive && !this.deactivatedAt) return next(new Error("inactive opportunity requires deactivatedAt"));
  if (this.isActive && this.deactivatedAt) return next(new Error("active opportunity cannot have deactivatedAt"));
  next();
});
module.exports = mongoose.model("LearningOpportunity", learningOpportunitySchema);

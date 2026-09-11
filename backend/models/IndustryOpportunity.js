const mongoose = require("mongoose");

const requiredSkillSchema = new mongoose.Schema(
  {
    skillId: { type: mongoose.Schema.Types.ObjectId, ref: "Skill", required: true },
    minScore: { type: Number, min: 1, max: 10 },
    maxScore: { type: Number, min: 1, max: 10 },
    required: { type: Boolean, default: true },
    weight: { type: Number, min: 0.0001, default: 1 },
  },
  { _id: false, strict: "throw" }
);
const industryOpportunitySchema = new mongoose.Schema(
  {
    organisationId: { type: mongoose.Schema.Types.ObjectId, ref: "Organisation", required: true, immutable: true },
    title: { type: String, required: true, trim: true, minlength: 1, maxlength: 250 },
    description: { type: String, trim: true, maxlength: 5000 },
    type: { type: String, enum: ["internship", "job", "apprenticeship", "live_project", "challenge"], required: true },
    requiredSkills: {
      type: [requiredSkillSchema],
      default: [],
      validate: { validator: (skills) => new Set(skills.map((s) => String(s.skillId))).size === skills.length, message: "an industry opportunity cannot require the same skill more than once" },
    },
    location: { type: String, trim: true, maxlength: 250 },
    mode: { type: String, enum: ["remote", "onsite", "hybrid"] },
    startDate: Date,
    endDate: Date,
    applicationDeadline: Date,
    isActive: { type: Boolean, default: true },
    deactivatedAt: Date,
  },
  { timestamps: true, strict: "throw" }
);
industryOpportunitySchema.index({ organisationId: 1, isActive: 1, applicationDeadline: 1 });
industryOpportunitySchema.index({ "requiredSkills.skillId": 1, isActive: 1 });
industryOpportunitySchema.pre("validate", function (next) {
  for (const skill of this.requiredSkills) {
    if (skill.maxScore != null && skill.minScore != null && skill.maxScore < skill.minScore) {
      return next(new Error("maxScore cannot be less than minScore"));
    }
  }
  if (this.startDate && this.endDate && this.endDate < this.startDate) {
    return next(new Error("endDate cannot be before startDate"));
  }
  if (this.applicationDeadline && this.startDate && this.applicationDeadline > this.startDate) {
    return next(new Error("applicationDeadline cannot be after startDate"));
  }
  next();
});
industryOpportunitySchema.pre("validate", function (next) {
  if (!this.isActive && !this.deactivatedAt) return next(new Error("inactive opportunity requires deactivatedAt"));
  if (this.isActive && this.deactivatedAt) return next(new Error("active opportunity cannot have deactivatedAt"));
  next();
});
module.exports = mongoose.model("IndustryOpportunity", industryOpportunitySchema);

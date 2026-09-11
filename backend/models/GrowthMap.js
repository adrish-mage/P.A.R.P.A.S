const mongoose = require("mongoose");

const skillGapSchema = new mongoose.Schema(
  {
    skillId: { type: mongoose.Schema.Types.ObjectId, ref: "Skill", required: true },
    currentScore: { type: Number, min: 0, max: 10, required: true },
    targetScore: { type: Number, min: 0, max: 10, required: true },
    gap: { type: Number, min: 0, max: 10, required: true },
    priority: { type: String, enum: ["low", "medium", "high"], required: true },
  },
  { _id: false, strict: "throw" }
);
const targetSkillSchema = new mongoose.Schema(
  {
    skillId: { type: mongoose.Schema.Types.ObjectId, ref: "Skill", required: true },
    expectedImprovement: { type: Number, min: 0, max: 10, required: true },
  },
  { _id: false, strict: "throw" }
);
const recommendationSchema = new mongoose.Schema(
  {
    opportunityId: { type: mongoose.Schema.Types.ObjectId, ref: "LearningOpportunity", required: true },
    title: { type: String, required: true, trim: true, maxlength: 250 },
    reason: { type: String, trim: true, maxlength: 3000 },
    targetSkills: {
      type: [targetSkillSchema],
      default: [],
      validate: { validator: (skills) => new Set(skills.map((s) => String(s.skillId))).size === skills.length, message: "recommendation targetSkills must not contain duplicates" },
    },
    priority: { type: Number, min: 0, max: 100, required: true },
    status: { type: String, enum: ["recommended", "accepted", "in_progress", "completed", "dismissed", "expired"], default: "recommended" },
  },
  { _id: true, strict: "throw" }
);
const growthMapSchema = new mongoose.Schema(
  {
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: "StudentProfile", required: true, unique: true, immutable: true },
    target: {
      type: {
        type: String,
        enum: ["career_role", "skill_goal"],
        required: true,
      },
      roleId: { type: mongoose.Schema.Types.ObjectId, ref: "CareerRole" },
      roleName: { type: String, trim: true, maxlength: 200 },
      skillId: { type: mongoose.Schema.Types.ObjectId, ref: "Skill" },
    },
    skillGaps: {
      type: [skillGapSchema],
      default: [],
      validate: { validator: (gaps) => new Set(gaps.map((g) => String(g.skillId))).size === gaps.length, message: "growth map skillGaps must not contain duplicate skills" },
    },
    recommendations: {
      type: [recommendationSchema],
      default: [],
      validate: {
        validator: (recommendations) => {
          const opportunityIds = recommendations.map((r) => String(r.opportunityId));
          return new Set(opportunityIds).size === opportunityIds.length;
        },
        message: "a growth map cannot recommend the same learning opportunity more than once",
      },
    },
    generatedBy: { type: String, default: "python-predictive", immutable: true },
    generatedAt: { type: Date, required: true, default: Date.now },
    version: { type: Number, min: 1, default: 1 },
  },
  { timestamps: true, strict: "throw" }
);
growthMapSchema.index({ "skillGaps.skillId": 1 });
growthMapSchema.index({ "recommendations.opportunityId": 1 });
growthMapSchema.statics.allowedRecommendationTransitions = {
  recommended: ["accepted", "in_progress", "dismissed", "expired"],
  accepted: ["in_progress", "dismissed", "expired"],
  in_progress: ["completed", "dismissed"],
  completed: [],
  dismissed: ["accepted"],
  expired: [],
};
growthMapSchema.statics.canRecommendationTransition = function (from, to) {
  return this.allowedRecommendationTransitions[from]?.includes(to) || false;
};

growthMapSchema.pre("validate", function (next) {
  if (this.target?.type === "career_role") {
    if (!this.target.roleId || this.target.skillId || !this.target.roleName) {
      return next(new Error("career_role target requires roleId and roleName and must not have skillId"));
    }
  }
  if (this.target?.type === "skill_goal") {
    if (!this.target.skillId || this.target.roleId) {
      return next(new Error("skill_goal target requires skillId and must not have roleId"));
    }
  }
  for (const gap of this.skillGaps) {
    const calculatedGap = Math.max(0, gap.targetScore - gap.currentScore);
    if (Math.abs(calculatedGap - gap.gap) > 0.000001) {
      return next(new Error("skill gap must equal targetScore - currentScore, floored at 0"));
    }
  }
  next();
});
module.exports = mongoose.model("GrowthMap", growthMapSchema);

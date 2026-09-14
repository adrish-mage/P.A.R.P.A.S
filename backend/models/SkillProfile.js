const mongoose = require("mongoose");

const skillEntrySchema = new mongoose.Schema(
  {
    skillId: { type: mongoose.Schema.Types.ObjectId, ref: "Skill", required: true },
    score: { type: Number, min: 0, max: 10, default: 0 },
    source: { type: String, enum: ["self", "training", "project"], default: "self" },
    source: { type: String, enum: ["self", "training", "project"], default: "self" },
    confidence: { type: Number, min: 0, max: 100, default: 0 },
    evidenceCount: { type: Number, min: 0, default: 0 },
    verifiedEvidenceCount: { type: Number, min: 0, default: 0 },
    lastVerifiedAt: Date,
    lastUpdatedAt: { type: Date, default: Date.now },
  },
  { _id: false, strict: "throw" }
);
const skillProfileSchema = new mongoose.Schema(
  {
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: "StudentProfile", required: true, unique: true, immutable: true },
    skills: {
      type: [skillEntrySchema],
      default: [],
      validate: { validator: (skills) => new Set(skills.map((s) => String(s.skillId))).size === skills.length, message: "a skill profile cannot contain duplicate skills" },
    },
    version: { type: Number, min: 1, default: 1 },
  },
  { timestamps: true, strict: "throw" }
);
skillProfileSchema.pre("validate", function (next) {
  for (const skill of this.skills) {
    if (skill.verifiedEvidenceCount > skill.evidenceCount) {
      return next(new Error("verifiedEvidenceCount cannot exceed evidenceCount"));
    }
  }
  next();
});
module.exports = mongoose.model("SkillProfile", skillProfileSchema);

const mongoose = require("mongoose");

const skillEvidenceSchema = new mongoose.Schema(
  {
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: "StudentProfile", required: true, immutable: true },
    skillId: { type: mongoose.Schema.Types.ObjectId, ref: "Skill", required: true, immutable: true },
    source: {
      type: {
        type: String,
        enum: ["academic", "training", "project", "industry_experience"],
        required: true,
        immutable: true,
      },
      sourceId: { type: mongoose.Schema.Types.ObjectId, required: true, immutable: true },
    },
    title: { type: String, required: true, trim: true, minlength: 1, maxlength: 250 },
    description: { type: String, trim: true, maxlength: 3000 },
    evidenceUrl: { type: String, trim: true, maxlength: 2048 },
    assessment: {
      score: { type: Number, min: 1, max: 10 },
      details: mongoose.Schema.Types.Mixed,
    },
    achievedAt: Date,
    submittedByUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, immutable: true },
    notes: { type: String, trim: true, maxlength: 2000 },
  },
  { timestamps: true, strict: "throw" }
);

skillEvidenceSchema.index({ studentId: 1, skillId: 1, "source.type": 1, "source.sourceId": 1 }, { unique: true });
skillEvidenceSchema.index({ studentId: 1, skillId: 1 });
skillEvidenceSchema.index({ submittedByUserId: 1, createdAt: -1 });

module.exports = mongoose.model("SkillEvidence", skillEvidenceSchema);

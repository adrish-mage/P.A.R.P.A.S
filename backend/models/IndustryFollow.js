const mongoose = require("mongoose");

const industryFollowSchema = new mongoose.Schema(
  {
    organisationId: { type: mongoose.Schema.Types.ObjectId, ref: "Organisation", required: true, immutable: true },
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: "StudentProfile", required: true, immutable: true },
    skillsBeingWatched: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: "Skill" }],
      default: [],
      validate: { validator: (skills) => new Set(skills.map(String)).size === skills.length, message: "skillsBeingWatched must not contain duplicates" },
    },
    active: { type: Boolean, default: true },
    followedAt: { type: Date, default: Date.now, immutable: true },
  },
  { timestamps: true, strict: "throw" }
);
industryFollowSchema.index({ organisationId: 1, studentId: 1 }, { unique: true });
industryFollowSchema.index({ organisationId: 1, active: 1, updatedAt: -1 });
industryFollowSchema.index({ studentId: 1, active: 1 });
module.exports = mongoose.model("IndustryFollow", industryFollowSchema);

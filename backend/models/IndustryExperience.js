const mongoose = require("mongoose");

const skillRefSchema = new mongoose.Schema(
  { skillId: { type: mongoose.Schema.Types.ObjectId, ref: "Skill", required: true } },
  { _id: false, strict: "throw" }
);
const industryExperienceSchema = new mongoose.Schema(
  {
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: "StudentProfile", required: true, immutable: true },
    organisationId: { type: mongoose.Schema.Types.ObjectId, ref: "Organisation", required: true },
    type: { type: String, enum: ["internship", "work_experience"], required: true },
    role: { type: String, trim: true, maxlength: 200 },
    description: { type: String, trim: true, maxlength: 5000 },
    skills: {
      type: [skillRefSchema],
      default: [],
      validate: { validator: (skills) => new Set(skills.map((s) => String(s.skillId))).size === skills.length, message: "an industry experience cannot map the same skill more than once" },
    },
    startedAt: Date,
    endedAt: Date,
    supervisor: {
      name: { type: String, trim: true, maxlength: 160 },
      designation: { type: String, trim: true, maxlength: 160 },
    },
  },
  { timestamps: true, strict: "throw" }
);
industryExperienceSchema.index({ studentId: 1, organisationId: 1, startedAt: -1 });
industryExperienceSchema.index({ organisationId: 1, type: 1 });
industryExperienceSchema.pre("validate", function (next) {
  if (this.startedAt && this.endedAt && this.endedAt < this.startedAt) {
    return next(new Error("endedAt cannot be before startedAt"));
  }
  next();
});
module.exports = mongoose.model("IndustryExperience", industryExperienceSchema);

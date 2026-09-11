const mongoose = require("mongoose");

const targetSkillSchema = new mongoose.Schema(
  {
    skillId: { type: mongoose.Schema.Types.ObjectId, ref: "Skill", required: true },
    targetLevel: { type: Number, min: 1, max: 10, required: true },
    weight: { type: Number, min: 0.0001, default: 1 },
  },
  { _id: false, strict: "throw" }
);
const careerRoleSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 160 },
    code: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      minlength: 2,
      maxlength: 80,
      match: /^[a-z][a-z0-9_]*$/,
    },
    description: { type: String, trim: true, maxlength: 2000 },
    skills: {
      type: [targetSkillSchema],
      default: [],
      validate: {
        validator: (skills) => new Set(skills.map((skill) => String(skill.skillId))).size === skills.length,
        message: "a career role cannot map the same skill more than once",
      },
    },
    isActive: { type: Boolean, default: true },
    deactivatedAt: Date,
  },
  { timestamps: true, strict: "throw" }
);
careerRoleSchema.index({ isActive: 1, name: 1 });
careerRoleSchema.index({ "skills.skillId": 1, isActive: 1 });
careerRoleSchema.pre("validate", function (next) {
  if (!this.isActive && !this.deactivatedAt) return next(new Error("inactive record requires deactivatedAt"));
  if (this.isActive && this.deactivatedAt) return next(new Error("active record cannot have deactivatedAt"));
  next();
});

module.exports = mongoose.model("CareerRole", careerRoleSchema);

const mongoose = require("mongoose");
const URL_REGEX = /^https?:\/\/[^\s]+$/i;
const skillMappingSchema = new mongoose.Schema(
  { skillId: { type: mongoose.Schema.Types.ObjectId, ref: "Skill", required: true }, weight: { type: Number, min: 0.0001, default: 1 } },
  { _id: false, strict: "throw" }
);
const certificateSchema = new mongoose.Schema(
  {
    title: { type: String, trim: true, minlength: 2, maxlength: 250 },
    issuer: { type: String, trim: true, minlength: 2, maxlength: 200 },
    certificateUrl: { type: String, trim: true, maxlength: 2048, validate: { validator: (v) => !v || URL_REGEX.test(v), message: "certificateUrl must be a valid HTTP(S) URL" } },
    verificationUrl: { type: String, trim: true, maxlength: 2048, validate: { validator: (v) => !v || URL_REGEX.test(v), message: "verificationUrl must be a valid HTTP(S) URL" } },
    issuedAt: Date,
    hasAssessment: { type: Boolean, default: false },
    assessmentScore: { type: Number, min: 0, max: 100 },
  },
  { _id: false, strict: "throw" }
);
const trainingSchema = new mongoose.Schema(
  {
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: "StudentProfile", required: true, immutable: true },
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 250 },
    description: { type: String, required: true, trim: true, minlength: 10, maxlength: 5000 },
    provider: {
      type: { type: String, enum: ["institution", "organisation", "external"], required: true },
      id: { type: mongoose.Schema.Types.ObjectId, required: function () { return this.provider?.type !== "external"; } },
      externalProviderName: { type: String, trim: true, minlength: 2, maxlength: 200, required: function () { return this.provider?.type === "external"; } },
    },
    type: { type: String, enum: ["certification", "workshop", "bootcamp", "hands_on", "course", "other"], required: true },
    startedAt: { type: Date, required: true },
    completedAt: Date,
    skills: {
      type: [skillMappingSchema], default: [],
      validate: { validator: (skills) => new Set(skills.map((s) => String(s.skillId))).size === skills.length, message: "a training record cannot map the same skill more than once" },
    },
    certificate: certificateSchema,
  },
  { timestamps: true, strict: "throw" }
);
trainingSchema.index({ studentId: 1, completedAt: -1 });
trainingSchema.pre("validate", function (next) {
  if (this.completedAt && this.completedAt < this.startedAt) return next(new Error("completedAt cannot be before startedAt"));
  if (this.provider?.type === "external" && this.provider.id) return next(new Error("external provider must not have provider.id"));
  if (this.provider?.type !== "external" && this.provider.externalProviderName) return next(new Error("internal provider must not have externalProviderName"));
  if (this.certificate) {
    if (this.certificate.hasAssessment && this.certificate.assessmentScore == null) return next(new Error("certificate assessmentScore is required when hasAssessment is true"));
    if (!this.certificate.hasAssessment && this.certificate.assessmentScore != null) return next(new Error("assessmentScore requires hasAssessment to be true"));
    if (this.certificate.issuedAt && this.certificate.issuedAt < this.startedAt) return next(new Error("certificate.issuedAt cannot be before training startedAt"));
    if (this.completedAt && this.certificate.issuedAt && this.certificate.issuedAt > this.completedAt) return next(new Error("certificate.issuedAt cannot be after training completedAt"));
  }
  next();
});
module.exports = mongoose.model("Training", trainingSchema);

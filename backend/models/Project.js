const mongoose = require("mongoose");

const URL_REGEX = /^https?:\/\/[^\s]+$/i;
const skillRefSchema = new mongoose.Schema(
  { skillId: { type: mongoose.Schema.Types.ObjectId, ref: "Skill", required: true } },
  { _id: false, strict: "throw" }
);
const evidenceSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ["image", "video", "document", "link"], required: true },
    url: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2048,
      validate: { validator: (value) => URL_REGEX.test(value), message: "evidence.url must be a valid HTTP(S) URL" },
    },
    caption: { type: String, trim: true, maxlength: 500 },
  },
  { _id: true, strict: "throw" }
);
const projectSchema = new mongoose.Schema(
  {
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: "StudentProfile", required: true, immutable: true },
    title: { type: String, required: true, trim: true, minlength: 2, maxlength: 250 },
    description: { type: String, required: true, trim: true, minlength: 10, maxlength: 5000 },
    type: { type: String, enum: ["personal", "academic", "open_source", "industry"], required: true },
    organisationId: { type: mongoose.Schema.Types.ObjectId, ref: "Organisation" },
    repositoryUrl: { type: String, trim: true, maxlength: 2048, validate: { validator: (v) => !v || URL_REGEX.test(v), message: "repositoryUrl must be a valid HTTP(S) URL" } },
    liveUrl: { type: String, trim: true, maxlength: 2048, validate: { validator: (v) => !v || URL_REGEX.test(v), message: "liveUrl must be a valid HTTP(S) URL" } },
    skills: {
      type: [skillRefSchema],
      default: [],
      validate: { validator: (skills) => new Set(skills.map((s) => String(s.skillId))).size === skills.length, message: "a project cannot map the same skill more than once" },
    },
    evidence: {
      type: [evidenceSchema],
      default: [],
      validate: { validator: (evidence) => new Set(evidence.map((e) => e.url.toLowerCase())).size === evidence.length, message: "a project cannot contain duplicate evidence URLs" },
    },
    startedAt: Date,
    completedAt: Date,
  },
  { timestamps: true, strict: "throw" }
);
projectSchema.index({ studentId: 1, title: 1 }, { unique: true, collation: { locale: "en", strength: 2 } });
projectSchema.index({ studentId: 1, type: 1 });
projectSchema.index({ organisationId: 1, type: 1 });
projectSchema.pre("validate", function (next) {
  if (this.type === "industry" && !this.organisationId) return next(new Error("industry project requires organisationId"));
  if (this.type !== "industry" && this.organisationId) return next(new Error("only industry projects may have organisationId"));
  if (this.completedAt && this.startedAt && this.completedAt < this.startedAt) return next(new Error("completedAt cannot be before startedAt"));
  next();
});
module.exports = mongoose.model("Project", projectSchema);

const mongoose = require("mongoose");

const skillMappingSchema = new mongoose.Schema(
  {
    skillId: {type: mongoose.Schema.Types.ObjectId, ref: "Skill", required: true},
    weight: {type: Number, min: 0.0001, default: 1},
  },
  {_id: false, strict: "throw"}
);
const academicRecordSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "StudentProfile",
      required: true,
      immutable: true,
    },
    course: {
      name: {type: String, required: true, trim: true, minlength: 1, maxlength: 200},
      code: {type: String, trim: true, maxlength: 100},
      institutionId: {type: mongoose.Schema.Types.ObjectId, ref: "Institution"},
      type: {
        type: String,
        enum: ["college_course", "nptel", "external_course"],
        required: true,
      },
    },
    performance: {
      marks: { type: Number, min: 0 },
      maxMarks: { type: Number, min: 0.0001 },
      grade: { type: String, trim: true, maxlength: 20 },
    },
    skills: {
      type: [skillMappingSchema],
      default: [],
      validate: {
        validator: (skills) => new Set(skills.map((s) => String(s.skillId))).size === skills.length,
        message: "an academic record cannot map the same skill more than once",
      },
    },
    examDate: Date,
  },
  { timestamps: true, strict: "throw" }
);
academicRecordSchema.index({ studentId: 1, examDate: -1 });
academicRecordSchema.index({ studentId: 1, "course.type": 1 });
academicRecordSchema.pre("validate", function (next) {
  const p = this.performance;
  if ((p?.marks != null) !== (p?.maxMarks != null)) {
    return next(new Error("performance.marks and performance.maxMarks must be provided together"));
  }
  if (p?.marks != null && p?.maxMarks != null && p.marks > p.maxMarks) {
    return next(new Error("performance.marks cannot exceed performance.maxMarks"));
  }
  if (this.course.type === "college_course" && !this.course.institutionId) {
    return next(new Error("college_course requires course.institutionId"));
  }
  next();
});
module.exports = mongoose.model("AcademicRecord", academicRecordSchema);

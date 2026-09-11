const mongoose = require("mongoose");

const studentProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      immutable: true,
    },
    bio: {
      type: String,
      trim: true,
      maxlength: 2000,
    },
    profileVisibility: {
      type: String,
      enum: ["private", "institution", "recruiter", "public"],
      default: "institution",
    },
    institutionLink: {
      institutionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Institution",
      },
      status: {
        type: String,
        enum: ["Unlinked", "Pending", "Linked", "Rejected"],
        default: "Unlinked",
      },
      rollNo: { type: String, trim: true, maxlength: 100 },
      enrollmentId: { type: String, trim: true, maxlength: 100 },
      course: { type: String, trim: true, maxlength: 200 },
      admissionYear: { type: Number, min: 1900, max: 2200 },
      verificationNote: { type: String, trim: true, maxlength: 2000 },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    deactivatedAt: Date,
  },
  { timestamps: true, strict: "throw" }
);
studentProfileSchema.pre("validate", function (next) {
  if (!this.isActive && !this.deactivatedAt) return next(new Error("inactive record requires deactivatedAt"));
  if (this.isActive && this.deactivatedAt) return next(new Error("active record cannot have deactivatedAt"));
  next();
});
module.exports = mongoose.model("StudentProfile", studentProfileSchema);

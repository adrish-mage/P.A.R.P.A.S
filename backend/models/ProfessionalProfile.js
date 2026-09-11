const mongoose = require("mongoose");

const professionalProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      immutable: true,
    },
    headline: {
      type: String,
      trim: true,
      maxlength: 160,
    },
    bio: {
      type: String,
      trim: true,
      maxlength: 3000,
    },
    specialisation: {
      type: String,
      trim: true,
      maxlength: 160,
    },
    profileVisibility: {
      type: String,
      enum: ["private", "institution", "recruiter", "public"],
      default: "private",
    },
    role: {
      type: String,
      enum: ["Unassigned", "Faculty", "TPO", "Employee"],
      default: "Unassigned",
    },
    linkedEntityType: {
      type: String,
      enum: ["institution", "organisation"],
    },
    linkedEntityId: mongoose.Schema.Types.ObjectId,
    linkStatus: {
      type: String,
      enum: ["Unlinked", "Linked"],
      default: "Unlinked",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    deactivatedAt: Date,
  },
  { timestamps: true, strict: "throw" }
);

professionalProfileSchema.pre("validate", function (next) {
  if (!this.isActive && !this.deactivatedAt) return next(new Error("inactive record requires deactivatedAt"));
  if (this.isActive && this.deactivatedAt) return next(new Error("active record cannot have deactivatedAt"));
  next();
});
module.exports = mongoose.model("ProfessionalProfile", professionalProfileSchema);

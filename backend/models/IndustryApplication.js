const mongoose = require("mongoose");

const industryApplicationSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    industryOpportunityId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "IndustryOpportunity",
      required: true,
    },
    status: {
      type: String,
      enum: ["Applied", "UnderReview", "Shortlisted", "Rejected", "Accepted", "Withdrawn"],
      default: "Applied",
    },
    coverNote: { type: String },
    reviewedAt: { type: Date },
    reviewNote: { type: String },
  },
  { timestamps: true }
);

industryApplicationSchema.index({ studentId: 1, industryOpportunityId: 1 }, { unique: true });

module.exports = mongoose.model("IndustryApplication", industryApplicationSchema);

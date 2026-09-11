const mongoose = require("mongoose");
const learningEnrollmentSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: "StudentProfile", required: true, immutable: true },
  opportunityId: { type: mongoose.Schema.Types.ObjectId, ref: "LearningOpportunity", required: true, immutable: true },
  status: { type: String, enum: ["enrolled", "in_progress", "completed", "dropped", "cancelled"], default: "enrolled" },
  progress: { type: Number, min: 0, max: 100, default: 0 },
  startedAt: Date,
  completedAt: Date,
  completionVerified: { type: Boolean, default: false },
  completionVerifiedAt: Date,
}, { timestamps: true, strict: "throw" });
learningEnrollmentSchema.index({ studentId: 1, opportunityId: 1 }, { unique: true });
learningEnrollmentSchema.index({ studentId: 1, status: 1 });
learningEnrollmentSchema.index({ opportunityId: 1, status: 1 });
learningEnrollmentSchema.pre("validate", function(next) {
  if (this.status === "completed" && this.progress !== 100) return next(new Error("completed enrollment must have progress 100"));
  if (this.completionVerified && this.status !== "completed") return next(new Error("completionVerified requires completed status"));
  if (this.completionVerified && !this.completedAt) return next(new Error("verified completion requires completedAt"));
  if (this.completionVerified && !this.completionVerifiedAt) return next(new Error("verified completion requires completionVerifiedAt"));
  if (!this.completionVerified && this.completionVerifiedAt) return next(new Error("completionVerifiedAt requires completionVerified"));
  if (this.startedAt && this.completedAt && this.completedAt < this.startedAt) return next(new Error("completedAt cannot be before startedAt"));
  if (["in_progress", "completed"].includes(this.status) && !this.startedAt) return next(new Error(`${this.status} enrollment requires startedAt`));
  if (this.status === "completed" && !this.completedAt) return next(new Error("completed enrollment requires completedAt"));
  if (["dropped", "cancelled"].includes(this.status) && this.completedAt) return next(new Error(`${this.status} enrollment cannot have completedAt`));
  next();
});
learningEnrollmentSchema.statics.allowedTransitions = { enrolled: ["in_progress", "completed", "dropped", "cancelled"], in_progress: ["completed", "dropped", "cancelled"], completed: [], dropped: [], cancelled: [] };
learningEnrollmentSchema.statics.canTransition = function(from,to) { return this.allowedTransitions[from]?.includes(to) || false; };
learningEnrollmentSchema.pre(["findOneAndUpdate","updateOne"], async function(next) {
  const update=this.getUpdate()||{}; const nextStatus=update.status ?? update.$set?.status;
  if(!nextStatus) return next(); const current=await this.model.findOne(this.getQuery()).select("status").lean();
  if(!current || current.status===nextStatus) return next();
  if(!this.model.canTransition(current.status,nextStatus)) return next(new Error(`invalid learning enrollment transition: ${current.status} -> ${nextStatus}`));
  next();
});
module.exports=mongoose.model("LearningEnrollment",learningEnrollmentSchema);

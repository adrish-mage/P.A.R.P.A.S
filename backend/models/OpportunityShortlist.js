const mongoose = require("mongoose");
const opportunityShortlistSchema = new mongoose.Schema({
  opportunityId: { type: mongoose.Schema.Types.ObjectId, ref: "IndustryOpportunity", required: true, immutable: true },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: "StudentProfile", required: true, immutable: true },
  status: { type: String, enum: ["shortlisted", "removed"], default: "shortlisted" },
  matchScore: { type: Number, min: 0, max: 100 },
}, { timestamps: true, strict: "throw" });
opportunityShortlistSchema.index({ opportunityId: 1, studentId: 1 }, { unique: true });
opportunityShortlistSchema.index({ opportunityId: 1, status: 1, matchScore: -1 });
opportunityShortlistSchema.index({ studentId: 1, status: 1 });
opportunityShortlistSchema.statics.allowedTransitions={shortlisted:["removed"],removed:["shortlisted"]};
opportunityShortlistSchema.statics.canTransition=function(from,to){return this.allowedTransitions[from]?.includes(to)||false;};
opportunityShortlistSchema.pre(["findOneAndUpdate","updateOne"],async function(next){const update=this.getUpdate()||{};const nextStatus=update.status??update.$set?.status;if(!nextStatus)return next();const current=await this.model.findOne(this.getQuery()).select("status").lean();if(!current||current.status===nextStatus)return next();if(!this.model.canTransition(current.status,nextStatus))return next(new Error(`invalid shortlist transition: ${current.status} -> ${nextStatus}`));next();});
module.exports=mongoose.model("OpportunityShortlist",opportunityShortlistSchema);

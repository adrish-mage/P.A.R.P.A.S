const IndustryApplication = require("../models/IndustryApplication");
const IndustryOpportunity = require("../models/IndustryOpportunity");
const Organisation = require("../models/Organisation");

async function apply(req, res) {
  try {
    const opportunity = await IndustryOpportunity.findOne({ _id: req.body.industryOpportunityId, isActive: true });
    if (!opportunity) return res.status(404).json({ message: "Open opportunity not found" });
    if (opportunity.applicationDeadline && opportunity.applicationDeadline < new Date()) {
      return res.status(400).json({ message: "Application deadline has passed" });
    }
    const application = await IndustryApplication.create({
      studentId: req.user.id,
      industryOpportunityId: opportunity._id,
      coverNote: req.body.coverNote,
    });
    return res.status(201).json(await application.populate("industryOpportunityId", "title type organisationId"));
  } catch (err) {
    return res.status(err.code === 11000 ? 409 : 500).json({ message: err.message });
  }
}

async function sendProposal(req, res) {
  try {
    const { industryOpportunityId, candidateId, coverNote } = req.body;
    const organisation = await Organisation.findOne({ userId: req.user.id, isActive: true });
    if (!organisation) return res.status(403).json({ message: "Organisation account required" });
    const opportunity = await IndustryOpportunity.findOne({ _id: industryOpportunityId, organisationId: organisation._id, isActive: true });
    if (!opportunity) return res.status(404).json({ message: "Organisation opportunity not found" });
    if (!candidateId || !coverNote?.trim()) return res.status(400).json({ message: "candidateId and proposal message are required" });
    const application = await IndustryApplication.findOneAndUpdate(
      { studentId: candidateId, industryOpportunityId: opportunity._id },
      { $set: { coverNote: coverNote.trim(), status: "UnderReview", reviewedAt: new Date(), reviewNote: "Proposal sent by recruiter" } },
      { new: true, upsert: true, setDefaultsOnInsert: true, runValidators: true }
    );
    return res.status(201).json(await application.populate("industryOpportunityId", "title type organisationId"));
  } catch (err) {
    return res.status(err.code === 11000 ? 409 : 500).json({ message: err.message });
  }
}

async function listMine(req, res) {
  const applications = await IndustryApplication.find({ studentId: req.user.id })
    .populate("industryOpportunityId", "title type applicationDeadline status organisationId")
    .sort({ createdAt: -1 });
  return res.status(200).json(applications);
}

async function withdraw(req, res) {
  const application = await IndustryApplication.findOneAndUpdate(
    { _id: req.params.id, studentId: req.user.id, status: { $in: ["Applied", "UnderReview"] } },
    { status: "Withdrawn" },
    { new: true }
  );
  if (!application) return res.status(404).json({ message: "Active application not found" });
  return res.status(200).json(application);
}

async function listForOrganisation(req, res) {
  const organisation = await Organisation.findOne({ userId: req.user.id, isActive: true });
  if (!organisation) return res.status(403).json({ message: "Organisation account required" });
  const opportunityFilter = req.query.opportunityId
    ? { _id: req.query.opportunityId, organisationId: organisation._id }
    : { organisationId: organisation._id };
  const opportunities = await IndustryOpportunity.find(opportunityFilter).select("_id");
  const applications = await IndustryApplication.find({ industryOpportunityId: { $in: opportunities.map((item) => item._id) } })
    .populate("studentId", "name email")
    .populate("industryOpportunityId", "title type status")
    .sort({ createdAt: -1 });
  return res.status(200).json(applications);
}

async function updateForOrganisation(req, res) {
  const organisation = await Organisation.findOne({ userId: req.user.id, isActive: true });
  if (!organisation) return res.status(403).json({ message: "Organisation account required" });
  const application = await IndustryApplication.findById(req.params.id).populate("industryOpportunityId");
  if (!application) return res.status(404).json({ message: "Application not found" });
  const opportunity = await IndustryOpportunity.findOne({ _id: application.industryOpportunityId._id, organisationId: organisation._id });
  if (!opportunity) return res.status(403).json({ message: "Application is outside this organisation" });
  if (!["UnderReview", "Shortlisted", "Rejected", "Accepted"].includes(req.body.status)) {
    return res.status(400).json({ message: "Invalid application status" });
  }
  application.status = req.body.status;
  application.reviewNote = req.body.reviewNote;
  application.reviewedAt = new Date();
  await application.save();
  return res.status(200).json(application);
}

module.exports = { apply, sendProposal, listMine, withdraw, listForOrganisation, updateForOrganisation };

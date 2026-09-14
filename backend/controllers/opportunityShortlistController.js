const OpportunityShortlist = require("../models/OpportunityShortlist");
const Organisation = require("../models/Organisation");
const IndustryOpportunity = require("../models/IndustryOpportunity");
const StudentProfile = require("../models/StudentProfile");

async function create(req, res) {
	try {
		const organisation = await Organisation.findOne({ userId: req.user.id, isVerified: true, isActive: true });
		if (!organisation) return res.status(403).json({ message: "Only a verified organisation admin can shortlist candidates" });
		const opportunityId = req.body.opportunityId || req.body.industryOpportunityId;
		if (!opportunityId) return res.status(400).json({ message: "opportunityId is required" });
		const opportunity = await IndustryOpportunity.findOne({ _id: opportunityId, organisationId: organisation._id, isActive: true });
		if (!opportunity) return res.status(400).json({ message: "Active opportunity does not belong to this organisation" });
		const student = await StudentProfile.findById(req.body.studentId).select("_id");
		if (!student) return res.status(404).json({ message: "Student profile not found" });
		const shortlist = await OpportunityShortlist.create({ opportunityId, studentId: student._id });
		return res.status(201).json(await shortlist.populate("studentId"));
	} catch (err) {
		return res.status(err.code === 11000 ? 409 : 500).json({ message: err.message });
	}
}

async function getAll(req, res) {
	const organisation = await Organisation.findOne({ userId: req.user.id, isActive: true });
	if (!organisation) return res.status(403).json({ message: "Organisation account required" });
	const opportunities = await IndustryOpportunity.find({ organisationId: organisation._id }).select("_id");
	const list = await OpportunityShortlist.find({ opportunityId: { $in: opportunities.map((item) => item._id) } })
		.populate("studentId")
		.populate("opportunityId", "title type status")
		.sort({ createdAt: -1 });
	return res.status(200).json(list);
}

async function update(req, res) {
	const organisation = await Organisation.findOne({ userId: req.user.id, isActive: true });
	if (!organisation) return res.status(403).json({ message: "Organisation account required" });
	const existing = await OpportunityShortlist.findById(req.params.id).select("opportunityId");
	if (!existing) return res.status(404).json({ message: "Shortlist entry not found" });
	const ownedOpportunity = await IndustryOpportunity.findOne({ _id: existing.opportunityId, organisationId: organisation._id });
	if (!ownedOpportunity) return res.status(403).json({ message: "Shortlist entry is outside this organisation" });
	const shortlist = await OpportunityShortlist.findOneAndUpdate(
		{ _id: existing._id },
		{ $set: { ...(req.body.status ? { status: req.body.status } : {}) } },
		{ new: true, runValidators: true }
	).populate("studentId");
	if (!shortlist) return res.status(404).json({ message: "Shortlist entry not found" });
	return res.status(200).json(shortlist);
}

async function remove(req, res) {
	const organisation = await Organisation.findOne({ userId: req.user.id, isActive: true });
	if (!organisation) return res.status(403).json({ message: "Organisation account required" });
	const shortlist = await OpportunityShortlist.findById(req.params.id);
	if (shortlist) {
		const opportunity = await IndustryOpportunity.findOne({ _id: shortlist.opportunityId, organisationId: organisation._id });
		if (!opportunity) return res.status(403).json({ message: "Shortlist entry is outside this organisation" });
		await shortlist.deleteOne();
	}
	if (!shortlist) return res.status(404).json({ message: "Shortlist entry not found" });
	return res.status(200).json({ message: "Shortlist entry removed" });
}

module.exports = { create, getAll, update, remove };

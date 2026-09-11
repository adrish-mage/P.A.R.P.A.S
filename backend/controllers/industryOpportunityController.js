const IndustryOpportunity = require("../models/IndustryOpportunity");
const Organisation = require("../models/Organisation");

async function create(req, res) {
	try {
		const organisation = await Organisation.findOne({
			_id: req.body.organisationId,
			userId: req.user.id,
			isVerified: true,
			isActive: true,
		});
		if (!organisation) return res.status(403).json({ message: "Only a verified organisation admin can publish opportunities" });
		const { organisationId, ...data } = req.body;
		const entry = await IndustryOpportunity.create({ ...data, organisationId: organisation._id });
		return res.status(201).json(await entry.populate("requiredSkills.skillId", "name aliases"));
	} catch (err) {
		return res.status(err.code === 11000 ? 409 : 500).json({ message: err.message });
	}
}

async function getAll(req, res) {
	try {
		const filter = { isActive: true, ...(req.query.type ? { type: req.query.type } : {}) };
		const entries = await IndustryOpportunity.find(filter)
			.populate("organisationId", "name code isVerified")
			.populate("requiredSkills.skillId", "name aliases")
			.sort({ createdAt: -1 });
		return res.status(200).json(entries);
	} catch (err) {
		return res.status(500).json({ message: err.message });
	}
}

async function getById(req, res) {
	try {
		const entry = await IndustryOpportunity.findById(req.params.id)
			.populate("organisationId", "name code isVerified")
			.populate("requiredSkills.skillId", "name aliases");
		if (!entry) return res.status(404).json({ message: "Opportunity not found" });
		return res.status(200).json(entry);
	} catch (err) {
		return res.status(500).json({ message: err.message });
	}
}

async function update(req, res) {
	try {
		const opportunity = await IndustryOpportunity.findById(req.params.id);
		if (!opportunity) return res.status(404).json({ message: "Opportunity not found" });
		const organisation = await Organisation.findOne({ _id: opportunity.organisationId, userId: req.user.id });
		if (!organisation) return res.status(403).json({ message: "Only the owning organisation admin can edit this opportunity" });
		const { organisationId, ...changes } = req.body;
		Object.assign(opportunity, changes);
		await opportunity.save();
		return res.status(200).json(opportunity);
	} catch (err) {
		return res.status(500).json({ message: err.message });
	}
}

async function remove(req, res) {
	try {
		const opportunity = await IndustryOpportunity.findById(req.params.id);
		if (!opportunity) return res.status(404).json({ message: "Opportunity not found" });
		const organisation = await Organisation.findOne({ _id: opportunity.organisationId, userId: req.user.id });
		if (!organisation) return res.status(403).json({ message: "Only the owning organisation admin can delete this opportunity" });
		await opportunity.deleteOne();
		return res.status(200).json({ message: "Opportunity deleted" });
	} catch (err) {
		return res.status(500).json({ message: err.message });
	}
}

module.exports = { create, getAll, getById, update, remove };

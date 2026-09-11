const LearningEnrollment = require("../models/LearningEnrollment");
const LearningOpportunity = require("../models/LearningOpportunity");
const StudentProfile = require("../models/StudentProfile");

async function getStudentProfileId(userId) {
	const profile = await StudentProfile.findOne({ userId }).select("_id");
	return profile?._id;
}

async function create(req, res) {
	try {
		const opportunity = await LearningOpportunity.findById(req.body.opportunityId || req.body.learningOpportunityId);
		if (!opportunity) return res.status(404).json({ message: "Learning opportunity not found" });
		const studentId = await getStudentProfileId(req.user.id);
		if (!studentId) return res.status(404).json({ message: "Student profile not found" });
		const enrollment = await LearningEnrollment.create({
			studentId,
			opportunityId: opportunity._id,
		});
		return res.status(201).json(await enrollment.populate("opportunityId"));
	} catch (err) {
		return res.status(err.code === 11000 ? 409 : 500).json({ message: err.message });
	}
}

async function getAll(req, res) {
	const studentId = await getStudentProfileId(req.user.id);
	if (!studentId) return res.status(404).json({ message: "Student profile not found" });
	const enrollments = await LearningEnrollment.find({ studentId })
		.populate("opportunityId")
		.sort({ createdAt: -1 });
	return res.status(200).json(enrollments);
}

async function getByUser(req, res) {
	if (String(req.user.id) !== String(req.params.userId)) return res.status(403).json({ message: "You can only view your own enrollments" });
	return getAll(req, res);
}

async function update(req, res) {
	const studentId = await getStudentProfileId(req.user.id);
	if (!studentId) return res.status(404).json({ message: "Student profile not found" });
	const allowed = {};
	if (req.body.status) allowed.status = req.body.status;
	if (req.body.progress !== undefined) allowed.progress = req.body.progress;
	if (req.body.startedAt) allowed.startedAt = req.body.startedAt;
	if (req.body.status === "completed") {
		allowed.progress = 100;
		allowed.completedAt = req.body.completedAt || new Date();
	}
	const enrollment = await LearningEnrollment.findOneAndUpdate(
		{ _id: req.params.id, studentId },
		allowed,
		{ new: true, runValidators: true, context: "query" }
	).populate("opportunityId");
	if (!enrollment) return res.status(404).json({ message: "Enrollment not found" });
	return res.status(200).json(enrollment);
}

async function remove(req, res) {
	const studentId = await getStudentProfileId(req.user.id);
	if (!studentId) return res.status(404).json({ message: "Student profile not found" });
	const enrollment = await LearningEnrollment.findOneAndDelete({ _id: req.params.id, studentId });
	if (!enrollment) return res.status(404).json({ message: "Enrollment not found" });
	return res.status(200).json({ message: "Enrollment removed" });
}

module.exports = { create, getAll, getByUser, update, remove };

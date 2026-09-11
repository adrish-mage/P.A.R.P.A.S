const IndustryFollow = require("../models/IndustryFollow");
const StudentProfile = require("../models/StudentProfile");

async function getStudentProfileId(userId) {
	const profile = await StudentProfile.findOne({ userId }).select("_id");
	return profile?._id;
}

async function create(req, res) {
	try {
		const studentId = await getStudentProfileId(req.user.id);
		if (!studentId) return res.status(404).json({ message: "Student profile not found" });
		const follow = await IndustryFollow.create({ studentId, organisationId: req.body.organisationId });
		return res.status(201).json(follow);
	} catch (err) {
		return res.status(err.code === 11000 ? 409 : 500).json({ message: err.message });
	}
}

async function getAll(req, res) {
	const studentId = await getStudentProfileId(req.user.id);
	if (!studentId) return res.status(404).json({ message: "Student profile not found" });
	const follows = await IndustryFollow.find({ studentId }).populate("organisationId", "name code isVerified");
	return res.status(200).json(follows);
}

async function getByUser(req, res) {
	if (String(req.user.id) !== String(req.params.userId)) return res.status(403).json({ message: "You can only view your own follows" });
	return getAll(req, res);
}

async function remove(req, res) {
	const studentId = await getStudentProfileId(req.user.id);
	if (!studentId) return res.status(404).json({ message: "Student profile not found" });
	const follow = await IndustryFollow.findOneAndDelete({ _id: req.params.id, studentId });
	if (!follow) return res.status(404).json({ message: "Follow not found" });
	return res.status(200).json({ message: "Organisation unfollowed" });
}

module.exports = { create, getAll, getByUser, remove };

const ProfessionalProfile = require("../models/ProfessionalProfile");

async function getByUser(req, res) {
  try {
    const profile = await ProfessionalProfile.findOne({ userId: req.params.userId });
    if (!profile) return res.status(404).json({ message: "Professional profile not found" });
    return res.status(200).json(profile);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

async function updateProfile(req, res) {
  try {
    const { role, linkedEntityType, linkedEntityId, linkStatus, ...safeFields } = req.body;
    const profile = await ProfessionalProfile.findOneAndUpdate(
      { userId: req.params.userId },
      safeFields,
      { new: true, runValidators: true }
    );
    if (!profile) return res.status(404).json({ message: "Professional profile not found" });
    return res.status(200).json(profile);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

module.exports = { getByUser, updateProfile };

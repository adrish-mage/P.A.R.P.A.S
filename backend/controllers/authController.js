const User = require("../models/User");
const StudentProfile = require("../models/StudentProfile");
const ProfessionalProfile = require("../models/ProfessionalProfile");
const Institution = require("../models/Institution");
const Organisation = require("../models/Organisation");

async function digilockerLogin(req, res) {
  try {
    const { fullName, email, phone, accountType, digilockerRef } = req.body;

    if (!["Student", "Professional"].includes(accountType)) {
      return res.status(400).json({ message: "accountType must be Student or Professional for DigiLocker auth" });
    }

    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({
        name: fullName,
        email,
        accountType: "individual",
        identityVerification: {
          status: "verified",
          provider: "digilocker",
          verifiedAt: new Date(),
        },
      });

      if (accountType === "Student") {
        await StudentProfile.create({ userId: user._id });
      } else {
        await ProfessionalProfile.create({ userId: user._id });
      }
    }

    return res.status(200).json({ user });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

async function customPipelineSignup(req, res) {
  try {
    const { fullName, email, entityType, entityName } = req.body;

    if (!["Institution", "Organisation"].includes(entityType)) {
      return res.status(400).json({ message: "entityType must be Institution or Organisation" });
    }

    let adminUser = await User.findOne({ email });
    if (!adminUser) {
      adminUser = await User.create({
        name: fullName,
        email,
        accountType: entityType === "Institution" ? "institution" : "organisation",
      });
    }

    const code = entityName.replace(/[^a-z0-9]/gi, "").slice(0, 30).toUpperCase() || `ENTITY${Date.now()}`;
    let entity;
    if (entityType === "Institution") {
      entity = await Institution.create({
        name: entityName,
        userId: adminUser._id,
        code,
      });
    } else {
      entity = await Organisation.create({
        name: entityName,
        userId: adminUser._id,
        code,
      });
    }

    return res.status(201).json({ adminUser, entity });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

async function addAdminSubUser(req, res) {
  try {
    const { institutionId, fullName, email, phone } = req.body;

    const institution = await Institution.findById(institutionId);
    if (!institution || !institution.isVerified || !institution.isActive) {
      return res.status(403).json({ message: "Institution must be verified before adding sub-users" });
    }

    const subUser = await User.create({
      name: fullName,
      email,
      accountType: "individual",
    });

    return res.status(201).json(subUser);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

async function getCurrentUser(req, res) {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ message: "User not found" });
    return res.status(200).json(user);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

module.exports = { digilockerLogin, customPipelineSignup, addAdminSubUser, getCurrentUser };

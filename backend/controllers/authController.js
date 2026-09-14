const User = require("../models/User");
const StudentProfile = require("../models/StudentProfile");
const ProfessionalProfile = require("../models/ProfessionalProfile");
const Institution = require("../models/Institution");
const Organisation = require("../models/Organisation");

async function getRegisteredIndividualRoles(userId) {
  const [studentProfile, professionalProfile] = await Promise.all([
    StudentProfile.exists({ userId }),
    ProfessionalProfile.exists({ userId }),
  ]);
  return [studentProfile && "Student", professionalProfile && "Professional"].filter(Boolean);
}

async function digilockerLogin(req, res) {
  try {
    const { fullName, email, phone, accountType, digilockerRef } = req.body;

    if (!["Student", "Professional"].includes(accountType)) {
      return res.status(400).json({ message: "accountType must be Student or Professional for DigiLocker auth" });
    }

    if (!email || !fullName) {
      return res.status(400).json({ message: "fullName and email are required" });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const isAaravDemo = accountType === "Student" && /^aarav\s+sen$/i.test(String(fullName).trim());
    const lookupEmail = isAaravDemo ? "aarav.sen@sih-demo.local" : normalizedEmail;
    let user = await User.findOne({ email: lookupEmail });
    if (!user) {
      user = await User.create({
        name: fullName,
        email: lookupEmail,
        accountType: "individual",
        identityVerification: {
          status: "verified",
          provider: "digilocker",
          verifiedAt: new Date(),
        },
      });

    }

    if (user.accountType !== "individual") {
      const registeredRole = user.accountType === "organisation" ? "Organisation" : "Institution";
      return res.status(409).json({ message: `Email already registered. Role: ${registeredRole}. Use that role to continue.` });
    }

    const registeredRoles = await getRegisteredIndividualRoles(user._id);
    if (registeredRoles.length > 0 && !registeredRoles.includes(accountType)) {
      return res.status(409).json({ message: `Email already registered. Role: ${registeredRoles.join(" and ")}. You cannot create a ${accountType} account with this email.` });
    }

    if (accountType === "Student") {
      await StudentProfile.findOneAndUpdate(
        { userId: user._id },
        { $setOnInsert: { userId: user._id } },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    } else {
      await ProfessionalProfile.findOneAndUpdate(
        { userId: user._id },
        { $setOnInsert: { userId: user._id } },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
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

    if (!email || !fullName || !entityName) {
      return res.status(400).json({ message: "fullName, email, and entityName are required" });
    }

    let adminUser = await User.findOne({ email: String(email).trim().toLowerCase() });
    if (!adminUser) {
      adminUser = await User.create({
        name: fullName,
        email,
        accountType: entityType === "Institution" ? "institution" : "organisation",
      });
    }

    if (adminUser.accountType !== (entityType === "Institution" ? "institution" : "organisation")) {
      const registeredRole = adminUser.accountType === "individual" ? (await getRegisteredIndividualRoles(adminUser._id)).join(" and ") || "Individual" : adminUser.accountType === "organisation" ? "Organisation" : "Institution";
      return res.status(409).json({ message: `Email already registered. Role: ${registeredRole}. Use a different email for a ${entityType} account.` });
    }

    const Entity = entityType === "Institution" ? Institution : Organisation;
    const existingEntity = await Entity.findOne({ userId: adminUser._id });
    if (existingEntity) {
      return res.status(200).json({ adminUser, entity: existingEntity });
    }

    const baseCode = entityName.replace(/[^a-z0-9]/gi, "").slice(0, 30).toUpperCase() || `ENTITY${Date.now()}`;
    let code = baseCode;
    let suffix = 1;
    while (await Entity.exists({ code })) {
      code = `${baseCode.slice(0, 26)}${suffix}`;
      suffix += 1;
    }

    const entity = await Entity.create({
      name: entityName,
      userId: adminUser._id,
      code,
    });

    return res.status(201).json({ adminUser, entity });
  } catch (err) {
    if (err.code === 11000 && err.keyPattern?.userId) {
      const Entity = req.body.entityType === "Institution" ? Institution : Organisation;
      const existingUser = await User.findOne({ email: req.body.email });
      const entity = existingUser ? await Entity.findOne({ userId: existingUser._id }) : null;
      if (existingUser && entity) return res.status(200).json({ adminUser: existingUser, entity });
    }
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

require("dotenv").config();
const connectDB = require("../config/db");
const User = require("../models/User");
const StudentProfile = require("../models/StudentProfile");
const ProfessionalProfile = require("../models/ProfessionalProfile");
const SkillProfile = require("../models/SkillProfile");
const Institution = require("../models/Institution");
const Organisation = require("../models/Organisation");
const AcademicRecord = require("../models/AcademicRecord");
const Training = require("../models/Training");
const IndustryExperience = require("../models/IndustryExperience");
const Project = require("../models/Project");
const Verification = require("../models/Verification");
const VerificationRequest = require("../models/VerificationRequest");
const SkillEvidence = require("../models/SkillEvidence");
const GrowthMap = require("../models/GrowthMap");
const LearningEnrollment = require("../models/LearningEnrollment");
const OpportunityShortlist = require("../models/OpportunityShortlist");
const IndustryFollow = require("../models/IndustryFollow");
const IndustryApplication = require("../models/IndustryApplication");
const { loadDemoData } = require("../controllers/studentProfileController");

function response() {
  return {
    statusCode: 500,
    body: null,
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return body; },
  };
}

async function ensureUser({ email, name, accountType }) {
  return User.findOneAndUpdate(
    { email },
    { $setOnInsert: { email, name, accountType, onboardingStatus: "in_progress", ...(accountType === "individual" ? { identityVerification: { status: "verified", provider: "digilocker", verifiedAt: new Date() } } : {}) } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
}

async function removeLegacyAarav() {
  const legacyUser = await User.findOne({ email: "aarav.sen.demo@example.com" });
  if (!legacyUser) return;
  const legacyProfile = await StudentProfile.findOne({ userId: legacyUser._id }).select("_id").lean();
  if (legacyProfile) {
    const profileFilter = { studentId: legacyProfile._id };
    await Promise.all([
      SkillProfile.deleteMany(profileFilter),
      AcademicRecord.deleteMany(profileFilter),
      Training.deleteMany(profileFilter),
      IndustryExperience.deleteMany(profileFilter),
      Project.deleteMany(profileFilter),
      Verification.deleteMany(profileFilter),
      VerificationRequest.deleteMany(profileFilter),
      SkillEvidence.deleteMany(profileFilter),
      GrowthMap.deleteMany(profileFilter),
      LearningEnrollment.deleteMany(profileFilter),
      OpportunityShortlist.deleteMany(profileFilter),
      IndustryFollow.deleteMany(profileFilter),
    ]);
    await IndustryApplication.deleteMany({ studentId: legacyUser._id });
    await StudentProfile.deleteOne({ _id: legacyProfile._id });
  }
  await ProfessionalProfile.deleteMany({ userId: legacyUser._id });
  await User.deleteOne({ _id: legacyUser._id });
  console.log("Removed legacy Aarav demo account");
}

async function run() {
  await connectDB();

  const skillProfileIndexes = await SkillProfile.collection.listIndexes().toArray();
  for (const index of skillProfileIndexes) {
    if (index.name === "userId_1" || index.key?.userId) {
      await SkillProfile.collection.dropIndex(index.name);
      console.log(`Removed legacy SkillProfile index ${index.name}`);
    }
  }

  await removeLegacyAarav();
  const studentUser = await ensureUser({ email: "aarav.sen@sih-demo.local", name: "Aarav Sen", accountType: "individual" });
  await StudentProfile.findOneAndUpdate({ userId: studentUser._id }, { $setOnInsert: { userId: studentUser._id } }, { upsert: true, new: true, setDefaultsOnInsert: true });
  const seedResponse = response();
  await loadDemoData({ user: { id: studentUser._id } }, seedResponse);
  if (seedResponse.statusCode >= 400) throw new Error(seedResponse.body?.message || "Demo data seed failed");

  const institution = await Institution.findOne({ code: "CALCUTTADEMO" });
  const organisation = await Organisation.findOne({ code: "CALCUTTADEMO" });
  if (!institution || !organisation) throw new Error("Demo institution or organisation was not created");

  const tpoUser = await ensureUser({ email: "tpo-demo@parpas.local", name: "PARPAS Demo TPO", accountType: "individual" });
  await ProfessionalProfile.findOneAndUpdate(
    { userId: tpoUser._id },
    { $set: { role: "TPO", linkedEntityType: "institution", linkedEntityId: institution._id, linkStatus: "Linked", profileVisibility: "institution" } },
    { upsert: true, new: true, setDefaultsOnInsert: true, runValidators: true }
  );

  const recruiterUser = await ensureUser({ email: "recruiter-demo@parpas.local", name: "PARPAS Demo Recruiter", accountType: "individual" });
  await ProfessionalProfile.findOneAndUpdate(
    { userId: recruiterUser._id },
    { $set: { role: "Employee", linkedEntityType: "organisation", linkedEntityId: organisation._id, linkStatus: "Linked", profileVisibility: "recruiter" } },
    { upsert: true, new: true, setDefaultsOnInsert: true, runValidators: true }
  );

  console.log(JSON.stringify({
    message: "Demo data seeded",
    accounts: {
      student: "aarav.sen@sih-demo.local",
      tpo: "tpo-demo@parpas.local",
      recruiter: "recruiter-demo@parpas.local",
      organisation: "placements@universityofcalcutta-demo.example",
    },
  }, null, 2));
  await require("mongoose").connection.close();
}

run().catch(async (error) => {
  console.error(error.message);
  try { await require("mongoose").connection.close(); } catch (_) {}
  process.exitCode = 1;
});

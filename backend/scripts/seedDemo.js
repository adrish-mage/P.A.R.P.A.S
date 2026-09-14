require("dotenv").config();
const connectDB = require("../config/db");
const User = require("../models/User");
const StudentProfile = require("../models/StudentProfile");
const ProfessionalProfile = require("../models/ProfessionalProfile");
const Institution = require("../models/Institution");
const Organisation = require("../models/Organisation");
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

async function run() {
  await connectDB();

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

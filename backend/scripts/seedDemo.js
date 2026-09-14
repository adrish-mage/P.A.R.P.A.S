require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("../config/db");
const User = require("../models/User");
const StudentProfile = require("../models/StudentProfile");
const ProfessionalProfile = require("../models/ProfessionalProfile");
const InstitutionMembership = require("../models/InstitutionMembership");
const AffiliationApplication = require("../models/AffiliationApplication");
const Role = require("../models/Role");
const SkillProfile = require("../models/SkillProfile");
const Institution = require("../models/Institution");
const Organisation = require("../models/Organisation");
const Skill = require("../models/Skill");
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

  const facultyUser = await ensureUser({ email: "faculty-demo@parpas.local", name: "Dr. Meera Iyer", accountType: "individual" });
  const facultyRole = await Role.findOneAndUpdate(
    { scopeType: "institution", scopeId: institution._id, code: "faculty_verifier" },
    { $set: { name: "Faculty Verifier", description: "Reviews student project evidence.", permissions: ["verification.review"], isActive: true }, $setOnInsert: { scopeType: "institution", scopeId: institution._id, code: "faculty_verifier", createdByUserId: institution.userId } },
    { upsert: true, new: true, setDefaultsOnInsert: true, runValidators: true }
  );
  await ProfessionalProfile.findOneAndUpdate(
    { userId: facultyUser._id },
    { $set: { role: "Faculty", linkedEntityType: "institution", linkedEntityId: institution._id, linkStatus: "Linked", profileVisibility: "institution" } },
    { upsert: true, new: true, setDefaultsOnInsert: true, runValidators: true }
  );
  const facultyApplication = await AffiliationApplication.findOneAndUpdate(
    { applicantUserId: facultyUser._id, affiliationType: "institution", affiliationId: institution._id },
    { $set: { status: "approved", reviewedAt: new Date("2026-09-01"), completedAt: new Date("2026-09-01"), approvals: [{ approverUserId: institution.userId, decision: "approved", comments: "Demo faculty account approved." }] }, $setOnInsert: { applicantUserId: facultyUser._id, affiliationType: "institution", affiliationId: institution._id, membershipId: new mongoose.Types.ObjectId() } },
    { upsert: true, new: true, setDefaultsOnInsert: true, runValidators: true }
  );
  const facultyMembership = await InstitutionMembership.findOneAndUpdate(
    { userId: facultyUser._id, institutionId: institution._id },
    { $set: { applicationId: facultyApplication._id, roles: [{ roleId: facultyRole._id, assignedByUserId: institution.userId }], designation: "Faculty Reviewer", department: "Computer Science", status: "active", approvedByUserId: institution.userId, approvedAt: new Date("2026-09-01") }, $setOnInsert: { userId: facultyUser._id, institutionId: institution._id } },
    { upsert: true, new: true, setDefaultsOnInsert: true, runValidators: true }
  );
  if (String(facultyApplication.membershipId) !== String(facultyMembership._id)) {
    facultyApplication.membershipId = facultyMembership._id;
    await facultyApplication.save();
  }

  const aaravStudent = await StudentProfile.findOne({ userId: studentUser._id });
  const aaravSkillRecords = await Skill.find({ name: { $in: ["Python", "SQL", "Git", "React", "Node.js"] } }).select("_id name").lean();
  const projectSkills = (names) => names.map((name) => ({ skillId: aaravSkillRecords.find((skill) => skill.name === name)._id }));
  const existingProject = await Project.findOne({ studentId: aaravStudent._id, title: "Campus Placement Insight Portal" });
  const rejectedProject = await Project.findOneAndUpdate(
    { studentId: aaravStudent._id, title: "Student Data Quality Dashboard" },
    { $setOnInsert: { studentId: aaravStudent._id, title: "Student Data Quality Dashboard", description: "A data quality dashboard for monitoring placement records and reporting consistency.", type: "academic", skills: projectSkills(["SQL", "Python"]), evidence: [{ type: "link", url: "https://example.com/demo-student-data-quality" }], completedAt: new Date("2026-04-15") } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  const pendingProject = await Project.findOneAndUpdate(
    { studentId: aaravStudent._id, title: "Opportunity Matching Prototype" },
    { $setOnInsert: { studentId: aaravStudent._id, title: "Opportunity Matching Prototype", description: "A prototype that compares student skills with internship requirements.", type: "personal", skills: projectSkills(["Node.js", "React"]), evidence: [{ type: "link", url: "https://example.com/demo-opportunity-matching" }], completedAt: new Date("2026-05-10") } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  const aaravProjects = [existingProject, rejectedProject, pendingProject];
  await Project.deleteMany({ studentId: aaravStudent._id, _id: { $nin: aaravProjects.map((project) => project._id) } });
  await Verification.deleteMany({ studentId: aaravStudent._id, targetType: "project" });
  await VerificationRequest.deleteMany({ studentId: aaravStudent._id, targetType: "project" });
  const verifiedRequest = await VerificationRequest.create({ studentId: aaravStudent._id, targetType: "project", targetId: existingProject._id, verifierUserId: facultyUser._id, anonymousRequestId: `demo-faculty-verified-${existingProject._id}`, verificationLevel: "faculty", message: "Please review this project evidence." });
  const verifiedRecord = await Verification.create({ requestId: verifiedRequest._id, targetType: "project", targetId: existingProject._id, studentId: aaravStudent._id, verifierUserId: facultyUser._id, verificationLevel: "faculty", verifierMembershipId: facultyMembership._id, verifierRoleAssignmentId: facultyMembership.roles[0]._id, status: "verified", verificationScore: 9, comments: "Project verified by demo faculty.", verifiedAt: new Date("2026-09-10") });
  verifiedRequest.status = "completed";
  verifiedRequest.respondedAt = new Date("2026-09-10");
  verifiedRequest.verificationId = verifiedRecord._id;
  await verifiedRequest.save();
  await VerificationRequest.create({ studentId: aaravStudent._id, targetType: "project", targetId: rejectedProject._id, verifierUserId: facultyUser._id, anonymousRequestId: `demo-faculty-rejected-${rejectedProject._id}`, verificationLevel: "faculty", status: "rejected", respondedAt: new Date("2026-09-11"), message: "Please review this project evidence." }).then(async (request) => {
    const record = await Verification.create({ requestId: request._id, targetType: "project", targetId: rejectedProject._id, studentId: aaravStudent._id, verifierUserId: facultyUser._id, verificationLevel: "faculty", status: "rejected", comments: "Please add clearer evidence and validation results." });
    return record;
  });
  await VerificationRequest.create({ studentId: aaravStudent._id, targetType: "project", targetId: pendingProject._id, verifierUserId: facultyUser._id, anonymousRequestId: `demo-faculty-pending-${pendingProject._id}`, verificationLevel: "faculty", message: "Self-submitted project awaiting faculty review." });

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
  await mongoose.connection.close();
}

run().catch(async (error) => {
  console.error(error.message);
  try { await mongoose.connection.close(); } catch (_) {}
  process.exitCode = 1;
});

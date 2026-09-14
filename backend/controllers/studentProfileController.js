const StudentProfile = require("../models/StudentProfile");
const Institution = require("../models/Institution");
const AffiliationApplication = require("../models/AffiliationApplication");
const AffiliationInvite = require("../models/AffiliationInvite");
const AcademicRecord = require("../models/AcademicRecord");
const InstitutionMembership = require("../models/InstitutionMembership");
const ProfessionalProfile = require("../models/ProfessionalProfile");
const User = require("../models/User");
const Skill = require("../models/Skill");
const SkillProfile = require("../models/SkillProfile");
const Training = require("../models/Training");
const IndustryExperience = require("../models/IndustryExperience");
const Project = require("../models/Project");
const VerificationRequest = require("../models/VerificationRequest");
const Verification = require("../models/Verification");
const Organisation = require("../models/Organisation");
const IndustryOpportunity = require("../models/IndustryOpportunity");
const CareerRole = require("../models/CareerRole");
const LearningOpportunity = require("../models/LearningOpportunity");

async function getByUser(req, res) {
  try {
    const profile = await StudentProfile.findOne({ userId: req.params.userId });
    if (!profile) return res.status(404).json({ message: "Student profile not found" });
    return res.status(200).json(profile);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

async function updateProfile(req, res) {
  try {
    const { institutionLink, ...rest } = req.body;
    const profile = await StudentProfile.findOneAndUpdate({ userId: req.params.userId }, rest, {
      new: true,
      runValidators: true,
    });
    if (!profile) return res.status(404).json({ message: "Student profile not found" });
    return res.status(200).json(profile);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

async function consentToLink(req, res) {
  return res.status(410).json({ message: "Institution consent is replaced by affiliation applications" });
}

async function requestLink(req, res) {
  try {
    const { institutionId, rollNo, enrollmentId, course, admissionYear } = req.body;
    const institution = await Institution.findOne({ _id: institutionId, isVerified: true, isActive: true });
    if (!institution) return res.status(404).json({ message: "Verified institution not found" });
    if (!rollNo || !enrollmentId || !course || !admissionYear) {
      return res.status(400).json({ message: "rollNo, enrollmentId, course, and admissionYear are required" });
    }
    const profile = await StudentProfile.findOne({ userId: req.params.userId });
    if (!profile) return res.status(404).json({ message: "Student profile not found" });
    let application = await AffiliationApplication.findOne({
      applicantUserId: profile.userId,
      affiliationType: "institution",
      affiliationId: institution._id,
    });
    if (application?.status === "approved") {
      return res.status(409).json({ message: "You are already linked to this institution" });
    }
    if (application?.status === "pending") {
      return res.status(409).json({ message: "A verification request is already pending for this institution" });
    }
    if (application) {
      application.status = "pending";
      application.approvals = [];
      application.membershipId = undefined;
      application.reviewedAt = undefined;
      application.completedAt = undefined;
      await application.save();
    } else {
      application = await AffiliationApplication.create({
        applicantUserId: profile.userId,
        affiliationType: "institution",
        affiliationId: institution._id,
      });
    }
    profile.institutionLink = {
      institutionId: institution._id,
      status: "Pending",
      rollNo,
      enrollmentId,
      course,
      admissionYear,
    };
    await profile.save();
    return res.status(201).json({ ...profile.toObject(), affiliationApplication: application });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: "A verification request is already pending for this institution" });
    }
    return res.status(500).json({ message: err.message });
  }
}

async function approveLink(req, res) {
  return res.status(410).json({ message: "Institution approval is handled through affiliation applications" });
}

async function loadDemoData(req, res) {
  try {
    const user = await User.findById(req.user.id);
    const student = await StudentProfile.findOne({ userId: req.user.id });
    if (!user || user.accountType !== "individual" || !student) return res.status(403).json({ message: "Student account required" });
    student.bio = student.bio || "Computer science student building practical products for education and hiring.";
    student.careerInterest = student.careerInterest || "Backend and full-stack engineering";
    student.profileVisibility = "recruiter";
    await student.save();

    const definitions = [
      ["Python", "technical", 8, "self"],
      ["Communication", "soft", 7, "self"],
      ["SQL", "technical", 7, "training"],
      ["Git", "technical", 8, "training"],
      ["React", "technical", 8, "project"],
      ["Node.js", "technical", 7, "project"],
    ];
    const skills = {};
    for (const [name, category] of definitions) {
      skills[name] = await Skill.findOneAndUpdate({ name }, { $setOnInsert: { name, category } }, { new: true, upsert: true, setDefaultsOnInsert: true });
    }

    let profile = await SkillProfile.findOne({ studentId: student._id });
    const existing = profile?.skills || [];
    const merged = [...existing];
    for (const [name, , score, source] of definitions) {
      const entry = { skillId: skills[name]._id, score, source, confidence: source === "self" ? 70 : source === "training" ? 85 : 90, evidenceCount: 1, verifiedEvidenceCount: source === "project" ? 1 : 0 };
      const index = merged.findIndex((item) => String(item.skillId) === String(entry.skillId));
      if (index === -1) merged.push(entry);
      else merged[index] = { ...merged[index].toObject?.() || merged[index], ...entry };
    }
    profile = await SkillProfile.findOneAndUpdate({ studentId: student._id }, { $set: { skills: merged } }, { upsert: true, new: true, setDefaultsOnInsert: true, runValidators: true });

    await Training.findOneAndUpdate(
      { studentId: student._id, name: "SQL & Git Foundations" },
      { $setOnInsert: { studentId: student._id, name: "SQL & Git Foundations", description: "Course covering relational queries, version control, and collaborative workflows.", provider: { type: "external", externalProviderName: "P.A.R.P.A.S. Demo Academy" }, type: "course", startedAt: new Date("2026-01-10"), completedAt: new Date("2026-02-20"), skills: [{ skillId: skills.SQL._id }, { skillId: skills.Git._id }], certificate: { title: "SQL & Git Foundations", issuer: "P.A.R.P.A.S. Demo Academy", issuedAt: new Date("2026-02-20"), hasAssessment: true, assessmentScore: 88 } } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    const project = await Project.findOneAndUpdate(
      { studentId: student._id, title: "Campus Placement Insight Portal" },
      { $setOnInsert: { studentId: student._id, title: "Campus Placement Insight Portal", description: "A dashboard that helps placement teams understand skill readiness and role alignment.", type: "academic", skills: [{ skillId: skills.React._id }, { skillId: skills["Node.js"]._id }], evidence: [{ type: "link", url: "https://example.com/demo-placement-portal" }], completedAt: new Date("2026-03-15") } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    let verification = await Verification.findOne({ targetType: "project", targetId: project._id, status: "verified" });
    if (!verification) {
      let request = await VerificationRequest.findOne({ studentId: student._id, targetType: "project", targetId: project._id, verifierUserId: user._id });
      if (!request) request = await VerificationRequest.create({ studentId: student._id, targetType: "project", targetId: project._id, verifierUserId: user._id, anonymousRequestId: `demo-${project._id}`, verificationLevel: "faculty" });
      verification = await Verification.create({ requestId: request._id, targetType: "project", targetId: project._id, studentId: student._id, verifierUserId: user._id, verificationLevel: "faculty", verifierMembershipId: request._id, verifierRoleAssignmentId: request._id, status: "verified", verificationScore: 9, comments: "Demo verified project", verifiedAt: new Date() });
      request.status = "completed";
      request.respondedAt = new Date();
      request.verificationId = verification._id;
      await request.save();
    }

    const organisationUser = await User.findOneAndUpdate(
      { email: "placements@universityofcalcutta-demo.example" },
      { $setOnInsert: { name: "University of Calcutta Demo", email: "placements@universityofcalcutta-demo.example", accountType: "organisation", onboardingStatus: "in_progress" } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    const organisation = await Organisation.findOneAndUpdate(
      { userId: organisationUser._id },
      { $setOnInsert: { userId: organisationUser._id, name: "University of Calcutta", code: "CALCUTTADEMO", isVerified: true, isActive: true } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    const opportunities = [
      { title: "Frontend Engineering Intern", type: "internship", description: "Build accessible product surfaces with the frontend platform team.", skills: [{ skillId: skills.React._id, minScore: 6, required: true, weight: 1 }, { skillId: skills.Git._id, minScore: 5, required: true, weight: .6 }] },
      { title: "Backend Developer Intern", type: "internship", description: "Ship APIs and data workflows for campus and employer products.", skills: [{ skillId: skills["Node.js"]._id, minScore: 6, required: true, weight: 1 }, { skillId: skills.Python._id, minScore: 6, required: true, weight: .8 }] },
      { title: "Junior Full-stack Engineer", type: "job", description: "Join a product squad working across React, Node.js, Python, and SQL.", skills: [{ skillId: skills.React._id, minScore: 7, required: true, weight: 1 }, { skillId: skills["Node.js"]._id, minScore: 6, required: true, weight: 1 }, { skillId: skills.SQL._id, minScore: 6, required: true, weight: .8 }] },
      { title: "Data Platform Associate", type: "job", description: "Turn operational data into reliable decisions for education and hiring.", skills: [{ skillId: skills.SQL._id, minScore: 7, required: true, weight: 1 }, { skillId: skills.Python._id, minScore: 7, required: true, weight: .9 }, { skillId: skills.Communication._id, minScore: 6, required: false, weight: .4 }] },
    ];
    for (const opportunity of opportunities) {
      await IndustryOpportunity.findOneAndUpdate(
        { organisationId: organisation._id, title: opportunity.title },
        { $set: { description: `${opportunity.description} Work with the University of Calcutta placement technology team on a scoped deliverable, collaborate with mentors, and present measurable outcomes at the end of the engagement.`, location: "Kolkata / Remote", mode: opportunity.type === "job" ? "hybrid" : "remote", startDate: new Date("2027-01-15"), endDate: new Date("2027-06-30"), applicationDeadline: new Date("2026-12-31"), isActive: true }, $setOnInsert: { organisationId: organisation._id, title: opportunity.title, type: opportunity.type, requiredSkills: opportunity.skills } },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    }

    const demoInstitutions = [
      { email: "demo.admin@universityofcalcutta.example", name: "University of Calcutta", code: "CALCUTTADEMO", emailDomain: "universityofcalcutta.example" },
      { email: "demo.admin@eastbridge.example", name: "Eastbridge Institute of Technology", code: "EASTBRIDGE", emailDomain: "eastbridge.example" },
      { email: "demo.admin@northfield.example", name: "Northfield University", code: "NORTHFIELD", emailDomain: "northfield.example" },
    ];
    const institutionRecords = {};
    for (const item of demoInstitutions) {
      const institutionUser = await User.findOneAndUpdate(
        { email: item.email },
        { $setOnInsert: { name: `${item.name} Demo Admin`, email: item.email, accountType: "institution", onboardingStatus: "in_progress" } },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      const matchingInstitutions = await Institution.find({ code: item.code }).sort({ createdAt: 1, _id: 1 });
      let institution = matchingInstitutions.find((record) => String(record.userId) === String(institutionUser._id)) || matchingInstitutions[0];
      if (!institution) {
        institution = await Institution.create({ userId: institutionUser._id, name: item.name, code: item.code, emailDomain: item.emailDomain, isVerified: true, isActive: true });
      } else {
        institution.name = item.name;
        institution.emailDomain = item.emailDomain;
        institution.isVerified = true;
        institution.isActive = true;
        await institution.save();
      }

      for (const duplicate of matchingInstitutions.filter((record) => String(record._id) !== String(institution._id))) {
        await StudentProfile.updateMany({ "institutionLink.institutionId": duplicate._id }, { $set: { "institutionLink.institutionId": institution._id } });
        await AcademicRecord.updateMany({ "course.institutionId": duplicate._id }, { $set: { "course.institutionId": institution._id } });
        await InstitutionMembership.updateMany({ institutionId: duplicate._id }, { $set: { institutionId: institution._id } });
        await AffiliationApplication.updateMany({ affiliationType: "institution", affiliationId: duplicate._id }, { $set: { affiliationId: institution._id } });
        await AffiliationInvite.updateMany({ affiliationType: "institution", affiliationId: duplicate._id }, { $set: { affiliationId: institution._id } });
        await ProfessionalProfile.updateMany({ linkedEntityType: "institution", linkedEntityId: duplicate._id }, { $set: { linkedEntityId: institution._id } });
        await Institution.deleteOne({ _id: duplicate._id });
      }
      institutionRecords[item.code] = institution;
    }

    const demoInstitution = institutionRecords.CALCUTTADEMO;
    student.institutionLink = {
      institutionId: demoInstitution._id,
      status: "Linked",
      rollNo: "DEMO-CALCUTTADEMO",
      enrollmentId: "ENR-CALCUTTADEMO-AARAVSEN",
      course: "B.Tech Computer Science",
      admissionYear: 2023,
    };
    await student.save();

    await AcademicRecord.findOneAndUpdate(
      { studentId: student._id, "course.name": "B.Tech Computer Science" },
      { $set: { studentId: student._id, course: { name: "B.Tech Computer Science", code: "BTECH-CSE", institutionId: demoInstitution._id, type: "college_course" }, performance: { marks: 842, maxMarks: 1000, grade: "A" }, skills: [{ skillId: skills.Python._id, weight: 1 }, { skillId: skills["Node.js"]._id, weight: 1 }, { skillId: skills.SQL._id, weight: .8 }], examDate: new Date("2026-05-20") } },
      { upsert: true, new: true, setDefaultsOnInsert: true, runValidators: true }
    );
    await AcademicRecord.findOneAndUpdate(
      { studentId: student._id, "course.name": "Applied Data Structures and Algorithms" },
      { $set: { studentId: student._id, course: { name: "Applied Data Structures and Algorithms", code: "NPTEL-DSA-2026", type: "nptel" }, performance: { marks: 91, maxMarks: 100, grade: "Elite" }, skills: [{ skillId: skills.Python._id, weight: 1 }, { skillId: skills["Node.js"]._id, weight: .8 }, { skillId: skills["Git"]._id, weight: .5 }], examDate: new Date("2026-04-18") } },
      { upsert: true, new: true, setDefaultsOnInsert: true, runValidators: true }
    );
    await Training.findOneAndUpdate(
      { studentId: student._id, name: "Node.js API Engineering Certificate" },
      { $setOnInsert: { studentId: student._id, name: "Node.js API Engineering Certificate", description: "Practical training in REST APIs, authentication, validation, and production service design.", provider: { type: "external", externalProviderName: "P.A.R.P.A.S. Demo Academy" }, type: "certification", startedAt: new Date("2026-02-01"), completedAt: new Date("2026-03-10"), skills: [{ skillId: skills["Node.js"]._id }, { skillId: skills["Git"]._id }], certificate: { title: "Node.js API Engineering Certificate", issuer: "P.A.R.P.A.S. Demo Academy", issuedAt: new Date("2026-03-10"), hasAssessment: true, assessmentScore: 92 } } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    await IndustryExperience.findOneAndUpdate(
      { studentId: student._id, organisationId: organisation._id, role: "Backend Engineering Intern" },
      { $set: { studentId: student._id, organisationId: organisation._id, type: "internship", role: "Backend Engineering Intern", description: "Built API endpoints, improved validation flows, and supported placement data integrations.", skills: [{ skillId: skills["Node.js"]._id }, { skillId: skills.Python._id }, { skillId: skills.SQL._id }, { skillId: skills.Git._id }], startedAt: new Date("2026-05-01"), endedAt: new Date("2026-08-15"), supervisor: { name: "Ritika Sen", designation: "Engineering Lead" } } },
      { upsert: true, new: true, setDefaultsOnInsert: true, runValidators: true }
    );

    const additionalStudents = [
      { email: "priya.nair@eastbridge.example", name: "Priya Nair", institution: "EASTBRIDGE", course: "B.Tech Computer Science", interest: "Frontend engineering and accessible product design", scores: [["React", 9, "project"], ["Git", 8, "training"], ["Communication", 8, "self"], ["SQL", 6, "training"]], project: "Accessible Campus Planner" },
      { email: "rohan.mehta@northfield.example", name: "Rohan Mehta", institution: "NORTHFIELD", course: "B.Sc Data Science", interest: "Data platforms and applied analytics", scores: [["Python", 9, "project"], ["SQL", 9, "training"], ["Communication", 7, "self"], ["Node.js", 5, "self"]], project: "Placement Forecasting Studio" },
      { email: "maya.iyer@universityofcalcutta.example", name: "Maya Iyer", institution: "CALCUTTADEMO", course: "B.Tech Information Technology", interest: "Full-stack products and developer tooling", scores: [["Node.js", 9, "project"], ["React", 8, "project"], ["Python", 7, "training"], ["Git", 9, "training"]], project: "Student Hiring Workspace" },
      { email: "aditya.roy@universityofcalcutta.example", name: "Aditya Roy", institution: "CALCUTTADEMO", course: "B.Tech Computer Science", interest: "Backend systems and API engineering", scores: [["Node.js", 9, "project"], ["Python", 8, "project"], ["SQL", 8, "training"], ["Git", 8, "training"]], project: "Campus Services API" },
      { email: "sneha.kapoor@universityofcalcutta.example", name: "Sneha Kapoor", institution: "CALCUTTADEMO", course: "B.Tech Information Technology", interest: "Frontend applications and product design", scores: [["React", 9, "project"], ["Communication", 9, "self"], ["Git", 8, "training"], ["SQL", 5, "self"]], project: "Student Experience Portal" },
      { email: "kabir.das@universityofcalcutta.example", name: "Kabir Das", institution: "CALCUTTADEMO", course: "M.Sc Data Science", interest: "Analytics and applied machine learning", scores: [["Python", 9, "project"], ["SQL", 9, "training"], ["Communication", 7, "self"], ["Node.js", 4, "self"]], project: "Placement Analytics Lab" },
      { email: "ishita.bose@universityofcalcutta.example", name: "Ishita Bose", institution: "CALCUTTADEMO", course: "B.Tech Computer Science", interest: "Full-stack development and cloud systems", scores: [["React", 8, "project"], ["Node.js", 8, "project"], ["Python", 8, "training"], ["Git", 9, "training"]], project: "Collaborative Learning Hub" },
    ];
    for (const item of additionalStudents) {
      const additionalUser = await User.findOneAndUpdate(
        { email: item.email },
        { $setOnInsert: { name: item.name, email: item.email, accountType: "individual", identityVerification: { status: "verified", provider: "digilocker", verifiedAt: new Date() } } },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      const additionalStudent = await StudentProfile.findOneAndUpdate(
        { userId: additionalUser._id },
        { $set: { bio: `${item.name} is building practical work for modern teams.`, careerInterest: item.interest, profileVisibility: "recruiter", institutionLink: { institutionId: institutionRecords[item.institution]?._id, status: "Linked", rollNo: `DEMO-${item.institution}`, enrollmentId: `ENR-${item.institution}-${item.name.replace(/\s/g, "").toUpperCase()}`, course: item.course, admissionYear: 2023 } } },
        { upsert: true, new: true, setDefaultsOnInsert: true, runValidators: true }
      );
      const studentSkills = item.scores.map(([name, score, source]) => ({ skillId: skills[name]._id, score, source, confidence: source === "self" ? 70 : 90, evidenceCount: 1, verifiedEvidenceCount: source === "project" ? 1 : 0 }));
      await SkillProfile.findOneAndUpdate({ studentId: additionalStudent._id }, { $set: { skills: studentSkills } }, { upsert: true, new: true, setDefaultsOnInsert: true, runValidators: true });
      await Project.findOneAndUpdate(
        { studentId: additionalStudent._id, title: item.project },
        { $setOnInsert: { studentId: additionalStudent._id, title: item.project, description: `${item.project} demonstrates practical delivery and collaboration.`, type: "academic", skills: studentSkills.filter((entry) => entry.source === "project").map((entry) => ({ skillId: entry.skillId })), evidence: [{ type: "link", url: `https://example.com/demo-${item.name.toLowerCase().replace(/\s/g, "-")}-project` }], completedAt: new Date("2026-04-01") } },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      if (item.institution === "CALCUTTADEMO") {
        const itemSkills = studentSkills.map((entry) => ({ skillId: entry.skillId }));
        await AcademicRecord.findOneAndUpdate(
          { studentId: additionalStudent._id, "course.name": item.course },
          { $set: { studentId: additionalStudent._id, course: { name: item.course, code: `CALCUTTA-${item.name.replace(/\s/g, "-").toUpperCase()}`, institutionId: institutionRecords.CALCUTTADEMO._id, type: "college_course" }, performance: { grade: "A" }, skills: itemSkills.slice(0, 3), examDate: new Date("2026-05-20") } },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );
        await Training.findOneAndUpdate(
          { studentId: additionalStudent._id, name: `${item.name} Full-stack Foundations` },
          { $setOnInsert: { studentId: additionalStudent._id, name: `${item.name} Full-stack Foundations`, description: "University of Calcutta demo training covering practical delivery, collaboration, and role-aligned technical skills.", provider: { type: "external", externalProviderName: "P.A.R.P.A.S. Demo Academy" }, type: "course", startedAt: new Date("2026-01-15"), completedAt: new Date("2026-03-15"), skills: itemSkills.slice(0, 3), certificate: { title: `${item.name} Full-stack Foundations`, issuer: "P.A.R.P.A.S. Demo Academy", issuedAt: new Date("2026-03-15"), hasAssessment: true, assessmentScore: 86 } } },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );
        await IndustryExperience.findOneAndUpdate(
          { studentId: additionalStudent._id, organisationId: organisation._id, role: "Product Engineering Trainee" },
          { $set: { studentId: additionalStudent._id, organisationId: organisation._id, type: "internship", role: "Product Engineering Trainee", description: `${item.name} contributed to a practical product engineering workstream for the University of Calcutta placement demo.`, skills: itemSkills.slice(0, 3), startedAt: new Date("2026-06-01"), endedAt: new Date("2026-08-31") } },
          { upsert: true, new: true, setDefaultsOnInsert: true, runValidators: true }
        );
      }
    }

    const additionalOrganisations = [
      { email: "hiring@technova-demo.example", name: "TechNova Labs", code: "TECHNOVA", industry: "Software platforms", opportunity: { title: "Product Engineering Associate", type: "job", requiredSkills: [{ skillId: skills.React._id, minScore: 7, required: true, weight: 1 }, { skillId: skills["Node.js"]._id, minScore: 6, required: true, weight: 1 }, { skillId: skills.Communication._id, minScore: 6, required: false, weight: .4 }] } },
      { email: "hiring@greengrid-demo.example", name: "GreenGrid Analytics", code: "GREENGRID", industry: "Data and sustainability", opportunity: { title: "Data Systems Fellow", type: "apprenticeship", requiredSkills: [{ skillId: skills.Python._id, minScore: 7, required: true, weight: 1 }, { skillId: skills.SQL._id, minScore: 7, required: true, weight: 1 }, { skillId: skills.Communication._id, minScore: 6, required: false, weight: .4 }] } },
    ];
    for (const item of additionalOrganisations) {
      const additionalOrganisationUser = await User.findOneAndUpdate(
        { email: item.email },
        { $setOnInsert: { name: `${item.name} Hiring`, email: item.email, accountType: "organisation", onboardingStatus: "in_progress" } },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      const additionalOrganisation = await Organisation.findOneAndUpdate(
        { userId: additionalOrganisationUser._id },
        { $setOnInsert: { userId: additionalOrganisationUser._id, name: item.name, code: item.code, industry: item.industry, isVerified: true, isActive: true } },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      await IndustryOpportunity.findOneAndUpdate(
        { organisationId: additionalOrganisation._id, title: item.opportunity.title },
        { $setOnInsert: { organisationId: additionalOrganisation._id, ...item.opportunity, description: `Demo role at ${item.name}.`, location: "Remote", mode: "remote", applicationDeadline: new Date("2027-12-31"), isActive: true } },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    }
    const careerRoles = [
      { name: "Backend Developer", code: "backend_developer", description: "Build reliable APIs and data services.", skills: [["Python", 8, 1], ["Node.js", 7, 1], ["SQL", 7, .8], ["Git", 6, .5]] },
      { name: "Frontend Engineer", code: "frontend_engineer", description: "Create accessible, production-ready interfaces.", skills: [["React", 8, 1], ["Git", 6, .6], ["Communication", 6, .4]] },
      { name: "Full-stack Engineer", code: "full_stack_engineer", description: "Work across product interfaces, APIs, and data.", skills: [["React", 8, 1], ["Node.js", 7, 1], ["Python", 7, .8], ["SQL", 7, .8]] },
    ];
    for (const role of careerRoles) {
      await CareerRole.findOneAndUpdate(
        { code: role.code },
        { $setOnInsert: { name: role.name, code: role.code, description: role.description, skills: role.skills.map(([name, targetLevel, weight]) => ({ skillId: skills[name]._id, targetLevel, weight })), isActive: true } },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    }
    const learningOpportunities = [
      { title: "Advanced Python API Practice", type: "hands_on_training", description: "Build and test production-style Python APIs to close the backend readiness gap.", skills: [{ skillId: skills.Python._id, targetLevel: 9, required: true, weight: 1 }] },
      { title: "Backend Systems Lab", type: "course", description: "Practice Node.js, SQL, and service design through a guided backend project.", skills: [{ skillId: skills["Node.js"]._id, targetLevel: 8, required: true, weight: 1 }, { skillId: skills.SQL._id, targetLevel: 8, required: true, weight: .8 }] },
    ];
    for (const opportunity of learningOpportunities) {
      await LearningOpportunity.findOneAndUpdate(
        { title: opportunity.title, "provider.externalProviderName": "P.A.R.P.A.S. Demo Academy" },
        { $setOnInsert: { ...opportunity, provider: { type: "external", externalProviderName: "P.A.R.P.A.S. Demo Academy" }, deliveryMode: "online", registrationDeadline: new Date("2027-12-31"), isActive: true } },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    }
    return res.status(200).json({ message: "Demo student, verified project, University of Calcutta opportunities, and career roles are ready", skillCount: profile.skills.length, projectId: project._id, organisation: organisation.name, opportunityCount: opportunities.length });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

module.exports = { getByUser, updateProfile, consentToLink, requestLink, approveLink, loadDemoData };

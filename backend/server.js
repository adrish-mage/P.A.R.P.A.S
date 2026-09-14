require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");

const authRoutes = require("./routes/authRoutes");
const institutionRoutes = require("./routes/institutionRoutes");
const organisationRoutes = require("./routes/organisationRoutes");
const membershipRoutes = require("./routes/membershipRoutes");
const studentProfileRoutes = require("./routes/studentProfileRoutes");
const professionalProfileRoutes = require("./routes/professionalProfileRoutes");

const verificationRoutes = require("./routes/verificationRoutes");
const skillRoutes = require("./routes/skillRoutes");
const skillEvidenceRoutes = require("./routes/skillEvidenceRoutes");

const skillProfileRoutes = require("./routes/skillProfileRoutes");
const academicRecordRoutes = require("./routes/academicRecordRoutes");
const trainingRoutes = require("./routes/trainingRoutes");
const projectRoutes = require("./routes/projectRoutes");
const industryExperienceRoutes = require("./routes/industryExperienceRoutes");
const growthMapRoutes = require("./routes/growthMapRoutes");

const industryFollowRoutes = require("./routes/industryFollowRoutes");
const industryOpportunityRoutes = require("./routes/industryOpportunityRoutes");
const industryApplicationRoutes = require("./routes/industryApplicationRoutes");
const learningOpportunityRoutes = require("./routes/learningOpportunityRoutes");
const learningEnrollmentRoutes = require("./routes/learningEnrollmentRoutes");
const opportunityShortlistRoutes = require("./routes/opportunityShortlistRoutes");

const insightsRoutes = require("./routes/insightsRoutes");

const app = express();
const authMiddleware = require("./middleware/authMiddleware");

const allowedOrigins = (process.env.FRONTEND_ORIGIN || "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(cors({ origin: allowedOrigins }));
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

app.use("/api", (req, res, next) => {
  if (req.path.startsWith("/auth")) return next();
  return authMiddleware(req, res, next);
});

app.use("/api/auth", authRoutes);
app.use("/api/institutions", institutionRoutes);
app.use("/api/organisations", organisationRoutes);
app.use("/api/memberships", membershipRoutes);
app.use("/api/student-profile", studentProfileRoutes);
app.use("/api/professional-profile", professionalProfileRoutes);

app.use("/api/verification", verificationRoutes);
app.use("/api/skills", skillRoutes);
app.use("/api/skill-evidence", skillEvidenceRoutes);

app.use("/api/skill-profile", skillProfileRoutes);
app.use("/api/academic-records", academicRecordRoutes);
app.use("/api/training", trainingRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/industry-experience", industryExperienceRoutes);
app.use("/api/growth-map", growthMapRoutes);

app.use("/api/industry-follow", industryFollowRoutes);
app.use("/api/industry-opportunities", industryOpportunityRoutes);
app.use("/api/industry-applications", industryApplicationRoutes);
app.use("/api/learning-opportunities", learningOpportunityRoutes);
app.use("/api/learning-enrollments", learningEnrollmentRoutes);
app.use("/api/opportunity-shortlist", opportunityShortlistRoutes);

app.use("/api/insights", insightsRoutes);

const PORT = process.env.PORT || 6767;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});

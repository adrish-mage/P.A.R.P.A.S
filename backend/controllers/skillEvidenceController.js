const crudFactory = require("../utilities/crudFactory");
const SkillEvidence = require("../models/SkillEvidence");

module.exports = crudFactory(SkillEvidence, { userField: "studentId" });

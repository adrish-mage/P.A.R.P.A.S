const express = require("express");
const router = express.Router();
const {
  getInstitution,
  listVerified,
  listPending,
  verifyInstitution,
  linkStudents,
  listStudentRequests,
  decideStudentRequest,
  inviteProfessional,
  listLinkedProfessionals,
} = require("../controllers/institutionController");

router.get("/pending", listPending);
router.get("/verified", listVerified);
router.get("/:id", getInstitution);
router.get("/:id/professionals", listLinkedProfessionals);
router.get("/:id/student-requests", listStudentRequests);
router.put("/:id/verify", verifyInstitution);
router.post("/:id/link-students", linkStudents);
router.post("/:id/invite", inviteProfessional);
router.put("/:id/student-requests/:userId", decideStudentRequest);

module.exports = router;

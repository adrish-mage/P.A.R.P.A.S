const express = require("express");
const router = express.Router();
const {
  getOrganisation,
  listPending,
  listCandidates,
  verifyOrganisation,
  inviteEmployee,
} = require("../controllers/organisationController");

router.get("/pending", listPending);
router.get("/candidates", listCandidates);
router.get("/:id", getOrganisation);
router.put("/:id/verify", verifyOrganisation);
router.post("/:id/invite", inviteEmployee);

module.exports = router;

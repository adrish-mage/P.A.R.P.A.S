const express = require("express");
const router = express.Router();
const {
  postRequest,
  postDecision,
  getAuditTrail,
  getInbox,
} = require("../controllers/verificationController");

router.post("/request", postRequest);
router.post("/decide", postDecision);
router.get("/entry/:entryType/:entryId", getAuditTrail);
router.get("/inbox/:endorserId", getInbox);

module.exports = router;

const express = require("express");
const router = express.Router();
const {
  getByUser,
  updateProfile,
  consentToLink,
  requestLink,
  approveLink,
  loadDemoData,
} = require("../controllers/studentProfileController");

router.post("/demo-data", loadDemoData);
router.get("/:userId", getByUser);
router.put("/:userId", updateProfile);
router.put("/:userId/consent-link", consentToLink);
router.put("/:userId/request-link", requestLink);
router.put("/:userId/approve-link", approveLink);

module.exports = router;

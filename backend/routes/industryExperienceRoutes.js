const express = require("express");
const router = express.Router();
const {
  createIndustryExperienceEntry,
  getIndustryExperienceByUser,
  getIndustryExperienceById,
  updateIndustryExperienceEntry,
  deleteIndustryExperienceEntry,
} = require("../controllers/industryExperienceController");

router.post("/", createIndustryExperienceEntry);
router.get("/user/:userId", getIndustryExperienceByUser);
router.get("/:id", getIndustryExperienceById);
router.put("/:id", updateIndustryExperienceEntry);
router.delete("/:id", deleteIndustryExperienceEntry);

module.exports = router;

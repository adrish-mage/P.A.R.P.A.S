const express = require("express");
const router = express.Router();
const {
  createSkillProfile,
  getSkillProfile,
  updateSkillProfile,
  deleteSkillProfile,
} = require("../controllers/skillProfileController");

router.post("/", createSkillProfile);
router.get("/:userId", getSkillProfile);
router.put("/:userId", updateSkillProfile);
router.delete("/:userId", deleteSkillProfile);

module.exports = router;

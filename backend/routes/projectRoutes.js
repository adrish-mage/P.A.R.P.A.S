const express = require("express");
const router = express.Router();
const {
  createProjectEntry,
  getProjectsByUser,
  getProjectById,
  updateProjectEntry,
  deleteProjectEntry,
} = require("../controllers/projectController");

router.post("/", createProjectEntry);
router.get("/user/:userId", getProjectsByUser);
router.get("/:id", getProjectById);
router.put("/:id", updateProjectEntry);
router.delete("/:id", deleteProjectEntry);

module.exports = router;

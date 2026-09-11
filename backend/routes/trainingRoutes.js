const express = require("express");
const router = express.Router();
const {
  createTrainingEntry,
  getTrainingByUser,
  getTrainingById,
  updateTrainingEntry,
  deleteTrainingEntry,
} = require("../controllers/trainingController");

router.post("/", createTrainingEntry);
router.get("/user/:userId", getTrainingByUser);
router.get("/:id", getTrainingById);
router.put("/:id", updateTrainingEntry);
router.delete("/:id", deleteTrainingEntry);

module.exports = router;

const express = require("express");
const router = express.Router();
const {
  createGrowthMap,
  getGrowthMap,
  updateGrowthMap,
  deleteGrowthMap,
} = require("../controllers/growthMapController");

router.post("/", createGrowthMap);
router.get("/:userId", getGrowthMap);
router.put("/:userId", updateGrowthMap);
router.delete("/:userId", deleteGrowthMap);

module.exports = router;

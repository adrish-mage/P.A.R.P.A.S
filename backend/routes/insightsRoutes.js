const express = require("express");
const router = express.Router();
const {skillGap, placementInsights, growthMapRecommend, resumeParse, intelligentMatch,} = require("../controllers/insightsController");
router.post("/skill-gap", skillGap);
router.post("/placement", placementInsights);
router.post("/growth-map-recommend", growthMapRecommend);
router.post("/resume-parse", resumeParse);
router.post("/match", intelligentMatch);
module.exports = router;

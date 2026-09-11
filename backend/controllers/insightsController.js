const matchingClient = require("../services/matchingClient");

async function skillGap(req, res) {
  const result = await matchingClient.getSkillGap(req.body);
  return res.status(200).json(result);
}

async function placementInsights(req, res) {
  const result = await matchingClient.getPlacementInsights(req.body);
  return res.status(200).json(result);
}

async function growthMapRecommend(req, res) {
  const result = await matchingClient.getGrowthMapRecommendations(req.body);
  return res.status(200).json(result);
}

async function resumeParse(req, res) {
  const result = await matchingClient.parseDocument(req.body);
  return res.status(200).json(result);
}

module.exports = { skillGap, placementInsights, growthMapRecommend, resumeParse };

const matchingClient = require("../services/matchingClient");
const {generateSkillGap} = require("../services/skillGapService");
const {generateGrowthMap,} = require("../services/growthMapService");
async function skillGap(req, res) {
  try {
    const { careerRoleId } = req.body;
    if (!careerRoleId) {
      return res.status(400).json({
        message: "careerRoleId is required",
      });
    }
    const result = await generateSkillGap({userId: req.user.id, careerRoleId,});
    return res.status(200).json(result);
  } catch (err) {
    return res.status(err.statusCode || 500).json({
      message: err.message,
    });
  }
}

async function placementInsights(req, res) {
  const result = await matchingClient.getPlacementInsights(req.body);
  return res.status(200).json(result);
}

async function growthMapRecommend(req, res) {
  try {
    const { careerRoleId } = req.body;
    if (!careerRoleId) {
      return res.status(400).json({
        message: "careerRoleId is required",
      });
    }
    const result = await generateGrowthMap({
      userId: req.user.id,
      careerRoleId,
    });
    return res.status(201).json(result);
  } catch (err) {
    return res.status(err.statusCode || 500).json({
      message: err.message,
    });
  }
}

async function resumeParse(req, res) {
  const result = await matchingClient.parseDocument(req.body);
  return res.status(200).json(result);
}

module.exports = { skillGap, placementInsights, growthMapRecommend, resumeParse };

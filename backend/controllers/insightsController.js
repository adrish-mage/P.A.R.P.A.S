const matchingClient = require("../services/matchingClient");
const {generateSkillGap} = require("../services/skillGapService");
const {generateGrowthMap,} = require("../services/growthMapService");
const { generatePlacementInsights } = require("../services/placementInsightsService");
const { parseResume } = require("../services/resumeParseService");
const { generateIntelligentMatching } = require("../services/intelligentMatchingService");
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
  try {
    const { institutionId, cohort } = req.body;
    if (!institutionId || cohort == null) {
      return res.status(400).json({
        message: "institutionId and cohort are required",
      });
    }
    const result = await generatePlacementInsights({
      userId: req.user.id,
      institutionId,
      cohort,
    });
    return res.status(200).json(result);
  } catch (err) {
    return res.status(err.statusCode || 500).json({ message: err.message });
  }
}

async function resumeParse(req, res) {
  try {
    const result = await parseResume({
      documentText: req.body.documentText,
    });
    return res.status(200).json(result);
  } catch (err) {
    return res.status(err.statusCode || 500).json({ message: err.message });
  }
}

async function intelligentMatch(req, res) {
  try {
    const result = await generateIntelligentMatching({
      userId: req.user.id,
    });
    return res.status(200).json(result);
  } catch (err) {
    return res.status(err.statusCode || 500).json({ message: err.message });
  }
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

module.exports = {skillGap, placementInsights, growthMapRecommend, resumeParse, intelligentMatch,};

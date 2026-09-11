const BASE = process.env.PYTHON_PREDICTIVE_BASE;

async function safePost(path, payload, fallback) {
  if (!BASE) return fallback;
  try {
    const res = await fetch(`${BASE}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) return fallback;
    return await res.json();
  } catch (_err) {
    return fallback;
  }
}

async function getSkillGap(payload) {
  return safePost("/skill-gap", payload, { missingSkillIds: [], matchScore: 0, note: "Python intelligence service not configured" });
}

async function getPlacementInsights(payload) {
  return safePost("/placement-insights", payload, { predictedPlacementRate: null, topSkillGaps: [], note: "Python intelligence service not configured" });
}

async function getGrowthMapRecommendations(payload) {
  return safePost("/growth-map/recommend", payload, { recommendedSkillIds: [], note: "Python intelligence service not configured" });
}

async function parseDocument(payload) {
  return safePost("/resume-parse", payload, { extractedSkillNames: [], note: "Python intelligence service not configured" });
}

module.exports = { getSkillGap, getPlacementInsights, getGrowthMapRecommendations, parseDocument };

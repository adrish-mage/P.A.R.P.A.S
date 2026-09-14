const BASE = process.env.PYTHON_PREDICTIVE_BASE;

function localSkillGap({ studentSkills = [], targetRoleSkills = [] }) {
  const scores = new Map(studentSkills.map((skill) => [String(skill.skillId), Number(skill.score) || 0]));
  const skillGaps = targetRoleSkills.map((target) => {
    const targetScore = Math.max(0, Number(target.targetLevel) || 0);
    const currentScore = Math.min(10, Math.max(0, scores.get(String(target.skillId)) || 0));
    const gap = Math.max(0, targetScore - currentScore);
    return {
      skillId: String(target.skillId),
      currentScore,
      targetScore,
      gap,
      weight: Number(target.weight) || 1,
      priority: gap >= 4 ? "high" : gap >= 2 ? "medium" : "low",
    };
  });
  const totalWeight = skillGaps.reduce((sum, skill) => sum + skill.weight, 0);
  const weightedReadiness = totalWeight
    ? skillGaps.reduce((sum, skill) => sum + Math.min(skill.currentScore / Math.max(skill.targetScore, 1), 1) * skill.weight, 0) / totalWeight
    : 0;
  return { skillGaps, matchScore: Math.round(weightedReadiness * 10000) / 10000, note: "Calculated locally because Python intelligence service is unavailable" };
}

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
  return safePost("/skill-gap", payload, localSkillGap(payload));
}

async function getPlacementInsights(payload) {
  return safePost("/placement-insights", payload, {predictedPlacementRate: null, topSkillGaps: [], note: "Python intelligence service not configured",});}

async function parseDocument(payload) {
  return safePost("/resume-parse", payload, {extractedSkillNames: [], note: "Python intelligence service not configured",});}

async function getIntelligentMatching(payload) {
  return safePost("/match", payload, {matches: [], note: "Python intelligence service not configured",});}

async function getGrowthMapRecommendations(payload) {
  return safePost("/growth-map/recommend", payload, {skillGaps: [], recommendations: [], note: "Python intelligence service not configured",});}

module.exports = { getSkillGap, getPlacementInsights, getGrowthMapRecommendations, parseDocument, getIntelligentMatching };

def _priority_label(weighted_gap: float) -> str:
    if weighted_gap >= 2:
        return "high"
    if weighted_gap >= 0.75:
        return "medium"
    return "low"
def calculate_skill_gaps(student_skills, target_role_skills,):
    student_lookup = {skill.skillId: skill.score for skill in student_skills}
    gaps = []
    for target in target_role_skills:
        current = student_lookup.get(target.skillId, 0.0,)
        gap = max(0.0, target.targetLevel - current,)
        weighted_gap = gap * target.weight
        gaps.append({
            "skillId": target.skillId,
            "currentScore": current,
            "targetScore": target.targetLevel,
            "gap": round(gap, 4),
            "weight": target.weight,
            "priority": _priority_label(weighted_gap),
            "_weightedGap": weighted_gap,
        })
    gaps.sort(key=lambda item: item["_weightedGap"], reverse=True,)
    for gap in gaps:
        gap.pop("_weightedGap", None)
    return gaps
def recommend_learning_opportunities(skill_gaps, opportunities,):
    gap_lookup = {gap["skillId"]: gap for gap in skill_gaps if gap["gap"] > 0}
    current_score_lookup = {gap["skillId"]: gap["currentScore"] for gap in skill_gaps}
    recommendations = []
    for opportunity in opportunities:
        target_skills = []
        total_score = 0.0
        for opportunity_skill in opportunity.skills:
            gap = gap_lookup.get(opportunity_skill.skillId)
            if not gap:
                continue
            if opportunity_skill.targetLevel is not None:
                current_score = current_score_lookup[opportunity_skill.skillId]
                potential_improvement = max(0.0, opportunity_skill.targetLevel - current_score,)
                expected_improvement = min(gap["gap"], potential_improvement,)
            else:
                expected_improvement = gap["gap"]
            contribution = (gap["gap"] * gap.get("weight", 1) * opportunity_skill.weight)
            total_score += contribution
            target_skills.append({
                "skillId": opportunity_skill.skillId,
                "expectedImprovement": round(
                    expected_improvement,
                    4,
                ),
            })
        if not target_skills:
            continue
        priority = min(100.0, total_score * 25,)
        covered = ", ".join(skill["skillId"] for skill in target_skills)
        recommendations.append({
            "opportunityId": opportunity.opportunityId,
            "title": opportunity.title,
            "reason": (
                "Addresses the student's current skill gaps "
                f"in: {covered}."
            ),
            "targetSkills": target_skills,
            "priority": round(priority, 4),
        })
    recommendations.sort(key=lambda item: item["priority"], reverse=True,)
    return recommendations
def generate_growth_map(student_skills, target_role_skills, learning_opportunities,):
    skill_gaps = calculate_skill_gaps(student_skills, target_role_skills,)
    recommendations = recommend_learning_opportunities(skill_gaps, learning_opportunities,)
    return skill_gaps, recommendations
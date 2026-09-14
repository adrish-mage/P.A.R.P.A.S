def calculate_skill_gap(student_skills, target_role_skills,):
    student_lookup = {skill.skillId: skill.score for skill in student_skills}
    skill_gaps = []
    total_weight = sum(skill.weight for skill in target_role_skills)
    if total_weight == 0:
        return [], 0.0
    weighted_attainment = 0.0
    for target_skill in target_role_skills:
        current_score = student_lookup.get(target_skill.skillId, 0.0)
        target_score = target_skill.targetLevel
        gap = max(0.0, target_score - current_score)
        attainment = min(current_score/target_score, 1.0)
        priority = gap * target_skill.weight
        weighted_attainment += (attainment * target_skill.weight)
        skill_gaps.append({
            "skillId": target_skill.skillId,
            "currentScore": current_score,
            "targetScore": target_score,
            "gap": round(gap, 4),
            "weight": target_skill.weight,
            "attainment": round(attainment, 4),
            "priority": round(priority, 4),
        })
    match_score = weighted_attainment / total_weight
    skill_gaps.sort(key=lambda skill: skill["priority"], reverse=True,)
    return skill_gaps, round(match_score, 4)
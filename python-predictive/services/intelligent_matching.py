def _student_lookup(student_skills):
    return {skill.skillId: skill.score for skill in student_skills}
def _score_opportunity(student_lookup, opportunity):
    if not opportunity.requiredSkills:
        return 0.0, [], []
    total_weight = sum(skill.weight for skill in opportunity.requiredSkills)
    weighted_attainment = 0.0
    matched_skills = []
    missing_required = []
    for required in opportunity.requiredSkills:
        current = student_lookup.get(required.skillId, 0.0)
        required_score = required.minScore
        if required_score is None:
            attainment = current / 10.0
            gap = max(0.0, 10.0 - current)
        else:
            attainment = min(1.0, current / required_score)
            gap = max(0.0, required_score - current)
        weighted_attainment += attainment * required.weight
        matched_skills.append(
            {
                "skillId": required.skillId,
                "currentScore": current,
                "requiredScore": required_score,
                "gap": round(gap, 4),
            }
        )
        if required.required and (
            current <= 0 or (required_score is not None and current < required_score)
        ):
            missing_required.append(required.skillId)

    score = 100.0 * weighted_attainment / total_weight
    return round(score, 4), matched_skills, missing_required
def rank_opportunities(student_skills, opportunities):
    student_lookup = _student_lookup(student_skills)
    matches = []
    for opportunity in opportunities:
        score, matched_skills, missing_required = _score_opportunity(
            student_lookup,
            opportunity,
        )
        matches.append(
            {
                "opportunityId": opportunity.opportunityId,
                "title": opportunity.title,
                "matchScore": score,
                "matchedSkills": matched_skills,
                "missingRequiredSkillIds": missing_required,
            }
        )
    matches.sort(key=lambda item: item["matchScore"], reverse=True)
    return matches
def generate_matching(student_skills, opportunities):
    return {"matches": rank_opportunities(student_skills, opportunities)}
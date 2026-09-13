from collections import defaultdict
def predict_placement_rate(students) -> float | None:
    if not students:
        return None
    readiness = sum(student.readinessScore for student in students)/len(students)
    return round(readiness / 100.0, 4)
def find_top_skill_gaps(students, limit: int = 5) -> list[str]:
    weighted_gaps = defaultdict(float)
    for student in students:
        for gap in student.skillGaps:
            weighted_gaps[gap.skillId] += gap.gap * gap.weight
    ranked = sorted(weighted_gaps.items(), key=lambda item: item[1], reverse=True,)
    return [skill_id for skill_id, _score in ranked[:limit]]
def generate_placement_insights(students):
    return {
        "predictedPlacementRate": predict_placement_rate(students),
        "topSkillGaps": find_top_skill_gaps(students),
    }
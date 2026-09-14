from schemas.placement_insights import (PlacementStudent, PlacementSkillGap,)
from services.placement_insights import generate_placement_insights
def test_placement_insights():
    students = [
        PlacementStudent(
            studentId="student-1",
            readinessScore=80,
            skillGaps=[
                PlacementSkillGap(
                    skillId="python",
                    gap=2,
                    weight=1.5,
                ),
                PlacementSkillGap(
                    skillId="sql",
                    gap=1,
                    weight=1,
                ),
            ],
        ),
        PlacementStudent(
            studentId="student-2",
            readinessScore=60,
            skillGaps=[
                PlacementSkillGap(
                    skillId="python",
                    gap=3,
                    weight=1.5,
                ),
            ],
        ),
    ]
    result = generate_placement_insights(students)
    assert result["predictedPlacementRate"] == 0.70
    assert result["topSkillGaps"][0] == "python"
def test_placement_insights_empty_cohort():
    result = generate_placement_insights([])
    assert result["predictedPlacementRate"] is None
    assert result["topSkillGaps"] == []
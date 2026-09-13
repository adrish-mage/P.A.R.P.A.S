from schemas.intelligent_matching import (StudentSkill, OpportunitySkill, OpportunityToMatch,)
from services.intelligent_matching import generate_matching
def test_intelligent_matching():
    student_skills = [
        StudentSkill(
            skillId="python",
            score=8,
        ),
        StudentSkill(
            skillId="sql",
            score=6,
        ),
    ]
    opportunities = [
        OpportunityToMatch(
            opportunityId="job-1",
            title="Python Developer",
            requiredSkills=[
                OpportunitySkill(
                    skillId="python",
                    minScore=7,
                    required=True,
                    weight=2,
                ),
                OpportunitySkill(
                    skillId="sql",
                    minScore=7,
                    required=True,
                    weight=1,
                ),
            ],
        ),
        OpportunityToMatch(
            opportunityId="job-2",
            title="Backend Developer",
            requiredSkills=[
                OpportunitySkill(
                    skillId="python",
                    minScore=6,
                    required=True,
                    weight=2,
                ),
            ],
        ),
    ]
    result = generate_matching(student_skills, opportunities)
    assert len(result["matches"]) == 2
    expected_job_1_score = round((2 + 6/7) / 3 * 100, 4)
    assert result["matches"][0]["opportunityId"] == "job-2"
    assert result["matches"][0]["matchScore"] == 100
    assert result["matches"][1]["opportunityId"] == "job-1"
    assert result["matches"][1]["matchScore"] == expected_job_1_score
def test_intelligent_matching_missing_required_skill():
    student_skills = [
        StudentSkill(
            skillId="python",
            score=8,
        )
    ]
    opportunities = [
        OpportunityToMatch(
            opportunityId="job-1",
            title="Full Stack Developer",
            requiredSkills=[
                OpportunitySkill(
                    skillId="python",
                    minScore=7,
                    required=True,
                    weight=1,
                ),
                OpportunitySkill(
                    skillId="react",
                    minScore=6,
                    required=True,
                    weight=1,
                ),
            ],
        )
    ]
    result = generate_matching(student_skills, opportunities)
    match = result["matches"][0]
    assert "react" in match["missingRequiredSkillIds"]
def test_intelligent_matching_empty_opportunities():
    student_skills = [
        StudentSkill(
            skillId="python",
            score=8,
        )
    ]
    result = generate_matching(student_skills, [])
    assert result["matches"] == []
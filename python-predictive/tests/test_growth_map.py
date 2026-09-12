from schemas.growth_map import (
    StudentSkill,
    TargetRoleSkill,
    LearningOpportunityInput,
    OpportunitySkill,
)
from services.growth_map_logic import (
    calculate_skill_gaps,
    recommend_learning_opportunities,
    generate_growth_map,
)
def test_calculate_skill_gaps():
    student_skills = [
        StudentSkill(skillId="python", score=7),
        StudentSkill(skillId="docker", score=3),
    ]
    target_role_skills = [
        TargetRoleSkill(
            skillId="python",
            targetLevel=8,
            weight=0.4,
        ),
        TargetRoleSkill(
            skillId="docker",
            targetLevel=7,
            weight=0.6,
        ),
    ]
    gaps = calculate_skill_gaps(
        student_skills,
        target_role_skills,
    )
    assert len(gaps) == 2
    docker = gaps[0]
    python = gaps[1]
    assert docker["skillId"] == "docker"
    assert docker["currentScore"] == 3
    assert docker["targetScore"] == 7
    assert docker["gap"] == 4
    assert docker["weight"] == 0.6
    assert docker["priority"] == "high"
    assert python["skillId"] == "python"
    assert python["currentScore"] == 7
    assert python["targetScore"] == 8
    assert python["gap"] == 1
    assert python["weight"] == 0.4
    assert python["priority"] == "low"
def test_missing_student_skill_defaults_to_zero():
    student_skills = [
        StudentSkill(
            skillId="python",
            score=7,
        )
    ]
    target_role_skills = [
        TargetRoleSkill(
            skillId="docker",
            targetLevel=7,
            weight=0.6,
        )
    ]
    gaps = calculate_skill_gaps(
        student_skills,
        target_role_skills,
    )
    assert len(gaps) == 1
    assert gaps[0]["skillId"] == "docker"
    assert gaps[0]["currentScore"] == 0
    assert gaps[0]["targetScore"] == 7
    assert gaps[0]["gap"] == 7
    assert gaps[0]["priority"] == "high"
def test_no_gap_when_student_exceeds_target():
    student_skills = [
        StudentSkill(
            skillId="python",
            score=9,
        )
    ]
    target_role_skills = [
        TargetRoleSkill(
            skillId="python",
            targetLevel=7,
            weight=0.4,
        )
    ]
    gaps = calculate_skill_gaps(
        student_skills,
        target_role_skills,
    )
    assert gaps[0]["gap"] == 0
    assert gaps[0]["priority"] == "low"
def test_recommendations_are_ranked_by_priority():
    student_skills = [
        StudentSkill(skillId="python", score=7),
        StudentSkill(skillId="docker", score=3),
    ]
    target_role_skills = [
        TargetRoleSkill(
            skillId="python",
            targetLevel=8,
            weight=0.4,
        ),
        TargetRoleSkill(
            skillId="docker",
            targetLevel=7,
            weight=0.6,
        ),
    ]
    gaps = calculate_skill_gaps(
        student_skills,
        target_role_skills,
    )
    opportunities = [
        LearningOpportunityInput(
            opportunityId="python-course",
            title="Advanced Python",
            skills=[
                OpportunitySkill(
                    skillId="python",
                    targetLevel=9,
                    required=True,
                    weight=1,
                )
            ],
        ),
        LearningOpportunityInput(
            opportunityId="docker-course",
            title="Docker for Developers",
            skills=[
                OpportunitySkill(
                    skillId="docker",
                    targetLevel=7,
                    required=True,
                    weight=1,
                )
            ],
        ),
    ]
    recommendations = recommend_learning_opportunities(
        gaps,
        opportunities,
    )
    assert len(recommendations) == 2
    assert recommendations[0]["opportunityId"] == "docker-course"
    assert recommendations[1]["opportunityId"] == "python-course"
    assert recommendations[0]["priority"] > recommendations[1]["priority"]
def test_expected_improvement_respects_opportunity_target_level():
    student_skills = [
        StudentSkill(
            skillId="docker",
            score=6,
        )
    ]
    target_role_skills = [
        TargetRoleSkill(
            skillId="docker",
            targetLevel=10,
            weight=0.6,
        )
    ]
    gaps = calculate_skill_gaps(student_skills, target_role_skills,)
    opportunities = [
        LearningOpportunityInput(
            opportunityId="docker-course",
            title="Docker for Developers",
            skills=[
                OpportunitySkill(
                    skillId="docker",
                    targetLevel=7,
                    required=True,
                    weight=1,
                )
            ],
        )
    ]
    recommendations = recommend_learning_opportunities(gaps, opportunities,)
    assert len(recommendations) == 1
    target_skill = recommendations[0]["targetSkills"][0]
    assert target_skill["expectedImprovement"] == 1
def test_generate_growth_map():
    student_skills = [
        StudentSkill(
            skillId="docker",
            score=3,
        )
    ]
    target_role_skills = [
        TargetRoleSkill(
            skillId="docker",
            targetLevel=7,
            weight=0.6,
        )
    ]
    opportunities = [
        LearningOpportunityInput(
            opportunityId="docker-course",
            title="Docker for Developers",
            skills=[
                OpportunitySkill(
                    skillId="docker",
                    targetLevel=7,
                    required=True,
                    weight=1,
                )
            ],
        )
    ]
    skill_gaps, recommendations = generate_growth_map(
        student_skills,
        target_role_skills,
        opportunities,
    )
    assert len(skill_gaps) == 1
    assert len(recommendations) == 1
    assert skill_gaps[0]["skillId"] == "docker"
    assert skill_gaps[0]["gap"] == 4
    assert recommendations[0]["opportunityId"] == "docker-course"
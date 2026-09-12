import pytest
from schemas.skill_gap import (StudentSkill, TargetRoleSkill, SkillGapRequest,)
from services.skill_gap_logic import calculate_skill_gap
def test_weighted_skill_gap():
    student_skills = [
        StudentSkill(skillId="python", score=7),
        StudentSkill(skillId="docker", score=3),
        StudentSkill(skillId="fastapi", score=6),
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
            weight=0.2,
        ),
        TargetRoleSkill(
            skillId="fastapi",
            targetLevel=8,
            weight=0.4,
        ),
    ]
    gaps, match_score = calculate_skill_gap(student_skills, target_role_skills,)
    assert match_score == 0.7357
    assert len(gaps) == 3
def test_missing_skill():
    student_skills = [StudentSkill(skillId="python", score=7),]
    target_role_skills = [
        TargetRoleSkill(
            skillId="python",
            targetLevel=8,
            weight=0.5,
        ),
        TargetRoleSkill(
            skillId="docker",
            targetLevel=7,
            weight=0.5,
        ),
    ]
    gaps, match_score = calculate_skill_gap(student_skills, target_role_skills,)
    docker_gap = next(gap for gap in gaps if gap["skillId"] == "docker")
    assert docker_gap["currentScore"] == 0
    assert docker_gap["gap"] == 7
    assert match_score == 0.4375
def test_score_above_target_is_capped():
    student_skills = [StudentSkill(skillId="python", score=10),]
    target_role_skills = [TargetRoleSkill(skillId="python", targetLevel=8, weight=1.0,),]
    gaps, match_score = calculate_skill_gap(student_skills, target_role_skills,)
    assert gaps[0]["gap"] == 0
    assert gaps[0]["attainment"] == 1.0
    assert match_score == 1.0
def test_empty_target_skills():
    gaps, match_score = calculate_skill_gap([], [],)
    assert gaps == []
    assert match_score == 0.0
def test_duplicate_student_skill_ids_are_rejected():
    with pytest.raises(ValueError):
        SkillGapRequest(
            studentSkills=[
                StudentSkill(
                    skillId="python",
                    score=5,
                ),
                StudentSkill(
                    skillId="python",
                    score=8,
                ),
            ],
            targetRoleSkills=[],
        )
def test_duplicate_target_skill_ids_are_rejected():
    with pytest.raises(ValueError):
        SkillGapRequest(
            studentSkills=[],
            targetRoleSkills=[
                TargetRoleSkill(
                    skillId="python",
                    targetLevel=8,
                    weight=0.5,
                ),
                TargetRoleSkill(
                    skillId="python",
                    targetLevel=9,
                    weight=0.5,
                ),
            ],
        )
def test_invalid_score_is_rejected():
    with pytest.raises(ValueError):
        StudentSkill(skillId="python", score=11,)
def test_invalid_target_level_is_rejected():
    with pytest.raises(ValueError):
        TargetRoleSkill(skillId="python", targetLevel=0, weight=1,)
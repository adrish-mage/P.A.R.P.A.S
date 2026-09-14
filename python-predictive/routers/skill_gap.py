from fastapi import APIRouter
from schemas.skill_gap import (SkillGapRequest, SkillGapResponse,)
from services.skill_gap_logic import calculate_skill_gap
router = APIRouter(prefix="/skill-gap", tags=["Skill Gap"],)
@router.post("", response_model=SkillGapResponse)
def skill_gap(request: SkillGapRequest):
    skill_gaps, match_score = calculate_skill_gap(request.studentSkills, request.targetRoleSkills,)
    return SkillGapResponse(skillGaps=skill_gaps, matchScore=match_score,)
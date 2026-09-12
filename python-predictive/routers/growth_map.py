from fastapi import APIRouter
from schemas.growth_map import (GrowthMapRequest, GrowthMapResponse,)
from services.growth_map_logic import generate_growth_map
router = APIRouter(prefix="/growth-map", tags=["Growth Map"],)
@router.post("/recommend", response_model=GrowthMapResponse,)
def growth_map_recommend(request: GrowthMapRequest,):
    skill_gaps, recommendations = generate_growth_map(request.studentSkills, request.targetRoleSkills, request.learningOpportunities,)
    return GrowthMapResponse(skillGaps=skill_gaps, recommendations=recommendations,)
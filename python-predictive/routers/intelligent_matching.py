from fastapi import APIRouter
from schemas.intelligent_matching import MatchingRequest, MatchingResponse
from services.intelligent_matching import generate_matching
router = APIRouter(prefix="/match", tags=["Intelligent Matching"])
@router.post("", response_model=MatchingResponse)
def match_opportunities(request: MatchingRequest):
    return generate_matching(request.studentSkills, request.opportunities)

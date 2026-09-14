from fastapi import APIRouter
from schemas.placement_insights import (PlacementInsightsRequest, PlacementInsightsResponse,)
from services.placement_insights import generate_placement_insights
router = APIRouter(prefix="/placement-insights", tags=["Placement Insights"])
@router.post("", response_model=PlacementInsightsResponse)
def placement_insights(request: PlacementInsightsRequest):
    return generate_placement_insights(request.students)

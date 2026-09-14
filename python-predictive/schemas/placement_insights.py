from pydantic import BaseModel, Field
class PlacementSkillGap(BaseModel):
    skillId: str
    gap: float = Field(ge=0, le=10)
    weight: float = Field(gt=0)
class PlacementStudent(BaseModel):
    studentId: str
    readinessScore: float = Field(ge=0, le=100)
    skillGaps: list[PlacementSkillGap] = Field(default_factory=list)
class PlacementInsightsRequest(BaseModel):
    institutionId: str
    cohort: str
    students: list[PlacementStudent] = Field(default_factory=list)
class PlacementInsightsResponse(BaseModel):
    predictedPlacementRate: float | None = Field(default=None, ge=0, le=1)
    topSkillGaps: list[str] = Field(default_factory=list)

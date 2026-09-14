from pydantic import BaseModel, Field, field_validator
from typing import Literal
class StudentSkill(BaseModel):
    skillId: str
    score: float = Field(ge=0, le=10)
class TargetRoleSkill(BaseModel):
    skillId: str
    targetLevel: float = Field(ge=1, le=10)
    weight: float = Field(gt=0)
class OpportunitySkill(BaseModel):
    skillId: str
    targetLevel: float | None = Field(default=None, ge=1, le=10)
    required: bool = True
    weight: float = Field(gt=0)
class LearningOpportunityInput(BaseModel):
    opportunityId: str
    title: str
    skills: list[OpportunitySkill] = Field(default_factory=list)
    @field_validator("skills")
    @classmethod
    def validate_skill_ids(cls, skills):
        ids = [skill.skillId for skill in skills]
        if len(ids) != len(set(ids)):
            raise ValueError("Duplicate skill IDs are not allowed")
        return skills
class GrowthMapRequest(BaseModel):
    studentSkills: list[StudentSkill] = Field(default_factory=list)
    targetRoleSkills: list[TargetRoleSkill] = Field(default_factory=list)
    learningOpportunities: list[LearningOpportunityInput] = Field(default_factory=list)
class SkillGapResult(BaseModel):
    skillId: str
    currentScore: float
    targetScore: float
    gap: float
    weight: float
    priority: Literal["low", "medium", "high"]
class RecommendationTargetSkill(BaseModel):
    skillId: str
    expectedImprovement: float = Field(ge=0, le=10,)
class GrowthMapRecommendation(BaseModel):
    opportunityId: str
    title: str
    reason: str
    targetSkills: list[RecommendationTargetSkill]
    priority: float = Field(ge=0, le=100)
class GrowthMapResponse(BaseModel):
    skillGaps: list[SkillGapResult]
    recommendations: list[GrowthMapRecommendation]
from pydantic import BaseModel, Field, field_validator
class StudentSkill(BaseModel):
    skillId: str
    score: float = Field(ge=0, le=10)
class OpportunitySkill(BaseModel):
    skillId: str
    minScore: float | None = Field(default=None, ge=1, le=10)
    required: bool = True
    weight: float = Field(gt=0)
class OpportunityToMatch(BaseModel):
    opportunityId: str
    title: str
    requiredSkills: list[OpportunitySkill] = Field(default_factory=list)
    @field_validator("requiredSkills")
    @classmethod
    def validate_skill_ids(cls, skills):
        ids = [skill.skillId for skill in skills]
        if len(ids) != len(set(ids)):
            raise ValueError("Duplicate skill IDs are not allowed")
        return skills
class MatchingRequest(BaseModel):
    studentSkills: list[StudentSkill] = Field(default_factory=list)
    opportunities: list[OpportunityToMatch] = Field(default_factory=list)
class MatchedSkill(BaseModel):
    skillId: str
    currentScore: float
    requiredScore: float | None = None
    gap: float = Field(ge=0, le=10)
class OpportunityMatch(BaseModel):
    opportunityId: str
    title: str
    matchScore: float = Field(ge=0, le=100)
    matchedSkills: list[MatchedSkill] = Field(default_factory=list)
    missingRequiredSkillIds: list[str] = Field(default_factory=list)
class MatchingResponse(BaseModel):
    matches: list[OpportunityMatch] = Field(default_factory=list)

from pydantic import BaseModel, Field, field_validator
class StudentSkill(BaseModel):
    skillId: str
    score: float = Field(ge=0, le=10)
class TargetRoleSkill(BaseModel):
    skillId: str
    targetLevel: float = Field(gt=0, le=10)
    weight: float = Field(gt=0)
class SkillGapRequest(BaseModel):
    studentSkills: list[StudentSkill] = Field(default_factory=list)
    targetRoleSkills: list[TargetRoleSkill] = Field(default_factory=list)
    @field_validator("studentSkills", "targetRoleSkills")
    @classmethod
    def validate_skill_ids(cls, skills):
        skill_ids = [skill.skillId for skill in skills]
        if len(skill_ids) != len(set(skill_ids)):
            raise ValueError("Duplicate skill IDs are not allowed")
        return skills
class SkillGap(BaseModel):
    skillId: str
    currentScore: float
    targetScore: float
    gap: float
    weight: float
    attainment: float
    priority: float
class SkillGapResponse(BaseModel):
    skillGaps: list[SkillGap]
    matchScore: float = Field(ge=0, le=1)
from pydantic import BaseModel, Field
class ResumeParseRequest(BaseModel):
    documentText: str = Field(min_length=1, max_length=100_000)
class ResumeParseResponse(BaseModel):
    extractedSkillNames: list[str] = Field(default_factory=list)

from fastapi import APIRouter
from schemas.document_parsing import ResumeParseRequest, ResumeParseResponse
from services.document_parsing import parse_document
router = APIRouter(prefix="/resume-parse", tags=["Document Parsing"])
@router.post("", response_model=ResumeParseResponse)
def resume_parse(request: ResumeParseRequest):
    return parse_document(request.documentText)

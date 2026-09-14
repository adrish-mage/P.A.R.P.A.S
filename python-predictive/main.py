from fastapi import FastAPI
from config import settings
from routers.skill_gap import router as skill_gap_router
from routers.growth_map import router as growth_map_router
from routers.placement_insights import router as placement_insights_router
from routers.document_parsing import router as document_parsing_router
from routers.intelligent_matching import router as intelligent_matching_router
app = FastAPI(title=settings.app_name, version=settings.app_version,)
app.include_router(skill_gap_router)
app.include_router(growth_map_router)
app.include_router(placement_insights_router)
app.include_router(document_parsing_router)
app.include_router(intelligent_matching_router)
@app.get("/")
def root():
    return {
        "service": settings.app_name,
        "version": settings.app_version,
        "status": "running",
    }
@app.get("/health")
def health():
    return {
        "status": "healthy"
    }
from fastapi import APIRouter
from backend.app.api.routes import health, inspections, dashboard, reports, settings

api_router = APIRouter()

api_router.include_router(health.router)
api_router.include_router(inspections.router)
api_router.include_router(dashboard.router)
api_router.include_router(reports.router)
api_router.include_router(settings.router)

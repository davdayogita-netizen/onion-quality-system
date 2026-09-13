from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from backend.app.core.database import get_db
from backend.app.schemas.dashboard import DashboardStats
from backend.app.services.stats_service import stats_service

router = APIRouter()


@router.get("/dashboard/stats", response_model=DashboardStats, tags=["Dashboard"])
def get_dashboard_statistics(db: Session = Depends(get_db)):
    """
    Retrieve live computed metrics, grade & defect distributions, and 7-day inspection trends.
    """
    return stats_service.get_dashboard_stats(db)

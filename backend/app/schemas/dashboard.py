from pydantic import BaseModel
from typing import Dict, List, Optional
from backend.app.schemas.inspection import InspectionListItem


class TrendPoint(BaseModel):
    date: str
    inspections: int
    avg_score: float


class DashboardStats(BaseModel):
    total_inspections: int
    inspections_today: int
    good_quality_count: int
    defective_count: int
    average_quality_score: float
    grade_distribution: Dict[str, int]
    defect_distribution: Dict[str, int]
    recent_inspections: List[InspectionListItem]
    trends: List[TrendPoint]

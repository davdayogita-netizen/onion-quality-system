from backend.app.schemas.defect import BoundingBox, DefectBase, DefectCreate, DefectOut
from backend.app.schemas.inspection import (
    InspectionUploadResponse,
    AnalysisResponse,
    InspectionDetail,
    InspectionListItem,
    PaginatedInspections,
)
from backend.app.schemas.dashboard import DashboardStats, TrendPoint
from backend.app.schemas.settings import SettingsUpdate, SettingsOut

__all__ = [
    "BoundingBox",
    "DefectBase",
    "DefectCreate",
    "DefectOut",
    "InspectionUploadResponse",
    "AnalysisResponse",
    "InspectionDetail",
    "InspectionListItem",
    "PaginatedInspections",
    "DashboardStats",
    "TrendPoint",
    "SettingsUpdate",
    "SettingsOut",
]

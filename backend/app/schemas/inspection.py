from pydantic import BaseModel, Field
from typing import List, Optional
import datetime
from backend.app.schemas.defect import DefectOut


class InspectionUploadResponse(BaseModel):
    id: str = Field(..., description="Unique inspection identifier")
    status: str = Field("uploaded", description="Current status of the inspection")
    image_url: str = Field(..., description="Accessible URL of uploaded image")


class AnalysisResponse(BaseModel):
    inspection_id: str = Field(..., description="Unique inspection ID")
    status: str = Field("completed", description="Analysis status")
    quality_score: float = Field(..., ge=0, le=100, description="Quality score from 0 to 100")
    grade: str = Field(..., description="Calculated Grade: A, B, C, D, or Reject")
    overall_status: str = Field(..., description="High-level category (e.g. Premium, Good, Commercial, Defective, Reject)")
    primary_defect: Optional[str] = Field(None, description="Most severe or dominant defect")
    defect_count: int = Field(0, description="Total detected defects")
    defects: List[DefectOut] = Field(default_factory=list, description="List of detected defect regions")
    explanation: str = Field(..., description="Human-readable assessment explanation")
    classification_label: Optional[str] = Field(None, description="Overall quality classification tier")
    model_version: str = Field("v1.0", description="Model version")
    inference_mode: str = Field("demo", description="demo or production")
    original_image_url: str = Field(..., description="URL to original uploaded image")
    processed_image_url: Optional[str] = Field(None, description="URL to OpenCV preprocessed image")
    annotated_image_url: Optional[str] = Field(None, description="URL to AI annotated image")


class InspectionDetail(BaseModel):
    id: str
    created_at: datetime.datetime
    image_url: str
    processed_image_url: Optional[str] = None
    annotated_image_url: Optional[str] = None
    quality_score: Optional[float] = None
    grade: Optional[str] = None
    overall_status: str
    primary_defect: Optional[str] = None
    defect_count: int = 0
    explanation: Optional[str] = None
    classification_label: Optional[str] = None
    model_version: str
    inference_mode: str
    defects: List[DefectOut] = []

    class Config:
        from_attributes = True


class InspectionListItem(BaseModel):
    id: str
    created_at: datetime.datetime
    image_url: str
    annotated_image_url: Optional[str] = None
    quality_score: Optional[float] = None
    grade: Optional[str] = None
    overall_status: str
    primary_defect: Optional[str] = None
    defect_count: int
    inference_mode: str

    class Config:
        from_attributes = True


class PaginatedInspections(BaseModel):
    items: List[InspectionListItem]
    total: int
    page: int
    page_size: int
    total_pages: int

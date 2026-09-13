from pydantic import BaseModel, Field
from typing import Optional


class BoundingBox(BaseModel):
    x: float = Field(..., description="Top-left X coordinate")
    y: float = Field(..., description="Top-left Y coordinate")
    width: float = Field(..., description="Bounding box width")
    height: float = Field(..., description="Bounding box height")


class DefectBase(BaseModel):
    defect_type: str = Field(..., alias="type", description="Defect class (rot, damage, sprouting, quality_issue, healthy)")
    confidence: float = Field(..., ge=0.0, le=1.0, description="Confidence score")
    severity: str = Field("medium", description="Defect severity: low, medium, high")
    bbox: BoundingBox

    class Config:
        populate_by_name = True


class DefectCreate(DefectBase):
    pass


class DefectOut(DefectBase):
    id: Optional[str] = None
    inspection_id: Optional[str] = None

    class Config:
        from_attributes = True
        populate_by_name = True

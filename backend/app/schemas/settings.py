from pydantic import BaseModel, Field
from typing import Optional


class SettingsUpdate(BaseModel):
    inference_mode: Optional[str] = Field(None, description="demo or production")
    yolo_model_path: Optional[str] = None
    classifier_model_path: Optional[str] = None
    grade_a_min: Optional[int] = Field(None, ge=0, le=100)
    grade_b_min: Optional[int] = Field(None, ge=0, le=100)
    grade_c_min: Optional[int] = Field(None, ge=0, le=100)
    grade_d_min: Optional[int] = Field(None, ge=0, le=100)
    reject_max: Optional[int] = Field(None, ge=0, le=100)


class SettingsOut(BaseModel):
    app_name: str
    app_version: str
    inference_mode: str
    model_version: str
    yolo_model_path: str
    classifier_model_path: str
    yolo_model_exists: bool
    classifier_model_exists: bool
    grade_a_min: int
    grade_b_min: int
    grade_c_min: int
    grade_d_min: int
    reject_max: int

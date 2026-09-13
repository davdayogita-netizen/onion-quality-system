import datetime
import uuid
from sqlalchemy import Column, String, Integer, Float, DateTime, Text
from sqlalchemy.orm import relationship
from backend.app.core.database import Base


def generate_inspection_id():
    return f"INS-{uuid.uuid4().hex[:8].upper()}"


class Inspection(Base):
    __tablename__ = "inspections"

    id = Column(String(36), primary_key=True, default=generate_inspection_id, index=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, index=True)
    
    # Image file paths
    image_path = Column(String(500), nullable=False)
    processed_image_path = Column(String(500), nullable=True)
    annotated_image_path = Column(String(500), nullable=True)
    
    # Grading & Quality metrics
    quality_score = Column(Float, nullable=True)
    grade = Column(String(10), nullable=True, index=True)  # A, B, C, D, Reject
    overall_status = Column(String(50), nullable=False, default="pending")  # pending, completed, failed
    primary_defect = Column(String(50), nullable=True, index=True)  # rot, damage, sprouting, etc.
    defect_count = Column(Integer, default=0)
    explanation = Column(Text, nullable=True)
    
    # Classification & Model info
    classification_label = Column(String(100), nullable=True)
    model_version = Column(String(50), default="v1.0")
    inference_mode = Column(String(20), default="demo")  # demo or production

    # Relationships
    defects = relationship("Defect", back_populates="inspection", cascade="all, delete-orphan")
    reports = relationship("Report", back_populates="inspection", cascade="all, delete-orphan")

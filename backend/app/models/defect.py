import uuid
from sqlalchemy import Column, String, Float, Integer, ForeignKey
from sqlalchemy.orm import relationship
from backend.app.core.database import Base


class Defect(Base):
    __tablename__ = "defects"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    inspection_id = Column(String(36), ForeignKey("inspections.id", ondelete="CASCADE"), nullable=False, index=True)
    
    defect_type = Column(String(50), nullable=False, index=True)  # rot, damage, sprouting, quality_issue, healthy
    confidence = Column(Float, nullable=False)
    severity = Column(String(20), nullable=False, default="medium")  # low, medium, high
    
    # Bounding Box normalized or pixel coordinates
    x = Column(Float, nullable=False)
    y = Column(Float, nullable=False)
    width = Column(Float, nullable=False)
    height = Column(Float, nullable=False)

    # Relationships
    inspection = relationship("Inspection", back_populates="defects")

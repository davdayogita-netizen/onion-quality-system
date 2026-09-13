import os
import shutil
import datetime
from typing import Optional
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import desc
from backend.app.core.config import settings
from backend.app.core.database import get_db
from backend.app.core.security import validate_image_file, generate_safe_filename
from backend.app.models.inspection import Inspection
from backend.app.models.defect import Defect
from backend.app.schemas.inspection import (
    InspectionUploadResponse,
    AnalysisResponse,
    InspectionDetail,
    InspectionListItem,
    PaginatedInspections,
)
from backend.app.schemas.defect import DefectOut, BoundingBox
from backend.app.services.inspection_service import inspection_service

router = APIRouter()


@router.post("/inspections", response_model=InspectionUploadResponse, status_code=status.HTTP_201_CREATED, tags=["Inspections"])
async def upload_inspection_image(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """
    Accept an onion image, validate format and size, save to storage, and initialize inspection.
    """
    validate_image_file(file)

    # Read content to check file size
    content = await file.read()
    max_bytes = settings.MAX_IMAGE_SIZE_MB * 1024 * 1024
    if len(content) > max_bytes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Image size exceeds maximum limit of {settings.MAX_IMAGE_SIZE_MB}MB."
        )

    # Save image with safe unique filename
    safe_name = generate_safe_filename(file.filename or "onion.jpg")
    file_path = os.path.join(settings.UPLOAD_DIR, safe_name)
    with open(file_path, "wb") as f:
        f.write(content)

    # Create Inspection record
    inspection = Inspection(
        image_path=file_path,
        overall_status="uploaded",
        model_version=settings.MODEL_VERSION,
        inference_mode=settings.INFERENCE_MODE
    )
    db.add(inspection)
    db.commit()
    db.refresh(inspection)

    image_url = f"/api/static/uploads/{safe_name}"
    return InspectionUploadResponse(
        id=inspection.id,
        status=inspection.overall_status,
        image_url=image_url
    )


@router.post("/inspections/sample/{sample_type}", response_model=InspectionUploadResponse, status_code=status.HTTP_201_CREATED, tags=["Inspections"])
def create_sample_inspection(
    sample_type: str,
    db: Session = Depends(get_db)
):
    """
    Convenience endpoint: quickly test with a generated synthetic sample
    ('healthy', 'rot', 'damage', 'sprouting', 'multiple').
    """
    valid_samples = ["healthy", "rot", "damage", "sprouting", "multiple"]
    if sample_type not in valid_samples:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid sample type '{sample_type}'. Valid options: {', '.join(valid_samples)}"
        )

    from backend.app.seeds.seed_data import create_synthetic_onion_image
    safe_name = generate_safe_filename(f"sample_{sample_type}.jpg")
    img_path = create_synthetic_onion_image(safe_name, sample_type)

    inspection = Inspection(
        image_path=img_path,
        overall_status="uploaded",
        model_version=settings.MODEL_VERSION,
        inference_mode=settings.INFERENCE_MODE
    )
    db.add(inspection)
    db.commit()
    db.refresh(inspection)

    return InspectionUploadResponse(
        id=inspection.id,
        status=inspection.overall_status,
        image_url=f"/api/static/uploads/{safe_name}"
    )


@router.post("/inspections/{inspection_id}/analyze", response_model=AnalysisResponse, tags=["Inspections"])
def analyze_inspection(
    inspection_id: str,
    db: Session = Depends(get_db)
):
    """
    Trigger end-to-end computer-vision pipeline:
    OpenCV Preprocessing -> Defect Detection -> PyTorch Classification -> Grading -> Visual HUD -> Database Save.
    """
    inspection = db.query(Inspection).filter(Inspection.id == inspection_id).first()
    if not inspection:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Inspection '{inspection_id}' not found."
        )

    if not os.path.exists(inspection.image_path):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Source image file is missing from server storage."
        )

    try:
        response = inspection_service.analyze_inspection(inspection, db)
        return response
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Computer-vision analysis failed: {str(e)}"
        )


@router.get("/inspections", response_model=PaginatedInspections, tags=["Inspections"])
def list_inspections(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    grade: Optional[str] = Query(None, description="Filter by grade: A, B, C, D, Reject"),
    defect: Optional[str] = Query(None, description="Filter by defect: rot, damage, sprouting, quality_issue"),
    search: Optional[str] = Query(None, description="Search by inspection ID"),
    start_date: Optional[str] = Query(None, description="YYYY-MM-DD"),
    end_date: Optional[str] = Query(None, description="YYYY-MM-DD"),
    db: Session = Depends(get_db)
):
    """
    List inspection history with full search, filtering, and pagination.
    """
    query = db.query(Inspection)

    if grade:
        query = query.filter(Inspection.grade == grade.upper())

    if search:
        query = query.filter(Inspection.id.ilike(f"%{search}%"))

    if defect:
        query = query.join(Inspection.defects).filter(Defect.defect_type == defect.lower())

    if start_date:
        try:
            start_dt = datetime.datetime.strptime(start_date, "%Y-%m-%d")
            query = query.filter(Inspection.created_at >= start_dt)
        except ValueError:
            pass

    if end_date:
        try:
            end_dt = datetime.datetime.strptime(end_date, "%Y-%m-%d") + datetime.timedelta(days=1)
            query = query.filter(Inspection.created_at < end_dt)
        except ValueError:
            pass

    total = query.count()
    total_pages = (total + page_size - 1) // page_size if total > 0 else 1

    records = (
        query.order_by(desc(Inspection.created_at))
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    items = []
    for r in records:
        orig_url = f"/api/static/uploads/{os.path.basename(r.image_path)}" if r.image_path else ""
        annot_url = f"/api/static/uploads/{os.path.basename(r.annotated_image_path)}" if r.annotated_image_path else None
        items.append(
            InspectionListItem(
                id=r.id,
                created_at=r.created_at,
                image_url=orig_url,
                annotated_image_url=annot_url,
                quality_score=r.quality_score,
                grade=r.grade,
                overall_status=r.overall_status,
                primary_defect=r.primary_defect,
                defect_count=r.defect_count,
                inference_mode=r.inference_mode
            )
        )

    return PaginatedInspections(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages
    )


@router.get("/inspections/{inspection_id}", response_model=InspectionDetail, tags=["Inspections"])
def get_inspection_detail(
    inspection_id: str,
    db: Session = Depends(get_db)
):
    """
    Fetch comprehensive details for an inspection, including defect coordinates.
    """
    inspection = db.query(Inspection).filter(Inspection.id == inspection_id).first()
    if not inspection:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Inspection '{inspection_id}' not found."
        )

    orig_url = f"/api/static/uploads/{os.path.basename(inspection.image_path)}" if inspection.image_path else ""
    proc_url = f"/api/static/uploads/{os.path.basename(inspection.processed_image_path)}" if inspection.processed_image_path else None
    annot_url = f"/api/static/uploads/{os.path.basename(inspection.annotated_image_path)}" if inspection.annotated_image_path else None

    defect_outs = [
        DefectOut(
            id=d.id,
            inspection_id=d.inspection_id,
            type=d.defect_type,
            confidence=d.confidence,
            severity=d.severity,
            bbox=BoundingBox(
                x=d.x,
                y=d.y,
                width=d.width,
                height=d.height
            )
        )
        for d in inspection.defects
    ]

    return InspectionDetail(
        id=inspection.id,
        created_at=inspection.created_at,
        image_url=orig_url,
        processed_image_url=proc_url,
        annotated_image_url=annot_url,
        quality_score=inspection.quality_score,
        grade=inspection.grade,
        overall_status=inspection.overall_status,
        primary_defect=inspection.primary_defect,
        defect_count=inspection.defect_count,
        explanation=inspection.explanation,
        classification_label=inspection.classification_label,
        model_version=inspection.model_version,
        inference_mode=inspection.inference_mode,
        defects=defect_outs
    )


@router.delete("/inspections/{inspection_id}", status_code=status.HTTP_204_NO_CONTENT, tags=["Inspections"])
def delete_inspection(
    inspection_id: str,
    db: Session = Depends(get_db)
):
    """
    Delete an inspection and its associated image and report files.
    """
    inspection = db.query(Inspection).filter(Inspection.id == inspection_id).first()
    if not inspection:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Inspection '{inspection_id}' not found."
        )

    # Clean up files if they exist
    for p in [inspection.image_path, inspection.processed_image_path, inspection.annotated_image_path]:
        if p and os.path.exists(p) and "demo_onion_" not in p:
            try:
                os.remove(p)
            except Exception:
                pass

    db.delete(inspection)
    db.commit()
    return None

import os
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from backend.app.core.database import get_db
from backend.app.models.inspection import Inspection
from backend.app.models.report import Report
from backend.app.services.report_service import report_service

router = APIRouter()


@router.get("/inspections/{inspection_id}/report", tags=["Reports"])
def download_inspection_report(
    inspection_id: str,
    db: Session = Depends(get_db)
):
    """
    Generate and stream downloadable PDF quality assessment report.
    """
    inspection = db.query(Inspection).filter(Inspection.id == inspection_id).first()
    if not inspection:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Inspection '{inspection_id}' not found."
        )

    try:
        pdf_path = report_service.generate_pdf_report(inspection, db)
        if not os.path.exists(pdf_path):
            raise RuntimeError("PDF report file was not generated.")

        return FileResponse(
            path=pdf_path,
            filename=f"onion_inspection_{inspection.id}.pdf",
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename=onion_inspection_{inspection.id}.pdf"}
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate inspection report: {str(e)}"
        )


@router.get("/reports/{report_id}", tags=["Reports"])
def get_report_by_id(
    report_id: str,
    db: Session = Depends(get_db)
):
    """
    Download a previously generated report by report ID.
    """
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report or not os.path.exists(report.report_path):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Report not found."
        )

    return FileResponse(
        path=report.report_path,
        filename=os.path.basename(report.report_path),
        media_type="application/pdf"
    )

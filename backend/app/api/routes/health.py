import datetime
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from backend.app.core.config import settings
from backend.app.core.database import get_db

router = APIRouter()


@router.get("/health", tags=["System"])
def health_check(db: Session = Depends(get_db)):
    db_connected = False
    try:
        db.execute(text("SELECT 1"))
        db_connected = True
    except Exception:
        db_connected = False

    return {
        "status": "healthy" if db_connected else "degraded",
        "timestamp": datetime.datetime.utcnow().isoformat(),
        "app_name": settings.APP_NAME,
        "app_version": settings.APP_VERSION,
        "database_connected": db_connected,
        "inference_mode": settings.INFERENCE_MODE,
        "model_version": settings.MODEL_VERSION
    }

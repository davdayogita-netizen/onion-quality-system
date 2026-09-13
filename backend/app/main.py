import os
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from backend.app.core.config import settings
from backend.app.core.database import init_db
from backend.app.api.api_router import api_router
from backend.app.seeds.seed_data import seed_database

# Configure root logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("onion_system")


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing Onion Quality Assessment Platform...")
    init_db()
    # Populate seed data if database is empty
    try:
        seed_database(force=False)
    except Exception as e:
        logger.warning(f"Initial seed notice: {e}")
    logger.info("Startup complete. Backend ready.")
    yield
    logger.info("Shutting down Onion Quality Assessment Platform.")


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description=(
        "SIH 2026 Computer-Vision System for Automated Onion Quality Assessment and Grading. "
        "Performs OpenCV preprocessing, YOLO-based multi-defect localization, PyTorch quality classification, "
        "scoring engine grading, and automated PDF reporting."
    ),
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# Configure CORS
origins = settings.CORS_ORIGINS if isinstance(settings.CORS_ORIGINS, list) else ["*"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static directories for viewing images and reports
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
os.makedirs(settings.REPORT_DIR, exist_ok=True)
app.mount("/api/static/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")
app.mount("/api/static/reports", StaticFiles(directory=settings.REPORT_DIR), name="reports")

# Include main API routes
app.include_router(api_router, prefix=settings.API_PREFIX)


@app.get("/")
def root():
    return {
        "message": "AI-Based Onion Quality Assessment and Grading System API",
        "version": settings.APP_VERSION,
        "docs": "/docs",
        "health": f"{settings.API_PREFIX}/health"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app.main:app", host=settings.HOST, port=settings.PORT, reload=True)

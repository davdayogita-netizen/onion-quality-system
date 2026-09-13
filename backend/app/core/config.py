import os
from typing import List, Union
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

    APP_NAME: str = "AI-Based Onion Quality Assessment & Grading System"
    APP_VERSION: str = "1.0.0"
    API_PREFIX: str = "/api"

    # Database settings
    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/onion_quality"

    # ML & Inference settings
    INFERENCE_MODE: str = "demo"  # "demo" or "production"
    MODEL_VERSION: str = "demo-v1.0"
    YOLO_MODEL_PATH: str = "models/yolo/onion_yolo.pt"
    CLASSIFIER_MODEL_PATH: str = "models/classifier/onion_classifier.pt"

    # Storage paths
    UPLOAD_DIR: str = "uploads"
    REPORT_DIR: str = "reports"

    # Server settings
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    CORS_ORIGINS: Union[str, List[str]] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000"
    ]

    # Configurable Quality Grade Thresholds (0 - 100)
    GRADE_A_MIN: int = 90
    GRADE_B_MIN: int = 75
    GRADE_C_MIN: int = 60
    GRADE_D_MIN: int = 40
    REJECT_MAX: int = 39

    # Configurable Defect Penalty Deductions
    PENALTY_ROT_HIGH: int = 30
    PENALTY_ROT_MED: int = 18
    PENALTY_ROT_LOW: int = 10
    PENALTY_SPROUTING_HIGH: int = 25
    PENALTY_SPROUTING_MED: int = 15
    PENALTY_SPROUTING_LOW: int = 8
    PENALTY_DAMAGE_HIGH: int = 20
    PENALTY_DAMAGE_MED: int = 12
    PENALTY_DAMAGE_LOW: int = 6
    PENALTY_QUALITY_ISSUE: int = 8

    # Image upload constraints
    MAX_IMAGE_SIZE_MB: int = 15
    ALLOWED_EXTENSIONS: List[str] = [".jpg", ".jpeg", ".png", ".webp"]

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",") if i.strip()]
        elif isinstance(v, (list, str)):
            return v
        return ["*"]


settings = Settings()

# Ensure directories exist
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
os.makedirs(settings.REPORT_DIR, exist_ok=True)
os.makedirs(os.path.dirname(settings.YOLO_MODEL_PATH) or ".", exist_ok=True)
os.makedirs(os.path.dirname(settings.CLASSIFIER_MODEL_PATH) or ".", exist_ok=True)

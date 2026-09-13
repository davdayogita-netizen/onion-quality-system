import os
from fastapi import APIRouter, HTTPException, status
from backend.app.core.config import settings
from backend.app.schemas.settings import SettingsOut, SettingsUpdate

router = APIRouter()


@router.get("/settings", response_model=SettingsOut, tags=["Settings"])
def get_current_settings():
    """
    Get current configuration, grading thresholds, and model availability.
    """
    yolo_exists = os.path.exists(settings.YOLO_MODEL_PATH)
    clf_exists = os.path.exists(settings.CLASSIFIER_MODEL_PATH)

    return SettingsOut(
        app_name=settings.APP_NAME,
        app_version=settings.APP_VERSION,
        inference_mode=settings.INFERENCE_MODE,
        model_version=settings.MODEL_VERSION,
        yolo_model_path=settings.YOLO_MODEL_PATH,
        classifier_model_path=settings.CLASSIFIER_MODEL_PATH,
        yolo_model_exists=yolo_exists,
        classifier_model_exists=clf_exists,
        grade_a_min=settings.GRADE_A_MIN,
        grade_b_min=settings.GRADE_B_MIN,
        grade_c_min=settings.GRADE_C_MIN,
        grade_d_min=settings.GRADE_D_MIN,
        reject_max=settings.REJECT_MAX
    )


@router.post("/settings", response_model=SettingsOut, tags=["Settings"])
def update_settings(update_data: SettingsUpdate):
    """
    Update runtime grading thresholds and switch between demo and production inference modes.
    """
    if update_data.inference_mode is not None:
        if update_data.inference_mode not in ["demo", "production"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Inference mode must be 'demo' or 'production'."
            )
        settings.INFERENCE_MODE = update_data.inference_mode

    if update_data.yolo_model_path is not None:
        settings.YOLO_MODEL_PATH = update_data.yolo_model_path

    if update_data.classifier_model_path is not None:
        settings.CLASSIFIER_MODEL_PATH = update_data.classifier_model_path

    if update_data.grade_a_min is not None:
        settings.GRADE_A_MIN = update_data.grade_a_min
    if update_data.grade_b_min is not None:
        settings.GRADE_B_MIN = update_data.grade_b_min
    if update_data.grade_c_min is not None:
        settings.GRADE_C_MIN = update_data.grade_c_min
    if update_data.grade_d_min is not None:
        settings.GRADE_D_MIN = update_data.grade_d_min
    if update_data.reject_max is not None:
        settings.REJECT_MAX = update_data.reject_max

    return get_current_settings()

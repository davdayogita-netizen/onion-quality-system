import os
import uuid
from typing import Tuple
from fastapi import UploadFile, HTTPException, status
from backend.app.core.config import settings

def validate_image_file(file: UploadFile) -> Tuple[bool, str]:
    """
    Validate uploaded image filename, extension, and content type.
    """
    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No filename provided in upload."
        )

    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in settings.ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file format '{ext}'. Allowed formats: {', '.join(settings.ALLOWED_EXTENSIONS)}"
        )

    # Check content type if available
    if file.content_type and not file.content_type.startswith("image/"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid MIME type '{file.content_type}'. Must be an image."
        )

    return True, ext

def generate_safe_filename(original_filename: str, prefix: str = "onion") -> str:
    """
    Generate collision-free, path-traversal-safe filename.
    """
    ext = os.path.splitext(original_filename)[1].lower()
    if ext not in settings.ALLOWED_EXTENSIONS:
        ext = ".jpg"
    unique_id = uuid.uuid4().hex[:12]
    return f"{prefix}_{unique_id}{ext}"

import os
import cv2
import numpy as np
import pytest
from backend.app.ml.preprocessing.image_preprocessor import OnionImagePreprocessor


def test_image_preprocessing(tmp_path):
    preprocessor = OnionImagePreprocessor()

    # Create synthetic test image
    test_img = np.full((300, 300, 3), (45, 125, 205), dtype=np.uint8)
    img_path = str(tmp_path / "test_onion.jpg")
    cv2.imwrite(img_path, test_img)

    result = preprocessor.process(img_path, str(tmp_path))

    assert result.original_bgr is not None
    assert result.clahe_bgr is not None
    assert result.dimensions == (300, 300)
    assert "green_ratio" in result.stats
    assert "dark_ratio" in result.stats
    assert os.path.exists(result.processed_image_path)


def test_invalid_small_image(tmp_path):
    preprocessor = OnionImagePreprocessor()
    tiny_img = np.zeros((30, 30, 3), dtype=np.uint8)
    img_path = str(tmp_path / "tiny.jpg")
    cv2.imwrite(img_path, tiny_img)

    with pytest.raises(ValueError, match="too small"):
        preprocessor.process(img_path, str(tmp_path))

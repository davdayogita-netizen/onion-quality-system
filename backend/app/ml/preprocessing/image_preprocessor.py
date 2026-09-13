import os
import cv2
import numpy as np
from typing import Dict, Any, Tuple
from PIL import Image


class PreprocessingResult:
    def __init__(
        self,
        original_bgr: np.ndarray,
        clahe_bgr: np.ndarray,
        hsv: np.ndarray,
        dimensions: Tuple[int, int],
        stats: Dict[str, Any],
        processed_image_path: str
    ):
        self.original_bgr = original_bgr
        self.clahe_bgr = clahe_bgr
        self.hsv = hsv
        self.dimensions = dimensions  # (width, height)
        self.stats = stats
        self.processed_image_path = processed_image_path


class OnionImagePreprocessor:
    """
    OpenCV-based modular image preprocessing pipeline for onion quality inspection.
    Enhances contrast, suppresses sensor noise, computes color metrics,
    and isolates defect spectral regions.
    """

    def __init__(self, target_size: Tuple[int, int] = (640, 640)):
        self.target_size = target_size

    def load_image(self, file_path: str) -> np.ndarray:
        """
        Safely load image from disk, compatible with cross-platform and Unicode paths.
        """
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"Image file not found: {file_path}")

        # Use PIL as a robust cross-platform reader for Unicode paths on Windows, then convert to BGR
        with Image.open(file_path) as pil_img:
            rgb_img = pil_img.convert("RGB")
            np_img = np.array(rgb_img)
            bgr_img = cv2.cvtColor(np_img, cv2.COLOR_RGB2BGR)

        if bgr_img is None or bgr_img.size == 0:
            raise ValueError(f"Failed to decode image from path: {file_path}")

        return bgr_img

    def validate_image(self, img: np.ndarray) -> bool:
        """
        Validate image dimensions and structure.
        """
        if len(img.shape) != 3 or img.shape[2] != 3:
            raise ValueError("Input image must have 3 color channels (BGR/RGB).")
        h, w = img.shape[:2]
        if h < 50 or w < 50:
            raise ValueError("Image dimensions are too small for defect inspection (min 50x50 px).")
        return True

    def enhance_contrast_clahe(self, bgr_img: np.ndarray) -> np.ndarray:
        """
        Apply CLAHE (Contrast Limited Adaptive Histogram Equalization)
        to the Luminance (L) channel in LAB color space to bring out hidden rot and surface lesions.
        """
        lab = cv2.cvtColor(bgr_img, cv2.COLOR_BGR2LAB)
        l_channel, a_channel, b_channel = cv2.split(lab)

        clahe = cv2.createCLAHE(clipLimit=2.5, tileGridSize=(8, 8))
        l_clahe = clahe.apply(l_channel)

        lab_clahe = cv2.merge((l_clahe, a_channel, b_channel))
        return cv2.cvtColor(lab_clahe, cv2.COLOR_LAB2BGR)

    def denoise(self, bgr_img: np.ndarray) -> np.ndarray:
        """
        Apply bilateral filter to smooth grain noise while preserving sharp peel/defect edges.
        """
        return cv2.bilateralFilter(bgr_img, d=9, sigmaColor=75, sigmaSpace=75)

    def extract_color_stats(self, bgr_img: np.ndarray, hsv_img: np.ndarray) -> Dict[str, Any]:
        """
        Compute color-space metrics for surface rot, sprout greenery, and skin consistency.
        """
        h_channel, s_channel, v_channel = cv2.split(hsv_img)

        # Sprouting mask: green hues in HSV (H: 35-85)
        lower_green = np.array([30, 40, 40])
        upper_green = np.array([85, 255, 255])
        green_mask = cv2.inRange(hsv_img, lower_green, upper_green)
        green_ratio = float(np.count_nonzero(green_mask)) / float(green_mask.size)

        # Rot/dark decay mask: low value/brightness and brownish tones
        lower_dark = np.array([0, 0, 0])
        upper_dark = np.array([180, 255, 65])
        dark_mask = cv2.inRange(hsv_img, lower_dark, upper_dark)
        dark_ratio = float(np.count_nonzero(dark_mask)) / float(dark_mask.size)

        # Contrast / variance
        gray = cv2.cvtColor(bgr_img, cv2.COLOR_BGR2GRAY)
        laplacian_var = float(cv2.Laplacian(gray, cv2.CV_64F).var())

        return {
            "mean_hue": float(np.mean(h_channel)),
            "mean_saturation": float(np.mean(s_channel)),
            "mean_value": float(np.mean(v_channel)),
            "green_ratio": green_ratio,
            "dark_ratio": dark_ratio,
            "sharpness_score": laplacian_var,
        }

    def process(self, input_file_path: str, output_dir: str) -> PreprocessingResult:
        """
        Execute full preprocessing pipeline and save a visual inspection artifact.
        """
        bgr = self.load_image(input_file_path)
        self.validate_image(bgr)

        h, w = bgr.shape[:2]
        denoised = self.denoise(bgr)
        clahe_enhanced = self.enhance_contrast_clahe(denoised)
        hsv = cv2.cvtColor(clahe_enhanced, cv2.COLOR_BGR2HSV)
        stats = self.extract_color_stats(clahe_enhanced, hsv)

        # Save processed visualization preview
        os.makedirs(output_dir, exist_ok=True)
        base_name = os.path.splitext(os.path.basename(input_file_path))[0]
        processed_filename = f"{base_name}_preprocessed.jpg"
        processed_path = os.path.join(output_dir, processed_filename)

        # Encode and save with high quality
        cv2.imwrite(processed_path, clahe_enhanced, [cv2.IMWRITE_JPEG_QUALITY, 92])

        return PreprocessingResult(
            original_bgr=bgr,
            clahe_bgr=clahe_enhanced,
            hsv=hsv,
            dimensions=(w, h),
            stats=stats,
            processed_image_path=processed_path
        )

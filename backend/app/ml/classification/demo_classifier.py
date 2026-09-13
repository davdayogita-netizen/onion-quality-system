import hashlib
import cv2
import numpy as np
from typing import Dict, Any
from backend.app.ml.classification.base import BaseClassifier, ClassificationResult


class DemoOnionClassifier(BaseClassifier):
    """
    Deterministic Demo Classification Provider for Onion Quality.
    Predicts overall quality tier from visual characteristics without requiring
    large external deep learning checkpoints.
    """

    def _get_image_seed(self, image_bgr: np.ndarray) -> int:
        small = cv2.resize(image_bgr, (64, 64))
        h = hashlib.md5(small.tobytes()).hexdigest()
        return int(h[:8], 16)

    def predict(self, image_bgr: np.ndarray, stats: Dict[str, Any] = None) -> ClassificationResult:
        seed = self._get_image_seed(image_bgr)
        rng = np.random.RandomState(seed)

        if stats is None:
            stats = {}

        dark_ratio = stats.get("dark_ratio", 0.0)
        green_ratio = stats.get("green_ratio", 0.0)
        sharpness = stats.get("sharpness_score", 100.0)

        # Infer class from realistic physical feature indicators
        if dark_ratio > 0.08 or (seed % 10 == 9):
            pred_class = "Reject / Decayed"
            probs = {"Reject / Decayed": 0.88, "Substandard (Grade D)": 0.09, "Fair (Grade C)": 0.03}
        elif dark_ratio > 0.03 or green_ratio > 0.04 or (seed % 10 in [3, 8]):
            pred_class = "Substandard (Grade D)"
            probs = {"Substandard (Grade D)": 0.82, "Fair (Grade C)": 0.12, "Reject / Decayed": 0.06}
        elif green_ratio > 0.015 or sharpness > 250.0 or (seed % 10 in [2, 4, 7]):
            pred_class = "Fair / Processing (Grade C)"
            probs = {"Fair / Processing (Grade C)": 0.79, "Good Commercial (Grade B)": 0.15, "Substandard": 0.06}
        elif (seed % 10 in [1, 5]):
            pred_class = "Good Commercial (Grade B)"
            probs = {"Good Commercial (Grade B)": 0.84, "Premium (Grade A)": 0.11, "Fair (Grade C)": 0.05}
        else:
            pred_class = "Premium (Grade A)"
            probs = {"Premium (Grade A)": 0.92, "Good Commercial (Grade B)": 0.07, "Fair (Grade C)": 0.01}

        top_conf = max(probs.values())
        return ClassificationResult(
            predicted_class=pred_class,
            confidence=float(round(top_conf, 2)),
            probabilities=probs,
            is_demo=True
        )

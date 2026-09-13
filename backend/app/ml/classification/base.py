from abc import ABC, abstractmethod
from typing import Dict, Any
from dataclasses import dataclass
import numpy as np


@dataclass
class ClassificationResult:
    predicted_class: str
    confidence: float
    probabilities: Dict[str, float]
    is_demo: bool


class BaseClassifier(ABC):
    """
    Abstract Base Class for Onion Quality Classification using PyTorch.
    """

    CLASSES = [
        "Premium (Grade A)",
        "Good Commercial (Grade B)",
        "Fair / Processing (Grade C)",
        "Substandard (Grade D)",
        "Reject / Decayed"
    ]

    @abstractmethod
    def predict(self, image_bgr: np.ndarray, stats: Dict[str, Any] = None) -> ClassificationResult:
        """
        Classify overall visual onion quality and skin firmness tier.
        """
        pass

from abc import ABC, abstractmethod
from typing import List, Dict, Any
from dataclasses import dataclass
import numpy as np


@dataclass
class BBox:
    x: float
    y: float
    width: float
    height: float


@dataclass
class DefectDetection:
    defect_type: str  # healthy, rot, damage, sprouting, quality_issue
    confidence: float
    severity: str     # low, medium, high
    bbox: BBox
    label: str


class BaseDetector(ABC):
    """
    Abstract Base Class for Onion Defect Object Detection.
    Allows hot-swapping between Mock/Demo provider and Production YOLO models.
    """

    CLASSES = ["healthy", "rot", "damage", "sprouting", "quality_issue"]

    @abstractmethod
    def detect(self, image_bgr: np.ndarray, stats: Dict[str, Any] = None) -> List[DefectDetection]:
        """
        Run inference on an input image in BGR format.
        Returns a list of detected defect bounding boxes and severities.
        """
        pass

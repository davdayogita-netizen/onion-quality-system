import os
import numpy as np
from typing import List, Dict, Any
from backend.app.ml.detection.base import BaseDetector, DefectDetection, BBox


class YOLODetector(BaseDetector):
    """
    Production YOLO Object Detector for Onion Quality Assessment.
    Loads custom-trained YOLO weights (e.g. Ultralytics YOLOv8/v11 or TorchScript)
    to perform multi-defect localization.
    """

    CLASS_MAPPING = {
        0: "healthy",
        1: "rot",
        2: "damage",
        3: "sprouting",
        4: "quality_issue"
    }

    def __init__(self, model_path: str):
        self.model_path = model_path
        self.model = None
        self._load_model()

    def _load_model(self):
        if not os.path.exists(self.model_path):
            raise FileNotFoundError(
                f"Production YOLO model file not found at '{self.model_path}'. "
                f"Please place your trained .pt weights in this path or set INFERENCE_MODE=demo in .env."
            )

        try:
            # Dynamically import ultralytics only when production model is invoked
            from ultralytics import YOLO
            self.model = YOLO(self.model_path)
        except ImportError:
            raise RuntimeError(
                "Ultralytics is required for production YOLO inference. "
                "Please run `pip install ultralytics` or switch INFERENCE_MODE=demo."
            )
        except Exception as e:
            raise RuntimeError(f"Failed to load YOLO model weights from '{self.model_path}': {str(e)}")

    def detect(self, image_bgr: np.ndarray, stats: Dict[str, Any] = None) -> List[DefectDetection]:
        if self.model is None:
            raise RuntimeError("YOLO model is not initialized.")

        results = self.model(image_bgr, verbose=False)
        detections: List[DefectDetection] = []

        for r in results:
            boxes = r.boxes
            for box in boxes:
                cls_id = int(box.cls[0].item())
                confidence = float(box.conf[0].item())
                xyxy = box.xyxy[0].tolist()  # [x1, y1, x2, y2]
                
                defect_type = self.CLASS_MAPPING.get(cls_id, "quality_issue")
                x = xyxy[0]
                y = xyxy[1]
                w = xyxy[2] - xyxy[0]
                h = xyxy[3] - xyxy[1]

                severity = "high" if confidence > 0.85 else ("medium" if confidence > 0.65 else "low")
                detections.append(
                    DefectDetection(
                        defect_type=defect_type,
                        confidence=round(confidence, 3),
                        severity=severity,
                        bbox=BBox(x=round(x, 1), y=round(y, 1), width=round(w, 1), height=round(h, 1)),
                        label=f"{defect_type.capitalize()} ({int(confidence * 100)}%)"
                    )
                )

        return detections

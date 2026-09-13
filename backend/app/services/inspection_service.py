import os
import cv2
import numpy as np
from sqlalchemy.orm import Session
from backend.app.core.config import settings
from backend.app.models.inspection import Inspection
from backend.app.models.defect import Defect
from backend.app.ml.preprocessing.image_preprocessor import OnionImagePreprocessor
from backend.app.ml.detection.demo_detector import DemoOnionDetector
from backend.app.ml.detection.yolo_detector import YOLODetector
from backend.app.ml.classification.demo_classifier import DemoOnionClassifier
from backend.app.ml.classification.pytorch_classifier import PyTorchClassifier
from backend.app.ml.grading.quality_grading import OnionQualityGrader
from backend.app.schemas.inspection import AnalysisResponse, DefectOut, BoundingBox


class InspectionService:
    def __init__(self):
        self.preprocessor = OnionImagePreprocessor()
        self.grader = OnionQualityGrader()

    def _get_detector(self):
        if settings.INFERENCE_MODE == "production":
            return YOLODetector(settings.YOLO_MODEL_PATH)
        return DemoOnionDetector()

    def _get_classifier(self):
        if settings.INFERENCE_MODE == "production":
            return PyTorchClassifier(settings.CLASSIFIER_MODEL_PATH)
        return DemoOnionClassifier()

    def draw_annotations(self, image_bgr: np.ndarray, detections) -> np.ndarray:
        """
        Draw clean, high-visibility computer vision bounding boxes and labels
        with modern styling (color-coded by defect severity and type).
        """
        annotated = image_bgr.copy()
        h, w = annotated.shape[:2]

        # Colors in BGR
        color_map = {
            "rot": (36, 40, 235),          # Bright Crimson Red
            "damage": (30, 140, 245),       # Vibrant Amber Orange
            "sprouting": (40, 200, 50),     # Leaf Green
            "quality_issue": (220, 180, 50),# Cyan/Yellow
            "healthy": (80, 210, 110)       # Emerald Green
        }

        for det in detections:
            bbox = det.bbox
            x1 = max(0, int(bbox.x))
            y1 = max(0, int(bbox.y))
            x2 = min(w - 1, int(bbox.x + bbox.width))
            y2 = min(h - 1, int(bbox.y + bbox.height))

            color = color_map.get(det.defect_type, (200, 200, 200))

            # Draw semi-transparent rectangle overlay inside box
            overlay = annotated.copy()
            cv2.rectangle(overlay, (x1, y1), (x2, y2), color, -1)
            cv2.addWeighted(overlay, 0.15, annotated, 0.85, 0, annotated)

            # Draw outer bounding box border
            thickness = max(2, int(min(w, h) / 300))
            cv2.rectangle(annotated, (x1, y1), (x2, y2), color, thickness)

            # Draw corner accents for professional HUD aesthetic
            corner_len = min(20, int(min(bbox.width, bbox.height) / 4))
            accent_thickness = thickness + 2
            # Top-left
            cv2.line(annotated, (x1, y1), (x1 + corner_len, y1), color, accent_thickness)
            cv2.line(annotated, (x1, y1), (x1, y1 + corner_len), color, accent_thickness)
            # Top-right
            cv2.line(annotated, (x2, y1), (x2 - corner_len, y1), color, accent_thickness)
            cv2.line(annotated, (x2, y1), (x2, y1 + corner_len), color, accent_thickness)
            # Bottom-left
            cv2.line(annotated, (x1, y2), (x1 + corner_len, y2), color, accent_thickness)
            cv2.line(annotated, (x1, y2), (x1, y2 - corner_len), color, accent_thickness)
            # Bottom-right
            cv2.line(annotated, (x2, y2), (x2 - corner_len, y2), color, accent_thickness)
            cv2.line(annotated, (x2, y2), (x2, y2 - corner_len), color, accent_thickness)

            # Label text banner
            label_text = f"{det.defect_type.upper()} {int(det.confidence * 100)}%"
            font = cv2.FONT_HERSHEY_DUPLEX
            font_scale = max(0.45, min(w, h) / 1200)
            (text_w, text_h), baseline = cv2.getTextSize(label_text, font, font_scale, 1)

            banner_y1 = max(0, y1 - text_h - 10)
            banner_y2 = y1
            banner_x2 = min(w, x1 + text_w + 14)

            # Draw label background banner
            cv2.rectangle(annotated, (x1, banner_y1), (banner_x2, banner_y2), color, -1)
            # Draw label text in white or dark
            cv2.putText(
                annotated,
                label_text,
                (x1 + 7, banner_y2 - 5),
                font,
                font_scale,
                (255, 255, 255),
                1,
                cv2.LINE_AA
            )

        return annotated

    def analyze_inspection(self, inspection: Inspection, db: Session) -> AnalysisResponse:
        """
        Execute complete analysis pipeline:
        Preprocessing -> Detection -> Classification -> Grading -> Visual annotation -> Persistence
        """
        # 1. Preprocessing
        prep_result = self.preprocessor.process(
            input_file_path=inspection.image_path,
            output_dir=settings.UPLOAD_DIR
        )
        inspection.processed_image_path = prep_result.processed_image_path

        # 2. Defect Detection
        detector = self._get_detector()
        detections = detector.detect(prep_result.original_bgr, prep_result.stats)

        # 3. Overall Quality Classification
        classifier = self._get_classifier()
        classification = classifier.predict(prep_result.original_bgr, prep_result.stats)

        # 4. Grading & Explanation
        grading_result = self.grader.grade(
            detections=detections,
            classification=classification,
            image_dimensions=prep_result.dimensions
        )

        # 5. Generate Annotated Image
        annotated_bgr = self.draw_annotations(prep_result.original_bgr, detections)
        base_name = os.path.splitext(os.path.basename(inspection.image_path))[0]
        annotated_filename = f"{base_name}_annotated.jpg"
        annotated_path = os.path.join(settings.UPLOAD_DIR, annotated_filename)
        cv2.imwrite(annotated_path, annotated_bgr, [cv2.IMWRITE_JPEG_QUALITY, 92])
        inspection.annotated_image_path = annotated_path

        # 6. Update and Persist Inspection Record
        inspection.quality_score = grading_result.quality_score
        inspection.grade = grading_result.grade
        inspection.overall_status = grading_result.overall_status
        inspection.primary_defect = grading_result.primary_defect
        inspection.defect_count = grading_result.defect_count
        inspection.explanation = grading_result.explanation
        inspection.classification_label = classification.predicted_class
        inspection.model_version = settings.MODEL_VERSION
        inspection.inference_mode = settings.INFERENCE_MODE

        # Remove any existing defects (if re-analyzing)
        db.query(Defect).filter(Defect.inspection_id == inspection.id).delete()

        # Add new Defect records
        defect_outs = []
        for det in detections:
            defect_record = Defect(
                inspection_id=inspection.id,
                defect_type=det.defect_type,
                confidence=det.confidence,
                severity=det.severity,
                x=det.bbox.x,
                y=det.bbox.y,
                width=det.bbox.width,
                height=det.bbox.height
            )
            db.add(defect_record)
            defect_outs.append(
                DefectOut(
                    type=det.defect_type,
                    confidence=det.confidence,
                    severity=det.severity,
                    bbox=BoundingBox(
                        x=det.bbox.x,
                        y=det.bbox.y,
                        width=det.bbox.width,
                        height=det.bbox.height
                    )
                )
            )

        db.commit()
        db.refresh(inspection)

        # Convert local paths to static URLs
        orig_url = f"/api/static/uploads/{os.path.basename(inspection.image_path)}"
        proc_url = f"/api/static/uploads/{os.path.basename(inspection.processed_image_path)}" if inspection.processed_image_path else None
        annot_url = f"/api/static/uploads/{os.path.basename(inspection.annotated_image_path)}" if inspection.annotated_image_path else None

        return AnalysisResponse(
            inspection_id=inspection.id,
            status="completed",
            quality_score=inspection.quality_score,
            grade=inspection.grade,
            overall_status=inspection.overall_status,
            primary_defect=inspection.primary_defect,
            defect_count=inspection.defect_count,
            defects=defect_outs,
            explanation=inspection.explanation,
            classification_label=inspection.classification_label,
            model_version=inspection.model_version,
            inference_mode=inspection.inference_mode,
            original_image_url=orig_url,
            processed_image_url=proc_url,
            annotated_image_url=annot_url
        )


inspection_service = InspectionService()

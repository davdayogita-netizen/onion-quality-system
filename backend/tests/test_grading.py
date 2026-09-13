from backend.app.ml.grading.quality_grading import OnionQualityGrader
from backend.app.ml.detection.base import DefectDetection, BBox


def test_grading_healthy():
    grader = OnionQualityGrader()
    # Healthy detection has no actual defects
    detections = [
        DefectDetection(
            defect_type="healthy",
            confidence=0.95,
            severity="none",
            bbox=BBox(x=10, y=10, width=200, height=200),
            label="Healthy"
        )
    ]
    res = grader.grade(detections)
    assert res.grade == "A"
    assert res.quality_score >= 90.0
    assert res.defect_count == 0
    assert "Grade A" in res.explanation


def test_grading_severe_rot():
    grader = OnionQualityGrader()
    detections = [
        DefectDetection(
            defect_type="rot",
            confidence=0.92,
            severity="high",
            bbox=BBox(x=50, y=50, width=120, height=120),
            label="Rot"
        ),
        DefectDetection(
            defect_type="rot",
            confidence=0.88,
            severity="high",
            bbox=BBox(x=180, y=180, width=100, height=100),
            label="Rot"
        ),
        DefectDetection(
            defect_type="damage",
            confidence=0.85,
            severity="medium",
            bbox=BBox(x=80, y=250, width=90, height=90),
            label="Damage"
        )
    ]
    res = grader.grade(detections)
    assert res.grade in ["D", "Reject"]
    assert res.quality_score < 60.0
    assert res.primary_defect == "rot"
    assert "decay" in res.explanation.lower() or "rot" in res.explanation.lower()

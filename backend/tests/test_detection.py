import numpy as np
from backend.app.ml.detection.demo_detector import DemoOnionDetector


def test_demo_detector_deterministic():
    detector = DemoOnionDetector()
    img = np.full((400, 400, 3), (45, 125, 205), dtype=np.uint8)

    # Run twice on the same image - must be strictly deterministic
    dets_1 = detector.detect(img, {"green_ratio": 0.0, "dark_ratio": 0.0})
    dets_2 = detector.detect(img, {"green_ratio": 0.0, "dark_ratio": 0.0})

    assert len(dets_1) == len(dets_2)
    assert dets_1[0].defect_type == dets_2[0].defect_type
    assert dets_1[0].confidence == dets_2[0].confidence
    assert dets_1[0].bbox.x == dets_2[0].bbox.x


def test_demo_detector_sprouting():
    detector = DemoOnionDetector()
    img = np.full((400, 400, 3), (45, 125, 205), dtype=np.uint8)
    dets = detector.detect(img, {"green_ratio": 0.08, "dark_ratio": 0.0})

    sprout_dets = [d for d in dets if d.defect_type == "sprouting"]
    assert len(sprout_dets) > 0
    assert sprout_dets[0].severity in ["medium", "high"]

import io
import cv2
import numpy as np


def test_inspection_sample_and_analyze(client):
    # 1. Create inspection using sample endpoint
    res = client.post("/api/inspections/sample/healthy")
    assert res.status_code == 201
    data = res.json()
    assert "id" in data
    ins_id = data["id"]
    assert data["status"] == "uploaded"

    # 2. Analyze the inspection
    analyze_res = client.post(f"/api/inspections/{ins_id}/analyze")
    assert analyze_res.status_code == 200
    analysis = analyze_res.json()
    assert analysis["inspection_id"] == ins_id
    assert analysis["status"] == "completed"
    assert "quality_score" in analysis
    assert "grade" in analysis
    assert "explanation" in analysis
    assert "original_image_url" in analysis

    # 3. Retrieve inspection detail
    detail_res = client.get(f"/api/inspections/{ins_id}")
    assert detail_res.status_code == 200
    detail = detail_res.json()
    assert detail["id"] == ins_id
    assert detail["quality_score"] == analysis["quality_score"]


def test_upload_image_file(client):
    # Create an in-memory image
    img = np.full((120, 120, 3), (120, 180, 240), dtype=np.uint8)
    _, buffer = cv2.imencode(".jpg", img)
    file_bytes = io.BytesIO(buffer.tobytes())

    response = client.post(
        "/api/inspections",
        files={"file": ("test_upload.jpg", file_bytes, "image/jpeg")}
    )
    assert response.status_code == 201
    data = response.json()
    assert "id" in data
    assert data["status"] == "uploaded"


def test_dashboard_stats(client):
    res = client.get("/api/dashboard/stats")
    assert res.status_code == 200
    stats = res.json()
    assert "total_inspections" in stats
    assert "good_quality_count" in stats
    assert "grade_distribution" in stats
    assert "trends" in stats

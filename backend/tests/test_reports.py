def test_report_generation(client):
    # 1. Create and analyze a sample inspection
    sample_res = client.post("/api/inspections/sample/rot")
    assert sample_res.status_code == 201
    ins_id = sample_res.json()["id"]

    analyze_res = client.post(f"/api/inspections/{ins_id}/analyze")
    assert analyze_res.status_code == 200

    # 2. Download the generated report
    report_res = client.get(f"/api/inspections/{ins_id}/report")
    assert report_res.status_code == 200
    assert report_res.headers["content-type"] == "application/pdf"
    assert len(report_res.content) > 1000  # Valid non-empty PDF binary

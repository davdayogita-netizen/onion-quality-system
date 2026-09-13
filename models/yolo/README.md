# YOLO Defect Detection Models

Place trained YOLO defect detection weights in this directory.

## Default Expected Model:
- File: `onion_yolo.pt` (e.g. YOLOv8n/s trained on onion defect dataset)
- Supported classes:
  - `0`: `healthy`
  - `1`: `rot`
  - `2`: `damage`
  - `3`: `sprouting`
  - `4`: `quality_issue`

## Configuration
In `.env`:
```env
INFERENCE_MODE=production
YOLO_MODEL_PATH=models/yolo/onion_yolo.pt
```

When `INFERENCE_MODE=demo` (default for SIH prototype), the system uses the deterministic OpenCV/feature-based `DemoOnionDetector` to provide realistic bounding boxes and confidence scores without requiring this file.

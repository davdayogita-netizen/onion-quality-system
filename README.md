# AI-Based Onion Quality Assessment & Grading System (SIH 2026)

An end-to-end computer-vision platform designed for automated agricultural onion inspection, defect detection, and quality grading for **Smart India Hackathon 2026**.

The system accepts onion bulb images, executes an OpenCV preprocessing pipeline, runs multi-defect localization (YOLO architecture) and quality classification (PyTorch), computes explainable agricultural quality scores and grades (A, B, C, D, Reject), persists inspection logs in PostgreSQL (with automatic SQLite fallback for rapid local prototyping), renders interactive defect bounding-box overlays, and generates downloadable PDF audit reports.

---

## Architecture Overview

```text
[ React 18 + TypeScript + Tailwind UI ]
                   │
                   ▼ (REST API / JSON / Multipart)
        [ FastAPI Backend Service ]
                   │
      ┌────────────┼───────────────────────┐
      ▼            ▼                       ▼
 [ OpenCV CLAHE ] [ YOLO Defect Detector ] [ PyTorch Classifier ]
      │            │                       │
      └────────────┬───────────────────────┘
                   ▼
       [ Quality Grading Engine ]
                   │
         ┌─────────┴─────────┐
         ▼                   ▼
[ PostgreSQL / SQLite ] [ PDF Report Engine (ReportLab) ]
```

---

## Key Features

- **Multi-Defect Localization**: Detects and draws bounding boxes for **rot/fungal decay**, **physical cuts/surface damage**, **vegetative sprouting**, and **skin/tunic blemishes**.
- **Dual Inference Engine**:
  - **Demo Mode** (`INFERENCE_MODE=demo`): Deterministic computer-vision inference using OpenCV color-space (HSV/LAB), contour metrics, and stable hashes. Runs completely out of the box without downloading multi-gigabyte neural network weights.
  - **Production Mode** (`INFERENCE_MODE=production`): Direct integration with trained Ultralytics YOLO (`.pt`) and PyTorch classification weights.
- **Configurable Grading Engine**: Computes scores (0–100) and maps to **Grade A** (Export), **Grade B** (Commercial), **Grade C** (Processing), **Grade D** (Substandard), and **Reject**. Thresholds and defect penalty weights are fully customizable in runtime settings.
- **Explainable AI Assessment**: Generates dynamic, natural-language explanations explaining exactly why deductions occurred.
- **Interactive HUD Image Viewer**: Toggle between Original, AI Annotated, and OpenCV CLAHE contrast views with hover-synced bounding boxes.
- **PDF Report Generation**: Instant server-side PDF generation embedding high-resolution photography, HUD bounding boxes, defect coordinate tables, and audit details.
- **Analytics Dashboard**: Real-time pass/fail metrics, defect frequency histograms, grade distributions, and 7-day quality trends via Recharts.
- **Inspection History Archive**: Searchable database with filters for grade, defect type, and date range.

---

## Technology Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Lucide React, Recharts, React Router v6.
- **Backend**: Python 3.10+, FastAPI, Pydantic v2, SQLAlchemy, OpenCV, ReportLab, Pillow, Pytest.
- **Database**: PostgreSQL (with automatic local SQLite fallback if PostgreSQL is not active).
- **Containerization**: Docker & Docker Compose.

---

## Project Structure

```text
onion-quality-system/
├── backend/
│   ├── app/
│   │   ├── api/routes/          # Health, Inspections, Dashboard, Reports, Settings
│   │   ├── core/                # Config, Database, Security
│   │   ├── models/              # SQLAlchemy ORM (Inspection, Defect, Report)
│   │   ├── schemas/             # Pydantic v2 schemas
│   │   ├── ml/
│   │   │   ├── preprocessing/   # OpenCV CLAHE, bilateral filter, HSV masks
│   │   │   ├── detection/       # BaseDetector, DemoOnionDetector, YOLODetector
│   │   │   ├── classification/  # BaseClassifier, DemoClassifier, PyTorchClassifier
│   │   │   └── grading/         # OnionQualityGrader & natural-language explanations
│   │   ├── services/            # Inspection, ReportLab PDF, and Stats services
│   │   ├── seeds/               # Synthetic onion image generator & seed script
│   │   └── main.py              # FastAPI application entrypoint
│   ├── tests/                   # Pytest test suite (health, CV, grading, API, reports)
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── components/          # ImageViewer, AnalysisStepper, GradeBadge, Layout
│   │   ├── pages/               # Dashboard, Inspect, InspectionResult, History, Reports, Settings
│   │   ├── services/            # Typed API client
│   │   └── types/               # TypeScript interfaces
│   ├── package.json
│   ├── vite.config.ts
│   └── Dockerfile
├── models/                      # Drop-in directories for YOLO and PyTorch weights
├── uploads/                     # Storage for raw and annotated images
├── reports/                     # Storage for generated PDF inspection reports
├── docker-compose.yml
├── .env.example
├── .env
└── README.md
```

---

## Quick Start (Non-Docker Local Development)

### 1. Backend Setup

```bash
cd backend

# Create and activate virtual environment
python -m venv venv
# On Windows:
.\venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Seed the database with sample inspections & synthetic onions
python -m backend.app.seeds.seed_data

# Start the FastAPI development server
uvicorn backend.app.main:app --reload --host 0.0.0.0 --port 8000
```

The backend is now accessible at `http://localhost:8000`.
- Swagger API Docs: `http://localhost:8000/docs`
- Health Check: `http://localhost:8000/api/health`

### 2. Frontend Setup

In a new terminal:

```bash
cd frontend

# Install npm dependencies
npm install

# Start the Vite development server
npm run dev
```

The web application is now live at `http://localhost:5173`.

---

## Running with Docker Compose

To launch the complete stack with PostgreSQL, FastAPI, and Nginx:

```bash
docker-compose up --build
```

- Frontend UI: `http://localhost:5173`
- Backend API & Swagger: `http://localhost:8000/docs`
- PostgreSQL: `localhost:5432`

---

## Running Tests

Execute the backend automated test suite:

```bash
pytest backend/tests -v
```

Tests cover:
- Health check API and database connectivity
- OpenCV CLAHE image preprocessing and validation
- Deterministic demo defect detector
- Quality grading score calculation and boundary conditions
- Inspection upload, analysis pipeline, and retrieval
- ReportLab PDF generation and download streaming

---

## Machine Learning Integration Guide

### How to use Production Weights:
1. Train a YOLO model on onion defect annotations (`healthy`, `rot`, `damage`, `sprouting`, `quality_issue`).
2. Export the `.pt` weights and save to `models/yolo/onion_yolo.pt`.
3. Save your trained PyTorch classifier to `models/classifier/onion_classifier.pt`.
4. In `.env` or in the web UI under **Settings & Models**, toggle:
   ```env
   INFERENCE_MODE=production
   ```
5. Restart backend or click **Save Configuration** in Settings.

---

## Future Enhancements
- Real-time conveyor-belt camera streaming via WebRTC/RTSP.
- High-throughput batch image processing queue (Celery/Redis).
- Multi-spectral and NIR (Near-Infrared) sensor integration for internal rot detection.
- Mobile PWA application for farm-gate lot grading.

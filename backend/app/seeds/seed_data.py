import os
import random
import datetime
import cv2
import numpy as np
from sqlalchemy.orm import Session
from backend.app.core.config import settings
from backend.app.core.database import SessionLocal, init_db
from backend.app.models.inspection import Inspection
from backend.app.models.defect import Defect
from backend.app.services.inspection_service import inspection_service


def create_synthetic_onion_image(filename: str, defect_type: str = "healthy") -> str:
    """
    Generate a realistic synthetic onion image with visual cues for testing.
    """
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    filepath = os.path.join(settings.UPLOAD_DIR, filename)

    w, h = 640, 640
    # Soft neutral background (agricultural laboratory surface)
    img = np.full((h, w, 3), (240, 242, 245), dtype=np.uint8)

    # Onion bulb center & radius
    cx, cy = w // 2, h // 2 + 20
    rx, ry = 190, 210

    # Base onion skin color (amber-yellowish brown: BGR 40, 120, 195)
    cv2.ellipse(img, (cx, cy), (rx, ry), 0, 0, 360, (45, 125, 205), -1, cv2.LINE_AA)

    # Concentric tunic peel rings / skin ridges
    for i in range(1, 7):
        offset = i * 26
        cv2.ellipse(img, (cx, cy), (rx - offset, ry - offset), 0, 0, 360, (55 + i * 5, 135 + i * 6, 215 + i * 4), 3, cv2.LINE_AA)

    # Stem / neck on top
    cv2.fillPoly(img, [np.array([[cx - 25, cy - ry + 15], [cx + 25, cy - ry + 15], [cx + 10, cy - ry - 45], [cx - 10, cy - ry - 45]])], (50, 115, 175))

    # Roots on bottom
    for angle in [-20, -10, 0, 10, 20]:
        rad = np.deg2rad(angle)
        ex = int(cx + np.sin(rad) * 40)
        ey = int(cy + ry + 25 + np.cos(rad) * 15)
        cv2.line(img, (cx, cy + ry - 10), (ex, ey), (70, 100, 140), 2, cv2.LINE_AA)

    # Defect visual cues
    if defect_type == "rot":
        # Dark, fungal decaying sunken patch
        cv2.ellipse(img, (cx - 50, cy + 30), (55, 45), 25, 0, 360, (20, 25, 40), -1, cv2.LINE_AA)
        cv2.ellipse(img, (cx - 50, cy + 30), (65, 55), 25, 0, 360, (30, 45, 75), 4, cv2.LINE_AA)
    elif defect_type == "sprouting":
        # Green shoot emerging from the top neck
        pts1 = np.array([[cx - 8, cy - ry - 30], [cx - 25, cy - ry - 110], [cx + 2, cy - ry - 75]], np.int32)
        pts2 = np.array([[cx + 2, cy - ry - 30], [cx + 20, cy - ry - 125], [cx - 2, cy - ry - 80]], np.int32)
        cv2.fillPoly(img, [pts1], (40, 180, 50))
        cv2.fillPoly(img, [pts2], (50, 205, 60))
    elif defect_type == "damage":
        # Mechanical cut and peeled dry tunic
        cv2.line(img, (cx + 30, cy - 40), (cx + 95, cy + 35), (20, 40, 90), 5, cv2.LINE_AA)
        cv2.circle(img, (cx + 60, cy - 5), 35, (40, 70, 130), -1, cv2.LINE_AA)
    elif defect_type == "multiple":
        # Both rot and cut
        cv2.ellipse(img, (cx - 60, cy + 40), (45, 40), 0, 0, 360, (25, 30, 45), -1, cv2.LINE_AA)
        cv2.line(img, (cx + 20, cy - 50), (cx + 80, cy + 20), (30, 60, 110), 4, cv2.LINE_AA)

    cv2.imwrite(filepath, img, [cv2.IMWRITE_JPEG_QUALITY, 90])
    return filepath


def seed_database(force: bool = False):
    init_db()
    db: Session = SessionLocal()
    try:
        existing_count = db.query(Inspection).count()
        if existing_count > 0 and not force:
            print(f"Database already contains {existing_count} inspections. Skipping seed.")
            return

        print("Seeding demo onion inspections covering Grade A, B, C, D, and Reject...")

        # Create demo sample images
        img_healthy_1 = create_synthetic_onion_image("demo_onion_healthy_1.jpg", "healthy")
        img_healthy_2 = create_synthetic_onion_image("demo_onion_healthy_2.jpg", "healthy")
        img_damage_1 = create_synthetic_onion_image("demo_onion_damage_1.jpg", "damage")
        img_sprout_1 = create_synthetic_onion_image("demo_onion_sprouting_1.jpg", "sprouting")
        img_rot_1 = create_synthetic_onion_image("demo_onion_rot_1.jpg", "rot")
        img_multi_1 = create_synthetic_onion_image("demo_onion_multiple_1.jpg", "multiple")

        samples = [
            # Grade A (Healthy)
            {"img": img_healthy_1, "dt": -6, "target_defects": []},
            {"img": img_healthy_2, "dt": -5, "target_defects": []},
            {"img": img_healthy_1, "dt": -3, "target_defects": []},
            {"img": img_healthy_2, "dt": -1, "target_defects": []},
            {"img": img_healthy_1, "dt": 0,  "target_defects": []},

            # Grade B (Minor Damage or cosmetic)
            {"img": img_damage_1, "dt": -6, "target_defects": ["damage"]},
            {"img": img_damage_1, "dt": -4, "target_defects": ["damage"]},
            {"img": img_damage_1, "dt": -2, "target_defects": ["damage"]},
            {"img": img_damage_1, "dt": 0,  "target_defects": ["damage"]},

            # Grade C (Sprouting or moderate issues)
            {"img": img_sprout_1, "dt": -5, "target_defects": ["sprouting"]},
            {"img": img_sprout_1, "dt": -3, "target_defects": ["sprouting"]},
            {"img": img_damage_1, "dt": -2, "target_defects": ["damage", "quality_issue"]},
            {"img": img_sprout_1, "dt": 0,  "target_defects": ["sprouting"]},

            # Grade D (Noticeable rot or extensive defects)
            {"img": img_rot_1,   "dt": -4, "target_defects": ["rot"]},
            {"img": img_multi_1, "dt": -2, "target_defects": ["rot", "damage"]},
            {"img": img_rot_1,   "dt": -1, "target_defects": ["rot"]},

            # Reject (Severe rot / decay)
            {"img": img_rot_1,   "dt": -6, "target_defects": ["rot", "rot"]},
            {"img": img_multi_1, "dt": -3, "target_defects": ["rot", "sprouting", "damage"]},
            {"img": img_rot_1,   "dt": 0,  "target_defects": ["rot", "rot", "damage"]},
        ]

        now = datetime.datetime.utcnow()
        for idx, sample in enumerate(samples, 1):
            created_time = now + datetime.timedelta(days=sample["dt"], hours=random.randint(8, 18), minutes=random.randint(5, 55))
            
            # Create inspection record
            ins = Inspection(
                image_path=sample["img"],
                overall_status="pending",
                model_version=settings.MODEL_VERSION,
                inference_mode="demo"
            )
            ins.created_at = created_time
            db.add(ins)
            db.commit()
            db.refresh(ins)

            # Analyze via pipeline to populate defects, annotations, grades, explanations
            inspection_service.analyze_inspection(ins, db)
            
            # Restore timestamp so trend charts display over 7 days
            ins.created_at = created_time
            db.commit()

        print(f"Successfully seeded {len(samples)} realistic inspection records!")

    finally:
        db.close()


if __name__ == "__main__":
    seed_database(force=True)

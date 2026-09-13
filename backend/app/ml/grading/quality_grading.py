from typing import List, Dict, Any, Tuple
from dataclasses import dataclass
from backend.app.core.config import settings
from backend.app.ml.detection.base import DefectDetection
from backend.app.ml.classification.base import ClassificationResult


@dataclass
class GradingResult:
    quality_score: float
    grade: str
    overall_status: str
    primary_defect: str
    defect_count: int
    highest_severity: str
    explanation: str
    defect_breakdown: Dict[str, int]


class OnionQualityGrader:
    """
    Transparent, configurable grading engine for agricultural onion inspection.
    Calculates 0-100 quality score, letter grade (A, B, C, D, Reject),
    and contextual human-readable explanatory assessment.
    """

    def __init__(
        self,
        grade_a_min: int = None,
        grade_b_min: int = None,
        grade_c_min: int = None,
        grade_d_min: int = None,
        reject_max: int = None,
    ):
        self.grade_a_min = grade_a_min or settings.GRADE_A_MIN
        self.grade_b_min = grade_b_min or settings.GRADE_B_MIN
        self.grade_c_min = grade_c_min or settings.GRADE_C_MIN
        self.grade_d_min = grade_d_min or settings.GRADE_D_MIN
        self.reject_max = reject_max or settings.REJECT_MAX

    def grade(
        self,
        detections: List[DefectDetection],
        classification: ClassificationResult = None,
        image_dimensions: Tuple[int, int] = (640, 640)
    ) -> GradingResult:
        score = 100.0
        defect_breakdown: Dict[str, int] = {
            "rot": 0,
            "damage": 0,
            "sprouting": 0,
            "quality_issue": 0
        }

        # Filter out purely "healthy" placeholder detections
        actual_defects = [d for d in detections if d.defect_type != "healthy"]
        defect_count = len(actual_defects)

        highest_severity = "none"
        severity_rank = {"none": 0, "low": 1, "medium": 2, "high": 3}
        primary_defect = "None"
        max_defect_weight = 0

        # Calculate deductions based on defect category, severity, and confidence
        for defect in actual_defects:
            dtype = defect.defect_type
            severity = defect.severity.lower()
            conf = defect.confidence

            if dtype in defect_breakdown:
                defect_breakdown[dtype] += 1

            if severity_rank.get(severity, 1) > severity_rank.get(highest_severity, 0):
                highest_severity = severity

            # Penalty calculation
            deduction = 0.0
            if dtype == "rot":
                if severity == "high":
                    deduction = settings.PENALTY_ROT_HIGH
                elif severity == "medium":
                    deduction = settings.PENALTY_ROT_MED
                else:
                    deduction = settings.PENALTY_ROT_LOW
                weight = 100 + deduction
            elif dtype == "sprouting":
                if severity == "high":
                    deduction = settings.PENALTY_SPROUTING_HIGH
                elif severity == "medium":
                    deduction = settings.PENALTY_SPROUTING_MED
                else:
                    deduction = settings.PENALTY_SPROUTING_LOW
                weight = 80 + deduction
            elif dtype == "damage":
                if severity == "high":
                    deduction = settings.PENALTY_DAMAGE_HIGH
                elif severity == "medium":
                    deduction = settings.PENALTY_DAMAGE_MED
                else:
                    deduction = settings.PENALTY_DAMAGE_LOW
                weight = 60 + deduction
            else:  # quality_issue
                deduction = settings.PENALTY_QUALITY_ISSUE
                weight = 30 + deduction

            # Scale deduction slightly by confidence
            deduction *= (0.7 + 0.3 * conf)
            score -= deduction

            if weight > max_defect_weight:
                max_defect_weight = weight
                primary_defect = dtype

        # Multiple defects compounding deduction
        if defect_count >= 3:
            score -= 10.0
        elif defect_count == 2:
            score -= 5.0

        # Bound score between 0.0 and 100.0
        final_score = float(max(0.0, min(100.0, round(score, 1))))

        # Determine letter grade
        if final_score >= self.grade_a_min:
            grade = "A"
            overall_status = "Premium Quality"
        elif final_score >= self.grade_b_min:
            grade = "B"
            overall_status = "Good Commercial"
        elif final_score >= self.grade_c_min:
            grade = "C"
            overall_status = "Fair / Processing"
        elif final_score >= self.grade_d_min:
            grade = "D"
            overall_status = "Substandard / Poor"
        else:
            grade = "Reject"
            overall_status = "Rejected"

        if defect_count == 0:
            primary_defect = "None (Healthy)"

        explanation = self._generate_explanation(
            grade=grade,
            score=final_score,
            defect_breakdown=defect_breakdown,
            highest_severity=highest_severity,
            primary_defect=primary_defect
        )

        return GradingResult(
            quality_score=final_score,
            grade=grade,
            overall_status=overall_status,
            primary_defect=primary_defect,
            defect_count=defect_count,
            highest_severity=highest_severity,
            explanation=explanation,
            defect_breakdown=defect_breakdown
        )

    def _generate_explanation(
        self,
        grade: str,
        score: float,
        defect_breakdown: Dict[str, int],
        highest_severity: str,
        primary_defect: str
    ) -> str:
        """
        Generate contextual, human-readable explanatory assessment.
        """
        rot_cnt = defect_breakdown.get("rot", 0)
        dmg_cnt = defect_breakdown.get("damage", 0)
        sprout_cnt = defect_breakdown.get("sprouting", 0)
        cosm_cnt = defect_breakdown.get("quality_issue", 0)
        total_defects = rot_cnt + dmg_cnt + sprout_cnt + cosm_cnt

        if grade == "A":
            return (
                f"Quality Grade A ({score}/100): Excellent bulb condition. "
                "No critical defects, rot, or active vegetative sprouting detected. "
                "Outer tunic layers display strong structural integrity suitable for export and long-term storage."
            )
        elif grade == "B":
            reasons = []
            if dmg_cnt > 0:
                reasons.append(f"{dmg_cnt} minor surface damage zone(s)")
            if cosm_cnt > 0:
                reasons.append(f"{cosm_cnt} skin blemish(es)")
            detail = " and ".join(reasons) if reasons else "minor skin imperfections"
            return (
                f"Quality Grade B ({score}/100): Good commercial grade. "
                f"Detected {detail}. No active rot identified. Suitable for immediate retail distribution."
            )
        elif grade == "C":
            reasons = []
            if sprout_cnt > 0:
                reasons.append(f"early vegetative sprouting ({sprout_cnt} zone(s))")
            if dmg_cnt > 0:
                reasons.append(f"moderate mechanical surface damage ({dmg_cnt} zone(s))")
            if rot_cnt > 0:
                reasons.append(f"localized fungal decay ({rot_cnt} zone(s))")
            detail = ", ".join(reasons) if reasons else "moderate visible defects"
            return (
                f"Quality Grade C ({score}/100): Fair / Processing grade. "
                f"Noticeable quality deductions caused by {detail}. "
                "Recommended for immediate industrial food processing or drying rather than fresh storage."
            )
        elif grade == "D":
            return (
                f"Quality Grade D ({score}/100): Substandard quality. "
                f"Significant defects identified ({highest_severity} severity {primary_defect}). "
                "The bulb exhibits pronounced decay or extensive mechanical degradation, failing standard retail tolerances."
            )
        else:  # Reject
            return (
                f"Quality Grade Reject ({score}/100): Rejected. "
                f"Critical fungal rot or severe sprouting decay detected ({rot_cnt} rot zones, {sprout_cnt} sprouts). "
                "Unfit for commercial food consumption. Immediate disposal or agricultural composting required."
            )

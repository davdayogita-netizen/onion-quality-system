import datetime
import os
from sqlalchemy.orm import Session
from sqlalchemy import func
from backend.app.models.inspection import Inspection
from backend.app.models.defect import Defect
from backend.app.schemas.dashboard import DashboardStats, TrendPoint
from backend.app.schemas.inspection import InspectionListItem


class StatsService:
    def get_dashboard_stats(self, db: Session) -> DashboardStats:
        total = db.query(Inspection).count()

        # Inspections today
        today_start = datetime.datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
        today_count = db.query(Inspection).filter(Inspection.created_at >= today_start).count()

        # Good vs Defective
        good_count = db.query(Inspection).filter(Inspection.grade.in_(["A", "B"])).count()
        defective_count = db.query(Inspection).filter(Inspection.grade.in_(["C", "D", "Reject"])).count()

        # Average quality score
        avg_score_res = db.query(func.avg(Inspection.quality_score)).filter(Inspection.quality_score.isnot(None)).scalar()
        avg_score = round(float(avg_score_res), 1) if avg_score_res is not None else 0.0

        # Grade distribution
        grades = ["A", "B", "C", "D", "Reject"]
        grade_dist = {g: 0 for g in grades}
        grade_counts = (
            db.query(Inspection.grade, func.count(Inspection.id))
            .filter(Inspection.grade.isnot(None))
            .group_by(Inspection.grade)
            .all()
        )
        for g, count in grade_counts:
            if g in grade_dist:
                grade_dist[g] = count

        # Defect distribution
        defect_types = ["rot", "damage", "sprouting", "quality_issue", "healthy"]
        defect_dist = {d: 0 for d in defect_types}
        defect_counts = (
            db.query(Defect.defect_type, func.count(Defect.id))
            .group_by(Defect.defect_type)
            .all()
        )
        for dtype, count in defect_counts:
            if dtype in defect_dist:
                defect_dist[dtype] = count

        # Recent inspections (latest 6)
        recent_records = (
            db.query(Inspection)
            .order_by(Inspection.created_at.desc())
            .limit(6)
            .all()
        )
        recent_list = []
        for r in recent_records:
            orig_url = f"/api/static/uploads/{os.path.basename(r.image_path)}" if r.image_path else ""
            annot_url = f"/api/static/uploads/{os.path.basename(r.annotated_image_path)}" if r.annotated_image_path else None
            recent_list.append(
                InspectionListItem(
                    id=r.id,
                    created_at=r.created_at,
                    image_url=orig_url,
                    annotated_image_url=annot_url,
                    quality_score=r.quality_score,
                    grade=r.grade,
                    overall_status=r.overall_status,
                    primary_defect=r.primary_defect,
                    defect_count=r.defect_count,
                    inference_mode=r.inference_mode
                )
            )

        # Inspection trends (last 7 days)
        trends = []
        now = datetime.datetime.utcnow()
        for i in range(6, -1, -1):
            day_dt = now - datetime.timedelta(days=i)
            day_str = day_dt.strftime("%b %d")
            start = day_dt.replace(hour=0, minute=0, second=0, microsecond=0)
            end = day_dt.replace(hour=23, minute=59, second=59, microsecond=999999)

            day_inspections = db.query(Inspection).filter(Inspection.created_at >= start, Inspection.created_at <= end).all()
            day_cnt = len(day_inspections)
            day_scores = [ins.quality_score for ins in day_inspections if ins.quality_score is not None]
            day_avg = round(sum(day_scores) / len(day_scores), 1) if day_scores else 0.0

            trends.append(TrendPoint(date=day_str, inspections=day_cnt, avg_score=day_avg))

        return DashboardStats(
            total_inspections=total,
            inspections_today=today_count,
            good_quality_count=good_count,
            defective_count=defective_count,
            average_quality_score=avg_score,
            grade_distribution=grade_dist,
            defect_distribution=defect_dist,
            recent_inspections=recent_list,
            trends=trends
        )


stats_service = StatsService()

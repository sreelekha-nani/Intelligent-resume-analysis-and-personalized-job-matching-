from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from models import User, Profile, Job, Application, ATSReport, Notification
from routers.auth import get_current_user
from services.matching_service import calculate_job_match

router = APIRouter(prefix="/dashboard", tags=["Dashboard Analytics"])

@router.get("/stats")
def get_dashboard_analytics(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    profile = db.query(Profile).filter(Profile.user_id == current_user.id).first()
    candidate_skills = [s.strip() for s in (profile.skills or "").split(",") if s.strip()] if profile else []
    candidate_text = f"{profile.title or ''} {profile.bio or ''}" if profile else ""

    total_jobs = db.query(Job).count()
    user_apps = db.query(Application).filter(Application.user_id == current_user.id).all()
    
    # Calculate average match score across jobs
    all_jobs = db.query(Job).all()
    scores = []
    for job in all_jobs:
        sc, _, _ = calculate_job_match(
            candidate_skills=candidate_skills,
            candidate_text=candidate_text,
            job_title=job.title,
            job_description=job.description,
            job_skills_str=job.skills_required
        )
        scores.append(sc)
    
    avg_match = round(sum(scores) / len(scores), 1) if scores else 0.0
    high_matches_count = len([s for s in scores if s >= 75.0])

    # ATS score average
    ats_reports = db.query(ATSReport).filter(ATSReport.user_id == current_user.id).all()
    avg_ats = round(sum(r.ats_score for r in ats_reports) / len(ats_reports), 1) if ats_reports else 82.5

    # Application Breakdown by status
    app_stats = {
        "Applied": 0,
        "Screening": 0,
        "Interview": 0,
        "Offered": 0,
        "Rejected": 0
    }
    for app in user_apps:
        app_stats[app.status] = app_stats.get(app.status, 0) + 1

    # Recent notifications
    notifications = db.query(Notification).filter(Notification.user_id == current_user.id).order_by(Notification.created_at.desc()).limit(5).all()

    return {
        "total_jobs_available": total_jobs,
        "recommended_high_matches": high_matches_count,
        "average_match_score": avg_match,
        "average_ats_score": avg_ats,
        "total_applications": len(user_apps),
        "applications_by_status": app_stats,
        "notifications": [
            {
                "id": n.id,
                "title": n.title,
                "message": n.message,
                "created_at": n.created_at
            } for n in notifications
        ]
    }

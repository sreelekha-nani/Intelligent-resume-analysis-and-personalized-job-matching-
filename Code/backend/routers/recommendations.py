from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from models import Job, Profile, User
from schemas import JobOut
from routers.auth import get_current_user
from services.job_service import seed_jobs_if_empty
from services.matching_service import calculate_job_match

router = APIRouter(prefix="/recommendations", tags=["Recommendation Engine"])

@router.get("/", response_model=List[JobOut])
def get_personalized_recommendations(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    seed_jobs_if_empty(db)

    profile = db.query(Profile).filter(Profile.user_id == current_user.id).first()
    candidate_skills = [s.strip() for s in (profile.skills or "").split(",") if s.strip()] if profile else []
    candidate_text = f"{profile.title or ''} {profile.bio or ''} {profile.preferred_roles or ''}" if profile else ""

    all_jobs = db.query(Job).all()
    recommended_jobs = []

    for job in all_jobs:
        score, matched_skills, missing_skills = calculate_job_match(
            candidate_skills=candidate_skills,
            candidate_text=candidate_text,
            job_title=job.title,
            job_description=job.description,
            job_skills_str=job.skills_required
        )
        
        job_out = JobOut(
            id=job.id,
            title=job.title,
            company=job.company,
            location=job.location,
            description=job.description,
            requirements=job.requirements,
            skills_required=job.skills_required,
            salary_range=job.salary_range,
            job_type=job.job_type,
            openings_count=job.openings_count or 1,
            status=job.status or "Published",
            external_url=job.external_url,
            source=job.source,
            created_at=job.created_at,
            match_score=score,
            matched_skills=matched_skills,
            missing_skills=missing_skills
        )
        recommended_jobs.append(job_out)

    # Sort by highest match score
    recommended_jobs.sort(key=lambda x: x.match_score, reverse=True)

    return recommended_jobs

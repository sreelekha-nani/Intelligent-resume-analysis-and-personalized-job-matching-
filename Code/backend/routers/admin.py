import json
import datetime
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from database import get_db
from models import User, Profile, Job, Application, ATSReport, Resume
from routers.auth import get_current_user
from pydantic import BaseModel

router = APIRouter(prefix="/admin", tags=["Admin Dashboard"])

def get_current_admin(current_user: User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin privileges required. Access denied.")
    return current_user

# --- ADMIN SCHEMAS ---
class JobCreateUpdateSchema(BaseModel):
    title: str
    company: str
    category: Optional[str] = "Engineering"
    job_type: Optional[str] = "Full-time"
    workplace_type: Optional[str] = "Onsite"
    location: str
    country: Optional[str] = "India"
    state: Optional[str] = ""
    city: Optional[str] = ""
    min_experience: Optional[float] = 0.0
    max_experience: Optional[float] = 0.0
    min_salary: Optional[float] = 0.0
    max_salary: Optional[float] = 0.0
    currency: Optional[str] = "INR"
    hide_salary: Optional[bool] = False
    min_qualification: Optional[str] = "Bachelor's Degree"
    skills_required: str  # Comma separated or string
    description: str
    responsibilities: Optional[str] = ""  # JSON or text list
    requirements: Optional[str] = ""      # JSON or text list
    openings_count: Optional[int] = 1
    deadline: Optional[str] = ""
    status: Optional[str] = "Published"  # Draft, Published, Closed

class ApplicationStatusUpdateSchema(BaseModel):
    status: str

# 1. OVERVIEW DASHBOARD STATS
@router.get("/stats")
def get_admin_dashboard_stats(
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    total_jobs = db.query(Job).count()
    active_jobs = db.query(Job).filter(Job.status == "Published").count()
    closed_jobs = db.query(Job).filter(Job.status == "Closed").count()
    total_users = db.query(User).filter(User.role == "candidate").count()
    total_applications = db.query(Application).count()
    
    today_start = datetime.datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    applications_today = db.query(Application).filter(Application.applied_at >= today_start).count()

    # Recent 5 Jobs
    recent_jobs_db = db.query(Job).order_by(Job.created_at.desc()).limit(5).all()
    recent_jobs = []
    for j in recent_jobs_db:
        recent_jobs.append({
            "id": j.id,
            "title": j.title,
            "company": j.company,
            "status": j.status or "Published",
            "posted_date": j.created_at.strftime("%Y-%m-%d") if j.created_at else ""
        })

    # Recent 5 Applications
    recent_apps_db = db.query(Application).order_by(Application.applied_at.desc()).limit(5).all()
    recent_applications = []
    for app in recent_apps_db:
        candidate = app.user
        job = app.job
        recent_applications.append({
            "id": app.id,
            "candidate_name": candidate.full_name if candidate else "Candidate",
            "job_title": job.title if job else "N/A",
            "company": job.company if job else "N/A",
            "applied_date": app.applied_at.strftime("%Y-%m-%d") if app.applied_at else "",
            "status": app.status
        })

    return {
        "total_jobs": total_jobs,
        "active_jobs": active_jobs,
        "closed_jobs": closed_jobs,
        "total_users": total_users,
        "total_applications": total_applications,
        "applications_today": applications_today,
        "recent_jobs": recent_jobs,
        "recent_applications": recent_applications
    }

# 2. JOBS MODULE (CRUD)
@router.get("/jobs")
def get_admin_jobs(
    search: Optional[str] = Query(None),
    status_filter: Optional[str] = Query(None),
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    query = db.query(Job)
    if status_filter and status_filter != "All":
        query = query.filter(Job.status == status_filter)
    if search:
        s_term = f"%{search}%"
        query = query.filter((Job.title.ilike(s_term)) | (Job.company.ilike(s_term)) | (Job.location.ilike(s_term)))

    jobs = query.order_by(Job.created_at.desc()).all()
    result = []
    for j in jobs:
        app_count = db.query(Application).filter(Application.job_id == j.id).count()
        
        salary_display = "Confidential" if j.hide_salary else f"{j.currency or 'INR'} {int(j.min_salary or 0):,} - {int(j.max_salary or 0):,}"
        if not j.min_salary and not j.max_salary and j.salary_range:
            salary_display = j.salary_range

        result.append({
            "id": j.id,
            "title": j.title,
            "company": j.company,
            "category": j.category or "Engineering",
            "employment_type": j.job_type or "Full-time",
            "workplace_type": j.workplace_type or "Onsite",
            "location": j.location,
            "country": j.country or "India",
            "state": j.state or "",
            "city": j.city or "",
            "min_experience": j.min_experience or 0.0,
            "max_experience": j.max_experience or 0.0,
            "experience_display": f"{j.min_experience or 0} - {j.max_experience or 0} yrs",
            "min_salary": j.min_salary or 0.0,
            "max_salary": j.max_salary or 0.0,
            "currency": j.currency or "INR",
            "hide_salary": j.hide_salary or False,
            "salary_display": salary_display,
            "min_qualification": j.min_qualification or "Bachelor's",
            "skills_required": j.skills_required or "",
            "description": j.description or "",
            "responsibilities": j.responsibilities or "",
            "requirements": j.requirements or "",
            "openings_count": j.openings_count or 1,
            "deadline": j.deadline or "",
            "status": j.status or "Published",
            "applications_count": app_count,
            "posted_date": j.created_at.strftime("%Y-%m-%d") if j.created_at else ""
        })
    return result

@router.post("/jobs")
def create_admin_job(
    payload: JobCreateUpdateSchema,
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    job = Job(
        title=payload.title,
        company=payload.company,
        category=payload.category,
        job_type=payload.job_type,
        workplace_type=payload.workplace_type,
        location=payload.location,
        country=payload.country,
        state=payload.state,
        city=payload.city,
        min_experience=payload.min_experience,
        max_experience=payload.max_experience,
        min_salary=payload.min_salary,
        max_salary=payload.max_salary,
        currency=payload.currency,
        hide_salary=payload.hide_salary,
        min_qualification=payload.min_qualification,
        skills_required=payload.skills_required,
        description=payload.description,
        responsibilities=payload.responsibilities,
        requirements=payload.requirements,
        openings_count=payload.openings_count,
        deadline=payload.deadline,
        status=payload.status or "Published",
        source="admin"
    )
    db.add(job)
    db.commit()
    db.refresh(job)
    return {"message": "Job created successfully", "job_id": job.id}

@router.get("/jobs/{job_id}")
def get_admin_job_by_id(
    job_id: int,
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job

@router.put("/jobs/{job_id}")
def update_admin_job(
    job_id: int,
    payload: JobCreateUpdateSchema,
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    job.title = payload.title
    job.company = payload.company
    job.category = payload.category
    job.job_type = payload.job_type
    job.workplace_type = payload.workplace_type
    job.location = payload.location
    job.country = payload.country
    job.state = payload.state
    job.city = payload.city
    job.min_experience = payload.min_experience
    job.max_experience = payload.max_experience
    job.min_salary = payload.min_salary
    job.max_salary = payload.max_salary
    job.currency = payload.currency
    job.hide_salary = payload.hide_salary
    job.min_qualification = payload.min_qualification
    job.skills_required = payload.skills_required
    job.description = payload.description
    job.responsibilities = payload.responsibilities
    job.requirements = payload.requirements
    job.openings_count = payload.openings_count
    job.deadline = payload.deadline
    if payload.status is not None:
        job.status = payload.status

    db.commit()
    return {"message": "Job updated successfully"}

@router.delete("/jobs/{job_id}")
def delete_admin_job(
    job_id: int,
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    # Safely delete dependent applications & ATS reports before deleting job
    db.query(Application).filter(Application.job_id == job_id).delete(synchronize_session=False)
    db.query(ATSReport).filter(ATSReport.job_id == job_id).delete(synchronize_session=False)
    db.delete(job)
    db.commit()
    return {"message": "Job deleted successfully"}

# 3. USERS MODULE
@router.get("/users")
def get_admin_users(
    search: Optional[str] = Query(None),
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    query = db.query(User).filter(User.role == "candidate")
    if search:
        s_term = f"%{search}%"
        query = query.filter((User.full_name.ilike(s_term)) | (User.email.ilike(s_term)))

    users = query.order_by(User.created_at.desc()).all()
    result = []
    for u in users:
        p = u.profile
        res_count = db.query(Resume).filter(Resume.user_id == u.id).count()

        skills_list = []
        if p and p.skills:
            if p.skills.startswith("["):
                try: skills_list = json.loads(p.skills)
                except: skills_list = [s.strip() for s in p.skills.split(",") if s.strip()]
            else:
                skills_list = [s.strip() for s in p.skills.split(",") if s.strip()]

        highest_qual = "Bachelor's Degree"
        if p and p.educations:
            try:
                eds = json.loads(p.educations) if p.educations.startswith("[") else []
                if eds and len(eds) > 0:
                    highest_qual = eds[0].get("degree") or eds[0].get("institution") or highest_qual
            except: pass

        result.append({
            "id": u.id,
            "full_name": u.full_name,
            "email": u.email,
            "phone": p.phone if p else "",
            "profile_photo": p.profile_photo if p else None,
            "highest_qualification": highest_qual,
            "experience_years": p.experience_years if p else 0.0,
            "skills_count": len(skills_list),
            "resume_uploaded": res_count > 0,
            "registration_date": u.created_at.strftime("%Y-%m-%d") if u.created_at else ""
        })
    return result

@router.get("/users/{user_id}/profile")
def get_admin_user_profile(
    user_id: int,
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Candidate not found")

    p = user.profile
    resumes = db.query(Resume).filter(Resume.user_id == user_id).order_by(Resume.uploaded_at.desc()).all()
    latest_ats = db.query(ATSReport).filter(ATSReport.user_id == user_id).order_by(ATSReport.created_at.desc()).first()

    return {
        "user_id": user.id,
        "full_name": user.full_name,
        "email": user.email,
        "role": user.role,
        "created_at": user.created_at.strftime("%Y-%m-%d"),
        "profile": {
            "first_name": p.first_name if p else "",
            "last_name": p.last_name if p else "",
            "phone": p.phone if p else "",
            "gender": p.gender if p else "",
            "current_city": p.current_city if p else "",
            "state": p.state if p else "",
            "country": p.country if p else "",
            "title": p.title if p else "",
            "bio": p.bio if p else "",
            "work_experiences": json.loads(p.work_experiences) if p and p.work_experiences and p.work_experiences.startswith("[") else [],
            "educations": json.loads(p.educations) if p and p.educations and p.educations.startswith("[") else [],
            "projects": json.loads(p.projects) if p and p.projects and p.projects.startswith("[") else [],
            "skills": json.loads(p.skills) if p and p.skills and p.skills.startswith("[") else ([s.strip() for s in p.skills.split(",")] if p and p.skills else []),
            "certifications": json.loads(p.certifications) if p and p.certifications and p.certifications.startswith("[") else [],
            "profile_photo": p.profile_photo if p else None
        },
        "resumes": [{"id": r.id, "filename": r.filename, "uploaded_at": r.uploaded_at.strftime("%Y-%m-%d")} for r in resumes],
        "latest_ats_score": latest_ats.ats_score if latest_ats else None
    }

# 4. APPLICATIONS MODULE (Grouped by Company)
@router.get("/applications")
def get_admin_applications(
    company_filter: Optional[str] = Query(None),
    job_id: Optional[int] = Query(None),
    status_filter: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    query = db.query(Application)
    if job_id:
        query = query.filter(Application.job_id == job_id)
    if status_filter and status_filter != "All":
        query = query.filter(Application.status == status_filter)

    apps = query.order_by(Application.applied_at.desc()).all()

    # Filter & Group by Company
    grouped: Dict[str, List[Dict[str, Any]]] = {}

    for app in apps:
        j = app.job
        u = app.user
        if not j or not u:
            continue

        company_name = j.company or "Other"

        if company_filter and company_filter != "All" and company_filter.lower() not in company_name.lower():
            continue

        if search:
            s_term = search.lower()
            if s_term not in u.full_name.lower() and s_term not in u.email.lower() and s_term not in j.title.lower():
                continue

        # Get resume info
        res = db.query(Resume).filter(Resume.id == app.resume_id).first() if app.resume_id else None
        if not res:
            res = db.query(Resume).filter(Resume.user_id == u.id).order_by(Resume.uploaded_at.desc()).first()

        ats_rep = db.query(ATSReport).filter(ATSReport.user_id == u.id, ATSReport.job_id == j.id).first()
        ats_score = ats_rep.ats_score if ats_rep else (app.match_score or 75.0)

        app_item = {
            "id": app.id,
            "candidate_id": u.id,
            "candidate_name": u.full_name,
            "candidate_email": u.email,
            "job_id": j.id,
            "job_title": j.title,
            "company": company_name,
            "applied_date": app.applied_at.strftime("%Y-%m-%d") if app.applied_at else "",
            "ats_score": round(ats_score, 1),
            "status": app.status or "Applied",
            "resume_id": res.id if res else None,
            "resume_filename": res.filename if res else "resume.pdf",
            "resume_url": f"/uploads/resumes/{res.filename}" if res else ""
        }

        if company_name not in grouped:
            grouped[company_name] = []
        grouped[company_name].append(app_item)

    # Format result as list of company groups
    result = []
    for comp, app_list in grouped.items():
        result.append({
            "company": comp,
            "applications": app_list
        })
    return result

@router.put("/applications/{application_id}/status")
def update_application_status(
    application_id: int,
    payload: ApplicationStatusUpdateSchema,
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    app = db.query(Application).filter(Application.id == application_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")

    valid_statuses = ["Applied", "Under Review", "Shortlisted", "Interview Scheduled", "Selected", "Rejected"]
    if payload.status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of {valid_statuses}")

    app.status = payload.status
    app.updated_at = datetime.datetime.utcnow()
    db.commit()
    return {"message": "Application status updated successfully", "status": app.status}

@router.get("/applications/{application_id}")
def get_application_details(
    application_id: int,
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    app = db.query(Application).filter(Application.id == application_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")

    u = app.user
    j = app.job
    p = u.profile if u else None

    # Retrieve candidate resume
    res = db.query(Resume).filter(Resume.id == app.resume_id).first() if app.resume_id else None
    if not res:
        res = db.query(Resume).filter(Resume.user_id == u.id).order_by(Resume.uploaded_at.desc()).first()

    parsed_data = {}
    if res and res.parsed_data:
        try: parsed_data = json.loads(res.parsed_data)
        except: pass

    ats_rep = db.query(ATSReport).filter(ATSReport.user_id == u.id, ATSReport.job_id == j.id).first()

    return {
        "id": app.id,
        "status": app.status,
        "applied_date": app.applied_at.strftime("%Y-%m-%d %H:%M") if app.applied_at else "",
        "candidate": {
            "id": u.id,
            "name": u.full_name,
            "email": u.email,
            "phone": p.phone if p else "N/A"
        },
        "job": {
            "id": j.id,
            "title": j.title,
            "company": j.company,
            "location": j.location
        },
        "resume": {
            "id": res.id if res else None,
            "filename": res.filename if res else "resume.pdf",
            "file_url": f"/uploads/resumes/{res.filename}" if res else ""
        },
        "parsed_resume": {
            "skills": parsed_data.get("skills", []),
            "education": parsed_data.get("education", []),
            "experience": parsed_data.get("work_experiences", []),
            "projects": parsed_data.get("projects", [])
        },
        "ats_analysis": {
            "ats_score": ats_rep.ats_score if ats_rep else (app.match_score or 0.0),
            "matched_skills": parsed_data.get("skills", []),
            "missing_skills": [s.strip() for s in ats_rep.missing_skills.split(",") if s.strip()] if ats_rep and ats_rep.missing_skills else [],
            "strengths": ["Parsed Skills Available"] if parsed_data.get("skills") else [],
            "weaknesses": []
        }
    }

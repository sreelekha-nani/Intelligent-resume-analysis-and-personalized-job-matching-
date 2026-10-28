import os
import datetime
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from models import User, Profile, Job, Application, Notification, Resume
from schemas import ApplicationCreate, ApplicationOut, ApplicationStatusUpdate
from routers.auth import get_current_user
from services.matching_service import calculate_job_match
from services.email_service import send_email_notification
from services.email_template_service import render_application_confirmation_email

router = APIRouter(prefix="/applications", tags=["Application Tracker"])

@router.post("/apply", response_model=ApplicationOut)
def apply_to_job(
    app_in: ApplicationCreate,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    job = db.query(Job).filter(Job.id == app_in.job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    if job.status and job.status.lower() in ["closed", "draft"]:
        raise HTTPException(status_code=400, detail="This job posting is closed and no longer accepting new applications.")

    existing = db.query(Application).filter(
        Application.user_id == current_user.id,
        Application.job_id == app_in.job_id
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="You have already applied for this job.")

    score = app_in.ats_score if (app_in.ats_score is not None and app_in.ats_score > 0) else 0.0
    if not score:
        profile = db.query(Profile).filter(Profile.user_id == current_user.id).first()
        candidate_skills = [s.strip() for s in (profile.skills or "").split(",") if s.strip()] if profile else []
        candidate_text = f"{profile.title or ''} {profile.bio or ''}" if profile else ""

        score, _, _ = calculate_job_match(
            candidate_skills=candidate_skills,
            candidate_text=candidate_text,
            job_title=job.title,
            job_description=job.description,
            job_skills_str=job.skills_required
        )

    application = Application(
        user_id=current_user.id,
        job_id=job.id,
        resume_id=app_in.resume_id,
        status="Applied",
        cover_letter=app_in.cover_letter,
        match_score=score
    )
    db.add(application)

    # Create in-app Notification
    notif = Notification(
        user_id=current_user.id,
        title="Application Submitted",
        message=f"Successfully submitted application for {job.title} at {job.company}."
    )
    db.add(notif)
    db.commit()
    db.refresh(application)

    # Determine recipient email (check profile email first, fallback to user account email)
    profile = db.query(Profile).filter(Profile.user_id == current_user.id).first()
    target_email = (profile.email if (profile and profile.email and "@" in profile.email) else current_user.email)
    
    # Selected resume details
    resume_name = "Primary Resume"
    resume_filepath = None
    if app_in.resume_id:
        selected_resume = db.query(Resume).filter(Resume.id == app_in.resume_id, Resume.user_id == current_user.id).first()
        if selected_resume:
            resume_name = selected_resume.filename
            resume_filepath = selected_resume.file_path

    exp_str = "Entry Level"
    if job.min_experience and job.min_experience > 0:
        if job.max_experience and job.max_experience > job.min_experience:
            exp_str = f"{int(job.min_experience)}–{int(job.max_experience)} Years"
        else:
            exp_str = f"{int(job.min_experience)}+ Years"
    elif job.max_experience and job.max_experience > 0:
        exp_str = f"Up to {int(job.max_experience)} Years"

    # Context for modern ATS email template
    email_context = {
        "candidate_name": current_user.full_name or "Candidate",
        "job_title": job.title,
        "company_name": job.company,
        "location": job.location or "Remote / Flexible",
        "employment_type": job.job_type or "Full-time",
        "experience_level": exp_str,
        "application_id": f"#APP-{application.id:05d}",
        "applied_date": application.applied_at.strftime("%B %d, %Y at %I:%M %p UTC") if application.applied_at else datetime.datetime.utcnow().strftime("%B %d, %Y at %I:%M %p UTC"),
        "application_status": "Applied",
        "resume_name": resume_name,
        "dashboard_url": "http://localhost:3000/dashboard",
        "applications_url": "http://localhost:3000/applications",
        "jobs_url": "http://localhost:3000/jobs",
        "support_email": "support@yourplatform.com",
        "platform_name": "AI Job Placement Platform",
        "expected_response_time": "Most applications are reviewed within 5–7 business days."
    }

    email_html = render_application_confirmation_email(email_context)

    # Prepare PDF / Text file attachments for candidate records
    attachments = []
    if resume_filepath and os.path.exists(resume_filepath):
        attachments.append({
            "filename": resume_name,
            "filepath": resume_filepath
        })
    
    if app_in.cover_letter and app_in.cover_letter.strip():
        attachments.append({
            "filename": f"Cover_Letter_{job.company.replace(' ', '_')}.txt",
            "content": app_in.cover_letter.strip()
        })

    # Trigger live email sending to candidate in background
    if target_email:
        background_tasks.add_task(
            send_email_notification,
            to_email=target_email,
            subject=f"Application Received: {job.title} at {job.company}",
            body_html=email_html,
            attachments=attachments
        )

    return application

@router.post("/generate-cover-letter")
def generate_cover_letter_endpoint(
    data: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    from services.ai_service import generate_cover_letter
    raw_job_id = data.get("job_id")
    if not raw_job_id:
        raise HTTPException(status_code=400, detail="Job ID is required")
    
    try:
        job_id = int(raw_job_id)
    except (ValueError, TypeError):
        raise HTTPException(status_code=400, detail="Invalid Job ID format")

    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    profile = db.query(Profile).filter(Profile.user_id == current_user.id).first()
    candidate_title = profile.title if profile else ""
    candidate_skills = []
    if profile and profile.skills:
        if isinstance(profile.skills, list):
            candidate_skills = [str(s).strip() for s in profile.skills if str(s).strip()]
        elif isinstance(profile.skills, str):
            candidate_skills = [s.strip() for s in profile.skills.split(",") if s.strip()]

    work_history = []
    projects = []
    
    raw_resume_id = data.get("resume_id")
    if raw_resume_id:
        try:
            resume_id = int(raw_resume_id)
            resume = db.query(Resume).filter(Resume.id == resume_id, Resume.user_id == current_user.id).first()
            if resume and resume.parsed_data:
                import json
                pdata = json.loads(resume.parsed_data) if isinstance(resume.parsed_data, str) else resume.parsed_data
                if isinstance(pdata, dict):
                    res_skills = pdata.get("skills", [])
                    if isinstance(res_skills, list):
                        candidate_skills = list(set(candidate_skills + [str(s).strip() for s in res_skills if str(s).strip()]))
                    
                    res_exp = pdata.get("experience", [])
                    if isinstance(res_exp, list):
                        work_history = [str(e.get("title") or e.get("company") or e).strip() for e in res_exp if isinstance(e, dict)]
                    
                    res_proj = pdata.get("projects", [])
                    if isinstance(res_proj, list):
                        projects = [str(p.get("title") or p.get("name") or p).strip() for p in res_proj if isinstance(p, dict)]
        except Exception as e:
            print("Error parsing resume data for cover letter:", e)

    job_skills_req = []
    if job.skills_required:
        if isinstance(job.skills_required, list):
            job_skills_req = [str(s).strip() for s in job.skills_required if str(s).strip()]
        elif isinstance(job.skills_required, str):
            job_skills_req = [s.strip() for s in job.skills_required.split(",") if s.strip()]

    letter = generate_cover_letter(
        candidate_name=current_user.full_name,
        candidate_title=candidate_title,
        candidate_skills=candidate_skills,
        work_history=work_history,
        projects=projects,
        job_title=job.title,
        company=job.company,
        job_description=job.description,
        skills_required=job_skills_req,
        custom_notes=data.get("custom_notes", ""),
        tone=data.get("tone", "standard")
    )

    return {"cover_letter": letter}

@router.get("/my-applications", response_model=List[ApplicationOut])
def get_my_applications(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    apps = db.query(Application).filter(Application.user_id == current_user.id).order_by(Application.applied_at.desc()).all()
    return apps

@router.put("/{application_id}/status", response_model=ApplicationOut)
def update_application_status(
    application_id: int,
    status_in: ApplicationStatusUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    app_obj = db.query(Application).filter(Application.id == application_id, Application.user_id == current_user.id).first()
    if not app_obj:
        raise HTTPException(status_code=404, detail="Application record not found")

    app_obj.status = status_in.status
    if status_in.notes is not None:
        app_obj.notes = status_in.notes

    # Add notification for status change
    notif = Notification(
        user_id=current_user.id,
        title="Application Status Updated",
        message=f"Your application status for {app_obj.job.title} changed to {status_in.status}."
    )
    db.add(notif)
    db.commit()
    db.refresh(app_obj)

    return app_obj

@router.delete("/{application_id}")
def withdraw_application(
    application_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    app_obj = db.query(Application).filter(Application.id == application_id, Application.user_id == current_user.id).first()
    if not app_obj:
        raise HTTPException(status_code=404, detail="Application record not found")

    job_title = app_obj.job.title if app_obj.job else "Job"
    company_name = app_obj.job.company if app_obj.job else ""

    db.delete(app_obj)

    # Add notification for application withdrawal
    notif = Notification(
        user_id=current_user.id,
        title="Application Withdrawn",
        message=f"You have successfully withdrawn your application for {job_title} at {company_name}."
    )
    db.add(notif)
    db.commit()

    return {"message": "Application withdrawn successfully", "application_id": application_id}

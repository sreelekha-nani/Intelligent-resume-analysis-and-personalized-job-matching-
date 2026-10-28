import json
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import User, Profile, Job, ATSReport, Resume
from schemas import ATSAnalysisRequest, ATSReportOut
from routers.auth import get_current_user
from services.ats_service import analyze_resume_against_job

router = APIRouter(prefix="/ats", tags=["ATS Engine"])

@router.post("/analyze", response_model=ATSReportOut)
def run_ats_analysis(
    req: ATSAnalysisRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    resume_text = req.resume_text or ""
    parsed_data = {}
    
    if req.resume_id:
        resume = db.query(Resume).filter(Resume.id == req.resume_id, Resume.user_id == current_user.id).first()
        if resume and resume.parsed_data:
            p_data = json.loads(resume.parsed_data) if isinstance(resume.parsed_data, str) else resume.parsed_data
            parsed_data = p_data
            resume_text = p_data.get("raw_text", "")
            if not resume_text:
                parts = []
                if p_data.get("skills"): parts.append("Skills: " + ", ".join(p_data["skills"]))
                if p_data.get("education"): parts.append("Education: " + json.dumps(p_data["education"]))
                if p_data.get("work_experiences"): parts.append("Experience: " + json.dumps(p_data["work_experiences"]))
                if p_data.get("projects"): parts.append("Projects: " + json.dumps(p_data["projects"]))
                resume_text = " ".join(parts)

    if not resume_text:
        latest_resume = db.query(Resume).filter(Resume.user_id == current_user.id).order_by(Resume.uploaded_at.desc()).first()
        if latest_resume and latest_resume.parsed_data:
            p_data = json.loads(latest_resume.parsed_data) if isinstance(latest_resume.parsed_data, str) else latest_resume.parsed_data
            parsed_data = p_data
            resume_text = p_data.get("raw_text", "")
            if not resume_text:
                parts = []
                if p_data.get("skills"): parts.append("Skills: " + ", ".join(p_data["skills"]))
                if p_data.get("education"): parts.append("Education: " + json.dumps(p_data["education"]))
                if p_data.get("work_experiences"): parts.append("Experience: " + json.dumps(p_data["work_experiences"]))
                if p_data.get("projects"): parts.append("Projects: " + json.dumps(p_data["projects"]))
                resume_text = " ".join(parts)

    if not resume_text:
        raise HTTPException(status_code=400, detail="No resume content provided or found for analysis.")

    job_desc = req.job_description or ""
    skills_req = []
    if req.job_id:
        job = db.query(Job).filter(Job.id == req.job_id).first()
        if job:
            job_desc = (job.description or "") + "\n" + (job.requirements or "")
            skills_req = job.skills_required or []

    report_data = analyze_resume_against_job(
        target_role=req.target_role or "Target Job Role",
        job_description=job_desc,
        skills_required_raw=skills_req,
        resume_text=resume_text,
        parsed_resume_data=parsed_data
    )

    # Save to database history
    try:
        missing_kw_names = [m["keyword"] for m in report_data.get("missing_keywords", [])]
        ats_db = ATSReport(
            user_id=current_user.id,
            job_id=req.job_id,
            ats_score=report_data["ats_score"],
            formatting_score=report_data["breakdown"].get("readability", 80.0),
            missing_skills=", ".join(missing_kw_names[:10]),
            section_feedback=json.dumps(report_data["section_analysis"]),
            recommendations=json.dumps(report_data["improvements"])
        )
        db.add(ats_db)
        db.commit()
    except Exception as e:
        print("ATS report DB save notice:", e)

    return report_data

import os
import shutil
import json
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from database import get_db
from models import User, Profile, Resume
from schemas import ResumeParsedOut
from routers.auth import get_current_user
from services.resume_parser import extract_text_from_file, parse_resume_text

router = APIRouter(prefix="/resumes", tags=["Resumes & Parsing"])

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads", "resumes")
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/upload", response_model=ResumeParsedOut)
async def upload_resume(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    filename_lower = file.filename.lower()
    if not filename_lower.endswith(('.pdf', '.docx', '.doc', '.txt')):
        raise HTTPException(status_code=400, detail="Only PDF, DOCX, and TXT files are supported.")

    file_filename = f"user_{current_user.id}_{file.filename}"
    file_path = os.path.join(UPLOAD_DIR, file_filename)

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Extract text & parse details using AI Parser
    extracted_text = extract_text_from_file(file_path)
    parsed_info = parse_resume_text(extracted_text)

    # Set all existing user resumes as inactive
    db.query(Resume).filter(Resume.user_id == current_user.id).update({"is_active": False})

    # Save Resume Record in DB with is_active = True
    resume = Resume(
        user_id=current_user.id,
        filename=file.filename,
        file_path=file_path,
        parsed_data=json.dumps(parsed_info),
        is_active=True
    )
    db.add(resume)

    # Sync with profile resume_url
    profile = db.query(Profile).filter(Profile.user_id == current_user.id).first()
    if profile:
        profile.resume_url = file_path

    db.commit()
    db.refresh(resume)

    # Return parsed details in memory for the current active frontend session ONLY
    return {
        "id": resume.id,
        "filename": file.filename,
        "first_name": parsed_info.get("first_name", ""),
        "middle_name": parsed_info.get("middle_name", ""),
        "last_name": parsed_info.get("last_name", ""),
        "email": parsed_info.get("email", ""),
        "phone": parsed_info.get("phone", ""),
        "alternate_phone": parsed_info.get("alternate_phone", ""),
        "date_of_birth": parsed_info.get("date_of_birth", ""),
        "gender": parsed_info.get("gender", ""),
        "current_city": parsed_info.get("current_city", ""),
        "state": parsed_info.get("state", ""),
        "country": parsed_info.get("country", ""),
        "postal_code": parsed_info.get("postal_code", ""),
        "skills": parsed_info.get("skills", []),
        "experience_years": parsed_info.get("experience_years", 0.0),
        "summary": "", # Professional Summary is entered strictly manually by user
        "education": parsed_info.get("education", []),
        "educations": parsed_info.get("education", []),
        "work_experiences": parsed_info.get("work_experiences", []),
        "projects": parsed_info.get("projects", []),
        "languages": parsed_info.get("languages", []),
        "links": parsed_info.get("links", [])
    }

@router.get("/my-resumes")
def get_user_resumes(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    resumes = db.query(Resume).filter(Resume.user_id == current_user.id).order_by(Resume.is_active.desc(), Resume.uploaded_at.desc()).all()
    
    # Default top resume as active if none is marked
    if resumes and not any(getattr(r, 'is_active', False) for r in resumes):
        resumes[0].is_active = True
        db.commit()

    res = []
    for r in resumes:
        p_data = json.loads(r.parsed_data) if r.parsed_data else {}
        is_act = bool(getattr(r, 'is_active', False))
        res.append({
            "id": r.id,
            "filename": r.filename,
            "uploaded_at": r.uploaded_at,
            "is_active": is_act,
            "status_label": "Active Resume" if is_act else "Previous Resume",
            "parsed_info": p_data
        })
    return res

@router.put("/{resume_id}/set-active")
def set_active_resume(
    resume_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    resume = db.query(Resume).filter(Resume.id == resume_id, Resume.user_id == current_user.id).first()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume record not found.")

    from datetime import datetime
    
    # Reset all resumes for user
    db.query(Resume).filter(Resume.user_id == current_user.id).update({"is_active": False})
    
    # Mark selected resume as active
    resume.is_active = True
    resume.uploaded_at = datetime.utcnow()

    # Sync with profile resume_url
    profile = db.query(Profile).filter(Profile.user_id == current_user.id).first()
    if profile:
        profile.resume_url = resume.file_path

    db.commit()
    db.refresh(resume)

    return {"message": f"Resume '{resume.filename}' set as active resume.", "id": resume_id}

@router.delete("/{resume_id}")
def delete_resume(
    resume_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    resume = db.query(Resume).filter(Resume.id == resume_id, Resume.user_id == current_user.id).first()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume record not found.")

    if resume.file_path and os.path.exists(resume.file_path):
        try:
            os.remove(resume.file_path)
        except Exception as e:
            print(f"File deletion warning: {e}")

    db.delete(resume)
    db.commit()

    return {"message": "Resume deleted successfully", "id": resume_id}

@router.get("/{resume_id}/download")
def download_resume_file(
    resume_id: int,
    db: Session = Depends(get_db)
):
    resume = db.query(Resume).filter(Resume.id == resume_id).first()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume record not found.")

    if not resume.file_path or not os.path.exists(resume.file_path):
        raise HTTPException(status_code=404, detail="Resume file not found on server disk.")

    media_type = "application/pdf"
    if resume.filename.lower().endswith(".docx"):
        media_type = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    elif resume.filename.lower().endswith(".txt"):
        media_type = "text/plain"

    return FileResponse(
        path=resume.file_path,
        media_type=media_type,
        filename=resume.filename
    )

@router.get("/{resume_id}/preview")
def preview_resume_file(
    resume_id: int,
    db: Session = Depends(get_db)
):
    resume = db.query(Resume).filter(Resume.id == resume_id).first()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume record not found.")

    if not resume.file_path or not os.path.exists(resume.file_path):
        raise HTTPException(status_code=404, detail="Resume file not found on server disk.")

    media_type = "application/pdf"
    if resume.filename.lower().endswith(".docx"):
        media_type = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    elif resume.filename.lower().endswith(".txt"):
        media_type = "text/plain"

    return FileResponse(
        path=resume.file_path,
        media_type=media_type,
        headers={"Content-Disposition": f'inline; filename="{resume.filename}"'}
    )

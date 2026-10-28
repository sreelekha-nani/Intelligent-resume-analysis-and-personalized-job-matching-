from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timedelta
from database import get_db
from models import Job, Profile, User
from schemas import JobOut, JobCreate
from routers.auth import get_current_user
from services.job_service import seed_jobs_if_empty, fetch_external_adzuna_jobs

router = APIRouter(prefix="/jobs", tags=["Jobs Directory"])

@router.get("/search", response_model=List[JobOut])
def search_jobs(
    q: Optional[str] = Query(None, description="Search keyword, role, title, company, skills, or description"),
    location: Optional[str] = Query(None, description="City, state, country, remote, hybrid, on-site"),
    job_type: Optional[str] = Query(None, description="Full-time, Part-time, Internship, Contract, Freelance"),
    experience: Optional[str] = Query(None, description="entry, senior, manager, director, executive"),
    posted: Optional[str] = Query(None, description="24hours, 7days, 30days"),
    salary: Optional[str] = Query(None, description="1-3, 3-6, 4-6, 6-10, 10-15, 15-25, 25+"),
    db: Session = Depends(get_db)
):
    seed_jobs_if_empty(db)
    
    query = db.query(Job)

    # 1. Keyword Search across Title, Company, Skills, Description, Requirements
    if q and q.strip():
        sp = f"%{q.strip()}%"
        query = query.filter(
            (Job.title.ilike(sp)) |
            (Job.company.ilike(sp)) |
            (Job.skills_required.ilike(sp)) |
            (Job.description.ilike(sp)) |
            (Job.requirements.ilike(sp))
        )

    # 2. Location Search (City, State, Country, Remote, Hybrid, Onsite)
    if location and location.strip():
        lp = f"%{location.strip()}%"
        query = query.filter(
            (Job.location.ilike(lp)) |
            (Job.city.ilike(lp)) |
            (Job.state.ilike(lp)) |
            (Job.country.ilike(lp)) |
            (Job.workplace_type.ilike(lp)) |
            (Job.job_type.ilike(lp))
        )

    # 3. Job Type Filter
    if job_type and job_type.strip() and job_type.lower() != "all":
        jp = f"%{job_type.strip()}%"
        query = query.filter((Job.job_type.ilike(jp)) | (Job.workplace_type.ilike(jp)))

    # 4. Experience Level Filter (Entry Level, Senior Level, Manager, Director, Executive)
    if experience and experience.strip() and experience.lower() != "all":
        exp_val = experience.strip().lower()
        if exp_val in ["entry", "entry level", "0-2"]:
            query = query.filter(Job.min_experience <= 2)
        elif exp_val in ["senior", "senior level", "5+"]:
            query = query.filter((Job.min_experience >= 4) | (Job.title.ilike("%senior%")) | (Job.title.ilike("%sr%")))
        elif exp_val in ["manager", "mgr"]:
            query = query.filter((Job.min_experience >= 6) | (Job.title.ilike("%manager%")) | (Job.title.ilike("%lead%")))
        elif exp_val in ["director"]:
            query = query.filter((Job.min_experience >= 9) | (Job.title.ilike("%director%")) | (Job.title.ilike("%head%")))
        elif exp_val in ["executive", "exec", "vp"]:
            query = query.filter((Job.min_experience >= 12) | (Job.title.ilike("%executive%") | Job.title.ilike("%vp%") | Job.title.ilike("%chief%")))

    # 5. Posted Date Filter (Past 24 Hours, Past 7 Days, Past 1 Month)
    if posted and posted.strip() and posted.lower() != "all":
        now = datetime.utcnow()
        post_val = posted.strip().lower()
        if post_val in ["24hours", "24h", "1day", "past 24 hours"]:
            cutoff = now - timedelta(hours=24)
            query = query.filter(Job.created_at >= cutoff)
        elif post_val in ["7days", "7d", "1week", "past 7 days"]:
            cutoff = now - timedelta(days=7)
            query = query.filter(Job.created_at >= cutoff)
        elif post_val in ["30days", "30d", "1month", "past 1 month"]:
            cutoff = now - timedelta(days=30)
            query = query.filter(Job.created_at >= cutoff)

    jobs = query.order_by(Job.created_at.desc()).all()

    # 6. Salary Range Filter (1-3 LPA, 3-6 LPA, 4-6 LPA, 6-10 LPA, 10-15 LPA, 15-25 LPA, 25+ LPA)
    if salary and salary.strip() and salary.lower() != "all":
        s_val = salary.strip().lower()
        min_lpa = 0.0
        max_lpa = 999.0
        if "-" in s_val:
            parts = s_val.split("-")
            try: min_lpa = float(parts[0])
            except: pass
            try: max_lpa = float(parts[1])
            except: pass
        elif "+" in s_val:
            try: min_lpa = float(s_val.replace("+", ""))
            except: pass

        filtered_jobs = []
        import re
        for j in jobs:
            j_min = j.min_salary or 0.0
            j_max = j.max_salary or 0.0

            if j_min > 100 or j_max > 100:
                j_min_lpa = j_min / 100000.0
                j_max_lpa = j_max / 100000.0 if j_max > 0 else j_min_lpa
            else:
                j_min_lpa = j_min
                j_max_lpa = j_max if j_max > 0 else j_min

            if j_min_lpa > 0 or j_max_lpa > 0:
                if not (j_max_lpa < min_lpa or (max_lpa < 999 and j_min_lpa > max_lpa)):
                    filtered_jobs.append(j)
                    continue

            # Fallback: Parse salary_range text string (e.g. "10 LPA - 15 LPA")
            if j.salary_range:
                nums = re.findall(r'\d+(?:,\d+)*(?:\.\d+)?', j.salary_range)
                clean_nums = []
                for n in nums:
                    val = float(n.replace(',', ''))
                    if val > 100:
                        val = val / 100000.0
                    clean_nums.append(val)
                
                if clean_nums:
                    parsed_min = min(clean_nums)
                    parsed_max = max(clean_nums)
                    if not (parsed_max < min_lpa or (max_lpa < 999 and parsed_min > max_lpa)):
                        filtered_jobs.append(j)
                        continue

        jobs = filtered_jobs
    
    # Try fetching external Adzuna jobs if search query is provided and local results are sparse
    if q and len(jobs) < 3:
        ext_jobs = fetch_external_adzuna_jobs(keyword=q)
        for ej in ext_jobs:
            new_j = Job(**ej)
            db.add(new_j)
        db.commit()
        jobs = query.order_by(Job.created_at.desc()).all()

    return jobs

@router.get("/{job_id}", response_model=JobOut)
def get_job_by_id(job_id: int, db: Session = Depends(get_db)):
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job

@router.post("/", response_model=JobOut)
def create_job(job_in: JobCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin permissions required to post jobs")
    job = Job(**job_in.dict())
    db.add(job)
    db.commit()
    db.refresh(job)
    return job

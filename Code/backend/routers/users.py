import json
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import User, Profile, Resume
from schemas import ProfileOut, ProfileUpdate
from routers.auth import get_current_user

router = APIRouter(prefix="/users", tags=["Users & Profiles"])

def parse_json_field(val, default=None):
    if default is None:
        default = []
    if not val:
        return default
    if isinstance(val, list) or isinstance(val, dict):
        return val
    try:
        parsed = json.loads(val)
        if isinstance(parsed, list) or isinstance(parsed, dict):
            return parsed
    except Exception:
        pass
    if isinstance(val, str) and "," in val:
        return [s.strip() for s in val.split(",") if s.strip()]
    if isinstance(val, str) and val.strip():
        return [val.strip()]
    return default

@router.get("/profile", response_model=ProfileOut)
def get_user_profile(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    profile = db.query(Profile).filter(Profile.user_id == current_user.id).first()
    if not profile:
        profile = Profile(
            user_id=current_user.id,
            first_name="",
            middle_name="",
            last_name="",
            email="",
            country=""
        )
        db.add(profile)
        db.commit()
        db.refresh(profile)

    skills_list = parse_json_field(profile.skills, [])
    if isinstance(skills_list, str):
        skills_list = [s.strip() for s in skills_list.split(",") if s.strip()]
    
    pref_obj = parse_json_field(profile.job_preferences, None)
    if not pref_obj:
        pref_obj = {
            "preferred_roles": profile.preferred_roles or "",
            "preferred_locations": profile.preferred_location or "",
            "job_type": "Full-time",
            "desired_salary": profile.desired_salary or ""
        }

    return ProfileOut(
        id=profile.id,
        user_id=profile.user_id,
        first_name=profile.first_name or "",
        middle_name=profile.middle_name or "",
        last_name=profile.last_name or "",
        email=profile.email or "",
        phone=profile.phone or "",
        alternate_phone=profile.alternate_phone or "",
        date_of_birth=profile.date_of_birth or "",
        gender=profile.gender or "",
        current_city=profile.current_city or "",
        state=profile.state or "",
        country=profile.country or "",
        postal_code=profile.postal_code or "",
        profile_photo=profile.profile_photo or "",
        title=profile.title or "",
        location=profile.location or "",
        bio=profile.bio or "",
        experience_years=profile.experience_years or 0.0,
        skills=skills_list if isinstance(skills_list, list) else [],
        work_experiences=parse_json_field(profile.work_experiences, []),
        educations=parse_json_field(profile.educations, []),
        projects=parse_json_field(profile.projects, []),
        certifications=parse_json_field(profile.certifications, []),
        languages=parse_json_field(profile.languages, []),
        links=parse_json_field(profile.links, []),
        job_preferences=pref_obj if isinstance(pref_obj, dict) else {},
        preferred_roles=profile.preferred_roles or "",
        preferred_location=profile.preferred_location or "",
        desired_salary=profile.desired_salary or "",
        resume_url=profile.resume_url
    )

@router.put("/profile", response_model=ProfileOut)
def update_user_profile(profile_in: ProfileUpdate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    profile = db.query(Profile).filter(Profile.user_id == current_user.id).first()
    if not profile:
        profile = Profile(user_id=current_user.id)
        db.add(profile)

    # Basic Info fields (explicit user saves)
    if profile_in.first_name is not None: profile.first_name = profile_in.first_name
    if profile_in.middle_name is not None: profile.middle_name = profile_in.middle_name
    if profile_in.last_name is not None: profile.last_name = profile_in.last_name
    if profile_in.email is not None: profile.email = profile_in.email
    if profile_in.phone is not None: profile.phone = profile_in.phone
    if profile_in.alternate_phone is not None: profile.alternate_phone = profile_in.alternate_phone
    if profile_in.date_of_birth is not None: profile.date_of_birth = profile_in.date_of_birth
    if profile_in.gender is not None: profile.gender = profile_in.gender
    if profile_in.current_city is not None: profile.current_city = profile_in.current_city
    if profile_in.state is not None: profile.state = profile_in.state
    if profile_in.country is not None: profile.country = profile_in.country
    if profile_in.postal_code is not None: profile.postal_code = profile_in.postal_code
    if profile_in.profile_photo is not None: profile.profile_photo = profile_in.profile_photo

    if profile_in.title is not None: profile.title = profile_in.title
    if profile_in.location is not None: profile.location = profile_in.location
    if profile_in.bio is not None: profile.bio = profile_in.bio
    if profile_in.experience_years is not None: profile.experience_years = profile_in.experience_years

    if profile_in.skills is not None:
        profile.skills = json.dumps(profile_in.skills) if isinstance(profile_in.skills, list) else profile_in.skills
    
    if profile_in.work_experiences is not None:
        profile.work_experiences = json.dumps([w.dict() if hasattr(w, 'dict') else w for w in profile_in.work_experiences])
    if profile_in.educations is not None:
        profile.educations = json.dumps([e.dict() if hasattr(e, 'dict') else e for e in profile_in.educations])
    if profile_in.projects is not None:
        profile.projects = json.dumps([p.dict() if hasattr(p, 'dict') else p for p in profile_in.projects])
    if profile_in.certifications is not None:
        profile.certifications = json.dumps([c.dict() if hasattr(c, 'dict') else c for c in profile_in.certifications])
    if profile_in.languages is not None:
        profile.languages = json.dumps(profile_in.languages)
    if profile_in.links is not None:
        profile.links = json.dumps([l.dict() if hasattr(l, 'dict') else l for l in profile_in.links])
    if profile_in.job_preferences is not None:
        jp = profile_in.job_preferences.dict() if hasattr(profile_in.job_preferences, 'dict') else profile_in.job_preferences
        if isinstance(jp, dict):
            profile.job_preferences = json.dumps(jp)
            profile.preferred_roles = jp.get('preferred_roles', '')
            profile.preferred_location = jp.get('preferred_locations', '')
            profile.desired_salary = jp.get('desired_salary', '')

    db.commit()
    db.refresh(profile)

    return get_user_profile(current_user=current_user, db=db)

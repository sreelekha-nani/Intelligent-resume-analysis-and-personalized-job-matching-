from pydantic import BaseModel, EmailStr
from typing import Optional, List, Dict, Any
from datetime import datetime

# Auth Schemas
class UserRegister(BaseModel):
    email: EmailStr
    password: str
    full_name: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class GoogleLoginRequest(BaseModel):
    credential: str

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class VerifyOTPRequest(BaseModel):
    email: EmailStr
    otp: str

class ResetPasswordRequest(BaseModel):
    email: EmailStr
    otp: str
    new_password: str

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: int
    full_name: str
    email: str
    role: str = "candidate"

class UserOut(BaseModel):
    id: int
    email: EmailStr
    full_name: str
    role: str
    created_at: datetime

    class Config:
        from_attributes = True

# Profile Nested Item Schemas
class WorkExperienceItem(BaseModel):
    company: Optional[str] = ""
    role: Optional[str] = ""
    location: Optional[str] = ""
    start_date: Optional[str] = ""
    end_date: Optional[str] = ""
    description: Optional[str] = ""

class EducationItem(BaseModel):
    institution: Optional[str] = ""
    degree: Optional[str] = ""
    field_of_study: Optional[str] = ""
    start_year: Optional[str] = ""
    end_year: Optional[str] = ""
    cgpa: Optional[str] = ""

class ProjectItem(BaseModel):
    title: Optional[str] = ""
    description: Optional[str] = ""
    tech_stack: Optional[str] = ""
    project_url: Optional[str] = ""

class CertificationItem(BaseModel):
    name: Optional[str] = ""
    issuer: Optional[str] = ""
    issue_date: Optional[str] = ""

class LinkItem(BaseModel):
    platform: Optional[str] = ""
    url: Optional[str] = ""

class JobPreferencesItem(BaseModel):
    preferred_roles: Optional[str] = ""
    preferred_locations: Optional[str] = ""
    job_type: Optional[str] = "Full-time"
    desired_salary: Optional[str] = ""

# Profile Update & Output Schemas
class ProfileUpdate(BaseModel):
    first_name: Optional[str] = None
    middle_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    alternate_phone: Optional[str] = None
    date_of_birth: Optional[str] = None
    gender: Optional[str] = None
    current_city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None
    postal_code: Optional[str] = None
    profile_photo: Optional[str] = None
    
    title: Optional[str] = None
    location: Optional[str] = None
    bio: Optional[str] = None
    experience_years: Optional[float] = None
    skills: Optional[List[str]] = None
    work_experiences: Optional[List[WorkExperienceItem]] = None
    educations: Optional[List[EducationItem]] = None
    projects: Optional[List[ProjectItem]] = None
    certifications: Optional[List[CertificationItem]] = None
    languages: Optional[List[str]] = None
    links: Optional[List[LinkItem]] = None
    job_preferences: Optional[JobPreferencesItem] = None
    preferred_roles: Optional[str] = None
    preferred_location: Optional[str] = None
    desired_salary: Optional[str] = None

class ProfileOut(BaseModel):
    id: int
    user_id: int
    first_name: Optional[str] = ""
    middle_name: Optional[str] = ""
    last_name: Optional[str] = ""
    email: Optional[str] = ""
    phone: Optional[str] = ""
    alternate_phone: Optional[str] = ""
    date_of_birth: Optional[str] = ""
    gender: Optional[str] = ""
    current_city: Optional[str] = ""
    state: Optional[str] = ""
    country: Optional[str] = ""
    postal_code: Optional[str] = ""
    profile_photo: Optional[str] = ""
    
    title: Optional[str] = None
    location: Optional[str] = None
    bio: Optional[str] = None
    experience_years: Optional[float] = 0.0
    skills: List[str] = []
    work_experiences: List[WorkExperienceItem] = []
    educations: List[EducationItem] = []
    projects: List[ProjectItem] = []
    certifications: List[CertificationItem] = []
    languages: List[str] = []
    links: List[LinkItem] = []
    job_preferences: Optional[JobPreferencesItem] = None
    preferred_roles: Optional[str] = None
    preferred_location: Optional[str] = None
    desired_salary: Optional[str] = None
    resume_url: Optional[str] = None

    class Config:
        from_attributes = True

# Resume Schemas
class ResumeParsedOut(BaseModel):
    id: Optional[int] = None
    filename: str
    first_name: Optional[str] = ""
    middle_name: Optional[str] = ""
    last_name: Optional[str] = ""
    email: Optional[str] = None
    phone: Optional[str] = None
    alternate_phone: Optional[str] = ""
    date_of_birth: Optional[str] = ""
    gender: Optional[str] = ""
    current_city: Optional[str] = ""
    state: Optional[str] = ""
    country: Optional[str] = ""
    postal_code: Optional[str] = ""
    skills: List[str] = []
    experience_years: float = 0.0
    summary: Optional[str] = ""
    education: List[EducationItem] = []
    work_experiences: List[WorkExperienceItem] = []
    projects: List[ProjectItem] = []
    languages: List[str] = []
    links: List[LinkItem] = []

# Job Schemas
class JobCreate(BaseModel):
    title: str
    company: str
    location: str
    description: str
    requirements: Optional[str] = None
    skills_required: str
    salary_range: Optional[str] = None
    job_type: Optional[str] = "Full-time"
    openings_count: Optional[int] = 1
    external_url: Optional[str] = None

class JobOut(BaseModel):
    id: int
    title: str
    company: str
    location: str
    description: str
    requirements: Optional[str] = None
    skills_required: str
    salary_range: Optional[str] = None
    job_type: str
    openings_count: Optional[int] = 1
    status: Optional[str] = "Published"
    external_url: Optional[str] = None
    source: str
    created_at: datetime
    match_score: Optional[float] = None
    matched_skills: Optional[List[str]] = []
    missing_skills: Optional[List[str]] = []

    class Config:
        from_attributes = True

# Application Schemas
class ApplicationCreate(BaseModel):
    job_id: int
    resume_id: Optional[int] = None
    cover_letter: Optional[str] = None
    ats_score: Optional[float] = None

class ApplicationStatusUpdate(BaseModel):
    status: str
    notes: Optional[str] = None

class ApplicationOut(BaseModel):
    id: int
    user_id: int
    job_id: int
    resume_id: Optional[int] = None
    status: str
    cover_letter: Optional[str] = None
    match_score: float
    notes: Optional[str] = None
    applied_at: datetime
    job: JobOut

    class Config:
        from_attributes = True

# ATS Engine Schemas
class ATSAnalysisRequest(BaseModel):
    target_role: Optional[str] = ""
    job_description: Optional[str] = ""
    job_id: Optional[int] = None
    resume_id: Optional[int] = None
    resume_text: Optional[str] = ""

class MissingKeywordInfo(BaseModel):
    keyword: str
    why_it_matters: str
    advice: str

class SectionAnalysisItem(BaseModel):
    status: str
    reason: str

class ResumeImprovementItem(BaseModel):
    section: str
    recommendation: str

class ATSReportOut(BaseModel):
    ats_score: float
    match_level: str
    breakdown: Dict[str, float]
    matched_keywords: List[str]
    missing_keywords: List[MissingKeywordInfo]
    additional_resume_skills: List[str] = []
    skills_gap: Dict[str, Any]
    section_analysis: Dict[str, SectionAnalysisItem]
    improvements: List[ResumeImprovementItem]
    job_match_summary: Dict[str, Any]

# Notification Schemas
class NotificationOut(BaseModel):
    id: int
    title: str
    message: str
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True

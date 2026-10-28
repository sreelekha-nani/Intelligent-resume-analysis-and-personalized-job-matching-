import datetime
from sqlalchemy import Column, Integer, String, Text, Float, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=False)
    role = Column(String, default="candidate") # candidate, admin
    auth_provider = Column(String, default="local") # local, google
    google_id = Column(String, unique=True, index=True, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    profile = relationship("Profile", back_populates="user", uselist=False)
    resumes = relationship("Resume", back_populates="user")
    applications = relationship("Application", back_populates="user")
    ats_reports = relationship("ATSReport", back_populates="user")
    notifications = relationship("Notification", back_populates="user")

class PasswordResetOTP(Base):
    __tablename__ = "password_reset_otps"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, index=True, nullable=False)
    otp = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    expires_at = Column(DateTime, nullable=False)

class Profile(Base):
    __tablename__ = "profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True)
    
    # 1. Basic Information Detailed Fields
    first_name = Column(String, nullable=True)
    middle_name = Column(String, nullable=True)
    last_name = Column(String, nullable=True)
    email = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    alternate_phone = Column(String, nullable=True)
    date_of_birth = Column(String, nullable=True)
    gender = Column(String, nullable=True)
    current_city = Column(String, nullable=True)
    state = Column(String, nullable=True)
    country = Column(String, nullable=True)
    postal_code = Column(String, nullable=True)
    profile_photo = Column(String, nullable=True)
    
    title = Column(String, nullable=True) # e.g. Senior Data Scientist / Full Stack Dev
    location = Column(String, nullable=True)
    
    # 2. Professional Summary
    bio = Column(Text, nullable=True)
    
    # 3. Work Experiences[] (JSON String)
    work_experiences = Column(Text, nullable=True)
    experience_years = Column(Float, default=0.0)
    
    # 4. Educations[] (JSON String)
    educations = Column(Text, nullable=True)
    
    # 5. Projects[] (JSON String)
    projects = Column(Text, nullable=True)
    
    # 6. Skills[] (JSON String)
    skills = Column(Text, nullable=True)
    
    # 7. Certifications[] (JSON String)
    certifications = Column(Text, nullable=True)
    
    # 8. Languages[] (JSON String)
    languages = Column(Text, nullable=True)
    
    # 9. Links[] (JSON String)
    links = Column(Text, nullable=True)
    
    # 10. Job Preferences
    preferred_roles = Column(String, nullable=True)
    preferred_location = Column(String, nullable=True)
    desired_salary = Column(String, nullable=True)
    job_preferences = Column(Text, nullable=True)
    
    resume_url = Column(String, nullable=True)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    user = relationship("User", back_populates="profile")

class Resume(Base):
    __tablename__ = "resumes"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    filename = Column(String, nullable=False)
    file_path = Column(String, nullable=False)
    parsed_data = Column(Text, nullable=True)
    is_active = Column(Boolean, default=False)
    uploaded_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="resumes")

class Job(Base):
    __tablename__ = "jobs"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True, nullable=False)
    company = Column(String, index=True, nullable=False)
    category = Column(String, nullable=True)
    job_type = Column(String, default="Full-time")
    workplace_type = Column(String, default="Onsite")
    location = Column(String, index=True, nullable=False)
    country = Column(String, nullable=True)
    state = Column(String, nullable=True)
    city = Column(String, nullable=True)
    min_experience = Column(Float, default=0.0)
    max_experience = Column(Float, default=0.0)
    min_salary = Column(Float, default=0.0)
    max_salary = Column(Float, default=0.0)
    currency = Column(String, default="INR")
    hide_salary = Column(Boolean, default=False)
    min_qualification = Column(String, nullable=True)
    skills_required = Column(Text, nullable=False)
    description = Column(Text, nullable=False)
    responsibilities = Column(Text, nullable=True)
    requirements = Column(Text, nullable=True)
    openings_count = Column(Integer, default=1)
    deadline = Column(String, nullable=True)
    status = Column(String, default="Published")
    salary_range = Column(String, nullable=True)
    external_url = Column(String, nullable=True)
    source = Column(String, default="internal")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    applications = relationship("Application", back_populates="job")

class Application(Base):
    __tablename__ = "applications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    job_id = Column(Integer, ForeignKey("jobs.id"))
    resume_id = Column(Integer, ForeignKey("resumes.id"), nullable=True)
    status = Column(String, default="Applied")
    cover_letter = Column(Text, nullable=True)
    match_score = Column(Float, default=0.0)
    notes = Column(Text, nullable=True)
    applied_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    user = relationship("User", back_populates="applications")
    job = relationship("Job", back_populates="applications")
    resume = relationship("Resume")

class ATSReport(Base):
    __tablename__ = "ats_reports"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    job_id = Column(Integer, ForeignKey("jobs.id"), nullable=True)
    ats_score = Column(Float, default=0.0)
    formatting_score = Column(Float, default=0.0)
    missing_skills = Column(Text, nullable=True)
    section_feedback = Column(Text, nullable=True)
    recommendations = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="ats_reports")

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    title = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="notifications")

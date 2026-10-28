import os
import sqlite3
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from database import engine, Base, SessionLocal
from services.job_service import seed_jobs_if_empty
from config import settings

from models import User
from routers.auth import get_password_hash

from routers import auth, users, resumes, jobs, recommendations, ats, applications, dashboard, admin

# Create SQLite Database tables
Base.metadata.create_all(bind=engine)

def auto_migrate_sqlite_columns():
    db_path = settings.DATABASE_URL.replace("sqlite:///./", "").replace("sqlite:///", "")
    if os.path.exists(db_path):
        try:
            conn = sqlite3.connect(db_path)
            cursor = conn.cursor()
            
            # Users table migration
            cursor.execute("PRAGMA table_info(users)")
            user_cols = [row[1] for row in cursor.fetchall()]
            new_user_cols = {
                'auth_provider': "TEXT DEFAULT 'local'",
                'google_id': 'TEXT'
            }
            for col_name, col_type in new_user_cols.items():
                if col_name not in user_cols:
                    cursor.execute(f"ALTER TABLE users ADD COLUMN {col_name} {col_type}")

            # Profiles table migration
            cursor.execute("PRAGMA table_info(profiles)")
            existing_cols = [row[1] for row in cursor.fetchall()]
            new_cols = {
                'first_name': 'TEXT',
                'middle_name': 'TEXT',
                'last_name': 'TEXT',
                'email': 'TEXT',
                'phone': 'TEXT',
                'alternate_phone': 'TEXT',
                'date_of_birth': 'TEXT',
                'gender': 'TEXT',
                'current_city': 'TEXT',
                'state': 'TEXT',
                'country': 'TEXT',
                'postal_code': 'TEXT',
                'profile_photo': 'TEXT',
                'title': 'TEXT',
                'location': 'TEXT',
                'bio': 'TEXT',
                'work_experiences': 'TEXT',
                'experience_years': 'FLOAT DEFAULT 0.0',
                'educations': 'TEXT',
                'projects': 'TEXT',
                'skills': 'TEXT',
                'certifications': 'TEXT',
                'languages': 'TEXT',
                'links': 'TEXT',
                'preferred_roles': 'TEXT',
                'preferred_location': 'TEXT',
                'desired_salary': 'TEXT',
                'job_preferences': 'TEXT',
                'resume_url': 'TEXT'
            }
            for col_name, col_type in new_cols.items():
                if col_name not in existing_cols:
                    cursor.execute(f"ALTER TABLE profiles ADD COLUMN {col_name} {col_type}")

            # Jobs table migration
            cursor.execute("PRAGMA table_info(jobs)")
            job_cols = [row[1] for row in cursor.fetchall()]
            new_job_cols = {
                'category': 'TEXT',
                'workplace_type': 'TEXT DEFAULT "Onsite"',
                'country': 'TEXT',
                'state': 'TEXT',
                'city': 'TEXT',
                'min_experience': 'FLOAT DEFAULT 0.0',
                'max_experience': 'FLOAT DEFAULT 0.0',
                'min_salary': 'FLOAT DEFAULT 0.0',
                'max_salary': 'FLOAT DEFAULT 0.0',
                'currency': 'TEXT DEFAULT "INR"',
                'hide_salary': 'BOOLEAN DEFAULT 0',
                'min_qualification': 'TEXT',
                'responsibilities': 'TEXT',
                'openings_count': 'INTEGER DEFAULT 1',
                'deadline': 'TEXT',
                'status': 'TEXT DEFAULT "Published"'
            }
            for col_name, col_type in new_job_cols.items():
                if col_name not in job_cols:
                    cursor.execute(f"ALTER TABLE jobs ADD COLUMN {col_name} {col_type}")

            # Applications table migration
            cursor.execute("PRAGMA table_info(applications)")
            app_cols = [row[1] for row in cursor.fetchall()]
            if 'resume_id' not in app_cols:
                cursor.execute("ALTER TABLE applications ADD COLUMN resume_id INTEGER")

            conn.commit()
            conn.close()
        except Exception as e:
            print(f"Auto-migration info: {e}")

def seed_admin_if_empty(db):
    admin_user = db.query(User).filter(User.email == "admin@gmail.com").first()
    if not admin_user:
        admin_user = User(
            email="admin@gmail.com",
            hashed_password=get_password_hash("admin"),
            full_name="System Administrator",
            role="admin"
        )
        db.add(admin_user)
        db.commit()
        print("Default Admin User (admin@gmail.com / admin) seeded successfully.")

@asynccontextmanager
async def lifespan(app: FastAPI):
    auto_migrate_sqlite_columns()
    db = SessionLocal()
    try:
        seed_admin_if_empty(db)
        seed_jobs_if_empty(db)
    finally:
        db.close()
    yield

app = FastAPI(
    lifespan=lifespan,
    title="AI-Powered Intelligent Job Recommendation & Application API",
    description="FastAPI Backend for Job Discovery, Resume Parsing, Candidate Matching, ATS Analysis, AI Resume Optimization, Cover Letter Generation, Application Tracking, Notifications, and Admin Management.",
    version="1.0.0"
)

# Allowed Origins for CORS (supports Vite on port 3000 or 5173 and backend on port 8000)
allowed_origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:8000",
    "http://127.0.0.1:8000",
]

# Enable CORS for React Frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1)(:\d+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.middleware("http")
async def add_process_time_header(request, call_next):
    import time
    start_time = time.time()
    response = await call_next(request)
    process_time = (time.time() - start_time) * 1000
    response.headers["X-Process-Time-Ms"] = f"{process_time:.2f}"
    print(f"[TIMING] {request.method} {request.url.path} took {process_time:.2f} ms")
    return response

# Mount Uploads directory for static access
UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

# Include Routers
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(resumes.router)
app.include_router(jobs.router)
app.include_router(recommendations.router)
app.include_router(ats.router)
app.include_router(applications.router)
app.include_router(dashboard.router)
app.include_router(admin.router)


@app.get("/")
def root():
    return {
        "status": "online",
        "system": "AI-Powered Job Recommendation System Backend",
        "docs_url": "/docs"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)


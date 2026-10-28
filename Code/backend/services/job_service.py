import requests
from typing import List, Optional
from sqlalchemy.orm import Session
from models import Job
from config import settings

SEED_JOBS = [
    {
        "title": "Full Stack Developer",
        "company": "TechVision Labs",
        "location": "Bangalore, India (Hybrid)",
        "description": "Looking for a skilled Full Stack Developer proficient in React, FastAPI, Node.js, and SQL databases to build modern Web AI applications.",
        "requirements": "3+ years experience with React, Python/FastAPI, PostgreSQL/SQLite, Docker, and REST API design.",
        "skills_required": "React, FastAPI, Python, JavaScript, Node.JS, SQL, Docker, REST API",
        "min_salary": 1000000.0,
        "max_salary": 1500000.0,
        "salary_range": "10 LPA - 15 LPA",
        "job_type": "Hybrid",
        "openings_count": 3,
        "source": "curated"
    },
    {
        "title": "AI & Machine Learning Engineer",
        "company": "DataMind AI Solutions",
        "location": "Remote / Hyderabad",
        "description": "Join our AI core team to build intelligent NLP recommendation systems, ATS resume matching engines, and predictive analytics models.",
        "requirements": "Strong experience in Python, Scikit-Learn, PyTorch/TensorFlow, NLP, pandas, and RESTful web microservices.",
        "skills_required": "Python, Machine Learning, NLP, TensorFlow, PyTorch, Scikit-Learn, Pandas, FastAPI, Git",
        "min_salary": 1500000.0,
        "max_salary": 2500000.0,
        "salary_range": "15 LPA - 25 LPA",
        "job_type": "Remote",
        "openings_count": 5,
        "source": "curated"
    },
    {
        "title": "Frontend React Developer",
        "company": "Nexus UI Systems",
        "location": "Bangalore, India",
        "description": "Develop high-performance, visually stunning web applications with modern React, Redux/Zustand, Tailwind/CSS, and interactive UI charts.",
        "requirements": "2+ years experience in React, JavaScript, HTML5/CSS3, Vite, state management, and user experience optimizations.",
        "skills_required": "React, JavaScript, TypeScript, HTML, CSS, Next.JS, Git, Responsive Design",
        "min_salary": 400000.0,
        "max_salary": 600000.0,
        "salary_range": "4 LPA - 6 LPA",
        "job_type": "Full-time",
        "openings_count": 2,
        "source": "curated"
    },
    {
        "title": "Backend Python FastAPI Developer",
        "company": "CloudScale Software",
        "location": "Pune, India (Hybrid)",
        "description": "Build high-throughput async backend microservices, SQL databases, API authentication, and cloud infrastructure pipelines.",
        "requirements": "Expertise in Python, FastAPI/Django, PostgreSQL/SQLite, SQLAlchemy, Redis, unit testing, and Docker.",
        "skills_required": "Python, FastAPI, Django, SQL, PostgreSQL, SQLite, Redis, Docker, REST API",
        "min_salary": 600000.0,
        "max_salary": 1000000.0,
        "salary_range": "6 LPA - 10 LPA",
        "job_type": "Hybrid",
        "openings_count": 4,
        "source": "curated"
    },
    {
        "title": "Data Analyst & NLP Specialist",
        "company": "Insight Analytics",
        "location": "Chennai / Remote",
        "description": "Analyze user behavior, resume datasets, ATS score metrics, and build automated reporting dashboards and text extraction engines.",
        "requirements": "Proficiency in SQL, Python, Pandas, Data Visualization (Tableau/Power BI), and basic NLP text matching techniques.",
        "skills_required": "Python, Data Analysis, SQL, NLP, Pandas, NumPy, Tableau, Power BI, Excel",
        "min_salary": 100000.0,
        "max_salary": 300000.0,
        "salary_range": "1 LPA - 3 LPA",
        "job_type": "Remote",
        "openings_count": 2,
        "source": "curated"
    },
    {
        "title": "DevOps & Cloud Engineer",
        "company": "Apex Infrastructure Systems",
        "location": "Hyderabad, India",
        "description": "Manage Kubernetes clusters, AWS cloud infrastructure, CI/CD automation pipelines, and server monitoring systems.",
        "requirements": "3+ years experience with AWS/Azure, Docker, Kubernetes, Terraform, CI/CD pipelines, and Linux administration.",
        "skills_required": "AWS, Azure, Docker, Kubernetes, CI/CD, Git, Linux, System Design",
        "min_salary": 1500000.0,
        "max_salary": 2200000.0,
        "salary_range": "15 LPA - 22 LPA",
        "job_type": "Full-time",
        "openings_count": 6,
        "source": "curated"
    }
]

def seed_jobs_if_empty(db: Session):
    count = db.query(Job).count()
    if count == 0:
        for seed in SEED_JOBS:
            job = Job(**seed)
            db.add(job)
        db.commit()
    else:
        # Migrate existing seed jobs if min_salary is 0
        jobs = db.query(Job).all()
        for seed in SEED_JOBS:
            j = next((item for item in jobs if item.title == seed["title"]), None)
            if j and not j.min_salary:
                j.min_salary = seed["min_salary"]
                j.max_salary = seed["max_salary"]
                j.salary_range = seed["salary_range"]
        db.commit()

def fetch_external_adzuna_jobs(keyword: str = "Developer", location: str = "in") -> List[dict]:
    if not settings.ADZUNA_APP_ID or not settings.ADZUNA_APP_KEY:
        return []
    
    url = f"https://api.adzuna.com/v1/api/jobs/{location}/search/1"
    params = {
        "app_id": settings.ADZUNA_APP_ID,
        "app_key": settings.ADZUNA_APP_KEY,
        "what": keyword,
        "results_per_page": 10
    }
    try:
        res = requests.get(url, params=params, timeout=5)
        if res.status_code == 200:
            data = res.json()
            jobs = []
            for item in data.get("results", []):
                jobs.append({
                    "title": item.get("title", "Software Engineer"),
                    "company": item.get("company", {}).get("display_name", "Technology Corp"),
                    "location": item.get("location", {}).get("display_name", "Remote"),
                    "description": item.get("description", "Exciting software opportunity."),
                    "requirements": "Refer to official listing for full details.",
                    "skills_required": keyword.capitalize() + ", Python, JavaScript, SQL",
                    "salary_range": f"₹{item.get('salary_min', 600000):.0f} - ₹{item.get('salary_max', 1200000):.0f} / year",
                    "job_type": "Full-time",
                    "external_url": item.get("redirect_url"),
                    "source": "adzuna"
                })
            return jobs
    except Exception as e:
        print(f"Error fetching Adzuna jobs: {e}")
    return []

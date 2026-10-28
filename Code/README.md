# AI-Powered Job Recommendation & Application System

An intelligent web platform that connects job seekers with matching career opportunities using Machine Learning (TF-IDF & Cosine Similarity), automates resume parsing, provides real-time ATS resume scoring, and simplifies candidate application workflows.

---

## ✨ Key Features

### 👤 Candidate
- **AI Resume Parser**: Automatically extracts skills, experience, education, and contact details from PDF/DOCX resumes.
- **Smart Job Recommendations**: Calculates real-time profile-to-job match scores using TF-IDF vectorization and cosine similarity.
- **ATS Resume Analyzer**: Scores resume compatibility against job descriptions and highlights missing skills.
- **Cover Letter Generator**: Generates tailored cover letters customized for target roles.
- **Application Tracker**: Apply for jobs and monitor status (*Applied*, *Shortlisted*, *Interview*, etc.).

### 🛠️ Administrator
- **Analytics Dashboard**: Live overview of candidates, job postings, and applications.
- **Job Management**: Create, edit, publish, and manage job openings with required qualifications.
- **Applicant Tracking**: Review candidate resumes, match percentages, and update application stages.

---

## 🛠️ Tech Stack

- **Backend**: FastAPI (Python 3.10+), SQLAlchemy, SQLite, Scikit-learn, PyPDF2, python-docx
- **Frontend**: React 18, Vite, React Router v6, Axios, Lucide Icons

---

## 📁 Project Structure

```
Code/
├── backend/                  # FastAPI backend
│   ├── main.py               # Application entry point & database setup
│   ├── database.py           # SQLite database connection
│   ├── models.py             # SQLAlchemy database models
│   ├── schemas.py            # Pydantic schemas
│   ├── routers/              # API routes (auth, jobs, ats, applications, admin)
│   ├── services/             # AI logic (resume parser, matching engine, ATS)
│   └── requirements.txt      # Python dependencies
│
└── frontend/                 # React frontend (Vite)
    ├── src/
    │   ├── components/       # Reusable UI components (Navbar, Sidebar)
    │   ├── pages/            # Views (Dashboard, Jobs, ATS Analyzer, Admin)
    │   ├── services/         # Axios API client
    │   └── App.jsx           # App routes & role guards
    ├── package.json          # Node dependencies
    └── vite.config.js        # Vite config
```

---

## 🚀 Installation & How to Start

### Prerequisites
- **Python** 3.10+
- **Node.js** 18+ & **npm**

---

### ⚡ Quick Start (Single Command)

From the project root folder (`Code/`), run:

```bash
python main.py
```
*(or run `python run.py`, or double-click `start.bat` on Windows)*

This launches **both** the backend API (`http://127.0.0.1:8000`) and the frontend web app (`http://localhost:3000`) simultaneously!

---

### Manual Setup (Separate Terminals)

**1. Start Backend:**
```bash
cd backend
pip install -r requirements.txt
python main.py
```
- API Server: `http://localhost:8000` | Docs: `http://localhost:8000/docs`

**2. Start Frontend:**
```bash
cd frontend
npm install
npm run dev
```
- Web App: `http://localhost:3000`

---

## 🔑 Default Admin Account

The system automatically initializes an admin account upon first launch:

- **Email**: `admin@gmail.com`
- **Password**: `admin`
- *(Candidates can register new accounts directly from the signup page)*

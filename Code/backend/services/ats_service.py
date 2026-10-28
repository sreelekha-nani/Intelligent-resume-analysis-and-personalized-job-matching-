import re
import json
from typing import List, Dict, Any, Set, Tuple

# Comprehensive Technical Taxonomy (Languages, Frameworks, DBs, Cloud, DevOps, Tools)
KNOWN_TECH_ENTITIES = {
    # Programming Languages
    "python", "java", "c++", "c#", "javascript", "typescript", "golang", "go", "rust", "php", "ruby", 
    "kotlin", "swift", "r", "matlab", "scala", "bash", "shell", "sql", "html", "css", "html5", "css3",
    
    # Frameworks & Libraries
    "react", "react.js", "reactjs", "angular", "vue", "vue.js", "next.js", "nextjs", "fastapi", "django", 
    "flask", "spring", "spring boot", "springboot", "express", "express.js", "node", "node.js", "nodejs", 
    "hibernate", "asp.net", ".net", "dotnet", "laravel", "rails", "ruby on rails", "tailwind", "bootstrap", 
    "pandas", "numpy", "scikit-learn", "pytorch", "tensorflow", "keras", "opencv", "graphql", "redux",
    
    # Databases & Caching
    "postgresql", "postgres", "mysql", "sqlite", "mongodb", "redis", "cassandra", "dynamodb", "oracle", 
    "mariadb", "elasticsearch", "neo4j", "firestore", "cockroachdb", "memcached",
    
    # Cloud & DevOps
    "aws", "amazon web services", "azure", "gcp", "google cloud", "docker", "kubernetes", "k8s", 
    "terraform", "ansible", "jenkins", "git", "github", "gitlab", "github actions", "ci/cd", "helm", 
    "prometheus", "grafana", "nginx", "apache", "serverless", "lambda", "ecs", "eks",
    
    # Web & Architecture Concepts
    "rest api", "rest apis", "restful", "microservices", "websockets", "grpc", "kafka", "rabbitmq", 
    "celery", "jwt", "oauth", "oauth2", "swagger", "openapi", "system design", "object-oriented", "oop", 
    "multithreading", "concurrency", "asynchronous", "async", "clean architecture",
    
    # Tools, OS & Certifications
    "linux", "ubuntu", "debian", "jira", "confluence", "postman", "aws certified", "pmp", "cissp", 
    "docker certified", "scrum", "agile", "kanban"
}

GENERIC_STOPWORDS = {
    "build", "high", "pipelines", "strong", "good", "throughput", "knowledge", "excellent", "experience", 
    "team", "work", "working", "requirements", "responsibilities", "ability", "understanding", "skills", 
    "key", "new", "role", "user", "data", "system", "application", "development", "engineer", "developer", 
    "candidate", "code", "solution", "performance", "management", "optimization", "quality", "scalable", 
    "robust", "modern", "production", "industry", "standard", "years", "year", "design", "deliver", "support"
}

def extract_technical_entities(text: str) -> Set[str]:
    """
    Extracts only meaningful technical entities from text using fuzzy matching against technical taxonomy,
    filtering out generic English words like 'Build', 'High', 'Pipelines', 'Experience'.
    """
    if not text:
        return set()

    text_lower = text.lower()
    found_entities = set()

    # Match multi-word entities first (e.g. "spring boot", "rest api", "amazon web services")
    for entity in KNOWN_TECH_ENTITIES:
        pattern = r'\b' + re.escape(entity) + r'\b'
        if re.search(pattern, text_lower):
            found_entities.add(entity)

    # Clean token search for exact single skills
    tokens = re.findall(r'\b[a-zA-Z0-9\+\#\.\-]+\b', text_lower)
    for tok in tokens:
        if tok in KNOWN_TECH_ENTITIES and tok not in GENERIC_STOPWORDS:
            found_entities.add(tok)

    return found_entities

def analyze_resume_against_job(
    target_role: str,
    job_description: str,
    skills_required_raw: Any,
    resume_text: str,
    parsed_resume_data: Dict[str, Any] = None
) -> Dict[str, Any]:
    """
    Unified ATS Analysis Service using Weighted Scoring:
    - Required Skills Match: 40%
    - Experience Match: 25%
    - Projects Relevance: 15%
    - Education Match: 10%
    - Resume Format & Structure: 10%
    """
    parsed_resume_data = parsed_resume_data or {}
    
    # 1. Extract Job Required Technical Skills
    job_tech_skills = extract_technical_entities(job_description)
    
    # Parse explicit skills_required field if provided
    explicit_skills = set()
    if skills_required_raw:
        if isinstance(skills_required_raw, list):
            for s in skills_required_raw:
                extracted = extract_technical_entities(str(s))
                explicit_skills.update(extracted if extracted else {str(s).strip().lower()})
        elif isinstance(skills_required_raw, str):
            for s in skills_required_raw.split(','):
                extracted = extract_technical_entities(s)
                explicit_skills.update(extracted if extracted else {s.strip().lower()})

    required_skills = explicit_skills.union(job_tech_skills)
    required_skills = {s for s in required_skills if s and s not in GENERIC_STOPWORDS}

    # 2. Extract Candidate Resume Skills
    resume_skills = extract_technical_entities(resume_text)
    if parsed_resume_data.get("skills"):
        res_skills_list = parsed_resume_data["skills"]
        if isinstance(res_skills_list, list):
            for s in res_skills_list:
                resume_skills.update(extract_technical_entities(str(s)))
                resume_skills.add(str(s).strip().lower())

    resume_skills = {s for s in resume_skills if s and s not in GENERIC_STOPWORDS}

    # 3. Categorize Comparison
    required_found = sorted(list(required_skills.intersection(resume_skills)))
    required_missing = sorted(list(required_skills.difference(resume_skills)))
    additional_resume_skills = sorted(list(resume_skills.difference(required_skills)))

    # 4. Weighted Score Components Calculation
    # A. Required Skills Score (40%)
    total_req = max(1, len(required_skills))
    skills_score = (len(required_found) / total_req) * 100.0

    # B. Experience Score (25%)
    exp_data = parsed_resume_data.get("experience", [])
    exp_years = 0
    exp_score = 70.0 # Default baseline
    if exp_data and isinstance(exp_data, list) and len(exp_data) > 0:
        exp_score = min(100.0, 75.0 + (len(exp_data) * 10.0))
    elif "experience" in resume_text.lower() or "worked as" in resume_text.lower():
        exp_score = 80.0

    # C. Projects Relevance Score (15%)
    proj_data = parsed_resume_data.get("projects", [])
    proj_score = 65.0
    if proj_data and isinstance(proj_data, list) and len(proj_data) > 0:
        proj_score = min(100.0, 80.0 + (len(proj_data) * 10.0))
    elif "project" in resume_text.lower() or "github" in resume_text.lower():
        proj_score = 75.0

    # D. Education Score (10%)
    edu_data = parsed_resume_data.get("education", [])
    edu_score = 70.0
    if edu_data or "bachelor" in resume_text.lower() or "degree" in resume_text.lower() or "b.tech" in resume_text.lower() or "university" in resume_text.lower():
        edu_score = 95.0

    # E. Structure & Formatting Score (10%)
    format_score = 90.0 if len(resume_text) > 200 else 60.0

    # Weighted Overall Score
    weighted_score = round(
        (skills_score * 0.40) +
        (exp_score * 0.25) +
        (proj_score * 0.15) +
        (edu_score * 0.10) +
        (format_score * 0.10)
    )
    weighted_score = max(15, min(99, weighted_score))

    # Match Level Category
    if weighted_score >= 75:
        match_level = "Strong"
    elif weighted_score >= 50:
        match_level = "Moderate"
    else:
        match_level = "Low"

    # 5. Generate Evidence-Backed Recommendations for Missing Required Skills
    missing_recommendations = []
    for skill in required_missing[:8]:
        skill_title = skill.title()
        evidence_snippet = f"Appears as a required technology in the Job Description for {target_role}."
        
        # Locate context snippet in JD if available
        match_idx = job_description.lower().find(skill.lower())
        if match_idx != -1:
            start = max(0, match_idx - 30)
            end = min(len(job_description), match_idx + 40)
            evidence_snippet = f"...{job_description[start:end].strip()}..."

        missing_recommendations.append({
            "keyword": skill_title,
            "why_it_matters": f"This technology ('{skill_title}') is listed as a core required technical skill for the {target_role} position.",
            "advice": f"Only add '{skill_title}' to your resume if you have practical project or professional experience using it.",
            "evidence": evidence_snippet
        })

    # 6. Specific Section-by-Section Analysis (6 Sections)
    summary_status = "Good" if ("summary" in resume_text.lower() or "profile" in resume_text.lower()) else "Needs Improvement"
    skills_status = "Good" if len(required_found) >= len(required_missing) else "Needs Improvement"
    exp_status = "Good" if exp_score >= 80 else "Needs Improvement"
    proj_status = "Good" if proj_score >= 80 else "Needs Improvement"
    edu_status = "Good" if edu_score >= 85 else "Needs Improvement"
    cert_status = "Good" if ("certified" in resume_text.lower() or "certification" in resume_text.lower()) else "Missing"

    section_analysis = {
        "summary": {
            "status": summary_status,
            "reason": "Includes a professional summary overview." if summary_status == "Good" else "Missing a dedicated professional summary highlighting your key technical strengths.",
            "suggestion": "Craft a 3-sentence summary tailoring your background directly to " + target_role + " requirements."
        },
        "skills": {
            "status": skills_status,
            "reason": f"Matches {len(required_found)} out of {len(required_skills)} required technical skills." if skills_status == "Good" else f"Missing {len(required_missing)} core technical skills required for this role.",
            "suggestion": f"The job explicitly requires {', '.join(required_missing[:3]) if required_missing else 'technical skills'}. Mention them only if you have used them in projects or production."
        },
        "experience": {
            "status": exp_status,
            "reason": "Demonstrates relevant professional work history." if exp_status == "Good" else "Work experience section lacks quantifiable metrics or detailed responsibilities.",
            "suggestion": "Your experience section should include measurable achievements (e.g. response time latency improvements, scalability gains, or user growth metrics)."
        },
        "projects": {
            "status": proj_status,
            "reason": "Includes relevant technical projects." if proj_status == "Good" else "Could benefit from highlighting hands-on technical projects.",
            "suggestion": "Add 2-3 key technical projects showcasing modern frameworks, API integration, and database design."
        },
        "education": {
            "status": edu_status,
            "reason": "Degree and academic qualification clearly documented.",
            "suggestion": "Ensure your degree title, field of study, and graduation year are cleanly formatted."
        },
        "certifications": {
            "status": cert_status,
            "reason": "Industry certifications detected." if cert_status == "Good" else "No industry certifications detected in resume.",
            "suggestion": "Include relevant cloud or technical certifications (e.g. AWS, Docker, Java, PMP) if achieved."
        }
    }

    # 7. Overall Match Summary
    top_3_changes = []
    if required_missing:
        top_3_changes.append(f"Highlight experience with {', '.join(required_missing[:2])} if you genuinely possess those skills.")
    top_3_changes.append("Quantify your project achievements using concrete performance and efficiency metrics.")
    top_3_changes.append("Format bullet points with action verbs (e.g. Engineered, Optimized, Architected).")

    return {
        "ats_score": weighted_score,
        "match_level": match_level,
        "matched_keywords": [s.title() for s in required_found],
        "missing_keywords": missing_recommendations,
        "breakdown": {
            "keyword_match": round(skills_score),
            "skills_match": round(skills_score),
            "experience_match": round(exp_score),
            "education_match": round(edu_score),
            "role_relevance": round(proj_score),
            "readability": round(format_score)
        },
        "skills_gap": {
            "skills_found": [s.title() for s in required_found],
            "required_missing": [s.title() for s in required_missing],
            "preferred_missing": []
        },
        "additional_resume_skills": [s.title() for s in additional_resume_skills[:8]],
        "improvements": [
            {
                "section": "Skills Alignment",
                "recommendation": f"The job requires {', '.join(required_missing[:3]) if required_missing else 'specific skills'}. Mention them ONLY if you have real hands-on experience using them."
            },
            {
                "section": "Measurable Impact",
                "recommendation": "Add quantifiable metrics to your project bullets (e.g. 'Optimized database queries, reducing response times by 35%')."
            }
        ],
        "section_analysis": section_analysis,
        "job_match_summary": {
            "strong_matches": [f"Matches core skills: {', '.join(required_found[:3])}" if required_found else "Clean ATS structure"],
            "important_gaps": [f"Missing required skills: {', '.join(required_missing[:3])}" if required_missing else "No major skill gaps"],
            "top_3_changes": top_3_changes
        }
    }

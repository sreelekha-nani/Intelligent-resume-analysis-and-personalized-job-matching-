from typing import List, Dict, Tuple
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import re

def calculate_job_match(candidate_skills: List[str], candidate_text: str, job_title: str, job_description: str, job_skills_str: str) -> Tuple[float, List[str], List[str]]:
    # Parse required job skills
    job_skills = [s.strip().title() for s in job_skills_str.split(",") if s.strip()]
    candidate_skills_title = [s.strip().title() for s in candidate_skills]
    
    # Match skills overlap
    matched_skills = []
    missing_skills = []
    
    for s in job_skills:
        # Check direct skill match or substring match in candidate skills/text
        if any(s.lower() == cs.lower() for cs in candidate_skills_title) or re.search(r'\b' + re.escape(s.lower()) + r'\b', candidate_text.lower()):
            matched_skills.append(s)
        else:
            missing_skills.append(s)

    skill_score = (len(matched_skills) / max(len(job_skills), 1)) * 100.0

    # TF-IDF Cosine Similarity between Candidate Profile text and Job Description
    combined_candidate = " ".join(candidate_skills) + " " + candidate_text
    combined_job = job_title + " " + job_description + " " + job_skills_str
    
    similarity_score = 50.0
    try:
        vectorizer = TfidfVectorizer(stop_words='english')
        tfidf = vectorizer.fit_transform([combined_candidate, combined_job])
        similarity_score = float(cosine_similarity(tfidf[0:1], tfidf[1:2])[0][0]) * 100.0
    except Exception:
        similarity_score = skill_score

    # Weighted final match score
    final_score = round(0.6 * skill_score + 0.4 * similarity_score, 1)
    final_score = min(max(final_score, 10.0), 99.0) # bound between 10% and 99%

    return final_score, list(set(matched_skills)), list(set(missing_skills))

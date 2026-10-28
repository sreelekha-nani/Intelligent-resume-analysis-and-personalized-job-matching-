import re
import os
import PyPDF2
import docx

KNOWN_SKILLS = [
    "python", "java", "c++", "c#", "javascript", "typescript", "html", "css", "react", "next.js", 
    "vue", "angular", "node.js", "express", "fastapi", "django", "flask", "sql", "postgresql", 
    "mysql", "mongodb", "sqlite", "redis", "aws", "azure", "gcp", "docker", "kubernetes", 
    "git", "github", "ci/cd", "machine learning", "deep learning", "nlp", "tensorflow", 
    "pytorch", "scikit-learn", "pandas", "numpy", "opencv", "data analysis", "tableau", 
    "power bi", "rest api", "graphql", "agile", "scrum", "devops", "system design"
]

KNOWN_LANGUAGES = ["english", "hindi", "telugu", "tamil", "kannada", "spanish", "french", "german", "mandarin", "japanese"]

CITIES_DB = {
    "hyderabad": ("Hyderabad", "Telangana"),
    "secunderabad": ("Secunderabad", "Telangana"),
    "bangalore": ("Bangalore", "Karnataka"),
    "bengaluru": ("Bangalore", "Karnataka"),
    "chennai": ("Chennai", "Tamil Nadu"),
    "pune": ("Pune", "Maharashtra"),
    "mumbai": ("Mumbai", "Maharashtra"),
    "delhi": ("Delhi", "Delhi"),
    "new delhi": ("New Delhi", "Delhi"),
    "noida": ("Noida", "Uttar Pradesh"),
    "gurgaon": ("Gurgaon", "Haryana"),
    "gurugram": ("Gurugram", "Haryana"),
    "kolkata": ("Kolkata", "West Bengal"),
    "ahmedabad": ("Ahmedabad", "Gujarat"),
    "kochi": ("Kochi", "Kerala"),
    "trivandrum": ("Trivandrum", "Kerala"),
    "coimbatore": ("Coimbatore", "Tamil Nadu"),
    "visakhapatnam": ("Visakhapatnam", "Andhra Pradesh"),
    "vijayawada": ("Vijayawada", "Andhra Pradesh"),
    "kadapa": ("Kadapa", "Andhra Pradesh"),
    "tirupati": ("Tirupati", "Andhra Pradesh"),
    "anantapur": ("Anantapur", "Andhra Pradesh")
}

SECTION_HEADER_KEYWORDS = [
    "internships", "internship", "work experience", "experience", "professional experience", 
    "employment history", "employment", "work history", "career history", "practical experience",
    "industrial experience", "industrial exposure", "work background",
    "projects", "academic projects", "personal projects", "technical projects", "key projects", "major projects", "mini projects",
    "education", "academic qualifications", "academic background", "educational qualifications", "education & qualifications",
    "education and qualifications", "academics", "academic details", "educational background", "qualifications",
    "education and training", "educational details", "scholastic achievements", "scholastic details", "education details",
    "technical skills", "skills", "skills & tools", "skills and tools", "tools & platforms", "tools and platforms",
    "certifications", "certifications & achievements", "certifications and achievements", "certifications / achievements",
    "achievements", "awards", "awards & achievements", "awards and achievements",
    "languages", "links", "profile", "summary", "objective", "personal details", "personal information",
    "interests", "hobbies", "declarations", "declaration", "publications", "references"
]

EXP_HEADER_KEYWORDS = [
    "internships", "internship", "work experience", "experience", "professional experience",
    "employment history", "employment", "work history", "career history", "practical experience",
    "industrial experience", "industrial exposure", "work background"
]

EDU_HEADER_KEYWORDS = [
    "education", "academic qualifications", "academic background", "educational qualifications",
    "education & qualifications", "education and qualifications", "academics", "academic details",
    "educational background", "qualifications", "education and training", "educational details",
    "scholastic achievements", "scholastic details", "education details"
]

PROJ_HEADER_KEYWORDS = [
    "projects", "academic projects", "personal projects", "technical projects", "key projects",
    "major projects", "mini projects"
]

JOB_TITLE_KEYWORDS = [
    "developer", "engineer", "intern", "analyst", "assistant", "lead", "specialist", 
    "trainee", "consultant", "manager", "architect", "designer", "administrator", 
    "associate", "officer", "executive", "programmer", "technician", "coordinator",
    "director", "head", "founder", "co-founder"
]

COMPANY_SUFFIX_KEYWORDS = [
    "pvt", "ltd", "inc", "llc", "technologies", "solutions", "corp", "corporation",
    "software", "services", "infotech", "systems", "labs", "studios", "group", "co.", "pvt.", "ltd."
]

DESC_START_PATTERNS = [
    r'^[•\-\*\d\.]+\s*',
    r'^(?:experienced|passionate|designed|developed|built|implemented|created|worked|responsible|led|managed|utilized|maintained|architected|assisted|handled|collaborated|contributed|spearheaded|engineered|optimized|automated|strong|expert|proficient|knowledgeable)\b'
]

MONTH_NAMES_REGEX = r'(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)'

DATE_RANGE_REGEX = r'\b(?:' + MONTH_NAMES_REGEX + r'[\s./,-]*\d{2,4}|\d{1,2}[/-]\d{2,4}|\d{4})\s*(?:-|–|—|to|till)\s*(?:present|current|now|till date|' + MONTH_NAMES_REGEX + r'[\s./,-]*\d{0,4}|\d{1,2}[/-]\d{2,4}|\d{4})\b'

def is_section_header(line: str, current_section_name: str = None) -> bool:
    line_clean = line.strip()
    if not line_clean:
        return False
    
    line_lower = line_clean.lower().rstrip(':-')

    if current_section_name == "projects" and any(line_lower == k for k in PROJ_HEADER_KEYWORDS):
        return False
    elif current_section_name == "education" and any(line_lower == k for k in EDU_HEADER_KEYWORDS):
        return False
    elif current_section_name == "experience" and any(line_lower == k for k in EXP_HEADER_KEYWORDS):
        return False

    for kw in SECTION_HEADER_KEYWORDS:
        if current_section_name == "projects" and kw in PROJ_HEADER_KEYWORDS:
            continue
        if current_section_name == "education" and kw in EDU_HEADER_KEYWORDS:
            continue
        if current_section_name == "experience" and kw in EXP_HEADER_KEYWORDS:
            continue

        if line_lower == kw or line_lower.startswith(kw + ":") or line_lower.startswith(kw + " -"):
            return True

    section_regex = r'^(?:certifications|achievements|awards|education|academic|experience|employment|work history|skills|tools|languages|interests|hobbies|declarations|publications|references)\b'
    if re.search(section_regex, line_lower):
        if len(line_clean.split()) <= 6 and not line_clean.startswith(('•', '-', '*', '1.', '2.', '3.')):
            return True

    if line_clean.isupper() and 1 <= len(line_clean.split()) <= 5 and len(line_clean) <= 45:
        if not any(char.isdigit() for char in line_clean) and not line_clean.startswith(('•', '-', '*')):
            return True

    return False

def extract_section_lines(lines, section_keywords, current_section_name):
    section_lines = []
    in_section = False
    
    for line in lines:
        line_clean = line.strip()
        if not line_clean:
            continue
        line_lower = line_clean.lower().rstrip(':-')
        
        if any(line_lower == kw or line_lower.startswith(kw + ":") or line_lower.startswith(kw + " -") for kw in section_keywords):
            in_section = True
            continue
            
        if in_section:
            if is_section_header(line_clean, current_section_name=current_section_name):
                break
            section_lines.append(line_clean)
            
    return section_lines

def is_description_line(line: str) -> bool:
    line_clean = line.strip()
    if line_clean.startswith(('•', '-', '*', '1.', '2.', '3.', '>')):
        return True
    line_lower = line_clean.lower()
    for pat in DESC_START_PATTERNS:
        if re.search(pat, line_lower):
            return True
    return False

DEGREE_PATTERNS = [
    (r'(?<![a-zA-Z])(?:b\.tech|btech|bachelor of technology)(?![a-zA-Z])', "B.Tech"),
    (r'(?<![a-zA-Z])(?:m\.tech|mtech|master of technology)(?![a-zA-Z])', "M.Tech"),
    (r'(?<![a-zA-Z])(?:b\.e\.|be|bachelor of engineering)(?![a-zA-Z])', "B.E."),
    (r'(?<![a-zA-Z])(?:m\.e\.|me|master of engineering)(?![a-zA-Z])', "M.E."),
    (r'(?<![a-zA-Z])(?:b\.sc|bsc|bachelor of science)(?![a-zA-Z])', "B.Sc"),
    (r'(?<![a-zA-Z])(?:m\.sc|msc|master of science)(?![a-zA-Z])', "M.Sc"),
    (r'(?<![a-zA-Z])(?:b\.ca|bca|bachelor of computer applications)(?![a-zA-Z])', "BCA"),
    (r'(?<![a-zA-Z])(?:m\.ca|mca|master of computer applications)(?![a-zA-Z])', "MCA"),
    (r'(?<![a-zA-Z])(?:mba|master of business administration)(?![a-zA-Z])', "MBA"),
    (r'(?<![a-zA-Z])(?:bba|bachelor of business administration)(?![a-zA-Z])', "BBA"),
    (r'(?<![a-zA-Z])(?:phd|doctorate|doctor of philosophy)(?![a-zA-Z])', "PhD"),
    (r'(?<![a-zA-Z])(?:diploma)(?![a-zA-Z])', "Diploma"),
    (r'(?<![a-zA-Z])(?:intermediate|higher secondary|12th\s*(?:standard|std|class)?|\+2|hsc)(?![a-zA-Z])', "Intermediate"),
    (r'(?<![a-zA-Z])(?:ssc|10th\s*(?:standard|std|class)?|class\s*10|secondary school|matriculation)(?![a-zA-Z])', "10th")
]

FIELD_PATTERNS = [
    (r'(?<![a-zA-Z])(?:artificial intelligence\s*(?:&|and)?\s*data science|ai\s*(?:&|and)?\s*ds)(?![a-zA-Z])', "Artificial Intelligence & Data Science"),
    (r'(?<![a-zA-Z])(?:computer science\s*(?:&|and)?\s*engineering|cse)(?![a-zA-Z])', "Computer Science & Engineering"),
    (r'(?<![a-zA-Z])(?:computer science)(?![a-zA-Z])', "Computer Science"),
    (r'(?<![a-zA-Z])(?:information technology|it)(?![a-zA-Z])', "Information Technology"),
    (r'(?<![a-zA-Z])(?:data science)(?![a-zA-Z])', "Data Science"),
    (r'(?<![a-zA-Z])(?:artificial intelligence|ai)(?![a-zA-Z])', "Artificial Intelligence"),
    (r'(?<![a-zA-Z])(?:electronics\s*(?:&|and)?\s*communication\s*(?:engineering)?|ece)(?![a-zA-Z])', "Electronics & Communication Engineering"),
    (r'(?<![a-zA-Z])(?:electrical\s*(?:&|and)?\s*electronics\s*(?:engineering)?|eee)(?![a-zA-Z])', "Electrical & Electronics Engineering"),
    (r'(?<![a-zA-Z])(?:mechanical engineering|mech)(?![a-zA-Z])', "Mechanical Engineering"),
    (r'(?<![a-zA-Z])(?:civil engineering)(?![a-zA-Z])', "Civil Engineering"),
    (r'(?<![a-zA-Z])(?:commerce)(?![a-zA-Z])', "Commerce"),
    (r'(?<![a-zA-Z])(?:mpc)(?![a-zA-Z])', "MPC"),
    (r'(?<![a-zA-Z])(?:bipc)(?![a-zA-Z])', "BiPC")
]

def extract_text_from_file(file_path: str) -> str:
    ext = os.path.splitext(file_path)[1].lower()
    text = ""
    try:
        if ext == ".pdf":
            with open(file_path, "rb") as f:
                reader = PyPDF2.PdfReader(f)
                for page in reader.pages:
                    extracted = page.extract_text()
                    if extracted:
                        text += extracted + "\n"
        elif ext in [".docx", ".doc"]:
            doc = docx.Document(file_path)
            for p in doc.paragraphs:
                text += p.text + "\n"
        else:
            with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                text = f.read()
    except Exception as e:
        print(f"Error reading file {file_path}: {e}")
    return text

def extract_name(lines):
    for line in lines[:8]:
        line_clean = line.strip()
        if not line_clean:
            continue
        if any(k in line_clean.lower() for k in ["resume", "curriculum", "vitae", "contact", "email", "phone", "profile", "summary"]):
            continue
        if re.match(r'^[A-Za-z\s\.\'-]{2,60}$', line_clean):
            parts = [p for p in line_clean.split() if p.strip('.')]
            if 1 <= len(parts) <= 5:
                if len(parts) == 1:
                    return parts[0], "", ""
                elif len(parts) == 2:
                    return parts[0], "", parts[1]
                elif len(parts) == 3:
                    return parts[0], parts[1], parts[2]
                else:
                    return parts[0], parts[1], " ".join(parts[2:])
    return "", "", ""

def extract_phone_numbers(text):
    valid_phones = []
    
    # 1. Search near explicit phone labels first (e.g. Phone:, Mobile:, Tel:, Contact:, Call:)
    label_pattern = r'\b(?:phone|mobile|mob|tel|contact|cell)\s*[:#-]?\s*((?:\+\d{1,3}[\s.-]?)?\(?\d{2,5}\)?[\s.-]?\d{3,5}[\s.-]?\d{3,5})\b'
    label_matches = re.findall(label_pattern, text, re.IGNORECASE)
    for m in label_matches:
        digits_only = re.sub(r'\D', '', m)
        if 10 <= len(digits_only) <= 13:
            cleaned = m.strip()
            if cleaned not in valid_phones:
                valid_phones.append(cleaned)

    # 2. Match general international and national phone patterns
    general_patterns = [
        r'\+\d{1,3}[\s.-]?\d{10}\b',                               # +91 9701943345
        r'\+\d{1,3}[\s.-]?\d{3,5}[\s.-]?\d{3,5}[\s.-]?\d{3,5}\b',  # +91 97019 43345
        r'\b[6-9]\d{9}\b',                                         # 10-digit mobile number starting 6-9
        r'\b0[6-9]\d{9}\b',                                        # 0-prefixed 10-digit mobile
        r'\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}\b'                    # (970) 194-3345
    ]
    
    for pattern in general_patterns:
        raw_matches = re.findall(pattern, text)
        for m in raw_matches:
            digits_only = re.sub(r'\D', '', m)
            if 10 <= len(digits_only) <= 13:
                cleaned = m.strip()
                if cleaned not in valid_phones:
                    valid_phones.append(cleaned)

    return valid_phones

def extract_postal_code(text):
    pin_match = re.search(r'\b(?:pin|pincode|zip|postal(?:\s*code)?)\s*[:#-]?\s*(\d{5,6})\b', text, re.IGNORECASE)
    if pin_match:
        return pin_match.group(1)
    
    loc_pin_match = re.search(r'\b(?:karnataka|telangana|maharashtra|tamil nadu|andhra pradesh|delhi|india)\s*[-:]?\s*(\d{5,6})\b', text, re.IGNORECASE)
    if loc_pin_match:
        return loc_pin_match.group(1)

    return ""

def extract_location(text):
    city, state, country = "", "", ""
    clean_text = text.lower()
    lines = [l.strip() for l in text.split("\n") if l.strip()][:15]
    top_block = " ".join(lines).lower()

    loc_match = re.search(r'\b(?:location|address|city|residing in|present address|current location)\s*[:#-]\s*([^\n,]+(?:,[^\n,]+)*)', top_block, re.IGNORECASE)
    search_scope = loc_match.group(1).lower() if loc_match else top_block

    for c_key, (c_name, s_name) in CITIES_DB.items():
        if re.search(r'\b' + re.escape(c_key) + r'\b', search_scope):
            city = c_name
            state = s_name
            break

    if "india" in top_block or "india" in clean_text:
        country = "India"
    elif "united states" in clean_text or "usa" in clean_text:
        country = "United States"
    elif "united kingdom" in clean_text or "uk" in clean_text:
        country = "United Kingdom"

    return city, state, country

def extract_dob_and_gender(text):
    clean_text = text.lower()
    dob, gender = "", ""

    dob_match = re.search(r'\b(?:dob|date of birth|born|birth date)\s*[:#-]?\s*(\d{1,2}[/-]\d{1,2}[/-]\d{2,4}|\d{4}[/-]\d{1,2}[/-]\d{1,2})\b', text, re.IGNORECASE)
    if dob_match:
        dob = dob_match.group(1)

    g_match = re.search(r'\b(?:gender|sex)\s*[:#-]?\s*(male|female|other)\b', clean_text)
    if g_match:
        gender = g_match.group(1).capitalize()

    return dob, gender

def parse_work_experiences(lines):
    exp_lines = extract_section_lines(lines, EXP_HEADER_KEYWORDS, "experience")
    
    # Fallback if no section header was found
    if not exp_lines:
        exp_lines = lines

    work_experiences = []
    current_exp = None
    
    i = 0
    while i < len(exp_lines):
        line = exp_lines[i].strip()
        if not line:
            i += 1
            continue

        line_lower = line.lower()

        if is_description_line(line):
            if current_exp:
                clean_desc = re.sub(r'^[•\-\*\d\.]+\s*', '', line).strip()
                if clean_desc:
                    if current_exp["description"]:
                        current_exp["description"] += " " + clean_desc
                    else:
                        current_exp["description"] = clean_desc
            i += 1
            continue

        has_job_kw = any(re.search(r'\b' + re.escape(kw) + r'\b', line_lower) for kw in JOB_TITLE_KEYWORDS)
        has_company_kw = any(re.search(r'\b' + re.escape(kw) + r'\b', line_lower) for kw in COMPANY_SUFFIX_KEYWORDS)
        has_date_match = re.search(DATE_RANGE_REGEX, line, re.IGNORECASE)

        if has_job_kw or has_company_kw or has_date_match:
            if current_exp and (current_exp["role"] or current_exp["company"]):
                work_experiences.append(current_exp)

            current_exp = {
                "role": "",
                "company": "",
                "location": "",
                "start_date": "",
                "end_date": "",
                "description": ""
            }

            dates = ""
            clean_header_line = line
            if has_date_match:
                dates = has_date_match.group(0).strip()
                clean_header_line = re.sub(DATE_RANGE_REGEX, "", line, flags=re.IGNORECASE).strip(' ,-–:')
            elif i + 1 < len(exp_lines):
                next_match = re.search(DATE_RANGE_REGEX, exp_lines[i+1], re.IGNORECASE)
                if next_match:
                    dates = next_match.group(0).strip()
                    exp_lines[i+1] = re.sub(DATE_RANGE_REGEX, "", exp_lines[i+1], flags=re.IGNORECASE).strip(' ,-–:')

            current_exp["start_date"] = dates

            for c_key, (c_name, s_name) in CITIES_DB.items():
                if re.search(r'\b' + re.escape(c_key) + r'\b', clean_header_line.lower()):
                    current_exp["location"] = c_name
                    clean_header_line = re.sub(r'\b' + re.escape(c_key) + r'\b', '', clean_header_line, flags=re.IGNORECASE).strip(' ,-–:')
                    break

            parts = re.split(r'\s*(?:—|–|\||@|\b(?:at)\b)\s*', clean_header_line)
            if len(parts) >= 2:
                current_exp["role"] = parts[0].strip(' ,-–:')
                current_exp["company"] = parts[1].strip(' ,-–:')
            else:
                dash_parts = re.split(r'\s*-\s*', clean_header_line)
                if len(dash_parts) >= 2:
                    current_exp["role"] = dash_parts[0].strip(' ,-–:')
                    current_exp["company"] = dash_parts[1].strip(' ,-–:')
                else:
                    if has_job_kw:
                        current_exp["role"] = clean_header_line.strip(' ,-–:')
                        if i + 1 < len(exp_lines) and not is_description_line(exp_lines[i+1]) and not any(re.search(r'\b' + re.escape(kw) + r'\b', exp_lines[i+1].lower()) for kw in JOB_TITLE_KEYWORDS):
                            next_l = exp_lines[i+1].strip()
                            next_date = re.search(DATE_RANGE_REGEX, next_l, re.IGNORECASE)
                            if next_date and not current_exp["start_date"]:
                                current_exp["start_date"] = next_date.group(0).strip()
                            c_line = re.sub(DATE_RANGE_REGEX, "", next_l, flags=re.IGNORECASE).strip(' ,-–:')
                            if c_line:
                                current_exp["company"] = c_line
                                i += 1
                    else:
                        current_exp["company"] = clean_header_line.strip(' ,-–:')

        elif current_exp:
            clean_desc = re.sub(r'^[•\-\*\d\.]+\s*', '', line).strip()
            if clean_desc:
                if current_exp["description"]:
                    current_exp["description"] += " " + clean_desc
                else:
                    current_exp["description"] = clean_desc

        i += 1

    if current_exp and (current_exp["role"] or current_exp["company"]):
        work_experiences.append(current_exp)

    return work_experiences

def parse_educations(lines):
    edu_lines = extract_section_lines(lines, EDU_HEADER_KEYWORDS, "education")
    if not edu_lines:
        for l in lines:
            if any(re.search(pat, l, re.IGNORECASE) for pat, _ in DEGREE_PATTERNS):
                edu_lines.append(l)

    if not edu_lines:
        return []

    blocks = []
    curr_block = []

    inst_keywords = ["college", "university", "institute", "school", "academy", "polytechnic", "high school", "junior college"]

    def has_degree_kw(line_str: str) -> bool:
        return any(re.search(pat, line_str, re.IGNORECASE) for pat, _ in DEGREE_PATTERNS)

    def has_inst_kw(line_str: str) -> bool:
        return any(ik in line_str.lower() for ik in inst_keywords)

    for l in edu_lines:
        l_clean = l.strip()
        if not l_clean:
            if curr_block:
                blocks.append(curr_block)
                curr_block = []
            continue

        is_deg = has_degree_kw(l_clean)
        
        if curr_block:
            curr_has_deg = any(has_degree_kw(b) for b in curr_block)
            curr_has_inst = any(has_inst_kw(b) for b in curr_block)
            if (is_deg and curr_has_deg) or (has_inst_kw(l_clean) and curr_has_inst):
                blocks.append(curr_block)
                curr_block = []

        curr_block.append(l_clean)

    if curr_block:
        blocks.append(curr_block)

    educations = []
    for block in blocks:
        block_text = " ".join(block).strip()
        if not block_text:
            continue

        degree = ""
        field_of_study = ""
        institution = ""
        start_year = ""
        end_year = ""
        cgpa = ""

        # 1. Degree
        for pattern, d_name in DEGREE_PATTERNS:
            if re.search(pattern, block_text, re.IGNORECASE):
                degree = d_name
                break

        # 2. Field of study
        for pattern, f_name in FIELD_PATTERNS:
            if re.search(pattern, block_text, re.IGNORECASE):
                field_of_study = f_name
                break

        if not field_of_study:
            # Fallback for "in <field>" or "(<field>)"
            in_match = re.search(r'\b(?:in|of|branch)\s+([A-Za-z\s&]+?)(?:\b\d{4}\b|cgpa|gpa|,|\(|$)', block_text, re.IGNORECASE)
            if in_match and len(in_match.group(1).strip()) >= 3:
                field_of_study = in_match.group(1).strip()
            else:
                paren_match = re.search(r'\(([^)]+)\)', block_text)
                if paren_match and not any(c.isdigit() for c in paren_match.group(1)):
                    field_of_study = paren_match.group(1).strip()

        # 3. Years
        yr_match = re.search(r'(?:19|20)\d{2}\s*(?:-|–|—|to)\s*(?:(?:19|20)\d{2}|present|current)', block_text, re.IGNORECASE)
        if yr_match:
            yrs = re.findall(r'(?:19|20)\d{2}|present|current', yr_match.group(0), re.IGNORECASE)
            if len(yrs) >= 2:
                start_year = yrs[0]
                end_year = yrs[1].capitalize() if not yrs[1].isdigit() else yrs[1]
        else:
            yrs = re.findall(r'(?:19|20)\d{2}', block_text)
            if len(yrs) >= 2:
                start_year = yrs[0]
                end_year = yrs[1]
            elif len(yrs) == 1:
                end_year = yrs[0]

        # 4. CGPA / Percentage
        cgpa_match = re.search(r'(?:cgpa|gpa|percentage|score|marks)\s*[:#-]?\s*(\d+(?:\.\d+)?%?|\d+\.\d+/\d+)', block_text, re.IGNORECASE)
        if cgpa_match:
            cgpa = cgpa_match.group(1)
        else:
            standalone_cgpa = re.search(r'(?<!\d)(?:[6-9]\.\d{1,2}|10\.0|\d{1,3}(?:\.\d{1,2})?%)(?![a-zA-Z0-9])', block_text)
            if standalone_cgpa and not any(y_val in standalone_cgpa.group(0) for y_val in [start_year, end_year] if y_val):
                cgpa = standalone_cgpa.group(0)

        # 5. Institution Extraction
        best_inst_line = ""
        for line_item in block:
            item_clean = line_item.strip()
            if not has_degree_kw(item_clean):
                cleaned_l = re.sub(r'(?:19|20)\d{2}\s*(?:-|–|—|to)?\s*(?:(?:19|20)\d{2}|present|current)?', '', item_clean, flags=re.IGNORECASE)
                cleaned_l = re.sub(r'(?:cgpa|gpa|percentage|score|marks)\s*[:#-]?\s*(\d+(?:\.\d+)?%?|\d+\.\d+/\d+)', '', cleaned_l, flags=re.IGNORECASE)
                cleaned_l = re.sub(r'(?<!\d)(?:[6-9]\.\d{1,2}|10\.0|\d{1,3}(?:\.\d{1,2})?%)(?![a-zA-Z0-9])', '', cleaned_l)
                cleaned_l = cleaned_l.strip(' -–:|,')
                if len(cleaned_l) >= 3 and not cleaned_l.lower().startswith(('cgpa', 'gpa', 'score')):
                    best_inst_line = cleaned_l
                    break

        if best_inst_line:
            institution = best_inst_line
        else:
            clean_text = block_text
            clean_text = re.sub(r'(?:19|20)\d{2}\s*(?:-|–|—|to)?\s*(?:(?:19|20)\d{2}|present|current)?', '', clean_text, flags=re.IGNORECASE)
            clean_text = re.sub(r'(?:cgpa|gpa|percentage|score|marks)\s*[:#-]?\s*(\d+(?:\.\d+)?%?|\d+\.\d+/\d+)', '', clean_text, flags=re.IGNORECASE)
            clean_text = re.sub(r'(?<!\d)(?:[6-9]\.\d{1,2}|10\.0|\d{1,3}(?:\.\d{1,2})?%)(?![a-zA-Z0-9])', '', clean_text)
            
            for f_pat, _ in FIELD_PATTERNS:
                clean_text = re.sub(f_pat, '', clean_text, flags=re.IGNORECASE)
            for d_pat, _ in DEGREE_PATTERNS:
                clean_text = re.sub(d_pat, '', clean_text, flags=re.IGNORECASE)

            clean_parts = re.split(r'[,|/\-–—]', clean_text)
            inst_parts = []
            for p in clean_parts:
                p_sub = re.sub(r'^\s*(?:in|from|at|of|with|branch)\s+', '', p.strip(), flags=re.IGNORECASE)
                p_sub = re.sub(r'\s+(?:in|from|at|of|with|branch)\s*$', '', p_sub, flags=re.IGNORECASE).strip(' -–:|,')
                p_sub = re.sub(r'\(\s*\)', '', p_sub).strip(' -–:|,')
                if p_sub and len(p_sub) >= 3 and not p_sub.lower().startswith(('cgpa', 'gpa', 'score', 'percentage')):
                    inst_parts.append(p_sub)

            institution = ", ".join(inst_parts)

        if degree or institution:
            educations.append({
                "institution": institution,
                "degree": degree,
                "field_of_study": field_of_study,
                "start_year": start_year,
                "end_year": end_year,
                "cgpa": cgpa
            })

    return educations

def parse_projects(lines):
    projects = []
    
    # 1. Isolate Projects Section
    in_proj_section = False
    proj_lines = []
    proj_trigger_headers = ["projects", "academic projects", "personal projects", "technical projects", "key projects"]
    
    for line in lines:
        line_clean = line.strip()
        if not line_clean:
            continue
        line_lower = line_clean.lower().rstrip(':-')
        
        if line_lower in proj_trigger_headers:
            in_proj_section = True
            continue
            
        if in_proj_section:
            # Immediately stop section reading if ANY new section header begins!
            if is_section_header(line_clean, current_section_name="projects"):
                break
            proj_lines.append(line_clean)

    if not proj_lines:
        return []

    # 2. Project Title Line Detector
    def is_title_line(line_str, is_first_line):
        l_clean = line_str.strip()
        if not l_clean:
            return False

        unbulleted = re.sub(r'^[•\-\*\d\.]+\s*', '', l_clean).strip()
        if not unbulleted:
            return False

        l_lower = unbulleted.lower()

        # Metadata / label lines are never titles
        if l_lower.startswith(("tech stack:", "technologies:", "tools:", "built with:", "github:", "live link:", "link:", "url:", "http://", "https://")):
            return False

        # Lowercase start -> description line
        if unbulleted[0].islower():
            return False

        # Action verbs & descriptive sentence starters -> description lines
        desc_starter_regex = r'^(?:developed|built|implemented|designed|created|engineered|spearheaded|architected|maintained|utilized|used|applied|a\s|an\s|voice-enabled|responsive|web-based|mobile|javafx|react|node|python|full-stack|fullstack)\b'
        if re.match(desc_starter_regex, l_lower):
            return False

        # Explicit title structure: colon e.g. "Shield – AI Chatbot: Voice-enabled..."
        if ":" in unbulleted and len(unbulleted.split(":")[0].strip()) <= 40:
            return True

        # Explicit title structure: dash e.g. "Shield – AI Chatbot"
        if (" – " in unbulleted or " - " in unbulleted) and len(unbulleted) <= 70:
            return True

        # First line of section is always a title
        if is_first_line:
            return True

        # Short title-cased lines without sentence punctuation or sentence connecting words
        if len(unbulleted) <= 55 and not unbulleted.endswith('.') and not any(kw in l_lower for kw in [" using ", " with ", " for ", " based ", " which ", " that "]):
            return True

        return False

    current_project = None

    for line in proj_lines:
        line_clean = line.strip()
        if not line_clean:
            continue

        line_lower = line_clean.lower()
        is_first = (current_project is None)

        if is_title_line(line_clean, is_first_line=is_first):
            # Save previous project if existing
            if current_project and current_project.get("title"):
                projects.append(current_project)

            # Start a brand new project record
            raw_title = re.sub(r'^[•\-\*\d\.]+\s*', '', line_clean).strip()
            explicit_tech = ""

            # Check if title line contains colon e.g. "Shield – AI Chatbot: Voice-enabled..."
            if ":" in raw_title and len(raw_title.split(":")[0].strip()) <= 40:
                raw_title = raw_title.split(":")[0].strip()

            # Check parenthesized tech stack in title e.g. "Study Cafe (HTML, CSS, JavaScript)"
            paren_match = re.search(r'\(([^)]+)\)', raw_title)
            if paren_match:
                inner_paren = paren_match.group(1).strip()
                if any(sk in inner_paren.lower() for sk in ["html", "css", "js", "java", "sql", "react", "python", "gpt", "api", "node"]):
                    explicit_tech = inner_paren
                raw_title = re.sub(r'\([^)]+\)', '', raw_title).strip()

            raw_title = raw_title.strip(' :-–')

            current_project = {
                "title": raw_title,
                "description": "",  # Description is strictly EMPTY for manual user entry!
                "tech_stack": explicit_tech,
                "project_url": ""
            }
        elif current_project:
            # Check explicit metadata lines for current project
            if line_lower.startswith(("tech stack:", "technologies:", "tools:", "built with:", "technology stack:")):
                stack_val = re.sub(r'^(?:tech stack|technologies|tools|built with|technology stack)\s*[:#-]\s*', '', line_clean, flags=re.IGNORECASE).strip()
                if stack_val:
                    current_project["tech_stack"] = stack_val

            elif "github.com" in line_lower or "http://" in line_lower or "https://" in line_lower:
                url_match = re.search(r'https?://[^\s,\(\)\]\[]+|(?:github\.com/[^\s]+)', line_clean, re.IGNORECASE)
                if url_match:
                    p_url = url_match.group(0)
                    if not p_url.startswith("http"):
                        p_url = "https://" + p_url
                    current_project["project_url"] = p_url

    if current_project and current_project.get("title"):
        projects.append(current_project)

    # Filter out any duplicate title records or generic headers
    valid_projects = []
    seen_titles = set()
    for p in projects:
        t_clean = p["title"].strip()
        if t_clean and t_clean.lower() not in seen_titles and not t_clean.lower().startswith(("tools", "skills", "platforms", "technologies")):
            seen_titles.add(t_clean.lower())
            valid_projects.append(p)

    return valid_projects

def parse_resume_text(text: str) -> dict:
    clean_text = text.lower()
    lines = [l.strip() for l in text.split("\n") if l.strip()]

    # 1. Names
    first_name, middle_name, last_name = extract_name(lines)

    # 2. Email
    email_match = re.search(r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}', text)
    email = email_match.group(0) if email_match else ""

    # 3. Phones
    phones = extract_phone_numbers(text)
    phone = phones[0] if len(phones) > 0 else ""
    alternate_phone = phones[1] if len(phones) > 1 else ""

    # 4. DOB & Gender
    date_of_birth, gender = extract_dob_and_gender(text)

    # 5. Postal Code
    postal_code = extract_postal_code(text)

    # 6. City, State, Country
    current_city, state, country = extract_location(text)

    # 7. Skills
    found_skills = []
    for skill in KNOWN_SKILLS:
        pattern = r'\b' + re.escape(skill) + r'\b'
        if re.search(pattern, clean_text):
            found_skills.append(skill.title())

    # 8. Experience Years
    exp_matches = re.findall(r'(\d+|\b(one|two|three|four|five|six|seven|eight|nine|ten)\b)\s*(?:\+)?\s*(?:years?|yrs?)\s*(?:of)?\s*(?:experience|exp)?', clean_text)
    years = 0.0
    num_map = {"one": 1, "two": 2, "three": 3, "four": 4, "five": 5, "six": 6, "seven": 7, "eight": 8, "nine": 9, "ten": 10}
    if exp_matches:
        val = exp_matches[0][0]
        if val in num_map:
            years = float(num_map[val])
        else:
            try:
                years = float(val)
            except ValueError:
                years = 1.0

    # 9. Educations List (Strict extraction - NO mock fallbacks!)
    educations = parse_educations(lines)

    # 10. Work Experiences List (Separate Role, Company, Location, Dates, Description)
    work_experiences = parse_work_experiences(lines)

    # 11. Projects List (Strict extraction - NO mock fallbacks!)
    projects = parse_projects(lines)

    # 12. Languages List (Strict extraction - NO mock fallbacks!)
    found_languages = []
    for lang in KNOWN_LANGUAGES:
        if re.search(r'\b' + re.escape(lang) + r'\b', clean_text):
            found_languages.append(lang.title())

    # 13. Links List (Strict extraction for LinkedIn, GitHub & Portfolios)
    links = []
    seen_urls = set()

    http_urls = re.findall(r'https?://[^\s,\(\)\]\[]+', text)
    linkedin_urls = re.findall(r'(?:https?://)?(?:www\.)?linkedin\.com/(?:in|profile)/[a-zA-Z0-9%_.-]+/?', text, re.IGNORECASE)
    github_urls = re.findall(r'(?:https?://)?(?:www\.)?github\.com/[a-zA-Z0-9%_.-]+/?', text, re.IGNORECASE)
    www_urls = re.findall(r'(?:https?://)?www\.[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}[^\s,\(\)\]\[]*', text, re.IGNORECASE)

    raw_candidates = http_urls + linkedin_urls + github_urls + www_urls

    for candidate in raw_candidates:
        clean = candidate.strip('.,;()[]')
        if not clean:
            continue
        
        if not clean.startswith('http://') and not clean.startswith('https://'):
            full_url = 'https://' + clean
        else:
            full_url = clean

        normalized_url = full_url.rstrip('/')
        if normalized_url.lower() in seen_urls:
            continue
        seen_urls.add(normalized_url.lower())

        platform = "Portfolio"
        if "linkedin.com" in normalized_url.lower():
            platform = "LinkedIn"
        elif "github.com" in normalized_url.lower():
            platform = "GitHub"

        links.append({"platform": platform, "url": full_url})

    # Summary is strictly entered manually by the user
    summary = ""

    return {
        "first_name": first_name,
        "middle_name": middle_name,
        "last_name": last_name,
        "email": email,
        "phone": phone,
        "alternate_phone": alternate_phone,
        "date_of_birth": date_of_birth,
        "gender": gender,
        "current_city": current_city,
        "state": state,
        "country": country,
        "postal_code": postal_code,
        "skills": list(set(found_skills)),
        "experience_years": years,
        "summary": summary,
        "education": educations,
        "educations": educations,
        "work_experiences": work_experiences,
        "projects": projects,
        "languages": list(set(found_languages)),
        "links": links,
        "raw_text": text[:3000]
    }

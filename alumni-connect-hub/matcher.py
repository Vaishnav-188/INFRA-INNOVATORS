import sys
import pdfplumber
import json
from sentence_transformers import SentenceTransformer, util

# 1. Load the Pre-trained Model 
# (Lightweight, fast, and handles semantic meaning perfectly)
model = SentenceTransformer('all-MiniLM-L6-v2')

def extract_text_from_pdf(pdf_path):
    """Extracts all text from the student's uploaded PDF."""
    try:
        text = ""
        with pdfplumber.open(pdf_path) as pdf:
            for page in pdf.pages:
                content = page.extract_text()
                if content:
                    text += content
        return text
    except Exception as e:
        return str(e)

def calculate_match(job_description, resume_text):
    """Calculates Semantic Similarity between JD and Resume."""
    # Convert text to numerical vectors (Embeddings)
    jd_embedding = model.encode(job_description, convert_to_tensor=True)
    resume_embedding = model.encode(resume_text, convert_to_tensor=True)
    
    # Calculate Cosine Similarity score (0 to 1)
    score = util.cos_sim(jd_embedding, resume_embedding).item()
    return score

if __name__ == "__main__":
    # Accessing inputs from Backend (Node.js)
    # sys.argv[1] is the Job Description from Alumni Post
    # sys.argv[2] is the Path of the Resume uploaded by Student
    if len(sys.argv) < 3:
        print(json.dumps({"error": "Missing arguments"}))
        sys.exit(1)

    alumni_jd = sys.argv[1]
    student_resume_path = sys.argv[2]

    # Process
    extracted_resume_text = extract_text_from_pdf(student_resume_path)
    match_score = calculate_match(alumni_jd, extracted_resume_text)

    # Threshold: If score > 70%, it's a good match
    status = "SELECTED" if match_score >= 0.70 else "REJECTED"

    # Return JSON output so Backend can easily parse it
    result = {
        "status": status,
        "score": round(match_score * 100, 2), # Percentage
        "is_eligible": match_score >= 0.70
    }

    print(json.dumps(result))
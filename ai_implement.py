from datetime import datetime, timezone
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from pymongo import MongoClient
from agno.agent import Agent
from agno.models.ollama import Ollama



SYSTEM_PROMPT = """
You are an AI Career Roadmap Generator inside an Alumni Management System.

Context:
- A student has been accepted by an alumni mentor.
- You must generate a structured 6-week career roadmap.
- The roadmap should be personalized based on:
    1) GitHub Profile Summary
    2) LinkedIn Skills
    3) Career Goal

Your Responsibilities:
1. Identify skill gaps between current skills and the career goal.
2. Create a 6-week roadmap.
3. Each week must contain 3 to 5 practical micro-tasks.

Rules:
- Tasks must be Measurable, Actionable, and Real-world focused.
- Avoid generic advice — be specific to the student's profile.
- Keep the output structured clearly:

  Week 1:
  - Task 1
  - Task 2
  ...

  Week 2:
  - Task 1
  - Task 2
  ...

- Keep total response under 400 words.
- Be professional and career-focused.
"""



# Shared Ollama model instane
_model = Ollama(id="llama3.2:1b")


roadmap_agent = Agent(
    name="Career Roadmap Generator",
    model=_model,
    instructions=SYSTEM_PROMPT,
)

# ── General chat agent ────────────────────────────────────────────────────────
CHAT_PROMPT = """
You are the Alumni Hub AI Assistant embedded in a student-alumni management platform.

Your role:
- Answer student questions about events, jobs, mentorship, alumni connections, and career advice.
- Be friendly, concise, and helpful.
- If asked to generate a career roadmap, tell the user to type: 'generate roadmap' and you will walk them through it.
- Keep responses under 150 words.
- Do not answer unrelated topics.
"""

chat_agent = Agent(
    name="Alumni Hub Chat Assistant",
    model=_model,
    instructions=CHAT_PROMPT,
)

# ── Domain Roadmap + Quiz agent ───────────────────────────────────────────────
DOMAIN_ROADMAP_PROMPT = """
You are a Career Domain Expert inside an Alumni Mentorship Platform.

When given a domain (e.g. Data Science, Web Development, Cybersecurity, etc.) you must produce:

PART 1 — 6-WEEK ROADMAP
- Exactly 6 weeks
- Each week: 3–5 specific, actionable tasks tailored to the domain
- Tasks must include real tools, libraries, or project ideas relevant to the domain
- Format:
  Week 1: <theme>
  - Task 1
  - Task 2
  ...

PART 2 — SKILL ASSESSMENT QUIZ
- Exactly 5 multiple-choice questions (MCQ) testing fundamental knowledge of the domain
- Each question must have exactly 4 options labeled A), B), C), D)
- Mark the correct answer clearly with: ANSWER: <letter>
- Format:
  QUIZ
  Q1. <question>
  A) ...
  B) ...
  C) ...
  D) ...
  ANSWER: B

Rules:
- Be domain-specific. Never give generic advice.
- Keep the roadmap under 350 words.
- Keep the quiz under 250 words.
- Be professional and structured.
"""

domain_roadmap_agent = Agent(
    name="Domain Roadmap & Quiz Generator",
    model=_model,
    instructions=DOMAIN_ROADMAP_PROMPT,
)


# =============================================================================
#  SECTION 3 — ROADMAP GENERATION FUNCTION
#  Builds the personalised prompt and runs the agent.
# =============================================================================

def generate_roadmap(
    github_summary: str,
    linkedin_skills: str,
    career_goal: str,
) -> str:
    """
    Generate a personalised 6-week career roadmap.

    Parameters
    ----------
    github_summary  : str — Short summary of the student's GitHub activity.
    linkedin_skills : str — Comma-separated list of LinkedIn skills.
    career_goal     : str — What the student wants to achieve / become.

    Returns
    -------
    str — The formatted 6-week roadmap text produced by the AI agent.
    """

    prompt = f"""
Student GitHub Summary:
{github_summary}

Student LinkedIn Skills:
{linkedin_skills}

Student Career Goal:
{career_goal}

Generate the personalised 6-week career roadmap now.
"""

    response = roadmap_agent.run(prompt)
    return response.content



_mongo_client = MongoClient("mongodb://localhost:27017/")
_db = _mongo_client["alumni_db"]

sessions_collection  = _db["mentorship_sessions"]
roadmaps_collection  = _db["roadmaps"]


# =============================================================================
#  SECTION 5 — FASTAPI APPLICATION
#  Exposes the roadmap generator as a REST endpoint.
# =============================================================================

app = FastAPI(
    title="Alumni AI API",
    description="AI-powered chat assistant and 6-week career roadmap generator for students.",
    version="2.0.0",
)


# ── Request/Response Models ───────────────────────────────────────────────────

class ChatRequest(BaseModel):
    message: str
    role: str = "student"
    name: str = "User"

class DomainRoadmapRequest(BaseModel):
    domain: str                  # e.g. "Data Science", "Web Development"
    student_name: str = "Student"
    mentor_name: str  = "Mentor"
    session_id: str   = ""


# ── POST /generate-domain-roadmap/ ───────────────────────────────────────────

@app.post("/generate-domain-roadmap/")
def generate_domain_roadmap(req: DomainRoadmapRequest):
    """
    Generates a domain-specific 6-week career roadmap + 5-question MCQ quiz.
    Called automatically when a student accepts a mentorship request.

    Body (JSON)
    -----------
    domain        : str — e.g. 'Data Science', 'Web Development'
    student_name  : str — Student's name
    mentor_name   : str — Mentor/alumni name
    session_id    : str — Optional mentorship session ID

    Returns
    -------
    JSON with roadmap text, quiz text, and the parsed quiz questions list.
    """
    prompt = (
        f"Domain: {req.domain}\n"
        f"Student: {req.student_name}\n"
        f"Mentor: {req.mentor_name}\n\n"
        f"Generate the 6-week roadmap for '{req.domain}' AND the 5-question MCQ quiz."
    )

    response = domain_roadmap_agent.run(prompt)
    full_text = response.content

    # ── Split roadmap and quiz sections ──────────────────────────────────────
    roadmap_text = full_text
    quiz_text    = ""

    if "QUIZ" in full_text:
        parts        = full_text.split("QUIZ", 1)
        roadmap_text = parts[0].strip()
        quiz_text    = "QUIZ\n" + parts[1].strip()

    
    quiz_questions = []
    import re

    if quiz_text:
        
        q_pattern = re.compile(
            r'Q(\d+)[\.:][\s\n]+(.+?)(?=\nQ\d+[\.:]\s|\Z)',
            re.DOTALL
        )

       
        raw_blocks = re.split(r'\n?(?:Q(\d+)[\.:])\s*', quiz_text)

       
        while i + 1 < len(raw_blocks):
            q_num_str = raw_blocks[i]      # e.g. "1"
            q_body    = raw_blocks[i + 1]  # everything until next Q

            lines = [l.strip() for l in q_body.strip().splitlines() if l.strip()]

            #
            if not lines:
                i += 2
                continue

            
            question = lines[0].strip()
            if question.upper() in ('QUIZ', 'PART 2', 'SKILL ASSESSMENT', ''):
                
                if len(lines) > 1:
                    question = lines[1].strip()
                    option_lines = lines[2:]
                else:
                    i += 2
                    continue
            else:
                option_lines = lines[1:]

           
            question = re.sub(r'\*+', '', question).strip()

          
            options = []
            ans_line = ''
            for ol in option_lines:
                if re.match(r'^[A-Da-d]\)', ol):
                    options.append(ol.strip())
                elif ol.upper().startswith('ANSWER'):
                    ans_line = ol

            answer = re.sub(r'(?i)answer\s*[:=\s]+', '', ans_line).strip().upper()

            if question and len(options) >= 4:
                quiz_questions.append({
                    "question": question,
                    "options" : options[:4],
                    "answer"  : answer,
                })

            i += 2


    # ── Persist roadmap to MongoDB ────────────────────────────────────────────
    if req.session_id:
        roadmaps_collection.insert_one({
            "session_id"     : req.session_id,
            "type"           : "domain_ai",
            "domain"         : req.domain,
            "created_by"     : "system",
            "roadmap_content": roadmap_text,
            "quiz_content"   : quiz_text,
            "quiz_questions" : quiz_questions,
            "progress"       : 0,
            "created_at"     : datetime.now(timezone.utc),
        })

    return {
        "domain"         : req.domain,
        "roadmap"        : roadmap_text,
        "quiz"           : quiz_text,
        "quiz_questions" : quiz_questions,
        "message"        : f"Domain roadmap for '{req.domain}' generated successfully",
    }


# ── POST /ai-chat/ ────────────────────────────────────────────────────────────

@app.post("/ai-chat/")
def ai_chat(req: ChatRequest):
    """
    General AI chatbot endpoint used by the Alumni Hub chat box.

    Body (JSON)
    -----------
    message : str  — The user's chat message.
    role    : str  — 'student', 'alumni', or 'admin'.
    name    : str  — User's display name.

    Returns
    -------
    JSON with the AI response and detected category.
    """
    prompt = (
        f"User ({req.role}, name: {req.name}) says: {req.message}\n\n"
        "Reply helpfully and concisely."
    )

    # Detect if roadmap is requested
    msg_lower = req.message.lower()
    if any(kw in msg_lower for kw in ["roadmap", "career plan", "6 week", "skill gap"]):
        response_text = (
            "I can generate a personalised 6-week career roadmap for you! 🗺️\n\n"
            "Please provide:\n"
            "1️⃣ Your GitHub profile summary\n"
            "2️⃣ Your LinkedIn skills\n"
            "3️⃣ Your career goal\n\n"
            "Type them in this format:\n"
            "GitHub: <your summary>\nSkills: <your skills>\nGoal: <your career goal>"
        )
        category = "roadmap"
    else:
        response = chat_agent.run(prompt)
        response_text = response.content
        category = "general"

    return {
        "response": response_text,
        "category": category,
    }


# ── POST /generate-ai-roadmap/ ────────────────────────────────────────────────

@app.post("/generate-ai-roadmap/")
def create_ai_roadmap(
    session_id: str,
    github_summary: str,
    linkedin_skills: str,
    career_goal: str,
):
    """
    Generate an AI career roadmap and persist it in MongoDB.

    Query Parameters
    ----------------
    session_id      : str — The active mentorship session ID.
    github_summary  : str — Student's GitHub profile summary.
    linkedin_skills : str — Student's LinkedIn skills (comma-separated).
    career_goal     : str — Student's target career role / goal.

    Returns
    -------
    JSON with a success message and the generated roadmap text.
    """

    # --- Validate that the mentorship session exists -------------------------
    session = sessions_collection.find_one({"session_id": session_id})
    if not session:
        raise HTTPException(
            status_code=404,
            detail=f"Mentorship session '{session_id}' not found.",
        )

    # --- Generate the roadmap using the AI agent ----------------------------
    roadmap_text = generate_roadmap(
        github_summary=github_summary,
        linkedin_skills=linkedin_skills,
        career_goal=career_goal,
    )

    # --- Persist the roadmap in MongoDB -------------------------------------
    roadmap_doc = {
        "session_id"     : session_id,
        "type"           : "ai",
        "created_by"     : "system",
        "roadmap_content": roadmap_text,
        "progress"       : 0,
        "created_at"     : datetime.now(timezone.utc),
    }
    roadmaps_collection.insert_one(roadmap_doc)

    # --- Return the response -------------------------------------------------
    return {
        "message": "AI Roadmap Created Successfully",
        "session_id": session_id,
        "roadmap": roadmap_text,
    }


# =============================================================================
#  SECTION 6 — ENTRY POINT (optional direct run)
#  Run with:  python ai_implement.py
#  Or use  :  uvicorn ai_implement:app --reload --port 8000
# =============================================================================

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("ai_implement:app", host="0.0.0.0", port=8000, reload=True)

"""
chat/tool_registry.py

Maps each agent domain to its allowed Gemini FunctionDeclaration specs.
Only the tools relevant to the active agent are sent to Gemini, which
technically enforces domain isolation at the model level.
"""

from google.genai import types

# ── Gemini tool schema helpers ────────────────────────────────────────────────

def _param(ptype: str, description: str, required: bool = False):
    return {"type": ptype, "description": description}


def _fn(name: str, description: str, properties: dict, required: list[str] = None):
    return types.FunctionDeclaration(
        name=name,
        description=description,
        parameters=types.Schema(
            type="OBJECT",
            properties={
                k: types.Schema(
                    type="STRING",
                    description=v["description"]
                )
                for k, v in properties.items()
            },
            required=required or [],
        ),
    )


# ── Tool specs per domain ─────────────────────────────────────────────────────

STUDENT_TOOLS = [
    _fn("get_students",
        "Retrieve a list of students filtered by department, year, or minimum GPA.",
        {
            "dept":      {"description": "Department code, e.g. CSE, ECE, MECH, IT"},
            "year":      {"description": "Year of study: 1, 2, 3, or 4"},
            "gpa_above": {"description": "Minimum GPA threshold (e.g. 8.0)"},
        }),
    _fn("enroll_student",
        "Enroll a new student into the university.",
        {
            "name":  {"description": "Full name of the student"},
            "dept":  {"description": "Department code: CSE, ECE, MECH, IT"},
            "year":  {"description": "Year of study: 1, 2, 3, or 4"},
            "email": {"description": "Student email address"},
        },
        required=["name", "dept", "year", "email"]),
    _fn("update_student",
        "Update a single field of an existing student record.",
        {
            "roll_no": {"description": "Student roll number"},
            "field":   {"description": "Field to update: name, department, year, gpa, or email"},
            "value":   {"description": "New value for the field"},
        },
        required=["roll_no", "field", "value"]),
    _fn("delete_student",
        "Permanently delete a student record by roll number.",
        {
            "roll_no": {"description": "Student roll number to delete"},
        },
        required=["roll_no"]),
]

FACULTY_TOOLS = [
    _fn("get_faculty",
        "List faculty members, optionally filtered by department.",
        {
            "dept": {"description": "Department code, e.g. CSE, ECE"},
        }),
    _fn("add_faculty",
        "Add a new faculty member to the system.",
        {
            "name":  {"description": "Full name of the faculty"},
            "dept":  {"description": "Department code"},
            "email": {"description": "Faculty email address"},
        },
        required=["name", "dept", "email"]),
    _fn("assign_subject",
        "Assign an existing course to a faculty member.",
        {
            "faculty_name": {"description": "Full name of the faculty member"},
            "subject":      {"description": "Name of the course to assign"},
        },
        required=["faculty_name", "subject"]),
    _fn("get_workload",
        "Get the number of courses assigned to each faculty member.",
        {}),
]

ATTENDANCE_TOOLS = [
    _fn("get_low_attendance",
        "Find students with attendance below a given percentage threshold.",
        {
            "threshold": {"description": "Minimum attendance percentage (default 75)"},
            "dept":      {"description": "Optional department filter"},
        }),
    _fn("mark_attendance",
        "Mark today's attendance for a student in a specific course.",
        {
            "roll_no":   {"description": "Student roll number"},
            "course_id": {"description": "Course ID (integer)"},
            "status":    {"description": "P (Present), A (Absent), or L (Leave)"},
        },
        required=["roll_no", "course_id"]),
    _fn("get_student_attendance",
        "Get attendance records for a specific student, optionally filtered by month.",
        {
            "roll_no": {"description": "Student roll number"},
            "month":   {"description": "Month number 1-12"},
        },
        required=["roll_no"]),
]

EXAM_TOOLS = [
    _fn("get_top_students",
        "Get the top-performing students in a given subject.",
        {
            "subject": {"description": "Course/subject name"},
            "limit":   {"description": "Number of top students to return (default 10)"},
        },
        required=["subject"]),
    _fn("record_marks",
        "Record or update exam marks for a student in a subject.",
        {
            "roll_no":   {"description": "Student roll number"},
            "subject":   {"description": "Course/subject name"},
            "marks":     {"description": "Marks obtained"},
            "exam_type": {"description": "MID1, MID2, FINAL, or LAB"},
            "max_marks": {"description": "Maximum possible marks (default 100)"},
        },
        required=["roll_no", "subject", "marks"]),
    _fn("schedule_exam",
        "Schedule an exam for a subject in a specific semester.",
        {
            "subject":   {"description": "Course name"},
            "semester":  {"description": "Semester number"},
            "exam_date": {"description": "Exam date in YYYY-MM-DD format"},
            "exam_type": {"description": "MID1, MID2, FINAL, or LAB"},
        },
        required=["subject", "semester", "exam_date"]),
]

COURSE_TOOLS = [
    _fn("get_courses",
        "List all courses, optionally filtered by department or semester.",
        {
            "dept":     {"description": "Department code"},
            "semester": {"description": "Semester number"},
        }),
    _fn("create_course",
        "Create a new course in the system.",
        {
            "name":     {"description": "Course name"},
            "dept":     {"description": "Department code"},
            "semester": {"description": "Semester number"},
            "credits":  {"description": "Number of credits (default 3)"},
        },
        required=["name", "dept", "semester"]),
]

ANALYTICS_TOOLS = [
    _fn("get_pass_stats",
        "Get pass/fail statistics per department.",
        {
            "dept": {"description": "Optional specific department to filter"},
        }),
    _fn("get_dept_performance",
        "Get average GPA and marks for each department.",
        {}),
    _fn("get_enrollment_trends",
        "Get student enrollment counts by year and department.",
        {}),
]

# ── Master registry ───────────────────────────────────────────────────────────

DOMAIN_TOOLS: dict[str, list] = {
    "student":    STUDENT_TOOLS,
    "faculty":    FACULTY_TOOLS,
    "attendance": ATTENDANCE_TOOLS,
    "exam":       EXAM_TOOLS,
    "course":     COURSE_TOOLS,
    "analytics":  ANALYTICS_TOOLS,
}


def get_tools_for_domain(domain: str) -> list:
    """Returns the Gemini FunctionDeclaration list for the given domain."""
    return DOMAIN_TOOLS.get(domain, [])

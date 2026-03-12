"""
seed/seed_data.py

Run with:  python seed/seed_data.py
(Make sure Django is configured and migrations are applied first.)
"""
import os
import sys
import django
from pathlib import Path

# ── Bootstrap Django ──────────────────────────────────────────────────────────
BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

# ── Imports (after setup) ─────────────────────────────────────────────────────
import random
from datetime import date, timedelta
from decimal import Decimal

from college.models import Student, Faculty, Course, Attendance, Result

# ── Data pools ────────────────────────────────────────────────────────────────

FIRST_NAMES = [
    "Aarav", "Aditya", "Akash", "Ananya", "Arjun",
    "Deepika", "Dhruv", "Divya", "Ganesh", "Harini",
    "Ishaan", "Karthik", "Kavya", "Keerthana", "Krish",
    "Lakshmi", "Madhavan", "Meera", "Nandini", "Naveen",
    "Pooja", "Pradeep", "Pranav", "Priya", "Rahul",
    "Raja", "Ramesh", "Riya", "Rohith", "Rukmini",
    "Sandhya", "Sanjay", "Shruti", "Siddharth", "Sneha",
    "Suresh", "Swathi", "Tanvi", "Vignesh", "Vijay",
    "Vishal", "Yamini", "Yash", "Yuva", "Zara",
    "Asha", "Bharath", "Chitra", "Devi", "Elan",
]

LAST_NAMES = [
    "Kumar", "Sharma", "Gupta", "Verma", "Patel",
    "Nair", "Iyer", "Pillai", "Reddy", "Rao",
    "Singh", "Mehta", "Joshi", "Mishra", "Bose",
    "Murugan", "Krishnan", "Subramanian", "Venkatesh", "Anand",
]

DEPARTMENTS  = ["CSE", "ECE", "MECH", "IT"]
DEPT_WEIGHTS = [0.35, 0.25, 0.20, 0.20]   # CSE-heavy, realistic distribution

FACULTY_DATA = [
    ("Dr. Ramesh Babu",      "CSE",  "ramesh.babu@uniagent.edu"),
    ("Dr. Priya Subramaniam","CSE",  "priya.sub@uniagent.edu"),
    ("Dr. Anand Krishnan",   "ECE",  "anand.k@uniagent.edu"),
    ("Prof. Meena Iyer",     "ECE",  "meena.iyer@uniagent.edu"),
    ("Dr. Suresh Pillai",    "MECH", "suresh.pillai@uniagent.edu"),
    ("Prof. Kavitha Nair",   "MECH", "kavitha.nair@uniagent.edu"),
    ("Dr. Vijay Patel",      "IT",   "vijay.patel@uniagent.edu"),
    ("Prof. Sneha Reddy",    "IT",   "sneha.reddy@uniagent.edu"),
    ("Dr. Karthik Menon",    "CSE",  "karthik.menon@uniagent.edu"),
    ("Prof. Divya Rao",      "ECE",  "divya.rao@uniagent.edu"),
]

COURSE_DATA = [
    # (name, dept, semester, credits)
    ("Data Structures & Algorithms", "CSE",  3, 4),
    ("Database Management Systems",  "CSE",  4, 4),
    ("Operating Systems",            "CSE",  5, 4),
    ("Computer Networks",            "CSE",  6, 3),
    ("Digital Electronics",          "ECE",  3, 4),
    ("Signals & Systems",            "ECE",  4, 3),
    ("Thermodynamics",               "MECH", 3, 4),
    ("Fluid Mechanics",              "MECH", 5, 3),
    ("Web Technologies",             "IT",   4, 3),
    ("Software Engineering",         "IT",   5, 4),
    ("Machine Learning",             "CSE",  7, 4),
    ("Embedded Systems",             "ECE",  6, 3),
]


# ── Helper functions ──────────────────────────────────────────────────────────

def random_name():
    return f"{random.choice(FIRST_NAMES)} {random.choice(LAST_NAMES)}"


def random_email(name: str, roll_no: str) -> str:
    clean = name.lower().replace(" ", ".").replace("'", "")
    return f"{clean}.{roll_no.lower()}@student.uniagent.edu"


def random_gpa() -> Decimal:
    # Bell-curve-like: most students 6.5–9.5
    base = random.gauss(8.0, 1.0)
    return Decimal(str(round(max(4.0, min(10.0, base)), 2)))


def random_date_in_last_n_days(n: int) -> date:
    return date.today() - timedelta(days=random.randint(0, n))


# ── Seeding functions ─────────────────────────────────────────────────────────

def clear_all():
    print("🗑  Clearing existing data...")
    Result.objects.all().delete()
    Attendance.objects.all().delete()
    Course.objects.all().delete()
    Faculty.objects.all().delete()
    Student.objects.all().delete()
    print("   Done.\n")


def seed_faculty():
    print("👩‍🏫 Seeding faculty...")
    faculty_objs = []
    for name, dept, email in FACULTY_DATA:
        if not Faculty.objects.filter(email=email).exists():
            f = Faculty.objects.create(name=name, department=dept, email=email)
            faculty_objs.append(f)
            print(f"   + {f.name} ({f.department})")
        else:
            faculty_objs.append(Faculty.objects.get(email=email))
    print(f"   Total faculty: {Faculty.objects.count()}\n")
    return faculty_objs


def seed_courses(faculty_objs):
    print("📚 Seeding courses...")
    course_objs = []
    # Map dept → faculty list
    dept_faculty = {}
    for f in faculty_objs:
        dept_faculty.setdefault(f.department, []).append(f)

    for name, dept, semester, credits in COURSE_DATA:
        if not Course.objects.filter(name=name, department=dept).exists():
            assigned_faculty = None
            if dept in dept_faculty and dept_faculty[dept]:
                assigned_faculty = random.choice(dept_faculty[dept])
            c = Course.objects.create(
                name=name,
                department=dept,
                semester=semester,
                credits=credits,
                faculty=assigned_faculty,
            )
            course_objs.append(c)
            print(f"   + {c.name} ({c.department} Sem {c.semester}) → {assigned_faculty.name if assigned_faculty else 'TBA'}")
        else:
            course_objs.append(Course.objects.get(name=name, department=dept))
    print(f"   Total courses: {Course.objects.count()}\n")
    return course_objs


def seed_students(target=50):
    print(f"🎓 Seeding {target} students...")
    created = 0
    dept_counters = {d: 0 for d in DEPARTMENTS}

    # Pre-count existing students per dept
    for d in DEPARTMENTS:
        dept_counters[d] = Student.objects.filter(department=d).count()

    while created < target:
        dept = random.choices(DEPARTMENTS, weights=DEPT_WEIGHTS, k=1)[0]
        year = random.randint(1, 4)
        dept_counters[dept] += 1
        roll_no = f"{dept}{dept_counters[dept]:04d}"

        if Student.objects.filter(roll_no=roll_no).exists():
            continue

        name  = random_name()
        email = random_email(name, roll_no)
        # Ensure unique email
        if Student.objects.filter(email=email).exists():
            email = f"{email}.{dept_counters[dept]}@student.uniagent.edu"

        Student.objects.create(
            name=name,
            roll_no=roll_no,
            department=dept,
            year=year,
            gpa=random_gpa(),
            email=email,
        )
        created += 1

    print(f"   Total students: {Student.objects.count()}\n")
    return list(Student.objects.all())


def seed_attendance(students, courses):
    print("📋 Seeding attendance records...")
    # Generate 30 days of records for each student in their dept courses
    today      = date.today()
    batch_size = 500
    batch      = []

    dept_courses = {}
    for c in courses:
        dept_courses.setdefault(c.department, []).append(c)

    for student in students:
        relevant_courses = dept_courses.get(student.department, [])[:3]  # pick up to 3
        for course in relevant_courses:
            for days_ago in range(30, 0, -1):
                d = today - timedelta(days=days_ago)
                # Skip weekends
                if d.weekday() >= 5:
                    continue

                r = random.random()
                if r < 0.80:
                    att_status = 'P'
                elif r < 0.93:
                    att_status = 'A'
                else:
                    att_status = 'L'

                batch.append(Attendance(
                    student=student,
                    course=course,
                    date=d,
                    status=att_status,
                    percentage=0,   # will recalculate below
                ))

                if len(batch) >= batch_size:
                    Attendance.objects.bulk_create(batch, ignore_conflicts=True)
                    batch = []

    if batch:
        Attendance.objects.bulk_create(batch, ignore_conflicts=True)

    # Recalculate percentage per (student, course)
    print("   Recalculating attendance percentages...")
    from django.db.models import Count, Q
    for student in students:
        for course in dept_courses.get(student.department, [])[:3]:
            total   = Attendance.objects.filter(student=student, course=course).count()
            present = Attendance.objects.filter(student=student, course=course, status='P').count()
            pct     = round((present / total * 100) if total else 0, 2)
            Attendance.objects.filter(student=student, course=course).update(percentage=pct)

    print(f"   Total attendance records: {Attendance.objects.count()}\n")


def seed_results(students, courses):
    print("📝 Seeding exam results...")
    exam_types = ['MID1', 'MID2', 'FINAL']
    dept_courses = {}
    for c in courses:
        dept_courses.setdefault(c.department, []).append(c)

    batch = []
    for student in students:
        relevant_courses = dept_courses.get(student.department, [])[:3]
        for course in relevant_courses:
            for exam_type in exam_types:
                # Marks correlated slightly with GPA
                base = float(student.gpa) * 8 + random.gauss(0, 8)
                marks = round(max(15, min(98, base)), 2)
                exam_date = random_date_in_last_n_days(120)

                batch.append(Result(
                    student=student,
                    course=course,
                    exam_type=exam_type,
                    marks=Decimal(str(marks)),
                    max_marks=Decimal("100"),
                    date=exam_date,
                ))

    Result.objects.bulk_create(batch, ignore_conflicts=True)
    print(f"   Total result records: {Result.objects.count()}\n")


# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    print("=" * 55)
    print("  UniAgent — Database Seeder")
    print("=" * 55, "\n")

    clear_all()
    faculty_objs = seed_faculty()
    course_objs  = seed_courses(faculty_objs)
    students     = seed_students(target=50)
    seed_attendance(students, course_objs)
    seed_results(students, course_objs)

    print("=" * 55)
    print("✅ Seeding complete!")
    print(f"   Students  : {Student.objects.count()}")
    print(f"   Faculty   : {Faculty.objects.count()}")
    print(f"   Courses   : {Course.objects.count()}")
    print(f"   Attendance: {Attendance.objects.count()}")
    print(f"   Results   : {Result.objects.count()}")
    print("=" * 55)


if __name__ == '__main__':
    main()

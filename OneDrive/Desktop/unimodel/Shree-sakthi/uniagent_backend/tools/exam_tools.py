from datetime import date


def get_top_students(subject, limit=10):
    """
    Return top students for a given subject (course name), ordered by marks descending.
    """
    from college.models import Course, Result
    
    try:
        course = Course.objects.get(name__iexact=subject)
    except Course.DoesNotExist:
        return {"error": f"Course '{subject}' not found."}
    except Course.MultipleObjectsReturned:
        course = Course.objects.filter(name__iexact=subject).first()

    results = (
        Result.objects
        .filter(course=course)
        .select_related('student')
        .order_by('-marks')[:int(limit)]
    )

    return [
        {
            "rank":      i + 1,
            "roll_no":   r.student.roll_no,
            "name":      r.student.name,
            "dept":      r.student.department,
            "marks":     float(r.marks),
            "max_marks": float(r.max_marks),
            "exam_type": r.exam_type,
        }
        for i, r in enumerate(results)
    ]


def record_marks(roll_no, subject, marks, exam_type='FINAL', max_marks=100):
    """
    Record or update exam marks for a student in a subject.
    exam_type: MID1 | MID2 | FINAL | LAB
    """
    from college.models import Student, Course, Result
    
    try:
        student = Student.objects.get(roll_no=roll_no)
    except Student.DoesNotExist:
        return {"error": f"Student with roll_no={roll_no} not found."}

    try:
        course = Course.objects.get(name__iexact=subject)
    except Course.DoesNotExist:
        return {"error": f"Course '{subject}' not found."}
    except Course.MultipleObjectsReturned:
        course = Course.objects.filter(name__iexact=subject).first()

    exam_type = exam_type.upper()
    if exam_type not in ('MID1', 'MID2', 'FINAL', 'LAB'):
        return {"error": "exam_type must be one of: MID1, MID2, FINAL, LAB"}

    result, created = Result.objects.update_or_create(
        student=student,
        course=course,
        exam_type=exam_type,
        defaults={
            'marks':     float(marks),
            'max_marks': float(max_marks),
            'date':      date.today(),
        }
    )

    return {
        "status":    "created" if created else "updated",
        "roll_no":   roll_no,
        "student":   student.name,
        "course":    course.name,
        "exam_type": exam_type,
        "marks":     float(result.marks),
        "max_marks": float(result.max_marks),
    }


def schedule_exam(subject, semester, exam_date, exam_type='FINAL'):
    """
    Schedule/confirm an exam by verifying the course exists and returning a schedule entry.
    (Stores nothing — acts as confirmation tool. Extend with an ExamSchedule model if needed.)
    """
    from college.models import Course
    
    try:
        course = Course.objects.get(name__iexact=subject, semester=int(semester))
    except Course.DoesNotExist:
        # Try without semester match
        try:
            course = Course.objects.get(name__iexact=subject)
        except Course.DoesNotExist:
            return {"error": f"Course '{subject}' not found."}
        except Course.MultipleObjectsReturned:
            course = Course.objects.filter(name__iexact=subject).first()
    except Course.MultipleObjectsReturned:
        course = Course.objects.filter(name__iexact=subject, semester=int(semester)).first()

    return {
        "status":     "scheduled",
        "course":     course.name,
        "department": course.department,
        "semester":   course.semester,
        "exam_type":  exam_type.upper(),
        "exam_date":  str(exam_date),
        "message":    f"{exam_type.upper()} exam for {course.name} scheduled on {exam_date}.",
    }

def get_faculty(dept=None):
    """
    List faculty members, optionally filtered by department.
    """
    from college.models import Faculty
    
    qs = Faculty.objects.all()
    if dept:
        qs = qs.filter(department__iexact=dept)

    return [
        {
            "id":           f.id,
            "name":         f.name,
            "department":   f.department,
            "email":        f.email,
            "joining_date": str(f.joining_date),
        }
        for f in qs
    ]


def add_faculty(name, dept, email):
    """
    Add a new faculty member.
    """
    from college.models import Faculty
    
    if Faculty.objects.filter(email__iexact=email).exists():
        return {"error": f"Faculty with email {email} already exists."}

    faculty = Faculty.objects.create(
        name=name,
        department=dept.upper(),
        email=email,
    )
    return {
        "status":     "created",
        "id":         faculty.id,
        "name":       faculty.name,
        "department": faculty.department,
        "email":      faculty.email,
    }


def assign_subject(faculty_name, subject):
    """
    Assign an existing course (subject) to a faculty member by name.
    Looks up faculty and course by name (case-insensitive).
    """
    from college.models import Faculty, Course
    
    try:
        faculty = Faculty.objects.get(name__iexact=faculty_name)
    except Faculty.DoesNotExist:
        return {"error": f"Faculty '{faculty_name}' not found."}
    except Faculty.MultipleObjectsReturned:
        return {"error": f"Multiple faculty found with name '{faculty_name}'. Be more specific."}

    try:
        course = Course.objects.get(name__iexact=subject)
    except Course.DoesNotExist:
        return {"error": f"Course '{subject}' not found."}
    except Course.MultipleObjectsReturned:
        # Take the first one if duplicates exist
        course = Course.objects.filter(name__iexact=subject).first()

    course.faculty = faculty
    course.save()
    return {
        "status":  "assigned",
        "faculty": faculty.name,
        "course":  course.name,
        "dept":    course.department,
    }


def get_workload():
    """
    Return each faculty member's course count (workload).
    """
    from college.models import Faculty
    from django.db.models import Count
    
    faculty_list = Faculty.objects.annotate(course_count=Count('courses'))
    return [
        {
            "name":         f.name,
            "department":   f.department,
            "course_count": f.course_count,
        }
        for f in faculty_list
    ]

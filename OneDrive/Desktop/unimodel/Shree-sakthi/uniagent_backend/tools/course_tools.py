def get_courses(dept=None, semester=None):
    """
    List courses filtered by optional department and/or semester.
    """
    from college.models import Course
    
    qs = Course.objects.select_related('faculty').all()
    if dept:
        qs = qs.filter(department__iexact=dept)
    if semester:
        qs = qs.filter(semester=int(semester))

    return [
        {
            "id":         c.id,
            "name":       c.name,
            "department": c.department,
            "semester":   c.semester,
            "credits":    c.credits,
            "faculty":    c.faculty.name if c.faculty else "Unassigned",
        }
        for c in qs
    ]


def create_course(name, dept, semester, credits=3):
    """
    Create a new course. Returns the created course dict.
    """
    from college.models import Course
    
    if Course.objects.filter(name__iexact=name, department__iexact=dept, semester=int(semester)).exists():
        return {"error": f"Course '{name}' for {dept} Sem {semester} already exists."}

    course = Course.objects.create(
        name=name,
        department=dept.upper(),
        semester=int(semester),
        credits=int(credits),
    )
    return {
        "status":     "created",
        "id":         course.id,
        "name":       course.name,
        "department": course.department,
        "semester":   course.semester,
        "credits":    course.credits,
    }

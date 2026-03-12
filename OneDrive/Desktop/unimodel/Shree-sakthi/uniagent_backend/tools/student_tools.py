def get_students(dept=None, year=None, gpa_above=None):
    """
    Fetch students filtered by optional department, year, and minimum GPA.
    Returns a list of student dicts.
    """
    from college.models import Student
    
    qs = Student.objects.all()
    if dept:
        qs = qs.filter(department__iexact=dept)
    if year:
        qs = qs.filter(year=int(year))
    if gpa_above is not None:
        qs = qs.filter(gpa__gte=float(gpa_above))

    return [
        {
            "roll_no":    s.roll_no,
            "name":       s.name,
            "department": s.department,
            "year":       s.year,
            "gpa":        float(s.gpa),
            "email":      s.email,
        }
        for s in qs
    ]


def enroll_student(name, dept, year, email, roll_no=None):
    """
    Enroll a new student. roll_no is auto-generated if not provided.
    Returns the created student dict.
    """
    from college.models import Student
    
    if not roll_no:
        # Auto-generate: dept + highest existing roll number + 1
        last = Student.objects.filter(department__iexact=dept).order_by('-roll_no').first()
        if last:
            try:
                num = int(last.roll_no.replace(dept.upper(), '')) + 1
            except ValueError:
                num = 1
        else:
            num = 1
        roll_no = f"{dept.upper()}{num:04d}"

    student = Student.objects.create(
        name=name,
        roll_no=roll_no,
        department=dept.upper(),
        year=int(year),
        email=email,
    )
    return {
        "status":  "enrolled",
        "roll_no": student.roll_no,
        "name":    student.name,
        "dept":    student.department,
        "year":    student.year,
        "email":   student.email,
    }


def update_student(roll_no, field, value):
    """
    Update a single field of a student record.
    Allowed fields: name, department, year, gpa, email
    """
    from college.models import Student
    
    allowed = {'name', 'department', 'year', 'gpa', 'email'}
    if field not in allowed:
        return {"error": f"Field '{field}' is not updatable. Allowed: {allowed}"}

    try:
        student = Student.objects.get(roll_no=roll_no)
    except Student.DoesNotExist:
        return {"error": f"No student found with roll_no={roll_no}"}

    if field == 'year':
        value = int(value)
    if field == 'gpa':
        value = float(value)

    setattr(student, field, value)
    student.save()
    return {"status": "updated", "roll_no": roll_no, "field": field, "new_value": value}


def delete_student(roll_no):
    """
    Delete a student by roll_no.
    """
    from college.models import Student
    
    try:
        student = Student.objects.get(roll_no=roll_no)
        name = student.name
        student.delete()
        return {"status": "deleted", "roll_no": roll_no, "name": name}
    except Student.DoesNotExist:
        return {"error": f"No student found with roll_no={roll_no}"}

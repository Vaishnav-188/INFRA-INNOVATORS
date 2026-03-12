from datetime import date


def get_low_attendance(threshold=75, dept=None):
    """
    Return students whose attendance percentage is below the given threshold.
    Aggregates across all their courses for the most recent percentage entry.
    """
    from college.models import Attendance
    
    qs = Attendance.objects.select_related('student', 'course')
    if dept:
        qs = qs.filter(student__department__iexact=dept)

    # Get unique (student, course) → latest percentage
    seen = {}
    for record in qs.order_by('-date'):
        key = (record.student_id, record.course_id)
        if key not in seen:
            seen[key] = record

    # Average per student
    student_avg = {}
    for (student_id, _), record in seen.items():
        pct = float(record.percentage)
        if student_id not in student_avg:
            student_avg[student_id] = {'records': [], 'student': record.student}
        student_avg[student_id]['records'].append(pct)

    result = []
    for sid, data in student_avg.items():
        avg = sum(data['records']) / len(data['records'])
        if avg < float(threshold):
            s = data['student']
            result.append({
                "roll_no":    s.roll_no,
                "name":       s.name,
                "department": s.department,
                "year":       s.year,
                "avg_attendance": round(avg, 2),
            })

    result.sort(key=lambda x: x['avg_attendance'])
    return result


def mark_attendance(roll_no, course_id, status='P'):
    """
    Mark today's attendance for a student in a course.
    status: 'P' (Present), 'A' (Absent), 'L' (Leave)
    """
    from college.models import Student, Course, Attendance
    
    status = status.upper()
    if status not in ('P', 'A', 'L'):
        return {"error": "Invalid status. Use P (Present), A (Absent), or L (Leave)."}

    try:
        student = Student.objects.get(roll_no=roll_no)
    except Student.DoesNotExist:
        return {"error": f"Student with roll_no={roll_no} not found."}

    try:
        course = Course.objects.get(id=int(course_id))
    except Course.DoesNotExist:
        return {"error": f"Course with id={course_id} not found."}

    today = date.today()
    attendance, created = Attendance.objects.get_or_create(
        student=student,
        course=course,
        date=today,
        defaults={'status': status}
    )

    if not created:
        attendance.status = status
        attendance.save()

    # Recalculate percentage for this student-course pair
    total_records = Attendance.objects.filter(student=student, course=course).count()
    present_count = Attendance.objects.filter(student=student, course=course, status='P').count()
    pct = (present_count / total_records * 100) if total_records else 0

    Attendance.objects.filter(student=student, course=course).update(percentage=round(pct, 2))

    return {
        "status":     "marked" if created else "updated",
        "roll_no":    roll_no,
        "course":     course.name,
        "date":       str(today),
        "attendance": status,
        "percentage": round(pct, 2),
    }


def get_student_attendance(roll_no, month=None):
    """
    Get attendance records for a specific student.
    Optionally filter by month (1-12).
    """
    from college.models import Student, Attendance
    
    try:
        student = Student.objects.get(roll_no=roll_no)
    except Student.DoesNotExist:
        return {"error": f"Student with roll_no={roll_no} not found."}

    qs = Attendance.objects.filter(student=student).select_related('course').order_by('-date')
    if month:
        qs = qs.filter(date__month=int(month))

    records = [
        {
            "course":     a.course.name,
            "date":       str(a.date),
            "status":     a.status,
            "percentage": float(a.percentage),
        }
        for a in qs
    ]

    return {
        "student":  student.name,
        "roll_no":  roll_no,
        "records":  records,
        "total":    len(records),
    }

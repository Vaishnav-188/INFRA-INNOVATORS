def get_pass_stats(dept=None):
    """
    Return pass/fail statistics per department (or for a specific dept).
    Pass threshold: marks >= 40% of max_marks.
    """
    from college.models import Result
    
    qs = Result.objects.select_related('student', 'course')
    if dept:
        qs = qs.filter(student__department__iexact=dept)

    stats = {}
    for r in qs:
        d = r.student.department
        if d not in stats:
            stats[d] = {'total': 0, 'pass': 0, 'fail': 0}
        stats[d]['total'] += 1
        threshold = float(r.max_marks) * 0.4
        if float(r.marks) >= threshold:
            stats[d]['pass'] += 1
        else:
            stats[d]['fail'] += 1

    result = []
    for dept_name, counts in stats.items():
        pass_rate = round(counts['pass'] / counts['total'] * 100, 2) if counts['total'] else 0
        result.append({
            "department": dept_name,
            "total_exams": counts['total'],
            "pass":        counts['pass'],
            "fail":        counts['fail'],
            "pass_rate":   pass_rate,
        })

    result.sort(key=lambda x: x['pass_rate'], reverse=True)
    return result


def get_dept_performance():
    """
    Return average GPA and average marks per department.
    """
    from django.db.models import Avg
    from college.models import Student, Result
    
    departments = Student.objects.values_list('department', flat=True).distinct()
    result = []
    for dept in departments:
        students = Student.objects.filter(department=dept)
        avg_gpa  = students.aggregate(avg=Avg('gpa'))['avg'] or 0

        results = Result.objects.filter(student__department=dept)
        avg_marks = results.aggregate(avg=Avg('marks'))['avg'] or 0

        student_count = students.count()
        result.append({
            "department":   dept,
            "student_count": student_count,
            "avg_gpa":       round(float(avg_gpa), 2),
            "avg_marks":     round(float(avg_marks), 2),
        })

    result.sort(key=lambda x: x['avg_marks'], reverse=True)
    return result


def get_enrollment_trends():
    """
    Return enrollment count per year per department.
    Shows how many students are in each year for each dept.
    """
    from college.models import Student
    
    departments = Student.objects.values_list('department', flat=True).distinct()
    result = []
    for dept in departments:
        dept_data = {"department": dept}
        for year in range(1, 5):
            count = Student.objects.filter(department=dept, year=year).count()
            dept_data[f"year_{year}"] = count
        dept_data["total"] = Student.objects.filter(department=dept).count()
        result.append(dept_data)

    result.sort(key=lambda x: x['total'], reverse=True)
    return result

def get_tool_function(name):
    """
    Lazily loads and returns the requested tool function.
    This prevents AppRegistryNotReady errors by avoiding module-level
    imports of Django models before apps are fully loaded.
    """
    from tools.student_tools    import get_students, enroll_student, update_student, delete_student
    from tools.faculty_tools    import get_faculty, add_faculty, assign_subject, get_workload
    from tools.attendance_tools import get_low_attendance, mark_attendance, get_student_attendance
    from tools.exam_tools       import get_top_students, record_marks, schedule_exam
    from tools.course_tools     import get_courses, create_course
    from tools.analytics_tools  import get_pass_stats, get_dept_performance, get_enrollment_trends

    TOOL_FUNCTIONS = {
        # Student
        "get_students":           get_students,
        "enroll_student":         enroll_student,
        "update_student":         update_student,
        "delete_student":         delete_student,
        # Faculty
        "get_faculty":            get_faculty,
        "add_faculty":            add_faculty,
        "assign_subject":         assign_subject,
        "get_workload":           get_workload,
        # Attendance
        "get_low_attendance":     get_low_attendance,
        "mark_attendance":        mark_attendance,
        "get_student_attendance": get_student_attendance,
        # Exam
        "get_top_students":       get_top_students,
        "record_marks":           record_marks,
        "schedule_exam":          schedule_exam,
        # Course
        "get_courses":            get_courses,
        "create_course":          create_course,
        # Analytics
        "get_pass_stats":         get_pass_stats,
        "get_dept_performance":   get_dept_performance,
        "get_enrollment_trends":  get_enrollment_trends,
    }
    
    return TOOL_FUNCTIONS.get(name)

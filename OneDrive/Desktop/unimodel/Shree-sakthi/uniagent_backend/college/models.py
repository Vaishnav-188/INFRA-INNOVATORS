from django.db import models


class Student(models.Model):
    DEPT_CHOICES = [
        ('CSE',  'Computer Science & Engineering'),
        ('ECE',  'Electronics & Communication Engineering'),
        ('MECH', 'Mechanical Engineering'),
        ('IT',   'Information Technology'),
        ('CIVIL','Civil Engineering'),
    ]
    YEAR_CHOICES = [(i, f'Year {i}') for i in range(1, 5)]

    name       = models.CharField(max_length=200)
    roll_no    = models.CharField(max_length=20, unique=True)
    department = models.CharField(max_length=10, choices=DEPT_CHOICES)
    year       = models.IntegerField(choices=YEAR_CHOICES)
    gpa        = models.DecimalField(max_digits=4, decimal_places=2, default=0.00)
    email      = models.EmailField(unique=True)
    join_date  = models.DateField(auto_now_add=True)

    class Meta:
        db_table = 'students'
        ordering = ['roll_no']

    def __str__(self):
        return f"{self.roll_no} — {self.name}"


class Faculty(models.Model):
    DEPT_CHOICES = Student.DEPT_CHOICES

    name         = models.CharField(max_length=200)
    department   = models.CharField(max_length=10, choices=DEPT_CHOICES)
    email        = models.EmailField(unique=True)
    joining_date = models.DateField(auto_now_add=True)

    class Meta:
        db_table = 'faculty'
        ordering  = ['name']

    def __str__(self):
        return self.name


class Course(models.Model):
    DEPT_CHOICES = Student.DEPT_CHOICES

    name       = models.CharField(max_length=200)
    department = models.CharField(max_length=10, choices=DEPT_CHOICES)
    semester   = models.IntegerField()
    credits    = models.IntegerField(default=3)
    faculty    = models.ForeignKey(
        Faculty, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='courses'
    )

    class Meta:
        db_table = 'courses'
        ordering = ['department', 'semester']

    def __str__(self):
        return f"{self.name} ({self.department} Sem {self.semester})"


class Attendance(models.Model):
    STATUS_CHOICES = [('P', 'Present'), ('A', 'Absent'), ('L', 'Leave')]

    student    = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='attendance')
    course     = models.ForeignKey(Course,  on_delete=models.CASCADE, related_name='attendance')
    date       = models.DateField()
    status     = models.CharField(max_length=1, choices=STATUS_CHOICES, default='P')
    percentage = models.DecimalField(max_digits=5, decimal_places=2, default=0.00)

    class Meta:
        db_table = 'attendance'
        unique_together = ('student', 'course', 'date')
        ordering = ['-date']

    def __str__(self):
        return f"{self.student.roll_no} | {self.course.name} | {self.date} | {self.status}"


class Result(models.Model):
    EXAM_CHOICES = [
        ('MID1',  'Mid Term 1'),
        ('MID2',  'Mid Term 2'),
        ('FINAL', 'Final Exam'),
        ('LAB',   'Lab Exam'),
    ]

    student   = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='results')
    course    = models.ForeignKey(Course,  on_delete=models.CASCADE, related_name='results')
    exam_type = models.CharField(max_length=10, choices=EXAM_CHOICES)
    marks     = models.DecimalField(max_digits=5, decimal_places=2)
    max_marks = models.DecimalField(max_digits=5, decimal_places=2, default=100)
    date      = models.DateField()

    class Meta:
        db_table = 'results'
        unique_together = ('student', 'course', 'exam_type')
        ordering = ['-date']

    def __str__(self):
        return f"{self.student.roll_no} | {self.course.name} | {self.exam_type} | {self.marks}/{self.max_marks}"

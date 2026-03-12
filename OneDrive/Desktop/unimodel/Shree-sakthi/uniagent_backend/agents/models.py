from django.db import models


class Agent(models.Model):
    DOMAIN_CHOICES = [
        ('student',    'Student'),
        ('faculty',    'Faculty'),
        ('attendance', 'Attendance'),
        ('exam',       'Exam'),
        ('course',     'Course'),
        ('analytics',  'Analytics'),
    ]

    name          = models.CharField(max_length=200)
    description   = models.TextField(blank=True)
    domain        = models.CharField(max_length=50, choices=DOMAIN_CHOICES)
    system_prompt = models.TextField()
    created_at    = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        db_table = 'agents'

    def __str__(self):
        return f"{self.name} ({self.domain})"

from django.db import models

class Specialty(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    def __str__(self):
        return self.name

    class Meta:
        verbose_name = 'Chuyên khoa'
        verbose_name_plural = 'Chuyên khoa'

class Schedule(models.Model):
    DAY_CHOICES = [
        (0, 'Thứ 2'), (1, 'Thứ 3'), (2, 'Thứ 4'),
        (3, 'Thứ 5'), (4, 'Thứ 6'), (5, 'Thứ 7'), (6, 'Chủ nhật'),
    ]
    doctor = models.ForeignKey('accounts.Doctor', on_delete=models.CASCADE, related_name='schedules')
    day_of_week = models.IntegerField(choices=DAY_CHOICES)
    start_time = models.TimeField()
    end_time = models.TimeField()
    is_available = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.doctor} - {self.get_day_of_week_display()}"

    class Meta:
        unique_together = ['doctor', 'day_of_week', 'start_time']

class Appointment(models.Model):
    STATUS = [
        ('pending', 'Chờ xác nhận'),
        ('confirm', 'Đã xác nhận'),
        ('complete', 'Hoàn thành'),
        ('cancelled', 'Đã hủy')
    ]
    patient = models.ForeignKey('accounts.Patient', on_delete=models.CASCADE, related_name='appointments')
    doctor = models.ForeignKey('accounts.Doctor', on_delete=models.CASCADE, related_name='appointments')
    scheduled_at = models.TimeField()
    status = models.CharField(max_length=10, choices=STATUS, default='pending')
    symptoms = models.TextField(blank=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.patient} - {self.doctor} lúc {self.schedule_at}"

    class Meta:
        ordering = ['-scheduled_at']
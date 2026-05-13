from django.contrib.auth.models import AbstractUser
from django.db import models
from cloudinary.models import CloudinaryField

class User(AbstractUser):
    ROLE = [
        ('doctor', 'bác sĩ'),
        ('patient', 'bệnh nhân'),
        ('staff', 'nhân viên'),
        ('admin', 'quản trị viên')
    ]
    role = models.CharField(max_length=10, choices=ROLE, default='patient')
    phone = models.CharField(max_length=11, blank=True)
    avatar = CloudinaryField(null=True)

    def __str__(self):
        return f"{self.username} ({self.role})"

class Doctor(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='doctor')
    specialty = models.ForeignKey('appointments.Specialty', on_delete=models.SET_NULL, null=True, related_name='doctor')
    bio = models.TextField(blank=True)
    consultation_fee = models.DecimalField(max_digits=10, decimal_places=2, default=0)

    def __str__(self):
        return f"Bác sĩ: {self.user.get_full_name()}"

class Patient(models.Model):
    GENDERS = [
        ('M', 'Nam'),
        ('F', 'Nữ')
    ]
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='patient')
    dob = models.DateField(null=True, blank=True)
    gender = models.CharField(max_length=1, choices=GENDERS, blank=True)
    blood_type = models.CharField(max_length=5, blank=True)
    address = models.TextField(blank=True)
    emergency_contact = models.CharField(max_length=100, blank=True)

    def __str__(self):
        return f"Bệnh nhân: {self.user.get_full_name()}"
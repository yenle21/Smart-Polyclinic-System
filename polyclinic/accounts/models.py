from cloudinary.models import CloudinaryField
from django.contrib.auth.models import AbstractUser
from django.db import models

# Create your models here.
class BaseModel(models.Model):
    active = models.BooleanField(default=True)
    created_date = models.DateTimeField(auto_now_add=True)
    updated_date = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True

class User(AbstractUser):
    ROLE_CHOICES = [
        ('patient', 'Bệnh nhân'),
        ('doctor', 'Bác sĩ'),
        ('staff', 'Nhân viên'),
        ('admin', 'Quản trị viên'),
    ]

    avatar = CloudinaryField(null=True)
    phone = models.CharField(max_length=15, null=True)
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='patient')

    def __str__(self):
        return self.username

class Patient(BaseModel):
    GENDER_CHOICES = [
        ('male',   'Nam'),
        ('female', 'Nữ'),
        ('other',  'Khác'),
    ]

    user       = models.OneToOneField(User, on_delete=models.CASCADE, related_name='patient_profile')
    full_name  = models.CharField(max_length=100)
    dob        = models.DateField(null=True)
    gender     = models.CharField(max_length=10, choices=GENDER_CHOICES, null=True)
    address    = models.TextField(null=True)

    def __str__(self):
        return self.full_name


class Specialty(BaseModel):
    name        = models.CharField(max_length=100, unique=True)
    description = models.TextField(null=True)


    def __str__(self):
        return self.name


class Doctor(BaseModel):
    user             = models.OneToOneField(User, on_delete=models.CASCADE, related_name='doctor_profile')
    degree           = models.CharField(max_length=100, null=True)
    bio              = models.TextField(null=True)
    consultation_fee = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    specialty        = models.ForeignKey(Specialty, on_delete=models.PROTECT, related_name='doctors') # related_name='doctors': Lấy tất cả bác sĩ của chuyên khoa.
    # PROTECT là không cho xóa chuyên khoa, nếu còn bác sĩ thuộc chuyên khoa đó
    def __str__(self):
        return self.user.get_full_name()
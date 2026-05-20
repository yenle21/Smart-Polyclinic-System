from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from .models import Doctor, Patient, User


class DoctorAdmin(admin.ModelAdmin):
    list_display  = ['pk','__str__', 'specialty', 'consultation_fee', 'active']  # Hiển thị cột
    search_fields = ['user__first_name', 'user__last_name']                 # Ô tìm kiếm
    list_filter   = ['specialty', 'active']                                 # Bộ lọc bên phải
class PatientAdmin(admin.ModelAdmin):
    list_display = ['pk','full_name','gender','dob','address', 'active']
class CustomUserAdmin(UserAdmin):
    fieldsets = UserAdmin.fieldsets + (
        ('Thông tin thêm', {'fields': ('role',)}),
    )
    add_fieldsets = UserAdmin.add_fieldsets + (
        ('Thông tin thêm', {'fields': ('role',)}),
    )

# Register your models here.

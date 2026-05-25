from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from .models import Doctor, Patient, User


class DoctorAdmin(admin.ModelAdmin):
    list_display = ['user', 'degree', 'get_specialties']  # thay 'specialty'
    list_filter = ['specialties']  # ManyToMany dùng được trong list_filter
    filter_horizontal = ['specialties']
    def get_specialties(self, obj):
        return ", ".join([s.name for s in obj.specialties.all()])
    get_specialties.short_description = "Chuyên khoa"# Bộ lọc bên phải

class PatientAdmin(admin.ModelAdmin):
    list_display = ['user', 'full_name']

class DoctorInline(admin.StackedInline):
    model = Doctor
    pk_name = 'user'

class PatientInline(admin.StackedInline):
    model = Patient
    pk_name = 'user'

class CustomUserAdmin(UserAdmin):
    inlines = [DoctorInline, PatientInline]
    fieldsets = UserAdmin.fieldsets + (
        ('Thông tin thêm', {'fields': ('role',)}),
    )
    add_fieldsets = UserAdmin.add_fieldsets + (
        ('Thông tin thêm', {'fields': ('role',)}),
    )
class SpecialtyAdmin(admin.ModelAdmin):
    list_display = ('name','description')

# Register your models here.

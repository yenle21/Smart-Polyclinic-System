from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User, Patient, Doctor


class CustomUserAdmin(UserAdmin):
    list_display = ['username', 'email', 'full_name', 'role', 'phone', 'is_active', 'date_joined']
    list_filter = ['role', 'is_active', 'is_staff']
    search_fields = ['username', 'email', 'first_name', 'last_name', 'phone']
    ordering = ['-date_joined']
    list_per_page = 20

    fieldsets = UserAdmin.fieldsets + (
        ('Thông tin thêm', {
            'fields': ('role', 'phone', 'avatar')
        }),
    )
    add_fieldsets = UserAdmin.add_fieldsets + (
        ('Thông tin thêm', {
            'fields': ('role', 'phone', 'avatar')
        }),
    )

    def full_name(self, obj):
        return obj.get_full_name() or '---'
    full_name.short_description = 'Họ tên'


class PatientAdmin(admin.ModelAdmin):
    list_display = ['full_name', 'gender', 'blood_type', 'phone', 'address']
    list_filter = ['gender', 'blood_type']
    search_fields = ['user__first_name', 'user__last_name', 'user__email']
    list_per_page = 20

    def full_name(self, obj):
        return obj.user.get_full_name()
    full_name.short_description = 'Họ tên'

    def phone(self, obj):
        return obj.user.phone
    phone.short_description = 'Số điện thoại'


class DoctorAdmin(admin.ModelAdmin):
    list_display = ['full_name', 'specialty', 'get_license', 'get_experience', 'consultation_fee', 'phone']
    list_filter = ['specialty']
    search_fields = ['user__first_name', 'user__last_name']
    list_per_page = 20

    def full_name(self, obj):
        return obj.user.get_full_name()
    full_name.short_description = 'Họ tên'

    def phone(self, obj):
        return obj.user.phone
    phone.short_description = 'Số điện thoại'

    def get_license(self, obj):
        return obj.license_number
    get_license.short_description = 'Số giấy phép'

    def get_experience(self, obj):
        return f"{obj.experience_years} năm"
    get_experience.short_description = 'Kinh nghiệm'
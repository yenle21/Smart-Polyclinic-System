from django.contrib import admin
from django.utils.html import format_html
from .models import Specialty, Schedule, Appointment


class SpecialtyAdmin(admin.ModelAdmin):
    list_display = ['name', 'doctor_count', 'description']
    search_fields = ['name']

    def doctor_count(self, obj):
        count = obj.doctors.count()
        return format_html('<b>{}</b> bác sĩ', count)
    doctor_count.short_description = 'Số bác sĩ'


class ScheduleAdmin(admin.ModelAdmin):
    list_display = ['doctor', 'get_day', 'start_time', 'end_time', 'is_available']
    list_filter = ['day_of_week', 'is_available']
    search_fields = ['doctor__user__first_name', 'doctor__user__last_name']
    list_per_page = 20

    def get_day(self, obj):
        return obj.get_day_of_week_display()
    get_day.short_description = 'Thứ'


class AppointmentAdmin(admin.ModelAdmin):
    list_display = ['id', 'patient_name', 'doctor_name', 'specialty', 'scheduled_at', 'status_badge', 'created_at']
    list_filter = ['status', 'scheduled_at', 'doctor__specialty']
    search_fields = [
        'patient__user__first_name', 'patient__user__last_name',
        'doctor__user__first_name', 'doctor__user__last_name',
    ]
    ordering = ['-scheduled_at']
    list_per_page = 20
    date_hierarchy = 'scheduled_at'

    def patient_name(self, obj):
        return obj.patient.user.get_full_name()
    patient_name.short_description = 'Bệnh nhân'

    def doctor_name(self, obj):
        return f"BS. {obj.doctor.user.get_full_name()}"
    doctor_name.short_description = 'Bác sĩ'

    def specialty(self, obj):
        return obj.doctor.specialty.name
    specialty.short_description = 'Chuyên khoa'

    def status_badge(self, obj):
        colors = {
            'pending': '#f59e0b',
            'confirmed': '#3b82f6',
            'completed': '#10b981',
            'cancelled': '#ef4444',
        }
        labels = {
            'pending': 'Chờ xác nhận',
            'confirmed': 'Đã xác nhận',
            'completed': 'Hoàn thành',
            'cancelled': 'Đã hủy',
        }
        color = colors.get(obj.status, '#gray')
        label = labels.get(obj.status, obj.status)
        return format_html(
            '<span style="background:{};color:white;padding:3px 10px;border-radius:12px;font-size:11px">{}</span>',
            color, label
        )
    status_badge.short_description = 'Trạng thái'
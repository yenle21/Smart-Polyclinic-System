from django.contrib import admin
from .models import Schedule, Appointment, Notification, MedicalRecord, TestResult


class ScheduleAdmin(admin.ModelAdmin):
    list_display  = ['doctor', 'work_date', 'start_time', 'end_time', 'max_slots', 'available_slots']
    list_filter   = ['work_date', 'doctor']
    search_fields = ['doctor__user__first_name', 'doctor__user__last_name']
    ordering      = ['work_date', 'start_time']


class AppointmentAdmin(admin.ModelAdmin):
    list_display  = ['patient', 'schedule', 'appointment_time', 'type', 'status']
    list_filter   = ['status', 'type', 'schedule__work_date']
    search_fields = ['patient__full_name', 'schedule__doctor__user__first_name']
    ordering      = ['schedule__work_date', 'appointment_time']


class NotificationAdmin(admin.ModelAdmin):
    list_display  = ['user', 'type', 'title', 'is_read', 'created_date']
    list_filter   = ['type', 'is_read']
    search_fields = ['user__username', 'title']
    ordering      = ['-created_date']


class MedicalRecordAdmin(admin.ModelAdmin):
    list_display  = ['appointment', 'diagnosis', 'follow_up', 'created_date']
    search_fields = ['appointment__patient__full_name', 'diagnosis']
    ordering      = ['-created_date']


class TestResultAdmin(admin.ModelAdmin):
    list_display  = ['name', 'type', 'medical_record', 'tested_at']
    list_filter   = ['type']
    search_fields = ['name', 'medical_record__appointment__patient__full_name']
    ordering      = ['-tested_at']


admin.site.register(Schedule,      ScheduleAdmin)
admin.site.register(Appointment,   AppointmentAdmin)
admin.site.register(Notification,  NotificationAdmin)
admin.site.register(MedicalRecord, MedicalRecordAdmin)
admin.site.register(TestResult,    TestResultAdmin)
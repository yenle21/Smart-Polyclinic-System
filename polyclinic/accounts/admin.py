from django.contrib import admin

from .models import Doctor, Patient


class DoctorAdmin(admin.ModelAdmin):
    list_display  = ['pk','__str__', 'specialty', 'consultation_fee', 'active']  # Hiển thị cột
    search_fields = ['user__first_name', 'user__last_name']                 # Ô tìm kiếm
    list_filter   = ['specialty', 'active']                                 # Bộ lọc bên phải
class PatientAdmin(admin.ModelAdmin):
    list_display = ['pk','full_name','gender','dob','address', 'active']

# Register your models here.
admin.site.register(Doctor, DoctorAdmin)
admin.site.register(Patient, PatientAdmin)

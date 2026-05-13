from django.contrib import admin
from django.contrib.admin import AdminSite
from django.shortcuts import render
from django.urls import path
from django.db.models import Count
from django.utils import timezone

from accounts.models import User, Doctor, Patient
from accounts.admin import CustomUserAdmin, PatientAdmin, DoctorAdmin
from appointments.models import Specialty, Schedule, Appointment
from appointments.admin import SpecialtyAdmin, ScheduleAdmin, AppointmentAdmin
from medical_records.models import MedicalRecord, Prescription
from medical_records.admin import MedicalRecordAdmin, PrescriptionAdmin
from pharmacy.models import Medicine, Inventory, Category, StockTransaction
from pharmacy.admin import MedicineAdmin, InventoryAdmin, StockTransactionAdmin
from billing.models import Invoice, ServiceFee
from billing.admin import InvoiceAdmin
from reports.models import Report
from reports.admin import ReportAdmin


class PolyclinicAdminSite(AdminSite):
    site_header = '🏥 Polyclinic Admin Dashboard'
    site_title = 'Polyclinic Admin'
    index_title = 'Dashboard'

    def get_urls(self):
        urls = super().get_urls()
        custom_urls = [
            path('stats/', self.admin_stats_view, name='admin_stats'),
            path('today-appointments/', self.today_appointments_view, name='today_appointments'),
        ]
        return custom_urls + urls

    def admin_stats_view(self, request):
        today = timezone.now().date()
        stats = {
            'total_users': User.objects.count(),
            'total_patients': Patient.objects.count(),
            'total_doctors': Doctor.objects.count(),
            'today_appointments': Appointment.objects.filter(scheduled_at__date=today).count(),
            'pending_appointments': Appointment.objects.filter(status='pending').count(),
            'confirmed_appointments': Appointment.objects.filter(status='confirmed').count(),
            'appointments_by_status': dict(
                Appointment.objects.values('status').annotate(count=Count('id'))
            ),
        }
        return render(request, 'admin/polyclinic_stats.html', {'stats': stats})

    def today_appointments_view(self, request):
        today = timezone.now().date()
        appointments = Appointment.objects.filter(
            scheduled_at__date=today
        ).select_related('patient__user', 'doctor__user').order_by('scheduled_at')
        return render(request, 'admin/today_appointments.html', {
            'appointments': appointments,
            'today': today
        })


admin_site = PolyclinicAdminSite(name='polyclinic_admin')

# Accounts
admin_site.register(User, CustomUserAdmin)
admin_site.register(Patient, PatientAdmin)
admin_site.register(Doctor, DoctorAdmin)

# Appointments
admin_site.register(Specialty, SpecialtyAdmin)
admin_site.register(Schedule, ScheduleAdmin)
admin_site.register(Appointment, AppointmentAdmin)

# Medical Records
admin_site.register(MedicalRecord, MedicalRecordAdmin)
admin_site.register(Prescription, PrescriptionAdmin)

# Pharmacy
admin_site.register(Category)
admin_site.register(Medicine, MedicineAdmin)
admin_site.register(Inventory, InventoryAdmin)
admin_site.register(StockTransaction, StockTransactionAdmin)

# Billing
admin_site.register(Invoice, InvoiceAdmin)
admin_site.register(ServiceFee)

# Reports
admin_site.register(Report, ReportAdmin)
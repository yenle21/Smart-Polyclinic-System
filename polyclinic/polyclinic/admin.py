from datetime import date
from django.contrib import admin
from django.db import models as db_models
from django.db.models import Count, Sum, F, Q, ExpressionWrapper, IntegerField
from django.db.models.functions import TruncMonth, Coalesce, ExtractYear
from django.template.response import TemplateResponse
from django.urls import path
from django.utils import timezone

from accounts.models import User, Doctor, Patient, Specialty
from appointments.models import Schedule, Appointment, Notification, MedicalRecord, TestResult
from pharmacy.models import Category, Medicine, Inventory, StockTransaction, Prescription, PrescriptionItem
from billing.models import Invoice
from dashboard.models import Report

from accounts.admin import CustomUserAdmin, DoctorAdmin, PatientAdmin, SpecialtyAdmin
from appointments.admin import ScheduleAdmin, AppointmentAdmin, NotificationAdmin, MedicalRecordAdmin, TestResultAdmin
from pharmacy.admin import (
    CategoryModelAdmin, MedicineModelAdmin, InventoryModelAdmin,
    StockTransactionModelAdmin, PrescriptionModelAdmin
)
from billing.admin import InvoiceModelAdmin
from dashboard.admin import ReportModelAdmin

class PolyclinicAdminSite(admin.AdminSite):
    site_header = '🏥 Smart Polyclinic Admin'
    site_title = 'Polyclinic Admin'
    index_title = 'Bảng điều khiển'

    def get_urls(self):
        return [
            path('stats/', self.admin_view(self.dashboard_stats_view), name='stats'),
        ] + super().get_urls()


    def dashboard_stats_view(self, request):
        current_tab = request.GET.get('tab', 'patient')

        context = {
            **self.each_context(request),
            'current_tab': current_tab,
        }

        if current_tab == 'patient':
            context['title'] = "Thống kê Bệnh nhân"
            context.update(self.get_patient_stats())
            template_name = "patient.html"

        elif current_tab == 'service':
            context['title'] = "Thống kê Dịch vụ & Thuốc"
            context.update(self.get_service_stats())
            template_name = "service.html"

        elif current_tab == 'disease':
            context['title'] = "Thống kê Bệnh lý dịch tễ"
            context.update(self.get_disease_stats())
            template_name = "disease.html"

        elif current_tab == 'revenue':
            context['title'] = "Báo cáo Doanh thu"
            context.update(self.get_revenue_stats())
            template_name = "revenue.html"
        else:
            template_name = "patient.html"


        return TemplateResponse(request, template_name, context)

    def get_patient_stats(self):
        current_year = timezone.now().year

        gender_stats = Patient.objects.values('gender').annotate(count=Count('id')).order_by('gender')
        GENDER_MAP = {'male': 'Nam', 'female': 'Nữ', None: 'Chưa rõ'}

        age_groups_query = Patient.objects.exclude(dob=None).annotate(
            age=ExpressionWrapper(current_year - ExtractYear('dob'), output_field=IntegerField())
        ).aggregate(
            group_0_17=Count('id', filter=Q(age__lt=18)),
            group_18_30=Count('id', filter=Q(age__gte=18, age__lte=30)),
            group_31_45=Count('id', filter=Q(age__gte=31, age__lte=45)),
            group_46_60=Count('id', filter=Q(age__gte=46, age__lte=60)),
            group_60_plus=Count('id', filter=Q(age__gt=60))
        )

        age_labels = ['0-17', '18-30', '31-45', '46-60', '60+']
        age_data = [
            age_groups_query['group_0_17'],
            age_groups_query['group_18_30'],
            age_groups_query['group_31_45'],
            age_groups_query['group_46_60'],
            age_groups_query['group_60_plus']
        ]

        specialty_stats = Specialty.objects.annotate(
            count=Count('doctors__schedules__appointments__patient', distinct=True)
        ).values('name', 'count').order_by('-count')

        return {
            'gender_labels': [GENDER_MAP.get(g['gender'], 'Chưa rõ') for g in gender_stats],
            'gender_data': [g['count'] for g in gender_stats],
            'age_labels': age_labels,
            'age_data': age_data,
            'specialty_labels': [s['name'] for s in specialty_stats],
            'specialty_data': [s['count'] for s in specialty_stats],
            'total_patients': Patient.objects.count(),
        }

    def get_service_stats(self):
        type_stats = Appointment.objects.values('type').annotate(count=Count('id'))
        TYPE_MAP = {'offline': 'Khám trực tiếp', 'online': 'Khám trực tuyến'}

        specialty_appt = Specialty.objects.annotate(
            count=Count('doctors__schedules__appointments', distinct=True)
        ).values('name', 'count').order_by('-count')

        test_stats = TestResult.objects.values('type').annotate(count=Count('id')).order_by('-count')
        TEST_MAP = {
            'blood': 'Xét nghiệm máu', 'urine': 'Nước tiểu', 'xray': 'X-Quang',
            'mri': 'MRI', 'ct': 'CT Scan', 'ultrasound': 'Siêu âm', 'other': 'Khác',
        }


        top_medicines = PrescriptionItem.objects.select_related('medicine').values(
            medicine_name=F('medicine__name')
        ).annotate(total_qty=Sum('quantity')).order_by('-total_qty')[:10]

        return {
            'type_labels': [TYPE_MAP.get(t['type'], t['type']) for t in type_stats],
            'type_data': [t['count'] for t in type_stats],
            'specialty_appt': list(specialty_appt),
            'test_labels': [TEST_MAP.get(t['type'], t['type']) for t in test_stats],
            'test_data': [t['count'] for t in test_stats],
            'top_medicines': list(top_medicines),
            'total_appointments': Appointment.objects.count(),
            'total_completed': Appointment.objects.filter(status='completed').count(),
        }

    def get_disease_stats(self):

        diagnoses = MedicalRecord.objects.exclude(Q(diagnosis='') | Q(diagnosis__isnull=True)).values(
            'diagnosis').annotate(count=Count('id')).order_by('-count')[:15]

        symptoms = MedicalRecord.objects.exclude(Q(symptoms='') | Q(symptoms__isnull=True)).values(
            'symptoms').annotate(count=Count('id')).order_by('-count')[:10]

        current_year = timezone.now().year
        monthly = MedicalRecord.objects.filter(created_date__year=current_year).annotate(
            month=TruncMonth('created_date')).values('month').annotate(count=Count('id')).order_by('month')

        return {
            'diagnoses': list(diagnoses),
            'symptoms': list(symptoms),
            'monthly_labels': [m['month'].strftime('%m/%Y') for m in monthly if m['month']],
            'monthly_data': [m['count'] for m in monthly],
            'total_records': MedicalRecord.objects.count(),
            'current_year': current_year,
        }

    def get_revenue_stats(self):
        paid_invoices = Invoice.objects.filter(status='paid')
        current_year = timezone.now().year

        summary = paid_invoices.aggregate(
            total_revenue=Coalesce(Sum('total_amount'), 0, output_field=db_models.DecimalField()),
            total_consultation=Coalesce(Sum('consultation_fee'), 0, output_field=db_models.DecimalField()),
            total_medicine=Coalesce(Sum('medicine_fee'), 0, output_field=db_models.DecimalField()),
            total_service=Coalesce(Sum('service_fee'), 0, output_field=db_models.DecimalField()),
            total_invoices=Count('id'),
        )

        monthly = paid_invoices.filter(paid_at__year=current_year).annotate(month=TruncMonth('paid_at')).values(
            'month').annotate(revenue=Sum('total_amount')).order_by('month')

        by_method = paid_invoices.values('payment_method').annotate(total=Sum('total_amount'),
                                                                    count=Count('id')).order_by('-total')
        METHOD_MAP = {'cash': 'Tiền mặt', 'transfer': 'Chuyển khoản', 'momo': 'MoMo', 'vnpay': 'VNPay'}

        by_specialty = paid_invoices.values(
            name=F('appointment__schedule__doctor__specialties__name')
        ).annotate(revenue=Sum('total_amount')).exclude(name__isnull=True).order_by('-revenue')[:8]


        top_invoices = paid_invoices.select_related(
            'patient',
            'appointment__schedule__doctor'
        ).order_by('-total_amount')[:10]

        return {
            'summary': summary,
            'monthly_labels': [m['month'].strftime('%m/%Y') for m in monthly if m['month']],
            'monthly_revenue': [float(m['revenue']) for m in monthly],
            'method_labels': [METHOD_MAP.get(m['payment_method'], m['payment_method']) for m in by_method],
            'method_revenue': [float(m['total']) for m in by_method],
            'by_specialty': list(by_specialty),
            'top_invoices': top_invoices,
            'current_year': current_year,
        }


admin_site = PolyclinicAdminSite(name='polyclinic_admin')

# Pharmacy
admin_site.register(Category, CategoryModelAdmin)
admin_site.register(Medicine, MedicineModelAdmin)
admin_site.register(Inventory, InventoryModelAdmin)
admin_site.register(StockTransaction, StockTransactionModelAdmin)
admin_site.register(Prescription, PrescriptionModelAdmin)

# Billing
admin_site.register(Invoice, InvoiceModelAdmin)
# Dashboard/Reports
admin_site.register(Report, ReportModelAdmin)

# Appointment
admin_site.register(Schedule, ScheduleAdmin)
admin_site.register(Appointment, AppointmentAdmin)
admin_site.register(Notification, NotificationAdmin)
admin_site.register(MedicalRecord, MedicalRecordAdmin)
admin_site.register(TestResult, TestResultAdmin)

# Accounts
admin_site.register(Doctor, DoctorAdmin)
admin_site.register(Patient, PatientAdmin)
admin_site.register(User, CustomUserAdmin)
admin_site.register(Specialty, SpecialtyAdmin)
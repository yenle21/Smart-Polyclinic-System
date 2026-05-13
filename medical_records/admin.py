from django.contrib import admin
from .models import MedicalRecord, TestResult, Prescription, PrescriptionItem


class TestResultInline(admin.TabularInline):
    model = TestResult
    extra = 0
    fields = ['test_name', 'result', 'normal_range', 'image']


class PrescriptionItemInline(admin.TabularInline):
    model = PrescriptionItem
    extra = 0
    fields = ['medicine', 'quantity', 'dosage', 'duration_days', 'notes']


class PrescriptionInline(admin.StackedInline):
    model = Prescription
    extra = 0
    fields = ['instructions', 'is_dispensed']


class MedicalRecordAdmin(admin.ModelAdmin):
    list_display = ['id', 'patient_name', 'doctor_name', 'diagnosis_short', 'created_at', 'has_prescription']
    list_filter = ['created_at', 'doctor__specialty']
    search_fields = [
        'patient__user__first_name', 'patient__user__last_name',
        'diagnosis', 'symptoms'
    ]
    ordering = ['-created_at']
    list_per_page = 20
    date_hierarchy = 'created_at'
    inlines = [TestResultInline, PrescriptionInline]

    def patient_name(self, obj):
        return obj.patient.user.get_full_name()
    patient_name.short_description = 'Bệnh nhân'

    def doctor_name(self, obj):
        return f"BS. {obj.doctor.user.get_full_name()}"
    doctor_name.short_description = 'Bác sĩ'

    def diagnosis_short(self, obj):
        return obj.diagnosis[:50] + '...' if len(obj.diagnosis) > 50 else obj.diagnosis
    diagnosis_short.short_description = 'Chẩn đoán'

    def has_prescription(self, obj):
        from django.utils.html import format_html
        has = hasattr(obj, 'prescription')
        return format_html(
            '<span style="color:{}">●</span> {}',
            '#10b981' if has else '#ef4444',
            'Có' if has else 'Không'
        )
    has_prescription.short_description = 'Đơn thuốc'


class PrescriptionAdmin(admin.ModelAdmin):
    list_display = ['id', 'patient_name', 'issued_at', 'item_count', 'is_dispensed']
    list_filter = ['is_dispensed', 'issued_at']
    list_per_page = 20
    inlines = [PrescriptionItemInline]

    def patient_name(self, obj):
        return obj.record.patient.user.get_full_name()
    patient_name.short_description = 'Bệnh nhân'

    def item_count(self, obj):
        return obj.items.count()
    item_count.short_description = 'Số loại thuốc'
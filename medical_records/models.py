from django.db import models
from accounts.models import Patient, Doctor
from appointments.models import Appointment

class MedicalRecord(models.Model):
    appointment = models.OneToOneField(
        Appointment, on_delete=models.CASCADE, related_name='medical_record'
    )
    patient = models.ForeignKey(
        Patient, on_delete=models.CASCADE, related_name='medical_records'
    )
    doctor = models.ForeignKey(
        Doctor, on_delete=models.CASCADE, related_name='medical_records'
    )
    symptoms = models.TextField(verbose_name='Triệu chứng')
    diagnosis = models.TextField(verbose_name='Chẩn đoán')
    notes = models.TextField(verbose_name='Ghi chú', blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Hồ sơ {self.patient} - {self.created_at.strftime('%d/%m/%Y')}"

    class Meta:
        verbose_name = 'Hồ sơ bệnh án'
        verbose_name_plural = 'Hồ sơ bệnh án'
        ordering = ['-created_at']

class TestResult(models.Model):
    record = models.ForeignKey(
        MedicalRecord, on_delete=models.CASCADE, related_name='test_results'
    )
    test_name = models.CharField(max_length=200, verbose_name='Tên xét nghiệm')
    result = models.TextField(verbose_name='Kết quả')
    normal_range = models.CharField(max_length=100, blank=True, verbose_name='Chỉ số bình thường')
    image = models.ImageField(upload_to='test_results/', blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.test_name} - {self.record.test_name} - {self.record.patient}"

    class Meta:
        verbose_name = 'Kết quả xét nghiệm'
        verbose_name_plural = 'Kết quả xét nghiệm'

class Prescription(models.Model):
    record = models.OneToOneField(
        MedicalRecord, on_delete=models.CASCADE, related_name='prescription'
    )
    instructions = models.TextField(verbose_name='Hướng dẫn dùng thuốc', blank=True)
    issued_at = models.DateTimeField(auto_now_add=True)
    is_dispensed = models.BooleanField(default=False, verbose_name='Đã cấp thuốc')

    def __str__(self):
        return f"Đơn thuốc - {self.record.patient} - {self.issued_at.strftime('%d/%m/%Y')}"

    class Meta:
        verbose_name = 'Đơn thuốc'
        verbose_name_plural = 'Đơn thuốc'

class PrescriptionItem(models.Model):
    prescription = models.ForeignKey(
        Prescription, on_delete=models.CASCADE, related_name='items'
    )
    medicine = models.ForeignKey(
        'pharmacy.Medicine', on_delete=models.PROTECT, related_name='prescription_items'
    )
    quantity = models.PositiveIntegerField(verbose_name='Số lượng')
    dosage = models.CharField(max_length=200, verbose_name='Liều dùng')
    duration_days = models.PositiveIntegerField(default=1, verbose_name='Số ngày dùng')
    notes = models.CharField(max_length=200, blank=True, verbose_name='Ghi chú')

    def __str__(self):
        return f"{self.medicine.name} x{self.quantity}"

    class Meta:
        verbose_name = 'Chi tiết đơn thuốc'
        verbose_name_plural = 'Chi tiết đơn thuốc'



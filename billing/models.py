from django.db import models
from accounts.models import Patient
from appointments.models import Appointment


class ServiceFee(models.Model):
    name = models.CharField(max_length=200, verbose_name='Tên dịch vụ')
    price = models.DecimalField(max_digits=10, decimal_places=2, verbose_name='Phí dịch vụ')
    description = models.TextField(blank=True)

    def __str__(self):
        return f"{self.name} - {self.price}đ"

    class Meta:
        verbose_name = 'Phí dịch vụ'
        verbose_name_plural = 'Bảng phí dịch vụ'


class Invoice(models.Model):
    STATUS_CHOICES = [
        ('unpaid', 'Chưa thanh toán'),
        ('paid', 'Đã thanh toán'),
        ('cancelled', 'Đã hủy'),
    ]
    PAYMENT_METHOD_CHOICES = [
        ('cash', 'Tiền mặt'),
        ('transfer', 'Chuyển khoản'),
        ('momo', 'MoMo'),
        ('vnpay', 'VNPay'),
    ]
    patient = models.ForeignKey(
        Patient, on_delete=models.CASCADE, related_name='invoices'
    )
    appointment = models.OneToOneField(
        Appointment, on_delete=models.CASCADE, related_name='invoice'
    )
    consultation_fee = models.DecimalField(
        max_digits=10, decimal_places=2, default=0, verbose_name='Phí khám'
    )
    medicine_fee = models.DecimalField(
        max_digits=10, decimal_places=2, default=0, verbose_name='Phí thuốc'
    )
    service_fee = models.DecimalField(
        max_digits=10, decimal_places=2, default=0, verbose_name='Phí dịch vụ'
    )
    total_amount = models.DecimalField(
        max_digits=10, decimal_places=2, default=0, verbose_name='Tổng tiền'
    )
    status = models.CharField(
        max_length=20, choices=STATUS_CHOICES, default='unpaid'
    )
    payment_method = models.CharField(
        max_length=20, choices=PAYMENT_METHOD_CHOICES, blank=True
    )
    paid_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    notes = models.TextField(blank=True)

    def save(self, *args, **kwargs):
        # Tự động tính tổng tiền
        self.total_amount = self.consultation_fee + self.medicine_fee + self.service_fee
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Hóa đơn #{self.id} - {self.patient} - {self.total_amount}đ"

    class Meta:
        verbose_name = 'Hóa đơn'
        verbose_name_plural = 'Hóa đơn'
        ordering = ['-created_at']


class InvoiceItem(models.Model):
    invoice = models.ForeignKey(
        Invoice, on_delete=models.CASCADE, related_name='items'
    )
    description = models.CharField(max_length=200, verbose_name='Mô tả')
    quantity = models.PositiveIntegerField(default=1)
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    total_price = models.DecimalField(max_digits=10, decimal_places=2)

    def save(self, *args, **kwargs):
        self.total_price = self.quantity * self.unit_price
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.description} x{self.quantity}"

    class Meta:
        verbose_name = 'Chi tiết hóa đơn'
        verbose_name_plural = 'Chi tiết hóa đơn'
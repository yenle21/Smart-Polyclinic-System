from django.db import models
from accounts.models import BaseModel, Patient


class Invoice(BaseModel):
    STATUS_CHOICES = [
        ('unpaid',    'Chưa thanh toán'),
        ('paid',      'Đã thanh toán'),
        ('cancelled', 'Đã hủy'),
    ]
    PAYMENT_METHOD_CHOICES = [
        ('cash',     'Tiền mặt'),
        ('transfer', 'Chuyển khoản'),
        ('momo',     'MoMo'),
        ('vnpay',    'VNPay'),
    ]

    patient          = models.ForeignKey(Patient, on_delete=models.CASCADE,
                                         related_name='invoices')
    appointment      = models.OneToOneField('appointments.Appointment',
                                            on_delete=models.CASCADE,
                                            related_name='invoice')
    consultation_fee = models.DecimalField(max_digits=10, decimal_places=2,
                                           default=0)
    medicine_fee     = models.DecimalField(max_digits=10, decimal_places=2,
                                           default=0)
    service_fee      = models.DecimalField(max_digits=10, decimal_places=2,
                                           default=0)
    total_amount     = models.DecimalField(max_digits=10, decimal_places=2,
                                           default=0)
    status           = models.CharField(max_length=20, choices=STATUS_CHOICES,
                                        default='unpaid')
    payment_method   = models.CharField(max_length=20,
                                        choices=PAYMENT_METHOD_CHOICES,
                                        null=True, blank=True)
    paid_at          = models.DateTimeField(null=True, blank=True)
    notes            = models.TextField(null=True, blank=True)

    def save(self, *args, **kwargs):
        # Tự động tính tổng
        self.total_amount = (
            self.consultation_fee +
            self.medicine_fee +
            self.service_fee
        )
        # Tự động ghi thời gian thanh toán
        if self.status == 'paid' and not self.paid_at:
            from django.utils import timezone
            self.paid_at = timezone.now()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Hóa đơn #{self.id} — {self.patient} — {self.total_amount}đ"

class InvoiceItem(BaseModel):
    """Chi tiết từng dịch vụ trong hóa đơn"""
    invoice     = models.ForeignKey(Invoice, on_delete=models.CASCADE,
                                    related_name='items')
    description = models.CharField(max_length=200, verbose_name='Mô tả dịch vụ')
    quantity    = models.PositiveIntegerField(default=1)
    unit_price  = models.DecimalField(max_digits=10, decimal_places=2,
                                      verbose_name='Đơn giá')
    total_price = models.DecimalField(max_digits=10, decimal_places=2,
                                      verbose_name='Thành tiền')

    def save(self, *args, **kwargs):
        self.total_price = self.quantity * self.unit_price
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.description} x{self.quantity} = {self.total_price}đ"

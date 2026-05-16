from django.db import models
from accounts.models import BaseModel


class Report(BaseModel):
    TYPE_CHOICES = [
        ('revenue',   'Doanh thu'),
        ('patient',   'Bệnh nhân'),
        ('disease',   'Bệnh phổ biến'),
        ('service',   'Dịch vụ'),
        ('inventory', 'Tồn kho'),
    ]

    report_type  = models.CharField(max_length=20, choices=TYPE_CHOICES)
    title        = models.CharField(max_length=200)
    date_from    = models.DateField()
    date_to      = models.DateField()
    created_by   = models.ForeignKey('accounts.User', on_delete=models.SET_NULL,
                                     null=True, related_name='reports')
    # Lưu kết quả dạng JSON để không cần query lại
    data_snapshot = models.JSONField(null=True, blank=True)

    def __str__(self):
        return f"{self.title} ({self.date_from} → {self.date_to})"


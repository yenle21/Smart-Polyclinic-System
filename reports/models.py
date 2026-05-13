from django.db import models


class Report(models.Model):
    TYPE_CHOICES = [
        ('revenue', 'Doanh thu'),
        ('patient', 'Bệnh nhân'),
        ('disease', 'Bệnh phổ biến'),
        ('service', 'Dịch vụ'),
        ('inventory', 'Tồn kho'),
    ]
    report_type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    title = models.CharField(max_length=200)
    date_from = models.DateField()
    date_to = models.DateField()
    created_by = models.ForeignKey(
        'accounts.User', on_delete=models.SET_NULL, null=True
    )
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.title} ({self.date_from} - {self.date_to})"

    class Meta:
        verbose_name = 'Báo cáo'
        verbose_name_plural = 'Báo cáo thống kê'
        ordering = ['-created_at']
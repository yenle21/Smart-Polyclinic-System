from django.db import models
from django.db.models.signals import post_save
from django.dispatch import receiver


class Category(models.Model):
    name = models.CharField(max_length=100, verbose_name='Tên danh mục')
    description = models.TextField(blank=True)

    def __str__(self):
        return self.name

    class Meta:
        verbose_name = 'Danh mục thuốc'
        verbose_name_plural = 'Danh mục thuốc'


class Medicine(models.Model):
    UNIT_CHOICES = [
        ('vien', 'Viên'),
        ('chai', 'Chai'),
        ('hop', 'Hộp'),
        ('ong', 'Ống'),
        ('goi', 'Gói'),
        ('ml', 'ml'),
        ('mg', 'mg'),
    ]
    category = models.ForeignKey(
        Category, on_delete=models.SET_NULL, null=True, related_name='medicines'
    )
    name = models.CharField(max_length=200, verbose_name='Tên thuốc')
    unit = models.CharField(max_length=10, choices=UNIT_CHOICES, verbose_name='Đơn vị')
    price = models.DecimalField(max_digits=10, decimal_places=2, verbose_name='Đơn giá')
    description = models.TextField(blank=True, verbose_name='Mô tả')
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.name} ({self.get_unit_display()})"

    class Meta:
        verbose_name = 'Thuốc'
        verbose_name_plural = 'Danh mục thuốc'


class Inventory(models.Model):
    medicine = models.OneToOneField(
        Medicine, on_delete=models.CASCADE, related_name='inventory'
    )
    quantity = models.PositiveIntegerField(default=0, verbose_name='Số lượng tồn kho')
    min_quantity = models.PositiveIntegerField(default=10, verbose_name='Số lượng tối thiểu')
    expiry_date = models.DateField(verbose_name='Hạn sử dụng')
    updated_at = models.DateTimeField(auto_now=True)

    @property
    def is_low_stock(self):
        return self.quantity <= self.min_quantity

    @property
    def is_expired(self):
        from django.utils import timezone
        return self.expiry_date < timezone.now().date()

    def __str__(self):
        return f"{self.medicine.name} - Tồn: {self.quantity}"

    class Meta:
        verbose_name = 'Tồn kho'
        verbose_name_plural = 'Quản lý tồn kho'


class StockTransaction(models.Model):
    TYPE_CHOICES = [
        ('import', 'Nhập kho'),
        ('export', 'Xuất kho'),
        ('adjust', 'Điều chỉnh'),
    ]
    medicine = models.ForeignKey(
        Medicine, on_delete=models.CASCADE, related_name='transactions'
    )
    transaction_type = models.CharField(max_length=10, choices=TYPE_CHOICES)
    quantity = models.IntegerField(verbose_name='Số lượng')
    note = models.CharField(max_length=200, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.get_transaction_type_display()} {self.medicine.name} x{self.quantity}"

    class Meta:
        verbose_name = 'Giao dịch kho'
        verbose_name_plural = 'Lịch sử giao dịch kho'


# Tự động trừ kho khi PrescriptionItem được tạo
@receiver(post_save, sender='medical_records.PrescriptionItem')
def deduct_stock(sender, instance, created, **kwargs):
    if created:
        inventory = instance.medicine.inventory
        inventory.quantity -= instance.quantity
        inventory.save()
        StockTransaction.objects.create(
            medicine=instance.medicine,
            transaction_type='export',
            quantity=-instance.quantity,
            note=f"Xuất theo đơn thuốc #{instance.prescription.id}"
        )
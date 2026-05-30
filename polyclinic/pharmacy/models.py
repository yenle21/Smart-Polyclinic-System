from cloudinary.models import CloudinaryField
from django.core.exceptions import ObjectDoesNotExist
from django.db import models
from accounts.models import BaseModel


class Category(BaseModel):
    name        = models.CharField(max_length=100)
    description = models.TextField(null=True, blank=True)

    def __str__(self):
        return self.name

    class Meta:

        ordering = ['name']

class Medicine(BaseModel):
    UNIT_CHOICES = [
        ('vien', 'Viên'),
        ('chai', 'Chai'),
        ('hop', 'Hộp'),
        ('ong', 'Ống'),
        ('goi', 'Gói'),
        ('ml', 'ml'),
        ('mg', 'mg'),
    ]
    name        = models.CharField(max_length=200)
    ingredient  = models.CharField(max_length=200, null=True, blank=True)
    unit        = models.CharField(max_length=10, choices=UNIT_CHOICES)
    price       = models.DecimalField(max_digits=10, decimal_places=2)
    image       = CloudinaryField(null=True, blank=True)
    description = models.TextField(null=True, blank=True)
    is_active   = models.BooleanField(default=True)
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, related_name='medicines')

    def __str__(self):
        return f"{self.name} ({self.get_unit_display()})"

class Inventory(BaseModel):
    quantity     = models.PositiveIntegerField(default=0)
    min_quantity = models.PositiveIntegerField(default=10)
    expiry_date  = models.DateField()
    medicine     = models.OneToOneField(Medicine, on_delete=models.CASCADE)

    @property
    def is_low_stock(self):
        return self.quantity <= self.min_quantity

    @property
    def is_expired(self):
        from django.utils import timezone
        return self.expiry_date < timezone.now().date()

    @property
    def days_until_expiry(self):
        from django.utils import timezone
        return (self.expiry_date - timezone.now().date()).days

    def __str__(self):
        return f"{self.medicine.name} — Tồn: {self.quantity}"

class StockTransaction(BaseModel):
    TYPE_CHOICES = [
        ('import', 'Nhập kho'),
        ('export', 'Xuất kho'),
        ('adjust', 'Điều chỉnh'),
    ]

    medicine         = models.ForeignKey(Medicine, on_delete=models.CASCADE,
                                         related_name='transactions')
    transaction_type = models.CharField(max_length=10, choices=TYPE_CHOICES)
    quantity         = models.IntegerField()
    note             = models.CharField(max_length=200, null=True, blank=True)

    def __str__(self):
        return f"{self.get_transaction_type_display()} — {self.medicine.name} x{self.quantity}"

class Prescription(BaseModel):

    instructions   = models.TextField(null=True, blank=True)
    is_dispensed   = models.BooleanField(default=False)
    medical_record = models.OneToOneField('appointments.MedicalRecord',on_delete=models.CASCADE,related_name='prescription')

    def __str__(self):
        try:
            name = self.medical_record.appointment.patient.user.get_full_name()
            return f"Đơn thuốc #{self.id} - {name}"
        except (AttributeError, ObjectDoesNotExist):
            return f"Đơn thuốc #{self.id}"

class PrescriptionItem(BaseModel):

    quantity      = models.PositiveIntegerField()
    dosage        = models.CharField(max_length=200)
    duration_days = models.PositiveIntegerField(default=1)
    notes         = models.CharField(max_length=200, null=True, blank=True)
    prescription = models.ForeignKey(Prescription, on_delete=models.CASCADE, related_name='items')
    medicine = models.ForeignKey(Medicine, on_delete=models.PROTECT, related_name='prescription_items')


    def save(self, *args, **kwargs):
            is_new = self._state.adding
            super().save(*args, **kwargs)

            if is_new:
                inv = self.medicine.inventory
                inv.quantity -= self.quantity
                inv.save()
                StockTransaction.objects.create(
                    medicine=self.medicine,
                    transaction_type='export',
                    quantity=-self.quantity,
                    note=f"Xuất theo đơn thuốc #{self.prescription.id}"
                )

    def __str__(self):
        return f"{self.medicine.name} x{self.quantity}"


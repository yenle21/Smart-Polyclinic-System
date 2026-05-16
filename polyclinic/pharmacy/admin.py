from django.contrib import admin
from django.utils.html import mark_safe, format_html
from django import forms
from .models import Category, Medicine, Inventory, StockTransaction, Prescription, PrescriptionItem


class MedicineForm(forms.ModelForm):
    class Meta:
        model = Medicine
        fields = '__all__'

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields['image'].required       = False
        self.fields['description'].required = False
        self.fields['ingredient'].required  = False


class InventoryInline(admin.StackedInline):
    model  = Inventory
    extra  = 1
    fields = ['quantity', 'min_quantity', 'expiry_date']


class PrescriptionItemInline(admin.TabularInline):
    model  = PrescriptionItem
    extra  = 0
    fields = ['medicine', 'quantity', 'dosage', 'duration_days', 'notes']


class CategoryModelAdmin(admin.ModelAdmin):
    list_display  = ['id', 'name', 'medicine_count']
    search_fields = ['name']

    def medicine_count(self, obj):
        return obj.medicines.count()
    medicine_count.short_description = 'Số loại thuốc'


class MedicineModelAdmin(admin.ModelAdmin):
    form          = MedicineForm
    list_display  = ['id', 'name', 'category', 'unit', 'price',
                     'stock_status', 'expiry_status', 'is_active']
    list_filter   = ['category', 'unit', 'is_active']
    search_fields = ['name', 'ingredient']
    inlines       = [InventoryInline]

    def medicine_image(self, obj):
        if obj.image:
            return mark_safe(f'<img src="{obj.image.url}" width="60" />')
        return '---'
    medicine_image.short_description = 'Hình'

    def stock_status(self, obj):
        try:
            inv = obj.inventory
            if inv.is_low_stock:
                return format_html(
                    '<span style="background:#ef4444;color:white;'
                    'padding:2px 8px;border-radius:10px">⚠ Thấp ({})</span>',
                    inv.quantity
                )
            return format_html(
                '<span style="background:#10b981;color:white;'
                'padding:2px 8px;border-radius:10px">✓ ({})</span>',
                inv.quantity
            )
        except Inventory.DoesNotExist:
            return '---'
    stock_status.short_description = 'Tồn kho'

    def expiry_status(self, obj):
        try:
            inv = obj.inventory
            days = inv.days_until_expiry
            if days < 0:
                return format_html('<span style="color:#ef4444">✗ Hết hạn</span>')
            elif days <= 30:
                return format_html('<span style="color:#f59e0b">⚠ Còn {} ngày</span>', days)
            return format_html('<span style="color:#10b981">✓ {}</span>', inv.expiry_date)
        except Inventory.DoesNotExist:
            return '---'
    expiry_status.short_description = 'Hạn dùng'


class InventoryModelAdmin(admin.ModelAdmin):
    list_display  = ['id', 'medicine', 'quantity', 'min_quantity', 'expiry_date', 'stock_alert']
    list_filter   = ['expiry_date']
    search_fields = ['medicine__name']
    list_editable = ['quantity', 'min_quantity']

    def stock_alert(self, obj):
        if obj.is_low_stock:
            return format_html('<span style="color:#ef4444;font-weight:bold">⚠ Cần nhập thêm</span>')
        return format_html('<span style="color:#10b981">✓ Đủ hàng</span>')
    stock_alert.short_description = 'Cảnh báo'


class StockTransactionModelAdmin(admin.ModelAdmin):
    list_display    = ['id', 'medicine', 'type_badge', 'quantity', 'note', 'created_date']
    list_filter     = ['transaction_type', 'created_date']
    search_fields   = ['medicine__name']
    readonly_fields = ['medicine', 'transaction_type', 'quantity', 'note', 'created_date']

    def type_badge(self, obj):
        colors = {
            'import': '#10b981',
            'export': '#ef4444',
            'adjust': '#f59e0b',
        }
        color = colors.get(obj.transaction_type, '#6b7280')
        label = obj.get_transaction_type_display()
        return format_html(
            '<span style="background:{};color:white;padding:2px 8px;border-radius:10px">{}</span>',
            color,
            label
        )

    type_badge.short_description = 'Loại'
    type_badge.short_description = 'Loại'

    def has_add_permission(self, request):
        return False


class PrescriptionModelAdmin(admin.ModelAdmin):
    list_display  = ['id', 'patient_name', 'doctor_name', 'item_count', 'total_fee', 'is_dispensed', 'created_date']
    list_filter   = ['is_dispensed', 'created_date']
    search_fields = ['medical_record__appointment__patient__user__first_name']
    inlines       = [PrescriptionItemInline]

    def patient_name(self, obj):
        return obj.medical_record.appointment.patient.user.get_full_name()
    patient_name.short_description = 'Bệnh nhân'

    def doctor_name(self, obj):
        return f"BS. {obj.medical_record.appointment.schedule.doctor.user.get_full_name()}"
    doctor_name.short_description = 'Bác sĩ'

    def item_count(self, obj):
        return f"{obj.items.count()} loại"
    item_count.short_description = 'Số thuốc'

    def total_fee(self, obj):
        total = sum(i.quantity * i.medicine.price for i in obj.items.all())
        return format_html('<b>{:,.0f}đ</b>', total)
    total_fee.short_description = 'Tổng tiền thuốc'
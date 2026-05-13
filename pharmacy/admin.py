from django.contrib import admin
from django.utils.html import format_html
from django.utils import timezone
from .models import Category, Medicine, Inventory, StockTransaction


class InventoryInline(admin.StackedInline):
    model = Inventory
    extra = 0
    fields = ['quantity', 'min_quantity', 'expiry_date']


class MedicineAdmin(admin.ModelAdmin):
    list_display = ['name', 'category', 'get_ingredient', 'unit', 'price', 'stock_status', 'expiry_status']
    list_filter = ['category', 'unit', 'is_active']
    search_fields = ['name']
    list_per_page = 20
    inlines = [InventoryInline]

    def get_ingredient(self, obj):
        return obj.ingredient or '---'
    get_ingredient.short_description = 'Hoạt chất'

    def stock_status(self, obj):
        try:
            inv = obj.inventory
            if inv.is_low_stock:
                return format_html(
                    '<span style="color:#ef4444;font-weight:bold">⚠ Thấp ({})</span>', inv.quantity
                )
            return format_html('<span style="color:#10b981">✓ OK ({})</span>', inv.quantity)
        except Inventory.DoesNotExist:
            return format_html('<span style="color:#6b7280">Chưa có</span>')
    stock_status.short_description = 'Tồn kho'

    def expiry_status(self, obj):
        try:
            inv = obj.inventory
            today = timezone.now().date()
            days_left = (inv.expiry_date - today).days
            if days_left < 0:
                return format_html('<span style="color:#ef4444;font-weight:bold">✗ Hết hạn</span>')
            elif days_left <= 30:
                return format_html('<span style="color:#f59e0b;font-weight:bold">⚠ Còn {} ngày</span>', days_left)
            return format_html('<span style="color:#10b981">✓ {}</span>', inv.expiry_date)
        except Inventory.DoesNotExist:
            return '---'
    expiry_status.short_description = 'Hạn sử dụng'


class InventoryAdmin(admin.ModelAdmin):
    list_display = ['medicine', 'quantity', 'min_quantity', 'expiry_date', 'low_stock_alert', 'updated_at']
    list_filter = ['expiry_date']
    search_fields = ['medicine__name']
    list_per_page = 20

    def low_stock_alert(self, obj):
        if obj.is_low_stock:
            return format_html('<span style="color:#ef4444;font-weight:bold">⚠ Cần nhập thêm</span>')
        return format_html('<span style="color:#10b981">✓ Đủ hàng</span>')
    low_stock_alert.short_description = 'Cảnh báo'


class StockTransactionAdmin(admin.ModelAdmin):
    list_display = ['medicine', 'transaction_type', 'quantity', 'note', 'created_at']
    list_filter = ['transaction_type', 'created_at']
    search_fields = ['medicine__name']
    ordering = ['-created_at']
    list_per_page = 20
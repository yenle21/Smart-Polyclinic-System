from django.contrib import admin
from django.utils.html import format_html
from django.db.models import Sum
from .models import Invoice, InvoiceItem, ServiceFee


class InvoiceItemInline(admin.TabularInline):
    model = InvoiceItem
    extra = 0
    fields = ['description', 'quantity', 'unit_price', 'total_price']
    readonly_fields = ['total_price']


class InvoiceAdmin(admin.ModelAdmin):
    list_display = ['id', 'patient_name', 'total_amount', 'status_badge', 'payment_method', 'created_at', 'paid_at']
    list_filter = ['status', 'payment_method', 'created_at']
    search_fields = ['patient__user__first_name', 'patient__user__last_name']
    ordering = ['-created_at']
    date_hierarchy = 'created_at'
    list_per_page = 20
    readonly_fields = ['total_amount', 'created_at']
    inlines = [InvoiceItemInline]

    def patient_name(self, obj):
        return obj.patient.user.get_full_name()
    patient_name.short_description = 'Bệnh nhân'

    def status_badge(self, obj):
        colors = {
            'unpaid': '#ef4444',
            'paid': '#10b981',
            'cancelled': '#6b7280',
        }
        labels = {
            'unpaid': 'Chưa thanh toán',
            'paid': 'Đã thanh toán',
            'cancelled': 'Đã hủy',
        }
        return format_html(
            '<span style="background:{};color:white;padding:3px 10px;border-radius:12px;font-size:11px">{}</span>',
            colors.get(obj.status, '#gray'),
            labels.get(obj.status, obj.status)
        )
    status_badge.short_description = 'Trạng thái'

    def get_queryset(self, request):
        qs = super().get_queryset(request)
        return qs.select_related('patient__user', 'appointment')
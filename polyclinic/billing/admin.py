from django.contrib import admin
from django.utils.html import format_html
from .models import Invoice, InvoiceItem


class InvoiceItemInline(admin.TabularInline):
    model           = InvoiceItem
    extra           = 0
    fields          = ['description', 'quantity', 'unit_price', 'total_price']
    readonly_fields = ['total_price']


class InvoiceModelAdmin(admin.ModelAdmin):
    list_display    = ['id', 'patient_name', 'total_amount', 'status_badge',
                       'payment_badge', 'paid_at', 'created_date']
    list_filter     = ['status', 'payment_method', 'created_date']
    search_fields   = ['patient__user__first_name', 'patient__user__last_name']
    readonly_fields = ['total_amount', 'paid_at', 'created_date']
    date_hierarchy  = 'created_date'
    inlines         = [InvoiceItemInline]

    def patient_name(self, obj):
        return obj.patient.user.get_full_name()
    patient_name.short_description = 'Bệnh nhân'

    def status_badge(self, obj):
        colors = {'unpaid': '#ef4444', 'paid': '#10b981', 'cancelled': '#6b7280'}
        return format_html(
            '<span style="background:{};color:white;padding:2px 10px;'
            'border-radius:10px;font-size:11px">{}</span>',
            colors.get(obj.status, '#6b7280'),
            obj.get_status_display()
        )
    status_badge.short_description = 'Trạng thái'

    def payment_badge(self, obj):
        if not obj.payment_method:
            return '---'
        icons = {'cash': '💵', 'transfer': '🏦', 'momo': '📱', 'vnpay': '💳'}
        return format_html(
            '{} {}',
            icons.get(obj.payment_method, '💰'),
            obj.get_payment_method_display()
        )
    payment_badge.short_description = 'Thanh toán'
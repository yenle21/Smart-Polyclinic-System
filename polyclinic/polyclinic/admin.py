from django.contrib import admin
from django.db import models
from django.template.response import TemplateResponse
from django.urls import path
from django.db.models import Count, Sum
from django.utils import timezone
from datetime import timedelta

# Chỉ import app của bạn
from pharmacy.models import Category, Medicine, Inventory, StockTransaction, Prescription
from billing.models import Invoice, InvoiceItem
from dashboard.models import Report

from pharmacy.admin import (
    CategoryModelAdmin, MedicineModelAdmin, InventoryModelAdmin,
    StockTransactionModelAdmin, PrescriptionModelAdmin
)
from billing.admin import InvoiceModelAdmin
from dashboard.admin import ReportModelAdmin


class PolyclinicAdminSite(admin.AdminSite):
    site_header = '🏥 Smart Polyclinic Admin'
    site_title  = 'Polyclinic Admin'
    index_title = 'Bảng điều khiển'

    def get_urls(self):
        return [
            path('stats/', self.stats_view, name='stats'),
        ] + super().get_urls()

    def stats_view(self, request):
        today  = timezone.now().date()
        last_7 = today - timedelta(days=7)

        stats = {
            # Pharmacy
            'total_medicines':   Medicine.objects.count(),
            'low_stock_count':   Inventory.objects.filter(
                quantity__lte=models.F('min_quantity')
            ).count(),
            'expiring_soon':     Inventory.objects.filter(
                expiry_date__lte=today + timedelta(days=30)
            ).count(),

            # Billing
            'total_revenue': Invoice.objects.filter(
                status='paid'
            ).aggregate(total=Sum('total_amount'))['total'] or 0,
            'unpaid_invoices':   Invoice.objects.filter(status='unpaid').count(),
            'today_revenue':     Invoice.objects.filter(
                status='paid', paid_at__date=today
            ).aggregate(total=Sum('total_amount'))['total'] or 0,

            # Doanh thu 7 ngày
            'revenue_7days': list(
                Invoice.objects.filter(
                    status='paid', paid_at__date__gte=last_7
                ).values('paid_at__date')
                .annotate(total=Sum('total_amount'))
                .order_by('paid_at__date')
            ),

            # Thuốc sắp hết hạn
            'expiring_medicines': list(
                Inventory.objects.filter(
                    expiry_date__lte=today + timedelta(days=30)
                ).select_related('medicine')
                .values('medicine__name', 'expiry_date', 'quantity')
                .order_by('expiry_date')[:10]
            ),

            # Thuốc tồn kho thấp
            'low_stock_medicines': list(
                Inventory.objects.filter(
                    quantity__lte=models.F('min_quantity')
                ).select_related('medicine')
                .values('medicine__name', 'quantity', 'min_quantity')[:10]
            ),
        }
        return TemplateResponse(request, 'admin/stats.html', {'stats': stats})


admin_site = PolyclinicAdminSite(name='polyclinic_admin')

# Pharmacy — app của bạn
admin_site.register(Category,         CategoryModelAdmin)
admin_site.register(Medicine,         MedicineModelAdmin)
admin_site.register(Inventory,        InventoryModelAdmin)
admin_site.register(StockTransaction, StockTransactionModelAdmin)
admin_site.register(Prescription,     PrescriptionModelAdmin)

# Billing — app của bạn
admin_site.register(Invoice, InvoiceModelAdmin)

# Dashboard/Reports — app của bạn
admin_site.register(Report, ReportModelAdmin)
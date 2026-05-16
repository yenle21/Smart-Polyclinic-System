from django.contrib import admin
from django.utils.html import format_html
from .models import Report


class ReportModelAdmin(admin.ModelAdmin):
    list_display    = ['id', 'title', 'type_badge', 'date_from', 'date_to',
                       'created_by', 'created_date']
    list_filter     = ['report_type', 'created_date']
    search_fields   = ['title']
    readonly_fields = ['created_date', 'data_snapshot', 'created_by']

    def type_badge(self, obj):
        config = {
            'revenue':   ('#10b981', '💰 Doanh thu'),
            'patient':   ('#3b82f6', '👤 Bệnh nhân'),
            'disease':   ('#f59e0b', '🏥 Bệnh phổ biến'),
            'service':   ('#8b5cf6', '⚕️ Dịch vụ'),
            'inventory': ('#ef4444', '💊 Tồn kho'),
        }
        color, label = config.get(obj.report_type, ('#6b7280', obj.report_type))
        return format_html(
            '<span style="background:{};color:white;padding:2px 10px;'
            'border-radius:10px;font-size:11px">{}</span>',
            color, label
        )
    type_badge.short_description = 'Loại báo cáo'

    def save_model(self, request, obj, form, change):
        if not obj.pk:
            obj.created_by = request.user
        super().save_model(request, obj, form, change)
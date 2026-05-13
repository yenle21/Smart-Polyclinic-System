from django.contrib import admin
from .models import Report


class ReportAdmin(admin.ModelAdmin):
    list_display = ['title', 'report_type', 'date_from', 'date_to', 'created_by', 'created_at']
    list_filter = ['report_type', 'created_at']
    search_fields = ['title']
    ordering = ['-created_at']
    list_per_page = 20
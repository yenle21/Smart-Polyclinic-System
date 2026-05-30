from rest_framework import serializers
from .models import Report


class ReportSerializer(serializers.ModelSerializer):
    created_by_name  = serializers.CharField(
        source='created_by.get_full_name', read_only=True
    )
    report_type_display = serializers.CharField(
        source='get_report_type_display', read_only=True
    )

    class Meta:
        model = Report
        fields = [
            'id', 'report_type', 'report_type_display',
            'title', 'date_from', 'date_to',
            'created_by', 'created_by_name',
            'data_snapshot', 'created_date'
        ]
        read_only_fields = ['created_date', 'data_snapshot']


class DashboardSerializer(serializers.Serializer):
    # Thống kê tổng quan
    total_patients     = serializers.IntegerField()
    total_doctors      = serializers.IntegerField()
    today_appointments = serializers.IntegerField()
    total_revenue      = serializers.DecimalField(max_digits=12, decimal_places=2)

    # Thống kê theo trạng thái lịch hẹn
    appointments_by_status = serializers.DictField()

    # Top 5 bác sĩ có nhiều lịch hẹn nhất
    top_doctors = serializers.ListField()

    # Doanh thu 7 ngày gần nhất
    revenue_last_7_days = serializers.ListField()

    # Cảnh báo kho thuốc
    low_stock_medicines = serializers.ListField()
    expiring_medicines  = serializers.ListField()
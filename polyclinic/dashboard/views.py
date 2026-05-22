from appointments.models import Appointment, MedicalRecord
from django.utils import timezone
from django.db.models import Sum, Count, Avg, F
from datetime import timedelta, date
from rest_framework import viewsets, generics
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from pharmacy.models import Medicine, Inventory, Prescription, PrescriptionItem
from billing.models import Invoice
from rest_framework.views import APIView

from .models import Report
from . import serializers
from accounts.models import Doctor, Patient

from django.db.models.functions import ExtractYear
from datetime import date





class DashboardViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]
    @action(detail=False, methods=['get'], url_path='overview')
    def overview(self, request):
        today     = timezone.now().date()
        last_7    = today - timedelta(days=7)
        threshold = today + timedelta(days=30)

        # Doanh thu 7 ngày gần nhất — mỗi ngày 1 dòng
        revenue_7days = list(
            Invoice.objects.filter(
                status='paid', paid_at__date__gte=last_7
            ).values('paid_at__date')
            .annotate(total=Sum('total_amount'))
            .order_by('paid_at__date')
        )

        # Top 5 thuốc tồn kho thấp
        low_stock = list(
            Inventory.objects.filter(
                quantity__lte=F('min_quantity')
            ).select_related('medicine')
            .values('medicine__name', 'quantity', 'min_quantity')
            .order_by('quantity')[:5]
        )

        # Top 5 thuốc sắp hết hạn
        expiring = list(
            Inventory.objects.filter(
                expiry_date__lte=threshold
            ).select_related('medicine')
            .values('medicine__name', 'expiry_date', 'quantity')
            .order_by('expiry_date')[:5]
        )

        return Response({
            # Tổng quan billing
            'total_revenue':   Invoice.objects.filter(
                                   status='paid'
                               ).aggregate(t=Sum('total_amount'))['t'] or 0,
            'today_revenue':   Invoice.objects.filter(
                                   status='paid', paid_at__date=today
                               ).aggregate(t=Sum('total_amount'))['t'] or 0,
            'unpaid_invoices': Invoice.objects.filter(status='unpaid').count(),

            # Tổng quan pharmacy
            'total_medicines':    Medicine.objects.filter(is_active=True).count(),
            'low_stock_count':    Inventory.objects.filter(quantity__lte=F('min_quantity')).count(),
            'expiring_count':     Inventory.objects.filter(expiry_date__lte=threshold).count(),
            'expired_count':      Inventory.objects.filter(expiry_date__lt=today).count(),

            # Chi tiết cảnh báo
            'revenue_7days':         revenue_7days,
            'low_stock_medicines':   low_stock,
            'expiring_medicines':    expiring,
        })

    @action(detail=False, methods=['get'], url_path='revenue')
    def revenue(self, request):
        """
        Báo cáo doanh thu chi tiết
        GET /api/dashboard/revenue/
        ?period=day|month|year
        ?date_from=2024-01-01&date_to=2024-12-31
        """
        period    = request.query_params.get('period', 'month')
        date_from = request.query_params.get('date_from')
        date_to   = request.query_params.get('date_to')

        qs = Invoice.objects.filter(status='paid')
        if date_from:
            qs = qs.filter(paid_at__date__gte=date_from)
        if date_to:
            qs = qs.filter(paid_at__date__lte=date_to)

        # Group theo ngày/tháng/năm
        if period == 'day':
            group_field = 'paid_at__date'
        elif period == 'year':
            group_field = 'paid_at__year'
        else:
            group_field = 'paid_at__month'

        revenue_data = list(
            qs.values(group_field)
            .annotate(
                total=Sum('total_amount'),
                count=Count('id'),
                avg=Avg('total_amount')
            ).order_by(group_field)
        )

        # Doanh thu theo phương thức thanh toán
        by_method = list(
            qs.values('payment_method')
            .annotate(total=Sum('total_amount'), count=Count('id'))
            .order_by('-total')
        )

        return Response({
            'summary': {
                'total':   qs.aggregate(t=Sum('total_amount'))['t'] or 0,
                'count':   qs.count(),
                'average': qs.aggregate(a=Avg('total_amount'))['a'] or 0,
            },
            'by_period':         revenue_data,
            'by_payment_method': by_method,
        })

    @action(detail=False, methods=['get'], url_path='medicines-report')
    def medicines(self, request):
        """
        Báo cáo dược phẩm và kho thuốc
        GET /api/dashboard/medicines/
        """
        today     = timezone.now().date()
        threshold = today + timedelta(days=30)

        # Thống kê theo danh mục
        by_category = list(
            Medicine.objects.filter(is_active=True)
            .values('category__name')
            .annotate(count=Count('id'))
            .order_by('-count')
        )

        # Thuốc được kê nhiều nhất
        top_prescribed = list(
            Prescription.objects.values('items__medicine__name')
            .annotate(count=Count('id'))
            .order_by('-count')[:10]
        )

        return Response({
            'total_medicines':  Medicine.objects.filter(is_active=True).count(),
            'total_categories': Medicine.objects.values('category').distinct().count(),
            'low_stock_count':  Inventory.objects.filter(quantity__lte=F('min_quantity')).count(),
            'expiring_count':   Inventory.objects.filter(expiry_date__lte=threshold).count(),
            'expired_count':    Inventory.objects.filter(expiry_date__lt=today).count(),
            'by_category':      by_category,
            'top_prescribed':   top_prescribed,
        })

    @action(detail=False, methods=['get'], url_path='patients-report')
    def patients_report(self, request):
        today = date.today()
        patients = Patient.objects.select_related('user')

        # Theo giới tính — lấy từ Patient.gender
        by_gender = list(
            patients.values('gender')
            .annotate(count=Count('id'))
            .order_by('-count')
        )

        # Theo độ tuổi — lấy từ Patient.dob
        age_groups = {'0-18': 0, '19-35': 0, '36-50': 0, '51-65': 0, '65+': 0}
        for p in patients:
            dob = p.dob
            if dob:
                age = today.year - dob.year
                if age <= 18:
                    age_groups['0-18'] += 1
                elif age <= 35:
                    age_groups['19-35'] += 1
                elif age <= 50:
                    age_groups['36-50'] += 1
                elif age <= 65:
                    age_groups['51-65'] += 1
                else:
                    age_groups['65+'] += 1

        # Theo chuyên khoa
        by_specialty = list(
            Appointment.objects.filter(status='completed')
            .values('schedule__doctor__specialty__name')
            .annotate(count=Count('id'))
            .order_by('-count')[:10]
        )

        return Response({
            'total_patients': patients.count(),
            'by_gender': by_gender,
            'by_age_group': age_groups,
            'by_specialty': by_specialty,
        })

    @action(detail=False, methods=['get'], url_path='disease-report')
    def disease_report(self, request):
        from appointments.models import MedicalRecord

        # Bệnh phổ biến từ diagnosis
        by_diagnosis = list(
            MedicalRecord.objects.exclude(diagnosis='')
            .exclude(diagnosis__isnull=True)
            .values('diagnosis')
            .annotate(count=Count('id'))
            .order_by('-count')[:15]
        )

        # Thuốc được kê nhiều nhất
        top_medicines = list(
            PrescriptionItem.objects.values('medicine__name')
            .annotate(total=Sum('quantity'))
            .order_by('-total')[:10]
        )

        return Response({
            'by_diagnosis': by_diagnosis,
            'top_medicines': top_medicines,
        })

class ReportViewSet(viewsets.ViewSet,
                    generics.ListCreateAPIView,
                    generics.RetrieveAPIView):
    """
    Lưu và xem lại các báo cáo đã tạo
    GET  /api/dashboard/reports/      → danh sách báo cáo
    POST /api/dashboard/reports/      → tạo báo cáo mới
    GET  /api/dashboard/reports/{id}/ → xem chi tiết báo cáo
    """
    queryset         = Report.objects.select_related('created_by').order_by('-created_date')
    serializer_class = serializers.ReportSerializer

    def get_queryset(self):
        query = self.queryset

        # Lọc theo loại: ?type=revenue
        report_type = self.request.query_params.get('type')
        if report_type:
            query = query.filter(report_type=report_type)

        return query

    def perform_create(self, serializer):
        # Tự động gán người tạo
        serializer.save(created_by=self.request.user)

class DoctorDashboardView(APIView):

    permission_classes = [IsAuthenticated]

    def get(self, request):

        # =========================
        # CHECK DOCTOR
        # =========================
        try:
            doctor = Doctor.objects.get(user=request.user)

        except Doctor.DoesNotExist:

            return Response(
                {
                    "error": "Bạn không phải bác sĩ"
                },
                status=403
            )

        # =========================
        # TODAY APPOINTMENTS
        # =========================
        appointments = Appointment.objects.filter(
            schedule__doctor=doctor,
            schedule__work_date=date.today()
        ).select_related(
            'patient__user',
            'schedule'
        )

        # =========================
        # STATISTICS
        # =========================
        total = appointments.count()

        pending = appointments.filter(
            status='pending'
        ).count()

        confirmed = appointments.filter(
            status='confirmed'
        ).count()

        completed = appointments.filter(
            status='completed'
        ).count()

        cancelled = appointments.filter(
            status='cancelled'
        ).count()

        # =========================
        # APPOINTMENT LIST
        # =========================
        appointment_data = []

        for ap in appointments:

            appointment_data.append({
                "id": ap.id,

                "patient_name":
                    f"{ap.patient.user.first_name} "
                    f"{ap.patient.user.last_name}",

                "appointment_time":
                    str(ap.appointment_time),

                "type":
                    ap.type,

                "status":
                    ap.status,

                "reason":
                    ap.reason,
            })

        # =========================
        # RESPONSE
        # =========================
        data = {

            "doctor": {
                "id": doctor.id,
                "name":
                    f"{doctor.user.first_name} "
                    f"{doctor.user.last_name}",
            },

            "overview": {
                "total_appointments": total,
                "pending": pending,
                "confirmed": confirmed,
                "completed": completed,
                "cancelled": cancelled,
            },

            "appointments": appointment_data,
        }

        return Response(data)
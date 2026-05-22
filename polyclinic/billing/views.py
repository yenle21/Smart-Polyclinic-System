from django.utils import timezone
from django.db.models import Sum, Count
from rest_framework import viewsets, generics, status
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import Invoice
from . import serializers


class InvoiceViewSet(viewsets.ViewSet,
                     generics.ListCreateAPIView,
                     generics.RetrieveAPIView,
                     generics.RetrieveUpdateAPIView):
    """
    GET  /api/billing/invoices/           → danh sách + lọc
    POST /api/billing/invoices/           → tạo hóa đơn
    GET  /api/billing/invoices/{id}/      → chi tiết
    POST /api/billing/invoices/{id}/pay/  → thanh toán
    """


    def get_serializer_class(self):
        if self.action == 'create':
            return serializers.InvoiceCreateSerializer
        if self.action == 'pay':
            return serializers.InvoicePaySerializer
        if self.action in ['update', 'partial_update']:
            return serializers.InvoiceUpdateSerializer
        return serializers.InvoiceSerializer

    def get_queryset(self):
        query = Invoice.objects.select_related(
            'patient__user'
        ).prefetch_related('items').order_by('-created_date')
        s          = self.request.query_params.get('status')
        patient_id = self.request.query_params.get('patient_id')
        date_from  = self.request.query_params.get('date_from')
        date_to    = self.request.query_params.get('date_to')
        user = self.request.user

        appointment_id = self.request.query_params.get('appointment_id')

        print(f'User: {user.username} | Role: {user.role}')
        print(f'Total before filter: {query.count()}')

        # Phân quyền theo role
        if user.role == 'patient':
            query = query.filter(patient=user.patient_profile)
        elif user.role == 'staff' or user.role == 'admin':
            pass  # xem tất cả
        elif user.role == 'doctor':
            # Doctor chỉ xem invoice của appointment mình phụ trách
            query = query.filter(appointment__schedule__doctor__user=user)
        else:
            query = query.none()  # doctor không xem hóa đơn

        if s:
            query = query.filter(status=s)
        if patient_id:
            query = query.filter(patient_id=patient_id)
        if date_from:
            query = query.filter(created_date__date__gte=date_from)
        if appointment_id:
            query = query.filter(appointment_id=appointment_id)
        if date_to:
            query = query.filter(created_date__date__lte=date_to)
        return query

    @action(detail=True, methods=['post'], url_path='pay')
    def pay(self, request, pk=None):
        """
        POST /api/billing/invoices/1/pay/
        Body: { "payment_method": "momo" }
        """
        invoice    = self.get_object()
        serializer = serializers.InvoicePaySerializer(invoice, data=request.data)

        if serializer.is_valid():
            serializer.save()
            return Response({
                'message':  'Thanh toán thành công',
                'total':    str(invoice.total_amount),
                'method':   invoice.get_payment_method_display(),
                'paid_at':  str(invoice.paid_at),
            })
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


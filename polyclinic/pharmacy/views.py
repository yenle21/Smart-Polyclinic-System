from django.utils import timezone
from django.db.models import F
from django.db import models as db_models
from datetime import timedelta
from rest_framework import viewsets, generics, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError

from .models import Category, Medicine, Inventory, StockTransaction, Prescription
from . import serializers
from billing.models import Invoice


class CategoryViewSet(viewsets.ViewSet, generics.ListCreateAPIView):
    queryset         = Category.objects.all()
    serializer_class = serializers.CategorySerializer

    def get_queryset(self):
        query = self.queryset
        q = self.request.query_params.get('q')
        if q:
            query = query.filter(name__icontains=q)
        return query


class MedicineViewSet(viewsets.ViewSet,
                      generics.ListCreateAPIView,
                      generics.RetrieveUpdateDestroyAPIView):

    # ✅ FIX: dùng prefetch_related thay vì select_related cho inventory
    # select_related dùng INNER JOIN → mất thuốc không có inventory
    # prefetch_related dùng query riêng → giữ đủ tất cả thuốc
    queryset = Medicine.objects.filter(
        is_active=True
    ).select_related('category').prefetch_related('inventory')

    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields   = ['name', 'ingredient']
    ordering_fields = ['name', 'price']

    def get_serializer_class(self):
        if self.action == 'list':
            return serializers.MedicineListSerializer
        return serializers.MedicineSerializer

    def get_queryset(self):
        query = self.queryset
        q = self.request.query_params.get('q')
        if q:
            query = query.filter(name__icontains=q)
        category_id = self.request.query_params.get('category_id')
        if category_id:
            query = query.filter(category_id=category_id)
        return query

    def destroy(self, request, *args, **kwargs):
        medicine           = self.get_object()
        medicine.is_active = False
        medicine.save()
        return Response(
            {'message': f'Đã ngừng kinh doanh thuốc {medicine.name}'},
            status=status.HTTP_200_OK
        )

    @action(detail=False, methods=['get'], url_path='alerts')
    def alerts(self, request):
        today     = timezone.now().date()
        threshold = today + timedelta(days=30)

        low_stock = Inventory.objects.filter(
            quantity__lte=F('min_quantity')
        ).select_related('medicine')

        expiring = Inventory.objects.filter(
            expiry_date__lte=threshold,
            expiry_date__gte=today
        ).select_related('medicine').order_by('expiry_date')

        expired = Inventory.objects.filter(
            expiry_date__lt=today
        ).select_related('medicine')

        return Response({
            'low_stock': {
                'count': low_stock.count(),
                'items': [{
                    'id':           inv.medicine.id,
                    'name':         inv.medicine.name,
                    'quantity':     inv.quantity,
                    'min_quantity': inv.min_quantity,
                    'shortage':     inv.min_quantity - inv.quantity,
                } for inv in low_stock]
            },
            'expiring_soon': {
                'count': expiring.count(),
                'items': [{
                    'id':             inv.medicine.id,
                    'name':           inv.medicine.name,
                    'expiry_date':    inv.expiry_date,
                    'days_remaining': inv.days_until_expiry,
                    'quantity':       inv.quantity,
                } for inv in expiring]
            },
            'expired': {
                'count': expired.count(),
                'items': [{
                    'id':          inv.medicine.id,
                    'name':        inv.medicine.name,
                    'expiry_date': inv.expiry_date,
                    'quantity':    inv.quantity,
                } for inv in expired]
            }
        })


class InventoryViewSet(viewsets.ViewSet, generics.ListCreateAPIView,
                       generics.ListAPIView,
                       generics.RetrieveUpdateAPIView):
    queryset         = Inventory.objects.select_related('medicine').all()
    serializer_class = serializers.InventorySerializer

    def get_queryset(self):
        query = self.queryset
        q = self.request.query_params.get('q')
        if q:
            query = query.filter(medicine__name__icontains=q)
        return query


class StockTransactionViewSet(viewsets.ViewSet, generics.ListCreateAPIView):
    queryset         = StockTransaction.objects.select_related('medicine').order_by('-created_date')
    serializer_class = serializers.StockTransactionSerializer

    def get_queryset(self):
        query       = self.queryset
        medicine_id = self.request.query_params.get('medicine_id')
        t           = self.request.query_params.get('type')
        if medicine_id:
            query = query.filter(medicine_id=medicine_id)
        if t:
            query = query.filter(transaction_type=t)
        return query

    def perform_create(self, serializer):
        transaction = serializer.save()
        inv         = transaction.medicine.inventory

        if transaction.transaction_type == 'import':
            inv.quantity += transaction.quantity

        elif transaction.transaction_type == 'export':
            if inv.quantity < transaction.quantity:
                transaction.delete()

                raise ValidationError(
                    {'detail': f'Không đủ hàng. Tồn kho hiện tại: {inv.quantity}'}
                )
            inv.quantity -= transaction.quantity

        elif transaction.transaction_type == 'adjust':
            inv.quantity = transaction.quantity

        inv.save()



class PrescriptionViewSet(viewsets.ViewSet, generics.ListCreateAPIView,  generics.RetrieveAPIView):
    queryset = Prescription.objects.select_related(
        'medical_record__appointment__patient__user',
        'medical_record__appointment__schedule__doctor__user',
    ).prefetch_related('items__medicine')

    def get_serializer_class(self):
        if self.action == 'create':
            return serializers.PrescriptionCreateSerializer
        return serializers.PrescriptionSerializer

    def get_queryset(self):
        query = self.queryset
        is_dispensed = self.request.query_params.get('is_dispensed')
        if is_dispensed is not None:
            query = query.filter(is_dispensed=is_dispensed.lower() == 'true')

        # ← THÊM DÒNG NÀY
        medical_record_id = self.request.query_params.get('medical_record')
        if medical_record_id:
            query = query.filter(medical_record_id=medical_record_id)

        return query

    @action(detail=True, methods=['post'], url_path='dispense')
    def dispense(self, request, pk=None):
        prescription = self.get_object()

        if prescription.is_dispensed:
            return Response(
                {'detail': 'Đơn thuốc này đã được xuất rồi.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        prescription.is_dispensed = True
        prescription.save()

        appointment = prescription.medical_record.appointment

        # Tính tổng tiền thuốc
        medicine_fee = prescription.items.aggregate(
            total=db_models.Sum(
                db_models.F('quantity') * db_models.F('medicine__price'),
                output_field=db_models.DecimalField()
            )
        )['total'] or 0

        invoice, created = Invoice.objects.get_or_create(
            appointment=appointment,
            defaults={
                'patient': appointment.patient,
                'medicine_fee': medicine_fee,
            }
        )

        if not created:
            invoice.medicine_fee = medicine_fee
            invoice.save()

        return Response({'invoice_id': invoice.id}, status=status.HTTP_200_OK)
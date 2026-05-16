from django.db.models import F
from rest_framework import viewsets, generics, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Category, Medicine, StockTransaction, Prescription
from . import serializers


class CategoryViewSet(viewsets.ViewSet, generics.ListCreateAPIView):
    queryset = Category.objects.all()
    serializer_class = serializers.CategorySerializer

    def get_queryset(self):
        query = self.queryset
        q = self.request.query_params.get('q')
        if q:
            query = query.filter(name__icontains=q)
        return query


class MedicineViewSet(viewsets.ViewSet, generics.ListCreateAPIView):
    queryset = Medicine.objects.filter(is_active=True).select_related('category')
    serializer_class = serializers.MedicineListSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'ingredient']
    ordering_fields = ['name', 'price']

    def get_queryset(self):
        query = self.queryset

        q = self.request.query_params.get('q')
        if q:
            query = query.filter(name__icontains=q)

        category_id = self.request.query_params.get('category_id')
        if category_id:
            query = query.filter(category_id=category_id)

        low_stock = self.request.query_params.get('low_stock')
        if low_stock:
            query = query.filter(
                inventory__quantity__lte=F('inventory__min_quantity')
            )

        return query

    @action(methods=['get'], url_path='inventory', detail=True)
    def get_inventory(self, request, pk):
        """Xem tồn kho và cảnh báo hết hạn / số lượng thấp"""
        medicine = self.get_object()
        inv = getattr(medicine, 'inventory', None)
        if not inv:
            return Response(
                {'detail': 'Không có thông tin tồn kho.'},
                status=status.HTTP_404_NOT_FOUND
            )
        return Response(serializers.InventorySerializer(inv).data)


class StockTransactionViewSet(viewsets.ViewSet, generics.ListCreateAPIView):
    queryset = StockTransaction.objects.select_related('medicine').order_by('-created_date')
    serializer_class = serializers.StockTransactionSerializer

    def get_queryset(self):
        query = self.queryset

        medicine_id = self.request.query_params.get('medicine_id')
        if medicine_id:
            query = query.filter(medicine_id=medicine_id)

        transaction_type = self.request.query_params.get('type')
        if transaction_type:
            query = query.filter(transaction_type=transaction_type)

        return query

    def perform_create(self, serializer):
        transaction = serializer.save()
        inv = transaction.medicine.inventory
        if transaction.transaction_type == 'import':
            inv.quantity += transaction.quantity
        elif transaction.transaction_type == 'export':
            inv.quantity -= transaction.quantity
        elif transaction.transaction_type == 'adjust':
            inv.quantity = transaction.quantity
        inv.save()


class PrescriptionViewSet(viewsets.ViewSet, generics.ListCreateAPIView):
    # Chỉ GET list + POST, không có retrieve
    queryset = Prescription.objects.select_related('medical_record').prefetch_related('items__medicine')
    serializer_class = serializers.PrescriptionSerializer

    def get_serializer_class(self):
        if self.action == 'create':
            return serializers.PrescriptionCreateSerializer
        return serializers.PrescriptionSerializer

    def get_queryset(self):
        query = self.queryset

        is_dispensed = self.request.query_params.get('is_dispensed')
        if is_dispensed is not None:
            query = query.filter(is_dispensed=is_dispensed.lower() == 'true')

        return query

    @action(methods=['post'], url_path='dispense', detail=True)
    def dispense(self, request, pk):
        prescription = self.get_object()
        if prescription.is_dispensed:
            return Response(
                {'detail': 'Đơn thuốc này đã được cấp phát.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        prescription.is_dispensed = True
        prescription.save()
        return Response(
            serializers.PrescriptionSerializer(prescription).data,
            status=status.HTTP_200_OK
        )
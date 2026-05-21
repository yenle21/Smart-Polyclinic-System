from rest_framework import serializers
from .models import Category, Medicine, Inventory, StockTransaction, Prescription, PrescriptionItem

class CategorySerializer(serializers.ModelSerializer):
    medicine_count = serializers.SerializerMethodField()
    class Meta:
        model = Category
        fields = ['id', 'name', 'description', 'medicine_count']

    def get_medicine_count(self, obj):
        return obj.medicines.count()


class InventorySerializer(serializers.ModelSerializer):
    is_low_stock      = serializers.BooleanField(read_only=True)
    is_expired        = serializers.BooleanField(read_only=True)
    days_until_expiry = serializers.IntegerField(read_only=True)

    class Meta:
        model = Inventory
        fields = [
            'id', 'medicine', 'quantity', 'min_quantity',
            'expiry_date', 'is_low_stock', 'is_expired', 'days_until_expiry'
        ]


class MedicineListSerializer(serializers.ModelSerializer):
    category_name  = serializers.CharField(source='category.name', read_only=True)
    stock_quantity = serializers.SerializerMethodField()
    min_quantity   = serializers.SerializerMethodField()
    expiry_date    = serializers.SerializerMethodField()
    is_low_stock   = serializers.SerializerMethodField()
    is_expired     = serializers.SerializerMethodField()

    class Meta:
        model  = Medicine
        fields = [
            'id', 'name', 'unit', 'price', 'category_name', 'is_active',
            'stock_quantity', 'min_quantity', 'expiry_date',
            'is_low_stock', 'is_expired',
        ]

    def _inv(self, obj):
        return getattr(obj, 'inventory', None)

    def get_stock_quantity(self, obj):
        inv = self._inv(obj)
        return inv.quantity if inv else 0

    def get_min_quantity(self, obj):
        inv = self._inv(obj)
        return inv.min_quantity if inv else 0

    def get_expiry_date(self, obj):
        inv = self._inv(obj)
        return str(inv.expiry_date) if inv else None

    def get_is_low_stock(self, obj):
        inv = self._inv(obj)
        return inv.is_low_stock if inv else False

    def get_is_expired(self, obj):
        inv = self._inv(obj)
        return inv.is_expired if inv else False

class MedicineSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    inventory     = InventorySerializer(read_only=True)

    class Meta:
        model  = Medicine
        fields = [
            'id', 'name', 'ingredient', 'category', 'category_name',
            'unit', 'price', 'image',
            'description', 'is_active', 'inventory'
        ]


class StockTransactionSerializer(serializers.ModelSerializer):
    medicine_name            = serializers.CharField(source='medicine.name', read_only=True)
    transaction_type_display = serializers.CharField(
        source='get_transaction_type_display', read_only=True
    )

    class Meta:
        model = StockTransaction
        fields = [
            'id', 'medicine', 'medicine_name',
            'transaction_type', 'transaction_type_display',
            'quantity', 'note', 'created_date'
        ]
        read_only_fields = ['created_date']


class PrescriptionItemSerializer(serializers.ModelSerializer):
    medicine_name = serializers.CharField(source='medicine.name', read_only=True)
    medicine_unit = serializers.CharField(source='medicine.get_unit_display', read_only=True)

    class Meta:
        model = PrescriptionItem
        fields = [
            'id', 'medicine', 'medicine_name', 'medicine_unit',
            'quantity', 'dosage', 'duration_days', 'notes'
        ]


class PrescriptionSerializer(serializers.ModelSerializer):
    items              = PrescriptionItemSerializer(many=True, read_only=True)
    patient_name       = serializers.CharField(
        source='medical_record.appointment.patient.user.get_full_name',
        read_only=True
    )
    doctor_name        = serializers.CharField(
        source='medical_record.appointment.schedule.doctor.user.get_full_name',
        read_only=True
    )
    total_medicine_fee = serializers.SerializerMethodField()

    class Meta:
        model = Prescription
        fields = [
            'id', 'medical_record', 'patient_name', 'doctor_name',
            'instructions', 'is_dispensed', 'items',
            'total_medicine_fee', 'created_date'
        ]
        read_only_fields = ['created_date']

    def get_total_medicine_fee(self, obj):
        return sum(
            item.quantity * item.medicine.price
            for item in obj.items.all()
        )


class PrescriptionCreateSerializer(serializers.ModelSerializer):
    items = PrescriptionItemSerializer(many=True)

    class Meta:
        model  = Prescription
        fields = ['medical_record', 'instructions', 'items']
        # Bỏ UniqueValidator mà DRF tự inject từ OneToOneField
        # để create() có thể tự xử lý update_or_create
        extra_kwargs = {
            'medical_record': {'validators': []}
        }

    def create(self, validated_data):
        items_data     = validated_data.pop('items')
        medical_record = validated_data['medical_record']

        prescription, created = Prescription.objects.update_or_create(
            medical_record=medical_record,
            defaults={'instructions': validated_data.get('instructions', '')}
        )

        # Nếu đã có đơn cũ → xóa items cũ trước khi tạo lại
        if not created:
            prescription.items.all().delete()

        for item_data in items_data:
            PrescriptionItem.objects.create(
                prescription=prescription,
                **item_data
            )

        return prescription
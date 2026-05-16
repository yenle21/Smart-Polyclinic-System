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
            'id', 'quantity', 'min_quantity',
            'expiry_date', 'is_low_stock', 'is_expired', 'days_until_expiry'
        ]

class MedicineSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    unit_display = serializers.CharField(source='unit.display', read_only=True)
    inventory = InventorySerializer(read_only=True)

    class Meta:
        model = Medicine
        fields = [
            'id', 'name', 'ingredient', 'category', 'category_name',
            'unit', 'unit_display', 'price', 'image',
            'description', 'is_active', 'inventory'
        ]

class MedicineListSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    stock_quantity = serializers.IntegerField(source='inventory.quantity', read_only=True)

    class Meta:
        model = Medicine
        fields = ['id', 'name', 'unit', 'price', 'category_name', 'stock_quantity', 'is_active']


class StockTransactionSerializer(serializers.ModelSerializer):
    medicine_name         = serializers.CharField(source='medicine.name', read_only=True)
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
    # Nhúng danh sách thuốc vào đơn — many=True vì 1 đơn có nhiều thuốc
    items = PrescriptionItemSerializer(many=True, read_only=True)

    # Lấy thông tin bệnh nhân từ quan hệ lồng nhau
    patient_name = serializers.CharField(
        source='medical_record.appointment.patient.user.get_full_name',
        read_only=True
    )
    doctor_name = serializers.CharField(
        source='medical_record.appointment.schedule.doctor.user.get_full_name',
        read_only=True
    )
    # Tính tổng tiền thuốc
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
        # Tính tổng: số lượng × đơn giá từng thuốc
        total = sum(
            item.quantity * item.medicine.price
            for item in obj.items.all()
        )
        return total


class PrescriptionCreateSerializer(serializers.ModelSerializer):
    items = PrescriptionItemSerializer(many=True)

    class Meta:
        model = Prescription
        fields = ['medical_record', 'instructions', 'items']

    def create(self, validated_data):
        # Tách items ra khỏi data vì phải tạo riêng
        items_data = validated_data.pop('items')

        # Tạo Prescription trước
        prescription = Prescription.objects.create(**validated_data)

        # Tạo từng PrescriptionItem — model.save() sẽ tự trừ kho
        for item_data in items_data:
            PrescriptionItem.objects.create(prescription=prescription, **item_data)

        return prescription

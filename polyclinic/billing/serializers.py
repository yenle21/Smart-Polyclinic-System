from rest_framework import serializers
from django.utils import timezone
from .models import Invoice, InvoiceItem


class InvoiceItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = InvoiceItem
        fields = ['id', 'description', 'quantity', 'unit_price', 'total_price']
        read_only_fields = ['total_price']


class InvoiceSerializer(serializers.ModelSerializer):
    patient_name = serializers.SerializerMethodField()
    doctor_name = serializers.SerializerMethodField()

    specialty_name = serializers.SerializerMethodField()

    def get_specialty_name(self, obj):
        specialty = obj.appointment.schedule.doctor.specialties.first()
        return specialty.name if specialty else ''

    status_display  = serializers.CharField(source='get_status_display', read_only=True)

    payment_display = serializers.CharField(
        source='get_payment_method_display', read_only=True
    )

    items           = InvoiceItemSerializer(many=True, read_only=True)

    total_amount    = serializers.DecimalField(
        max_digits=10, decimal_places=2, read_only=True
    )
    appointment_type = serializers.CharField(
        source='appointment.type', read_only=True
    )

    class Meta:
        model = Invoice
        fields = [
            'id',
            'patient', 'patient_name', 'appointment_type',
            'appointment', 'doctor_name', 'specialty_name',
            'consultation_fee', 'medicine_fee', 'service_fee', 'total_amount',
            'status', 'status_display',
            'payment_method', 'payment_display',
            'paid_at', 'notes', 'items',
            'created_date'
        ]
        read_only_fields = ['total_amount', 'paid_at', 'created_date']

    def get_patient_name(self, obj):
        user = obj.patient.user
        full_name = user.get_full_name().strip()
        return full_name if full_name else user.username

    def get_doctor_name(self, obj):
        user = obj.appointment.schedule.doctor.user
        full_name = user.get_full_name().strip()
        return full_name if full_name else user.username



class InvoiceCreateSerializer(serializers.ModelSerializer):

    items = InvoiceItemSerializer(many=True, required=False)

    class Meta:
        model = Invoice
        fields = [
            'patient', 'appointment',
            'consultation_fee', 'medicine_fee', 'service_fee',
            'notes', 'items'
        ]

    def create(self, validated_data):
        items_data = validated_data.pop('items', [])

        invoice = Invoice.objects.create(**validated_data)
        for item_data in items_data:
            InvoiceItem.objects.create(invoice=invoice, **item_data)
        return invoice


class InvoicePaySerializer(serializers.ModelSerializer):

    payment_method = serializers.ChoiceField(
        choices=Invoice.PAYMENT_METHOD_CHOICES,
        default='cash'
    )
    class Meta:
        model = Invoice
        fields = ['payment_method']

    def update(self, instance, validated_data):

        if instance.status != 'unpaid':
            raise serializers.ValidationError('Hóa đơn này đã được xử lý rồi.')

        instance.payment_method = validated_data['payment_method']
        instance.status  = 'paid'
        instance.paid_at = timezone.now()
        instance.save()
        return instance

class InvoiceUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Invoice
        fields = ['consultation_fee', 'medicine_fee', 'service_fee', 'notes']
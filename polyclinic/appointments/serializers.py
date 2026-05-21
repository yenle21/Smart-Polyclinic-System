from rest_framework import serializers
from .models import Schedule, Appointment, Notification, MedicalRecord, TestResult


class ScheduleSerializer(serializers.ModelSerializer):
    available_slots = serializers.SerializerMethodField()
    doctor_name     = serializers.CharField(source='doctor.user.get_full_name', read_only=True)
    specialty_name  = serializers.CharField(source='doctor.specialty.name', read_only=True)

    class Meta:
        model  = Schedule
        fields = [
            'id', 'doctor', 'doctor_name', 'specialty_name',
            'work_date', 'start_time', 'end_time', 'max_slots', 'available_slots',
        ]
        read_only_fields = ['doctor', 'available_slots', 'doctor_name', 'specialty_name']

    def get_available_slots(self, obj):
        return obj.available_slots()


class AppointmentSerializer(serializers.ModelSerializer):
    doctor_name    = serializers.CharField(source='schedule.doctor.user.get_full_name', read_only=True)
    specialty_name = serializers.CharField(source='schedule.doctor.specialty.name', read_only=True)
    work_date      = serializers.DateField(source='schedule.work_date', read_only=True)
    patient_name   = serializers.SerializerMethodField()

    class Meta:
        model  = Appointment
        fields = [
            'id', 'doctor_name', 'specialty_name', 'work_date', 'patient_name',
            'appointment_time', 'type', 'status',
            'reason', 'notes', 'cancel_reason',
            'created_date', 'updated_date'
        ]
        read_only_fields = ['status', 'cancel_reason', 'created_date', 'updated_date']

    def get_patient_name(self, obj):
        return obj.patient.full_name


class AppointmentCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Appointment
        fields = ['schedule', 'appointment_time', 'type', 'reason', 'notes']

    def validate(self, attrs):
        schedule = attrs.get('schedule')
        try:
            patient = self.context['request'].user.patient_profile
        except Exception:
            raise serializers.ValidationError('Tài khoản này chưa có hồ sơ bệnh nhân. Vui lòng liên hệ admin!')

        if schedule.available_slots() <= 0:
            raise serializers.ValidationError('Lịch này đã đầy slot!')

        existing = Appointment.objects.filter(patient=patient, schedule=schedule).first()
        if existing:
            if existing.status == 'cancelled':
                raise serializers.ValidationError('Bạn đã từng đặt và hủy lịch này trước đó!')
            else:
                raise serializers.ValidationError('Bạn đã đặt lịch này rồi!')
        return attrs

    def create(self, validated_data):
        try:
            patient = self.context['request'].user.patient_profile
        except Exception:
            raise serializers.ValidationError('Tài khoản này chưa có hồ sơ bệnh nhân. Vui lòng liên hệ admin!')
        return Appointment.objects.create(patient=patient, **validated_data)


class AppointmentCancelSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Appointment
        fields = ['cancel_reason']

    def update(self, appointment, validated_data):
        if appointment.status not in ['pending', 'confirmed']:
            raise serializers.ValidationError('Không thể huỷ lịch này!')
        appointment.cancel_reason = validated_data.get('cancel_reason', '')
        appointment.status        = 'cancelled'
        appointment.save()
        return appointment


class AppointmentApproveSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Appointment
        fields = ['status', 'cancel_reason']

    def validate(self, attrs):
        if self.instance.status != 'pending':
            raise serializers.ValidationError('Lịch hẹn này đã được xử lý trước đó.')

        new_status    = attrs.get('status')
        cancel_reason = attrs.get('cancel_reason')
        if new_status == 'cancelled' and not cancel_reason:
            raise serializers.ValidationError({'cancel_reason': 'Vui lòng nhập lý do từ chối.'})
        return attrs


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Notification
        fields = ['id', 'type', 'title', 'message', 'is_read', 'created_date']
        read_only_fields = ['type', 'title', 'message', 'created_date']


class TestResultSerializer(serializers.ModelSerializer):
    class Meta:
        model  = TestResult
        fields = ['id', 'type', 'name', 'result', 'file', 'tested_at']


class MedicalRecordSerializer(serializers.ModelSerializer):
    test_results   = TestResultSerializer(many=True, read_only=True)
    doctor_name    = serializers.CharField(source='appointment.schedule.doctor.user.get_full_name', read_only=True)
    patient_name   = serializers.SerializerMethodField()
    work_date      = serializers.DateField(source='appointment.schedule.work_date', read_only=True)
    specialty_name = serializers.CharField(source='appointment.schedule.doctor.specialty.name', read_only=True)

    class Meta:
        model  = MedicalRecord
        fields = [
            'id', 'appointment',
            'doctor_name', 'patient_name', 'specialty_name', 'work_date',  # ← THÊM
            'diagnosis', 'treatment', 'notes', 'follow_up',
            'symptoms', 'blood_pressure', 'temperature', 'height', 'weight',
            'test_results',  # ← THÊM
        ]

    def get_patient_name(self, obj):
        return obj.appointment.patient.full_name



class MedicalRecordCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model  = MedicalRecord
        fields = [
            'appointment', 'diagnosis', 'treatment', 'notes', 'follow_up',
            'symptoms', 'blood_pressure', 'temperature', 'height', 'weight',  # ← THÊM
        ]

    def validate_appointment(self, value):
        if MedicalRecord.objects.filter(appointment=value).exists():
            raise serializers.ValidationError(
                'Hồ sơ bệnh án cho lịch hẹn này đã tồn tại.'
            )
        return value
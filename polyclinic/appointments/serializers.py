from rest_framework import serializers
from .models import Schedule, Appointment, Notification, MedicalRecord, TestResult


# ─────────────────────────────────────────
#  SCHEDULE
# ─────────────────────────────────────────
class ScheduleSerializer(serializers.ModelSerializer):
    available_slots = serializers.SerializerMethodField()

    class Meta:
        model  = Schedule
        fields = ['id', 'doctor', 'work_date', 'start_time', 'end_time', 'max_slots', 'available_slots']

    def get_available_slots(self, obj):
        return obj.available_slots()


# ─────────────────────────────────────────
#  APPOINTMENT
# ─────────────────────────────────────────
class AppointmentSerializer(serializers.ModelSerializer):
    """Dùng cho GET — hiển thị đầy đủ thông tin"""
    doctor_name   = serializers.CharField(source='schedule.doctor.user.get_full_name', read_only=True)
    specialty     = serializers.CharField(source='schedule.doctor.specialty.name', read_only=True)
    work_date     = serializers.DateField(source='schedule.work_date', read_only=True)

    class Meta:
        model  = Appointment
        fields = [
            'id', 'doctor_name', 'specialty', 'work_date',
            'appointment_time', 'type', 'status',
            'reason', 'notes', 'cancel_reason',
            'created_date', 'updated_date'
        ]
        read_only_fields = ['status', 'cancel_reason', 'created_date', 'updated_date']


class AppointmentCreateSerializer(serializers.ModelSerializer):
    """Dùng cho POST — bệnh nhân đặt lịch"""
    class Meta:
        model  = Appointment
        fields = ['schedule', 'appointment_time', 'type', 'reason', 'notes']

    def validate(self, data):
        schedule         = data['schedule']
        appointment_time = data['appointment_time']

        # Kiểm tra giờ khám nằm trong khung lịch
        if not (schedule.start_time <= appointment_time <= schedule.end_time):
            raise serializers.ValidationError(
                'Giờ khám phải nằm trong khung giờ làm việc của bác sĩ!'
            )

        # Kiểm tra còn slot không
        if schedule.available_slots() <= 0:
            raise serializers.ValidationError('Lịch này đã hết chỗ!')

        return data

    def create(self, validated_data):
        # Tự động gán patient từ user đang đăng nhập
        patient = self.context['request'].user.patient_profile
        return Appointment.objects.create(patient=patient, **validated_data)


class AppointmentCancelSerializer(serializers.ModelSerializer):
    """Dùng cho PATCH huỷ lịch — chỉ cần lý do huỷ"""
    class Meta:
        model  = Appointment
        fields = ['cancel_reason']

    def update(self, instance, validated_data):
        if instance.status not in ['pending', 'confirmed']:
            raise serializers.ValidationError('Không thể huỷ lịch này!')
        instance.cancel_reason = validated_data.get('cancel_reason', '')
        instance.status        = 'cancelled'
        instance.save()
        return instance


# ─────────────────────────────────────────
#  NOTIFICATION
# ─────────────────────────────────────────
class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Notification
        fields = ['id', 'type', 'title', 'message', 'is_read', 'created_date']
        read_only_fields = ['type', 'title', 'message', 'created_date']


# ─────────────────────────────────────────
#  TEST RESULT
# ─────────────────────────────────────────
class TestResultSerializer(serializers.ModelSerializer):
    class Meta:
        model  = TestResult
        fields = ['id', 'type', 'name', 'result', 'file', 'tested_at']


# ─────────────────────────────────────────
#  MEDICAL RECORD
# ─────────────────────────────────────────
class MedicalRecordSerializer(serializers.ModelSerializer):
    test_results  = TestResultSerializer(many=True, read_only=True)
    doctor_name   = serializers.CharField(source='appointment.schedule.doctor.user.get_full_name', read_only=True)
    work_date     = serializers.DateField(source='appointment.schedule.work_date', read_only=True)

    class Meta:
        model  = MedicalRecord
        fields = [
            'id', 'doctor_name', 'work_date',
            'diagnosis', 'treatment', 'notes', 'follow_up',
            'test_results', 'created_date'
        ]
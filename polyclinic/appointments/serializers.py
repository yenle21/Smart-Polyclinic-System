from rest_framework import serializers
from .models import Schedule, Appointment, Notification, MedicalRecord, TestResult



#lịch làm việc của bác sĩ
class ScheduleSerializer(serializers.ModelSerializer):
    available_slots = serializers.SerializerMethodField()
    doctor_name     = serializers.CharField(source='doctor.user.get_full_name', read_only=True)
    specialty_name  = serializers.CharField(source='doctor.specialty.name', read_only=True)

    class Meta:
        model  = Schedule
        fields = [
            'id',
            'doctor',
            'doctor_name',      # ← thêm
            'specialty_name',   # ← thêm
            'work_date',
            'start_time',
            'end_time',
            'max_slots',
            'available_slots',
        ]

    def get_available_slots(self, obj):
        return obj.available_slots()

#Lịch hẹn
class AppointmentSerializer(serializers.ModelSerializer):
    doctor_name   = serializers.CharField(source='schedule.doctor.user.get_full_name', read_only=True)
    specialty_name = serializers.CharField(source='schedule.doctor.specialty.name', read_only=True)
    work_date     = serializers.DateField(source='schedule.work_date', read_only=True)
    patient_name = serializers.SerializerMethodField()

    class Meta:
        model = Appointment
        fields = '__all__'

    def get_patient_name(self, obj):
        user = obj.patient.user

        full_name = f"{user.first_name} {user.last_name}".strip()

        return full_name if full_name else user.username

    class Meta:
        model  = Appointment
        fields = [
            'id', 'doctor_name', 'specialty_name', 'work_date','patient_name',
            'appointment_time', 'type', 'status',
            'reason', 'notes', 'cancel_reason',
            'created_date', 'updated_date'
        ]
        read_only_fields = ['status', 'cancel_reason', 'created_date', 'updated_date']

# bệnh nhân đặt lịch hẹn
class AppointmentCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Appointment
        fields = ['schedule', 'appointment_time', 'type', 'reason', 'notes']

    def validate(self, attrs):
        schedule         = attrs.get('schedule')
        appointment_time = attrs.get('appointment_time')

        # FIX: bắt lỗi nếu chưa có patient_profile
        try:
            patient = self.context['request'].user.patient_profile
        except Exception:
            raise serializers.ValidationError(
                'Tài khoản này chưa có hồ sơ bệnh nhân. Vui lòng liên hệ admin!'
            )

        # Kiểm tra còn slot không
        if schedule.available_slots() <= 0:
            raise serializers.ValidationError('Lịch này đã đầy slot!')

        # Kiểm tra bệnh nhân đã đặt trùng lịch chưa
        existing = Appointment.objects.filter(
            patient=patient,
            schedule=schedule
        ).first()

        if existing:
            if existing.status == 'cancelled':
                raise serializers.ValidationError('Bạn đã từng đặt và hủy lịch này trước đó!')
            else:
                raise serializers.ValidationError('Bạn đã đặt lịch này rồi!')
        return attrs

    def create(self, validated_data):
        # FIX: bắt lỗi nếu chưa có patient_profile
        try:
            patient = self.context['request'].user.patient_profile
        except Exception:
            raise serializers.ValidationError(
                'Tài khoản này chưa có hồ sơ bệnh nhân. Vui lòng liên hệ admin!'
            )
        return Appointment.objects.create(patient=patient, **validated_data)
# hủy lịch hẹn
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



#  NOTIFICATION
class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Notification
        fields = ['id', 'type', 'title', 'message', 'is_read', 'created_date']
        read_only_fields = ['type', 'title', 'message', 'created_date']


#  TEST RESULT
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
    specialty = serializers.CharField(
        source='appointment.schedule.doctor.specialty.name',
        read_only=True)

    class Meta:
        model  = MedicalRecord
        fields = [
            'id', 'doctor_name', 'work_date', 'specialty',
            'diagnosis', 'treatment', 'notes', 'follow_up',
            'test_results', 'created_date'
        ]


class AppointmentApproveSerializer(serializers.ModelSerializer):
    class Meta:
        model = Appointment
        fields = ['status', 'cancel_reason']

    def validate(self, attrs):
        # Kiểm tra nếu trạng thái hiện tại của lịch không phải là 'pending'
        if self.instance.status != 'pending':
            raise serializers.ValidationError('Lịch hẹn này đã được xử lý trước đó.')

        status = attrs.get('status')
        cancel_reason = attrs.get('cancel_reason')

        # Kiểm tra nếu từ chối thì bắt buộc phải nhập lý do
        if status == 'cancelled' and not cancel_reason:
            raise serializers.ValidationError({'cancel_reason': 'Vui lòng nhập lý do từ chối.'})

        return attrs
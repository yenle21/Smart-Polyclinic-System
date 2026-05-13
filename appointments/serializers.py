from rest_framework import serializers
from .models import Schedule, Appointment
from accounts.models import Doctor


class ScheduleSerializer(serializers.ModelSerializer):
    doctor_name = serializers.SerializerMethodField()
    doctor_avatar = serializers.SerializerMethodField()

    class Meta:
        model = Schedule
        fields = ['id', 'doctor', 'doctor_name', 'doctor_avatar', 'day_of_week', 'start_time', 'end_time',
                  'is_available']

    def get_doctor_name(self, obj):
        return obj.doctor.user.get_full_name()

    def get_doctor_avatar(self, obj):
        return obj.doctor.user.avatar.url if obj.doctor.user.avatar else None


class AppointmentSerializer(serializers.ModelSerializer):
    patient_name = serializers.CharField(source='patient.user.get_full_name', read_only=True)
    doctor_name = serializers.CharField(source='doctor.user.get_full_name', read_only=True)

    class Meta:
        model = Appointment
        fields = ['id', 'patient', 'patient_name', 'doctor', 'doctor_name', 'specialty',
                  'appointment_date', 'status', 'symptoms', 'notes', 'created_at']
        read_only_fields = ['patient', 'created_at']
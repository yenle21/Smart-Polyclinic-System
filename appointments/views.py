from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework import serializers
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.db.models import Q
from .models import Schedule, Appointment
from .serializers import ScheduleSerializer, AppointmentSerializer


class DoctorScheduleList(generics.ListAPIView):
    serializer_class = ScheduleSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        specialty_id = self.request.query_params.get('specialty')
        doctor_id = self.request.query_params.get('doctor')
        queryset = Schedule.objects.filter(is_available=True)

        if specialty_id:
            queryset = queryset.filter(doctor__specialty_id=specialty_id)
        if doctor_id:
            queryset = queryset.filter(doctor_id=doctor_id)

        return queryset.order_by('day_of_week', 'start_time')


class BookAppointment(generics.CreateAPIView):
    serializer_class = AppointmentSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        # Check user has patient profile
        if not hasattr(self.request.user, 'patient'):
            raise serializers.ValidationError("Bạn cần hoàn thiện hồ sơ bệnh nhân!")

        doctor_id = self.request.data['doctor']
        appointment_date = self.request.data['appointment_date']

        # Check slot conflict
        if Appointment.objects.filter(
                doctor_id=doctor_id,
                appointment_date=appointment_date
        ).exists():
            raise serializers.ValidationError("Khung giờ này đã được đặt!")

        serializer.save(patient=self.request.user.patient)


class MyAppointmentsList(generics.ListAPIView):
    serializer_class = AppointmentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        if hasattr(self.request.user, 'patient'):
            return self.request.user.patient.appointments.all()
        return Appointment.objects.none()
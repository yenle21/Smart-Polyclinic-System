from rest_framework import viewsets, generics, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import Schedule, Appointment, Notification, MedicalRecord
from .serializers import (
    ScheduleSerializer,
    AppointmentSerializer, AppointmentCreateSerializer, AppointmentCancelSerializer,
    NotificationSerializer,
    MedicalRecordSerializer,
)


# ─────────────────────────────────────────
#  SCHEDULE — Bệnh nhân xem lịch bác sĩ
# ─────────────────────────────────────────
class ScheduleViewSet(viewsets.ViewSet, generics.ListAPIView):
    serializer_class   = ScheduleSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = Schedule.objects.filter(active=True).select_related('doctor__user', 'doctor__specialty')

        # Filter theo bác sĩ: /schedules/?doctor=1
        doctor_id = self.request.query_params.get('doctor')
        if doctor_id:
            qs = qs.filter(doctor_id=doctor_id)

        # Filter theo ngày: /schedules/?date=2025-06-01
        date = self.request.query_params.get('date')
        if date:
            qs = qs.filter(work_date=date)

        return qs


# ─────────────────────────────────────────
#  APPOINTMENT — Bệnh nhân đặt/xem/huỷ lịch
# ─────────────────────────────────────────
class AppointmentViewSet(viewsets.ViewSet, generics.ListAPIView):
    serializer_class   = AppointmentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user

        # Bệnh nhân chỉ thấy lịch của mình
        if user.role == 'patient':
            return Appointment.objects.filter(
                patient=user.patient_profile, active=True
            ).select_related('schedule__doctor__user', 'schedule__doctor__specialty')

        # Bác sĩ thấy lịch của mình
        if user.role == 'doctor':
            return Appointment.objects.filter(
                schedule__doctor=user.doctor_profile, active=True
            ).select_related('patient__user', 'schedule')

        return Appointment.objects.filter(active=True)

    # POST /appointments/ — Đặt lịch mới
    def create(self, request):
        if request.user.role != 'patient':
            return Response({'detail': 'Chỉ bệnh nhân mới đặt lịch được.'}, status=403)

        serializer = AppointmentCreateSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        appointment = serializer.save()
        return Response(AppointmentSerializer(appointment).data, status=status.HTTP_201_CREATED)

    # PATCH /appointments/{id}/cancel/ — Huỷ lịch
    @action(detail=True, methods=['patch'], url_path='cancel')
    def cancel(self, request, pk=None):
        try:
            appointment = Appointment.objects.get(pk=pk, patient=request.user.patient_profile)
        except Appointment.DoesNotExist:
            return Response({'detail': 'Không tìm thấy lịch hẹn.'}, status=404)

        serializer = AppointmentCancelSerializer(appointment, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(AppointmentSerializer(appointment).data)


# ─────────────────────────────────────────
#  NOTIFICATION — Thông báo của bệnh nhân
# ─────────────────────────────────────────
class NotificationViewSet(viewsets.ViewSet, generics.ListAPIView):
    serializer_class   = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user, active=True)

    # PATCH /notifications/{id}/read/ — Đánh dấu đã đọc
    @action(detail=True, methods=['patch'], url_path='read')
    def mark_read(self, request, pk=None):
        try:
            notification = Notification.objects.get(pk=pk, user=request.user)
        except Notification.DoesNotExist:
            return Response({'detail': 'Không tìm thấy thông báo.'}, status=404)

        notification.is_read = True
        notification.save()
        return Response(NotificationSerializer(notification).data)


# ─────────────────────────────────────────
#  MEDICAL RECORD — Lịch sử khám bệnh
# ─────────────────────────────────────────
class MedicalRecordViewSet(viewsets.ViewSet, generics.ListAPIView):
    serializer_class   = MedicalRecordSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'patient':
            return MedicalRecord.objects.filter(
                appointment__patient=user.patient_profile
            ).select_related('appointment__schedule__doctor__user')

        if user.role == 'doctor':
            return MedicalRecord.objects.filter(
                appointment__schedule__doctor=user.doctor_profile
            )

        return MedicalRecord.objects.all()

    # GET /medical-records/{id}/ — Xem chi tiết 1 hồ sơ
    def retrieve(self, request, pk=None):
        try:
            record = self.get_queryset().get(pk=pk)
        except MedicalRecord.DoesNotExist:
            return Response({'detail': 'Không tìm thấy hồ sơ.'}, status=404)
        return Response(MedicalRecordSerializer(record).data)
from rest_framework import viewsets, generics, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import Schedule, Appointment, Notification, MedicalRecord
from .serializers import (
    ScheduleSerializer,
    AppointmentSerializer,
    AppointmentCreateSerializer,
    AppointmentCancelSerializer,
    AppointmentApproveSerializer,
    NotificationSerializer,
    MedicalRecordSerializer,
)
from accounts.models import Specialty, Doctor
from accounts.serializers import SpecialtySerializer, DoctorSerializer

class ScheduleViewSet(viewsets.ViewSet, generics.ListAPIView):

    queryset = Schedule.objects.filter(
        active=True
    ).select_related(
        'doctor__user',
        'doctor__specialty'
    )

    serializer_class = ScheduleSerializer

    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        query = self.queryset
        # tìm theo tên bác sĩ
        doctor_name = self.request.query_params.get('doctor')
        if doctor_name:
            query = query.filter(doctor__user__last_name__icontains=doctor_name)
        # lọc theo ngày
        date = self.request.query_params.get('date')

        if date:
            query = query.filter(work_date=date)
        # lọc theo chuyên khoa
        specialty_name = self.request.query_params.get('specialty')
        if specialty_name:
            query = query.filter(doctor__specialty__name__icontains=specialty_name )

        return query


class AppointmentViewSet(viewsets.ViewSet, generics.ListAPIView):
    queryset = Appointment.objects.filter(active=True)
    serializer_class = AppointmentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user

        if user.role == 'patient':
            return self.queryset.filter(
                patient=user.patient_profile
            ).select_related('schedule__doctor__user', 'schedule__doctor__specialty')

        if user.role == 'doctor':
            return self.queryset.filter(
                schedule__doctor=user.doctor_profile
            ).select_related('patient__user', 'schedule')

        # Nếu là nhân viên phòng khám (staff) hoặc admin, cho phép quản lý và xem tất cả lịch hẹn
        if user.role == 'staff' or user.is_superuser:
            return Appointment.objects.all()

        return self.queryset.none()

    # Bước 1: Chọn chuyên khoa
    @action(methods=['get'], url_path='specialties', detail=False)
    def specialties(self, request):
        specialties = Specialty.objects.filter(active=True)
        return Response(SpecialtySerializer(specialties, many=True).data, status=status.HTTP_200_OK)

    # Bước 2: Chọn bác sĩ theo chuyên khoa
    @action(methods=['get'], url_path='doctors', detail=False)
    def doctors(self, request):
        specialty_id = request.query_params.get('specialty_id')
        if not specialty_id:
            return Response({'detail': 'Vui lòng chọn chuyên khoa!'}, status=status.HTTP_400_BAD_REQUEST)

        doctors = Doctor.objects.filter(
            specialty_id=specialty_id, active=True
        ).select_related('user', 'specialty')
        return Response(DoctorSerializer(doctors, many=True).data, status=status.HTTP_200_OK)

    # Bước 3: Chọn lịch trống của bác sĩ
    @action(methods=['get'], url_path='schedules', detail=False)
    def schedules(self, request):
        doctor_id = request.query_params.get('doctor_id')
        if not doctor_id:
            return Response({'detail': 'Vui lòng chọn bác sĩ!'}, status=status.HTTP_400_BAD_REQUEST)

        qs = Schedule.objects.filter(
            doctor_id=doctor_id, active=True
        ).select_related('doctor__user', 'doctor__specialty')

        date = request.query_params.get('date')
        if date:
            qs = qs.filter(work_date=date)

        qs = [s for s in qs if s.available_slots() > 0]
        return Response(ScheduleSerializer(qs, many=True).data, status=status.HTTP_200_OK)

    # Bước 4: Đặt lịch hẹn
    @action(methods=['post'], url_path='book', detail=False)
    def book(self, request):
        if request.user.role != 'patient':
            return Response({'detail': 'Chỉ bệnh nhân mới được đặt lịch.'}, status=status.HTTP_403_FORBIDDEN)

        s = AppointmentCreateSerializer(data=request.data, context={'request': request})
        s.is_valid(raise_exception=True)
        appointment = s.save()

        Notification.objects.create(
            user=request.user,
            appointment=appointment,
            type='reminder',
            title='Đặt lịch thành công',
            message=f'Bạn đã đặt lịch khám thành công vào ngày {appointment.schedule.work_date} lúc {appointment.appointment_time}.',
        )

        return Response(AppointmentSerializer(appointment).data, status=status.HTTP_201_CREATED)

    # Xem chi tiết lịch hẹn
    @action(methods=['get'], url_path='detail', detail=True)
    def get_detail(self, request, pk=None):
        try:
            appointment = self.get_queryset().get(pk=pk)
        except Appointment.DoesNotExist:
            return Response({'detail': 'Không tìm thấy lịch hẹn.'}, status=status.HTTP_404_NOT_FOUND)

        return Response(AppointmentSerializer(appointment).data, status=status.HTTP_200_OK)

    # Huỷ lịch hẹn
    @action(methods=['patch'], url_path='cancel', detail=True)
    def cancel(self, request, pk=None):
        try:
            appointment = Appointment.objects.get(pk=pk, patient=request.user.patient_profile)
        except Appointment.DoesNotExist:
            return Response({'detail': 'Không tìm thấy lịch hẹn.'}, status=status.HTTP_404_NOT_FOUND)

        s = AppointmentCancelSerializer(appointment, data=request.data, partial=True)
        s.is_valid(raise_exception=True)
        s.save()

        Notification.objects.create(
            user=request.user,
            appointment=appointment,
            type='cancelled',
            title='Lịch hẹn đã bị huỷ',
            message=f'Lịch khám ngày {appointment.schedule.work_date} lúc {appointment.appointment_time} đã được huỷ.',
        )

        return Response(AppointmentSerializer(appointment).data, status=status.HTTP_200_OK)

    # Đổi lịch hẹn
    @action(methods=['patch'], url_path='change-schedule', detail=True)
    def change_schedule(self, request, pk=None):
        if request.user.role != 'patient':
            return Response({'detail': 'Chỉ bệnh nhân mới được đổi lịch hẹn.'}, status=status.HTTP_403_FORBIDDEN)

        try:
            appointment = Appointment.objects.get(pk=pk, patient=request.user.patient_profile, active=True)
        except Appointment.DoesNotExist:
            return Response({'detail': 'Không tìm thấy lịch hẹn.'}, status=status.HTTP_404_NOT_FOUND)

        if appointment.status not in ['pending', 'confirmed']:
            return Response({'detail': 'Lịch hẹn đã hoàn thành hoặc đã huỷ, không thể thay đổi.'},
                            status=status.HTTP_400_BAD_REQUEST)

        new_schedule_id = request.data.get('new_schedule_id')
        if not new_schedule_id:
            return Response({'detail': 'Vui lòng chọn lịch khám mới!'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            new_schedule = Schedule.objects.get(pk=new_schedule_id, active=True)
        except Schedule.DoesNotExist:
            return Response({'detail': 'Lịch khám mới không tồn tại.'}, status=status.HTTP_404_NOT_FOUND)

        if new_schedule.available_slots() <= 0:
            return Response({'detail': 'Lịch khám mới đã hết chỗ trống!'}, status=status.HTTP_400_BAD_REQUEST)

        appointment.schedule = new_schedule
        appointment.status = 'pending'
        appointment.save()

        Notification.objects.create(
            user=request.user,
            appointment=appointment,
            type='reminder',
            title='Đổi lịch hẹn thành công',
            message=f'Lịch khám của bạn đã được đổi sang ngày {new_schedule.work_date} lúc {appointment.appointment_time}.',
        )

        return Response(AppointmentSerializer(appointment).data, status=status.HTTP_200_OK)

    # Duyệt / từ chối lịch hẹn (staff + doctor)
    @action(methods=['patch'], url_path='approve', detail=True)
    def approve(self, request, pk=None):
        user = request.user

        # Chỉ cần kiểm tra xem role là staff hoặc doctor
        is_clinic_staff = (user.role == 'staff')
        is_doctor = (user.role == 'doctor')

        if not (is_clinic_staff or is_doctor or user.is_superuser):
            return Response({'detail': 'Bạn không có quyền thực hiện thao tác này.'}, status=status.HTTP_403_FORBIDDEN)

        try:
            appointment = self.get_queryset().get(pk=pk)
        except Appointment.DoesNotExist:
            return Response({'detail': 'Không tìm thấy lịch hẹn.'}, status=status.HTTP_404_NOT_FOUND)

        s = AppointmentApproveSerializer(appointment, data=request.data, partial=True)
        s.is_valid(raise_exception=True)
        s.save()

        # Thông báo cho bệnh nhân sau khi duyệt
        new_status = request.data.get('status')
        if new_status == 'confirmed':
            Notification.objects.create(
                user=appointment.patient.user,
                appointment=appointment,
                type='reminder',
                title='Lịch hẹn đã được xác nhận',
                message=f'Lịch khám ngày {appointment.schedule.work_date} lúc {appointment.appointment_time} đã được xác nhận.',
            )
        elif new_status == 'cancelled':
            Notification.objects.create(
                user=appointment.patient.user,
                appointment=appointment,
                type='cancelled',
                title='Lịch hẹn bị từ chối',
                message=f'Lịch khám ngày {appointment.schedule.work_date} lúc {appointment.appointment_time} đã bị từ chối.',
            )

        return Response(AppointmentSerializer(appointment).data, status=status.HTTP_200_OK)


class NotificationViewSet(viewsets.ViewSet, generics.ListAPIView):
    queryset = Notification.objects.filter(active=True)
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return self.queryset.filter(user=self.request.user)

    @action(methods=['patch'], url_path='read-all', detail=False)
    def mark_all_read(self, request):
        self.get_queryset().filter(is_read=False).update(is_read=True)
        return Response({'detail': 'Đã đánh dấu tất cả là đã đọc.'}, status=status.HTTP_200_OK)

    @action(methods=['patch'], url_path='read', detail=True)
    def mark_read(self, request, pk=None):
        try:
            notification = self.get_queryset().get(pk=pk)
        except Notification.DoesNotExist:
            return Response({'detail': 'Không tìm thấy thông báo.'}, status=status.HTTP_404_NOT_FOUND)

        notification.is_read = True
        notification.save()
        return Response(NotificationSerializer(notification).data, status=status.HTTP_200_OK)


class MedicalRecordViewSet(viewsets.ViewSet, generics.ListAPIView):
    queryset = MedicalRecord.objects.all()
    serializer_class = MedicalRecordSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user

        if user.role == 'patient':
            return self.queryset.filter(
                appointment__patient=user.patient_profile
            ).select_related('appointment__schedule__doctor__user')

        if user.role == 'doctor':
            return self.queryset.filter(
                appointment__schedule__doctor=user.doctor_profile
            )

        # Toàn bộ nhân viên phòng khám (staff) được xem danh sách hồ sơ bệnh án để phục vụ phát thuốc/lấy bệnh phẩm
        if user.role == 'staff':
            return self.queryset.select_related('appointment__patient__user')

        return MedicalRecord.objects.none()

    # Cập nhật hồ sơ / kết quả xét nghiệm
    @action(methods=['patch'], url_path='update-result', detail=True)
    def update_result(self, request, pk=None):
        user = request.user
        is_doctor = (user.role == 'doctor')
        is_clinic_staff = (user.role == 'staff')

        if not (is_doctor or is_clinic_staff):
            return Response({'detail': 'Chỉ bác sĩ hoặc nhân viên phòng khám mới được cập nhật hồ sơ.'},
                            status=status.HTTP_403_FORBIDDEN)

        try:
            record = self.get_queryset().get(pk=pk)
        except MedicalRecord.DoesNotExist:
            return Response({'detail': 'Không tìm thấy hồ sơ.'}, status=status.HTTP_404_NOT_FOUND)

        s = MedicalRecordSerializer(record, data=request.data, partial=True)
        s.is_valid(raise_exception=True)
        s.save()
        return Response(MedicalRecordSerializer(record).data, status=status.HTTP_200_OK)

    # Xem chi tiết hồ sơ
    @action(methods=['get'], url_path='detail', detail=True)
    def get_detail(self, request, pk=None):
        try:
            record = self.get_queryset().get(pk=pk)
        except MedicalRecord.DoesNotExist:
            return Response({'detail': 'Không tìm thấy hồ sơ.'}, status=status.HTTP_404_NOT_FOUND)

        return Response(MedicalRecordSerializer(record).data, status=status.HTTP_200_OK)
from rest_framework import viewsets, generics, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import Schedule, Appointment, Notification, MedicalRecord, TestResult
from .serializers import (
    ScheduleSerializer,
    AppointmentSerializer,
    AppointmentCreateSerializer,
    AppointmentCancelSerializer,
    AppointmentApproveSerializer,
    NotificationSerializer,
    MedicalRecordSerializer,
    MedicalRecordCreateSerializer, TestResultSerializer,
)
from accounts.models import Specialty, Doctor
from accounts.serializers import SpecialtySerializer, DoctorSerializer


class ScheduleViewSet(viewsets.ViewSet, generics.ListAPIView):

    queryset = Schedule.objects.filter(
        active=True
    ).select_related('doctor__user', 'doctor__specialty')

    serializer_class   = ScheduleSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class   = None

    def get_queryset(self):
        query = self.queryset
        user  = self.request.user

        if user.role == 'doctor':
            try:
                query = query.filter(doctor=user.doctor_profile)
            except Exception:
                return query.none()

        doctor_name = self.request.query_params.get('doctor')
        if doctor_name:
            query = query.filter(doctor__user__last_name__icontains=doctor_name)

        date = self.request.query_params.get('date')
        if date:
            query = query.filter(work_date=date)

        specialty_name = self.request.query_params.get('specialty')
        if specialty_name:
            query = query.filter(doctor__specialty__name__icontains=specialty_name)

        return query

    def create(self, request):
        try:
            doctor = request.user.doctor_profile
        except Exception:
            return Response({'detail': 'User này không phải bác sĩ'}, status=status.HTTP_403_FORBIDDEN)

        serializer = ScheduleSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(doctor=doctor)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def partial_update(self, request, pk=None):
        try:
            schedule = Schedule.objects.get(pk=pk, doctor=request.user.doctor_profile)
        except Schedule.DoesNotExist:
            return Response({'detail': 'Không tìm thấy lịch'}, status=status.HTTP_404_NOT_FOUND)
        except Exception:
            return Response({'detail': 'User này không phải bác sĩ'}, status=status.HTTP_403_FORBIDDEN)

        serializer = ScheduleSerializer(schedule, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def destroy(self, request, pk=None):
        try:
            schedule = Schedule.objects.get(pk=pk, doctor=request.user.doctor_profile)
        except Schedule.DoesNotExist:
            return Response({'detail': 'Không tìm thấy lịch'}, status=status.HTTP_404_NOT_FOUND)
        except Exception:
            return Response({'detail': 'User này không phải bác sĩ'}, status=status.HTTP_403_FORBIDDEN)

        schedule.active = False
        schedule.save()
        return Response(status=status.HTTP_204_NO_CONTENT)


class AppointmentViewSet(viewsets.ViewSet, generics.ListAPIView):
    queryset           = Appointment.objects.filter(active=True)
    serializer_class   = AppointmentSerializer
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

        if user.role == 'staff' or user.is_superuser:
            return Appointment.objects.all()

        return self.queryset.none()

    @action(methods=['get'], url_path='specialties', detail=False)
    def specialties(self, request):
        specialties = Specialty.objects.filter(active=True)
        return Response(SpecialtySerializer(specialties, many=True).data)

    @action(methods=['get'], url_path='doctors', detail=False)
    def doctors(self, request):
        specialty_id = request.query_params.get('specialty_id')
        if not specialty_id:
            return Response({'detail': 'Vui lòng chọn chuyên khoa!'}, status=status.HTTP_400_BAD_REQUEST)

        doctors = Doctor.objects.filter(
            specialty_id=specialty_id, active=True
        ).select_related('user', 'specialty')
        return Response(DoctorSerializer(doctors, many=True).data)

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
        return Response(ScheduleSerializer(qs, many=True).data)

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

    @action(methods=['get'], url_path='detail', detail=True)
    def get_detail(self, request, pk=None):
        try:
            appointment = self.get_queryset().get(pk=pk)
        except Appointment.DoesNotExist:
            return Response({'detail': 'Không tìm thấy lịch hẹn.'}, status=status.HTTP_404_NOT_FOUND)
        return Response(AppointmentSerializer(appointment).data)

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

        return Response(AppointmentSerializer(appointment).data)

    @action(methods=['patch'], url_path='change-schedule', detail=True)
    def change_schedule(self, request, pk=None):
        if request.user.role != 'patient':
            return Response({'detail': 'Chỉ bệnh nhân mới được đổi lịch hẹn.'}, status=status.HTTP_403_FORBIDDEN)

        try:
            appointment = Appointment.objects.get(pk=pk, patient=request.user.patient_profile, active=True)
        except Appointment.DoesNotExist:
            return Response({'detail': 'Không tìm thấy lịch hẹn.'}, status=status.HTTP_404_NOT_FOUND)

        if appointment.status not in ['pending', 'confirmed']:
            return Response({'detail': 'Lịch hẹn đã hoàn thành hoặc đã huỷ, không thể thay đổi.'}, status=status.HTTP_400_BAD_REQUEST)

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
        appointment.status   = 'pending'
        appointment.save()

        Notification.objects.create(
            user=request.user,
            appointment=appointment,
            type='reminder',
            title='Đổi lịch hẹn thành công',
            message=f'Lịch khám của bạn đã được đổi sang ngày {new_schedule.work_date} lúc {appointment.appointment_time}.',
        )

        return Response(AppointmentSerializer(appointment).data)

    @action(methods=['patch'], detail=True, url_path='complete')
    def complete(self, request, pk=None):
        appointment        = self.get_object()
        appointment.status = 'completed'
        appointment.save()
        return Response({'message': 'Appointment completed'}, status=status.HTTP_200_OK)

    @action(methods=['patch'], url_path='approve', detail=True)
    def approve(self, request, pk=None):
        user = request.user

        if not (user.role in ['staff', 'doctor'] or user.is_superuser):
            return Response({'detail': 'Bạn không có quyền thực hiện thao tác này.'}, status=status.HTTP_403_FORBIDDEN)

        try:
            appointment = self.get_queryset().get(pk=pk)
        except Appointment.DoesNotExist:
            return Response({'detail': 'Không tìm thấy lịch hẹn.'}, status=status.HTTP_404_NOT_FOUND)

        s = AppointmentApproveSerializer(appointment, data=request.data, partial=True)
        s.is_valid(raise_exception=True)
        s.save()

        new_status = request.data.get('status')
        if new_status == 'confirmed':
            Notification.objects.create(
                user=appointment.patient.user, appointment=appointment,
                type='reminder', title='Lịch hẹn đã được xác nhận',
                message=f'Lịch khám ngày {appointment.schedule.work_date} lúc {appointment.appointment_time} đã được xác nhận.',
            )
        elif new_status == 'cancelled':
            Notification.objects.create(
                user=appointment.patient.user, appointment=appointment,
                type='cancelled', title='Lịch hẹn bị từ chối',
                message=f'Lịch khám ngày {appointment.schedule.work_date} lúc {appointment.appointment_time} đã bị từ chối.',
            )

        return Response(AppointmentSerializer(appointment).data)


class NotificationViewSet(viewsets.ViewSet, generics.ListAPIView):
    queryset           = Notification.objects.filter(active=True)
    serializer_class   = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return self.queryset.filter(user=self.request.user)

    @action(methods=['patch'], url_path='read-all', detail=False)
    def mark_all_read(self, request):
        self.get_queryset().filter(is_read=False).update(is_read=True)
        return Response({'detail': 'Đã đánh dấu tất cả là đã đọc.'})

    @action(methods=['patch'], url_path='read', detail=True)
    def mark_read(self, request, pk=None):
        try:
            notification = self.get_queryset().get(pk=pk)
        except Notification.DoesNotExist:
            return Response({'detail': 'Không tìm thấy thông báo.'}, status=status.HTTP_404_NOT_FOUND)

        notification.is_read = True
        notification.save()
        return Response(NotificationSerializer(notification).data)


class MedicalRecordViewSet(viewsets.ViewSet, generics.ListCreateAPIView):
    queryset = MedicalRecord.objects.all()
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return MedicalRecordCreateSerializer
        return MedicalRecordSerializer

    def get_queryset(self):
        user = self.request.user
        query = self.queryset

        if user.role == 'patient':
            query = query.filter(
                appointment__patient=user.patient_profile
            ).select_related(
                'appointment__schedule__doctor__user'
            )

        elif user.role == 'doctor':
            query = query.filter(
                appointment__schedule__doctor=user.doctor_profile
            ).select_related(
                'appointment__patient__user',
                'appointment__schedule__doctor__specialty'
            )

        elif user.role == 'staff' or user.is_superuser:
            query = query.select_related(
                'appointment__patient__user'
            )

        else:
            return MedicalRecord.objects.none()

        appointment_id = self.request.query_params.get('appointment_id')
        if appointment_id:
            query = query.filter(appointment_id=appointment_id)

        return query

    # =========================
    # CREATE MEDICAL RECORD
    # =========================
    @action(methods=['post'], detail=False, url_path='create-record')
    def create_record(self, request):

        if request.user.role != 'doctor':
            return Response(
                {'detail': 'Chỉ bác sĩ mới được tạo hồ sơ bệnh án.'},
                status=status.HTTP_403_FORBIDDEN
            )

        serializer = MedicalRecordCreateSerializer(
            data=request.data,
            context={'request': request}
        )

        serializer.is_valid(raise_exception=True)

        appointment_id = request.data.get('appointment')

        try:
            appointment = Appointment.objects.get(
                pk=appointment_id,
                schedule__doctor=request.user.doctor_profile
            )
        except Appointment.DoesNotExist:
            return Response(
                {'detail': 'Không tìm thấy lịch khám.'},
                status=status.HTTP_404_NOT_FOUND
            )

        # kiểm tra đã có hồ sơ chưa
        if MedicalRecord.objects.filter(
            appointment=appointment
        ).exists():
            return Response(
                {'detail': 'Lịch khám này đã có hồ sơ bệnh án.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        record = serializer.save()

        # cập nhật trạng thái lịch khám
        appointment.status = 'completed'
        appointment.save()

        return Response(
            MedicalRecordSerializer(record).data,
            status=status.HTTP_201_CREATED
        )

    @action(methods=['get', 'post'], detail=True, url_path='test-results')
    def test_results(self, request, pk=None):

        try:
            record = self.get_queryset().get(pk=pk)
        except MedicalRecord.DoesNotExist:
            return Response(
                {'detail': 'Không tìm thấy hồ sơ bệnh án.'},
                status=status.HTTP_404_NOT_FOUND
            )

        # GET — lấy danh sách
        if request.method == 'GET':
            results = TestResult.objects.filter(medical_record=record)
            return Response(
                TestResultSerializer(results, many=True).data
            )

        # POST — thêm mới
        if request.user.role != 'doctor':
            return Response(
                {'detail': 'Chỉ bác sĩ mới được thêm kết quả xét nghiệm.'},
                status=status.HTTP_403_FORBIDDEN
            )

        serializer = TestResultSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(medical_record=record)

        return Response(
            serializer.data,
            status=status.HTTP_201_CREATED
        )

    # =========================
    # UPDATE MEDICAL RECORD
    # =========================
    @action(methods=['patch'], detail=True, url_path='update-record')
    def update_record(self, request, pk=None):

        if request.user.role != 'doctor':
            return Response(
                {'detail': 'Chỉ bác sĩ mới được cập nhật hồ sơ bệnh án.'},
                status=status.HTTP_403_FORBIDDEN
            )

        try:
            record = MedicalRecord.objects.get(
                pk=pk,
                appointment__schedule__doctor=request.user.doctor_profile
            )
        except MedicalRecord.DoesNotExist:
            return Response(
                {'detail': 'Không tìm thấy hồ sơ bệnh án.'},
                status=status.HTTP_404_NOT_FOUND
            )

        serializer = MedicalRecordSerializer(
            record,
            data=request.data,
            partial=True
        )

        serializer.is_valid(raise_exception=True)
        serializer.save()

        return Response(
            MedicalRecordSerializer(record).data,
            status=status.HTTP_200_OK
        )

    # =========================
    # DETAIL
    # =========================
    @action(methods=['get'], url_path='detail', detail=True)
    def get_detail(self, request, pk=None):
        try:
            record = self.get_queryset().get(pk=pk)
        except MedicalRecord.DoesNotExist:
            return Response(
                {'detail': 'Không tìm thấy hồ sơ.'},
                status=status.HTTP_404_NOT_FOUND
            )

        return Response(MedicalRecordSerializer(record).data)


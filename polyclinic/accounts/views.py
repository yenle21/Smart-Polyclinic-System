from django.core.exceptions import ObjectDoesNotExist
from django.shortcuts import render
from rest_framework import viewsets, generics, parsers, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from .permissions import IsAdminRole, IsOwnerOrAdmin
from .models import User, Doctor, Patient, Specialty
from .serializers import UserSerializer, DoctorSerializer, PatientProfileSerializer, PatientUpdateSerializer, CreateDoctorSerializer, CreateStaffSerializer, SpecialtySerializer


class UserViewSet(viewsets.ViewSet, generics.ListAPIView,generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer

    def get_permissions(self):
        if self.action in ['create']:
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]
     # xem và cập nhật thông tin of user đang đăng nhập
    @action(methods=['get', 'patch'], url_path='current-user', detail=False,
            permission_classes=[IsOwnerOrAdmin])
    def current_user(self, request):
        u = request.user
        if request.method == 'PATCH':
            s = UserSerializer(u, data=request.data, partial=True)
            s.is_valid(raise_exception=True)
            u = s.save()
        return Response(UserSerializer(u).data, status=status.HTTP_200_OK)

    @action(methods=['post'], url_path='create-doctor', detail=False,
            permission_classes=[IsAdminRole])
    def create_doctor(self, request):
        s = CreateDoctorSerializer(data=request.data)
        s.is_valid(raise_exception=True)
        s.save()
        return Response({'message': 'Tạo tài khoản bác sĩ thành công!'}, status=status.HTTP_201_CREATED)

    @action(methods=['post'], url_path='create-staff', detail=False,
            permission_classes=[IsAdminRole])
    def create_staff(self, request):
        s = CreateStaffSerializer(data=request.data)
        s.is_valid(raise_exception=True)
        s.save()
        return Response({'message': 'Tạo tài khoản nhân viên thành công!'}, status=status.HTTP_201_CREATED)

class SpecialtyViewSet(viewsets.ViewSet, generics.ListAPIView):
    queryset         = Specialty.objects.filter(active=True)
    serializer_class = SpecialtySerializer

class DoctorViewSet(viewsets.ViewSet, generics.ListAPIView):
    queryset = Doctor.objects.filter(active=True)
    serializer_class = DoctorSerializer


class PatientViewSet(viewsets.ViewSet, generics.ListAPIView):
    queryset = Patient.objects.all()
    serializer_class = PatientProfileSerializer
    parser_classes = [parsers.MultiPartParser]
    # xem và cập nhật hồ sơ bệnh nhân đang đăng nhập
    @action(methods=['get', 'patch'], url_path='profile', detail=False,
            permission_classes=[permissions.IsAuthenticated])
    def profile(self, request):
        try:
            patient = request.user.patient_profile
        except ObjectDoesNotExist:
            if request.method == 'PATCH':
                patient = Patient.objects.create(user=request.user)
            else:
                return Response(
                    {'detail': 'Tài khoản này chưa có hồ sơ bệnh nhân.'},
                    status=status.HTTP_404_NOT_FOUND
                )
        if request.method == 'PATCH':
            s = PatientUpdateSerializer(patient, data=request.data, partial=True)
            s.is_valid(raise_exception=True)
            patient = s.save()
        return Response(PatientProfileSerializer(patient).data, status=status.HTTP_200_OK)
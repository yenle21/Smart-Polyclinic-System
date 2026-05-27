from django.core.exceptions import ObjectDoesNotExist
from django.shortcuts import render
from rest_framework import viewsets, generics, parsers, permissions, status
from rest_framework.decorators import action
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.response import Response
from rest_framework.views import APIView
from .permissions import IsAdminRole, IsOwnerOrAdmin
from .models import User, Doctor, Patient, Specialty
from .serializers import UserSerializer, DoctorSerializer, PatientProfileSerializer, PatientUpdateSerializer, \
    CreateDoctorSerializer, CreateStaffSerializer, SpecialtySerializer, CreatePharmacySerializer

from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import RefreshToken
from polyclinic import settings
import requests as http_requests


class UserViewSet(viewsets.ViewSet, generics.ListAPIView, generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer

    def get_permissions(self):
        if self.action in ['create']:
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]

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
            permission_classes=[IsAdminRole], parser_classes=[MultiPartParser, FormParser])
    def create_doctor(self, request):
        s = CreateDoctorSerializer(data=request.data)
        s.is_valid(raise_exception=True)
        s.save()
        return Response({'message': 'Tạo tài khoản bác sĩ thành công!'}, status=status.HTTP_201_CREATED)

    @action(methods=['post'], url_path='create-staff', detail=False,
            permission_classes=[IsAdminRole], parser_classes=[MultiPartParser, FormParser])
    def create_staff(self, request):
        s = CreateStaffSerializer(data=request.data)
        s.is_valid(raise_exception=True)
        s.save()
        return Response({'message': 'Tạo tài khoản nhân viên thành công!'}, status=status.HTTP_201_CREATED)

    @action(methods=['post'], url_path='create-pharmacy', detail=False,
            permission_classes=[IsAdminRole], parser_classes=[MultiPartParser, FormParser])
    def create_pharmacy(self, request):
        s = CreatePharmacySerializer(data=request.data)
        s.is_valid(raise_exception=True)
        s.save()
        return Response({'message': 'Tạo tài khoản dược sĩ thành công!'}, status=status.HTTP_201_CREATED)


class SpecialtyViewSet(viewsets.ViewSet, generics.ListAPIView):
    queryset = Specialty.objects.filter(active=True)
    serializer_class = SpecialtySerializer


class DoctorViewSet(viewsets.ViewSet, generics.ListAPIView):
    queryset = Doctor.objects.filter(active=True)
    serializer_class = DoctorSerializer


class PatientViewSet(viewsets.ViewSet, generics.ListAPIView):
    queryset = Patient.objects.all()
    serializer_class = PatientProfileSerializer
    parser_classes = [parsers.MultiPartParser]

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


User = get_user_model()


class GoogleLoginView(APIView):
    permission_classes = []

    def post(self, request):
        access_token = request.data.get('access_token')

        if not access_token:
            return Response({'error': 'Thiếu access_token.'}, status=400)

        try:
            # ✅ Gọi Google API để lấy thông tin user từ access_token
            r = http_requests.get(
                'https://www.googleapis.com/oauth2/v3/userinfo',
                headers={'Authorization': f'Bearer {access_token}'},
                timeout=10,
            )
            if r.status_code != 200:
                return Response({'error': 'Token không hợp lệ hoặc đã hết hạn.'}, status=400)

            info = r.json()

        except Exception as e:
            return Response({'error': f'Không thể xác thực token: {str(e)}'}, status=400)

        email   = info.get('email')
        name    = info.get('name', '')
        picture = info.get('picture', '')

        if not email:
            return Response({'error': 'Không lấy được email từ Google.'}, status=400)

        # Tạo user nếu chưa có, mặc định role là patient
        user, created = User.objects.get_or_create(
            email=email,
            defaults={'username': email, 'first_name': name, 'role': 'patient'}
        )

        # ✅ Nếu user đã tồn tại nhưng không phải patient → từ chối
        if user.role != 'patient':
            return Response(
                {'error': 'Chỉ bệnh nhân mới được đăng nhập bằng Google.'},
                status=status.HTTP_403_FORBIDDEN
            )

        # Trả JWT
        refresh = RefreshToken.for_user(user)
        return Response({
            'access':  str(refresh.access_token),
            'refresh': str(refresh),
            'user': {
                'id':      user.id,
                'email':   email,
                'name':    name,
                'picture': picture,
            }
        })
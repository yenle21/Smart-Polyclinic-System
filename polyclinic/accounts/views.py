from django.core.exceptions import ObjectDoesNotExist
from rest_framework import viewsets, generics, parsers, permissions, status
from rest_framework.decorators import action
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.response import Response
from rest_framework.views import APIView
from oauth2_provider.models import AccessToken, Application
from django.utils import timezone
from datetime import timedelta
import secrets

from .permissions import IsAdminRole, IsOwnerOrAdmin
from .models import User, Doctor, Patient, Specialty
from .serializers import (
    UserSerializer, DoctorSerializer, PatientProfileSerializer,
    PatientUpdateSerializer, CreateDoctorSerializer, CreateStaffSerializer,
    SpecialtySerializer, CreatePharmacySerializer
)

from django.contrib.auth import get_user_model
import requests as http_requests

User = get_user_model()


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


class GoogleLoginView(APIView):

    permission_classes = []

    OAUTH2_CLIENT_ID = 'Qo0xwsPc00Wama0YySwi81z1jfnjPbUxi6xYc5H1'

    def post(self, request):
        id_token_str = request.data.get('id_token')

        if not id_token_str:
            return Response({'error': 'Thiếu id_token.'}, status=400)

        # ── 1. Verify id_token với Google ──────────────────────────────
        try:
            r = http_requests.get(
                f'https://oauth2.googleapis.com/tokeninfo?id_token={id_token_str}',
                timeout=10,
            )
            if r.status_code != 200:
                return Response(
                    {'error': 'Google token không hợp lệ hoặc đã hết hạn.'},
                    status=400
                )
            info = r.json()

        except Exception as e:
            return Response(
                {'error': f'Không thể xác thực với Google: {str(e)}'},
                status=400
            )

        email   = info.get('email')
        name    = info.get('name', '')
        picture = info.get('picture', '')

        if not email:
            return Response({'error': 'Không lấy được email từ Google.'}, status=400)


        user, created = User.objects.get_or_create(
            email=email,
            defaults={
                'username':   email,
                'first_name': name,
                'role':       'patient',
            }
        )

        # Nếu user đã tồn tại nhưng không phải patient → từ chối
        if user.role != 'patient':
            return Response(
                {'error': 'Tài khoản này không phải bệnh nhân. Vui lòng đăng nhập bằng username/password.'},
                status=status.HTTP_403_FORBIDDEN
            )

        # ── 3. Tạo OAuth2 Access Token ─────────────────────────────────
        try:
            app = Application.objects.get(client_id=self.OAUTH2_CLIENT_ID)
        except Application.DoesNotExist:
            return Response(
                {'error': 'OAuth2 Application không tồn tại. Liên hệ admin.'},
                status=500
            )

        # Xoá token cũ của user này (tránh tích luỹ)
        AccessToken.objects.filter(user=user, application=app).delete()

        # Tạo token mới với expire 1 giờ (giống cấu hình OAUTH2_PROVIDER)
        oauth2_token = AccessToken.objects.create(
            user=user,
            application=app,
            token=secrets.token_urlsafe(40),
            expires=timezone.now() + timedelta(seconds=3600),
            scope='read write',
        )

        # ── 4. Trả response ────────────────────────────────────────────
        # Dùng key 'access_token' giống /o/token/ để app xử lý thống nhất
        return Response({
            'access_token': oauth2_token.token,
            'token_type':   'Bearer',
            'expires_in':   3600,
            'scope':        'read write',
            'user': {
                'id':      user.id,
                'email':   email,
                'name':    name,
                'picture': picture,
                'role':    user.role,
            }
        })
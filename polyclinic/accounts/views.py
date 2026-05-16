from django.shortcuts import render
from rest_framework import viewsets, generics, parsers, permissions, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import User, Doctor, Patient
from .serializers import UserSerializer, DoctorSerializer, PatientSerializer, RegisterSerializer, \
    PatientProfileSerializer, PatientUpdateSerializer


class UserViewSet(viewsets.ViewSet, generics.ListAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    parser_classes = [parsers.MultiPartParser]

    @action(methods=['get', 'patch'], url_path='current-user', detail=False,
            permission_classes=[permissions.IsAuthenticated])
    def current_user(self, request):
        u = request.user
        if request.method == 'PATCH':
            s = UserSerializer(u, data=request.data, partial=True)
            s.is_valid(raise_exception=True)
            u = s.save()
        return Response(UserSerializer(u).data, status=status.HTTP_200_OK)


class DoctorViewSet(viewsets.ViewSet, generics.ListAPIView):
    queryset = Doctor.objects.filter(active=True)
    serializer_class = DoctorSerializer


class PatientViewSet(viewsets.ViewSet, generics.ListAPIView):
    queryset = Patient.objects.filter(active=True)
    serializer_class = PatientSerializer


class PatientsMe(APIView):  # ← đổi tên
    permission_classes = [IsAuthenticated]

    def get(self, request):
        patient = request.user.patient_profile
        serializer = PatientProfileSerializer(patient)
        return Response(serializer.data)

    def patch(self, request):
        patient = request.user.patient_profile
        serializer = PatientUpdateSerializer(patient, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(PatientProfileSerializer(patient).data)


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
from django.shortcuts import render
from rest_framework import viewsets,generics
from .models import User, Doctor, Patient
from .serializers import UserSerializer, DoctorSerializer, PatientSerializer, RegisterSerializer


# Create your views here.
class UserViewSet(viewsets.ViewSet, generics.ListAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer

class DoctorViewSet(viewsets.ViewSet, generics.ListAPIView):
    queryset = Doctor.objects.filter(active=True)
    serializer_class = DoctorSerializer

class PatientViewSet(viewsets.ViewSet, generics.ListAPIView):
    queryset = Patient.objects.filter(active=True)
    serializer_class = PatientSerializer

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
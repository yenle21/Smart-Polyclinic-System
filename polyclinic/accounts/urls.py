
from django.contrib import admin
from django.urls import path, include
from rest_framework import routers
from . import views
from .views import RegisterView

router = routers.DefaultRouter()
router.register('users',views.UserViewSet, basename='users')
router.register('doctors',views.DoctorViewSet, basename='doctors')
router.register('patients',views.PatientViewSet, basename='patients')

urlpatterns = [
    path('',include(router.urls)),
    path('users/register/', RegisterView.as_view(), name='register'),
]


from django.urls import path, include
from rest_framework import routers
from . import views
from .views import RegisterView, PatientsMe  # ← đổi tên

router = routers.DefaultRouter()
router.register('users', views.UserViewSet, basename='users')
router.register('doctors', views.DoctorViewSet, basename='doctors')
router.register('patients', views.PatientViewSet, basename='patients')
from appointments.urls import router as appointments_router
router.registry.extend(appointments_router.registry)  # ← gộp vào đây


urlpatterns = [
    path('', include(router.urls)),
    path('users/register/', RegisterView.as_view(), name='register'),
    path('patients/profile/', PatientsMe.as_view(), name='patient-profile'),  # ← đổi tên
]
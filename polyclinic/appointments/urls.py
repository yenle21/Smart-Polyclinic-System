from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register('schedules', views.ScheduleViewSet, basename='schedules')
router.register('appointments', views.AppointmentViewSet, basename='appointments')
router.register('notifications', views.NotificationViewSet, basename='notifications')
router.register('medical-records', views.MedicalRecordViewSet, basename='medical-records')

urlpatterns = [
    path('', include(router.urls)),
]
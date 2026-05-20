from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views
from .views import DoctorDashboardView

router = DefaultRouter()
router.register('', views.DashboardViewSet, basename='dashboard')
router.register('reports', views.ReportViewSet, basename='report')

urlpatterns = [
    path('', include(router.urls)),
    path('doctor/dashboard/',DoctorDashboardView.as_view(),name='doctor-dashboard'),
]
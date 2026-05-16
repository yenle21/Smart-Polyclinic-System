from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register('', views.DashboardViewSet, basename='dashboard')
router.register('reports', views.ReportViewSet, basename='report')

urlpatterns = [
    path('', include(router.urls)),
]
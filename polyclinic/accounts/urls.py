
from django.urls import path, include
from rest_framework import routers
from . import views
from .views import GoogleLoginView

router = routers.DefaultRouter()
router.register('users', views.UserViewSet, basename='users')
router.register('doctors', views.DoctorViewSet, basename='doctors')
router.register('patients', views.PatientViewSet, basename='patients')
router.register('specialties', views.SpecialtyViewSet, basename='specialty')


urlpatterns = [
    path('', include(router.urls)),
    path('auth/google/', GoogleLoginView.as_view()),

]
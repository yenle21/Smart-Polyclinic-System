from django.urls import path
from . import views

urlpatterns = [
    path('schedules/', views.DoctorScheduleList.as_view(), name='schedules'),
    path('book/', views.BookAppointment.as_view(), name='book'),
    path('my-appointments/', views.MyAppointmentsList.as_view(), name='my_appointments'),
]
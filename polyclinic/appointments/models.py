
from django.db import models
from cloudinary.models import CloudinaryField
from accounts.models import Doctor, Patient, BaseModel

# Lịch làm việc của bác sĩ
class Schedule(BaseModel):
    work_date  = models.DateField()
    start_time = models.TimeField()
    end_time   = models.TimeField()
    max_slots  = models.PositiveIntegerField(default=10)  # Số bệnh nhân tối đa
    # một bác sĩ có nhiều lịch làm việc
    doctor     = models.ForeignKey(Doctor, on_delete=models.CASCADE, related_name='schedules')

    class Meta:
        unique_together = ('doctor', 'work_date', 'start_time') #không cho tạo 2 lịch trùng cùng bác sĩ, cùng ngày, cùng giờ bắt đầu
        ordering = ['work_date', 'start_time'] #tự dộng sắp xếp theo ngày giờ

    def __str__(self):
        return f"{self.doctor} | {self.work_date} | {self.start_time}–{self.end_time}"

    def available_slots(self):
        booked = self.appointments.filter(
            status__in=['pending', 'confirmed']
        ).count()
        return self.max_slots - booked


class Appointment(BaseModel):
    STATUS_CHOICES = [
        ('pending',   'Chờ xác nhận'),
        ('confirmed', 'Đã xác nhận'),
        ('cancelled', 'Đã huỷ'),
        ('completed', 'Đã khám xong'),
        ('no_show',   'Vắng mặt'),
    ]

    TYPE_CHOICES = [
        ('offline', 'Khám trực tiếp'),
        ('online',  'Khám trực tuyến'),
    ]

    appointment_time = models.TimeField()                           # Giờ khám cụ thể trong khung lịch
    type             = models.CharField(max_length=10, choices=TYPE_CHOICES, default='offline')
    status           = models.CharField(max_length=10, choices=STATUS_CHOICES, default='pending')
    reason           = models.TextField(null=True, blank=True)     # Lý do khám
    notes            = models.TextField(null=True, blank=True)     # Ghi chú thêm của bệnh nhân
    cancel_reason    = models.TextField(null=True, blank=True)     # Lý do huỷ (nếu có)
    patient          = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='appointments')
    schedule         = models.ForeignKey(Schedule, on_delete=models.CASCADE, related_name='appointments')

    class Meta:
        # Một bệnh nhân không đặt 2 lần cùng giờ cùng lịch
        unique_together = ('patient', 'schedule', 'appointment_time') #Ngăn bệnh nhân đặt trùng cùng giờ trong cùng 1 khung lịch
        ordering = ['schedule__work_date', 'appointment_time']

    def __str__(self):
        return f"{self.patient} → {self.schedule.doctor} | {self.schedule.work_date} {self.appointment_time}"


class Notification(BaseModel):
    """Thông báo nhắc lịch hẹn gửi cho bệnh nhân"""
    TYPE_CHOICES = [
        ('reminder', 'Nhắc lịch hẹn'),
        ('confirmed', 'Lịch hẹn được xác nhận'),
        ('cancelled', 'Thông báo huỷ'),
        ('result', 'Kết quả xét nghiệm'),
        ('follow_up', 'Nhắc tái khám'),
        ('prescription', 'Đơn thuốc mới'),
        ('invoice', 'Hóa đơn mới'),
        ('general', 'Chung'),
    ]

    user        = models.ForeignKey('accounts.User', on_delete=models.CASCADE, related_name='notifications')
    appointment = models.ForeignKey(Appointment, on_delete=models.SET_NULL,
                                    null=True, blank=True, related_name='notifications')
    type        = models.CharField(max_length=20, choices=TYPE_CHOICES, default='general')
    title       = models.CharField(max_length=200)
    message     = models.TextField()
    is_read     = models.BooleanField(default=False)

    class Meta:
        ordering = ['-created_date']

    def __str__(self):
        return f"[{self.type}] {self.title} → {self.user}"

# Thêm vào appointments/models.py

class MedicalRecord(BaseModel): #Hồ sơ bệnh án, tạo sau khi khám xong
    appointment  = models.OneToOneField(Appointment, on_delete=models.CASCADE, related_name='medical_record')
    diagnosis    = models.TextField()                        # Chẩn đoán
    treatment    = models.TextField(null=True, blank=True)  # Hướng điều trị
    notes        = models.TextField(null=True, blank=True)  # Ghi chú thêm của bác sĩ
    follow_up    = models.DateField(null=True, blank=True)  # Ngày tái khám (nếu có)

    def __str__(self):
        return f"Hồ sơ: {self.appointment}"

#Kết quả xét nghiệm
class TestResult(BaseModel):
    TYPE_CHOICES = [
        ('blood',   'Xét nghiệm máu'),
        ('urine',   'Xét nghiệm nước tiểu'),
        ('xray',    'X-Quang'),
        ('mri',     'MRI'),
        ('ct',      'CT Scan'),
        ('ultrasound', 'Siêu âm'),
        ('other',   'Khác'),
    ]

    type           = models.CharField(max_length=20, choices=TYPE_CHOICES, default='other')
    name           = models.CharField(max_length=200)        # Tên xét nghiệm cụ thể
    result         = models.TextField(null=True, blank=True) # Mô tả kết quả dạng text
    file           = CloudinaryField(null=True, blank=True)  # File PDF/ảnh kết quả
    tested_at      = models.DateTimeField(null=True, blank=True)
    medical_record = models.ForeignKey(MedicalRecord, on_delete=models.CASCADE, related_name='test_results')

    def __str__(self):
        return f"{self.name} | {self.medical_record.appointment.patient}"
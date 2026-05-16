from rest_framework import serializers

from .models import Patient, User, Doctor, Staff


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'phone', 'role', 'avatar']

class PatientSerializer(serializers.ModelSerializer):
    class Meta:
        model = Patient
        fields = '__all__'

class DoctorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Doctor
        fields = '__all__'

class StaffSerializer(serializers.ModelSerializer):
    class Meta:
        model = Staff
        fields = '__all__'

class RegisterSerializer(serializers.ModelSerializer):
    password         = serializers.CharField(write_only=True)
    password_confirm = serializers.CharField(write_only=True)
    email            = serializers.EmailField(required=True)

    class Meta:
        model  = User
        fields = ['username', 'password', 'password_confirm', 'email', 'phone']

    def validate_username(self, value):
        if not value.isalnum():
            raise serializers.ValidationError('Username chỉ được chứa chữ và số!')
        return value

    def validate_password(self, value):
        if len(value) < 8:
            raise serializers.ValidationError('Mật khẩu phải ít nhất 8 ký tự!')
        if not any(char.isdigit() for char in value):
            raise serializers.ValidationError('Mật khẩu phải có ít nhất 1 số!')
        if not any(char.isupper() for char in value):
            raise serializers.ValidationError('Mật khẩu phải có ít nhất 1 chữ hoa!')
        return value

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError('Email đã được sử dụng!')
        return value

    def validate_phone(self, value):
        if not value.isdigit():
            raise serializers.ValidationError('Số điện thoại chỉ được chứa số!')
        if len(value) != 10:
            raise serializers.ValidationError('Số điện thoại phải có 10 chữ số!')
        return value

    def validate(self, data):
        if data['password'] != data['password_confirm']:
            raise serializers.ValidationError({'password': 'Mật khẩu không khớp!'})
        return data

    def create(self, validated_data):
        validated_data.pop('password_confirm')
        user = User.objects.create_user(
            **validated_data,
            role='patient'
        )
        Patient.objects.create(
            user=user,
            full_name=f"{user.first_name} {user.last_name}".strip() or user.username
        )
        return user

class PatientProfileSerializer(serializers.ModelSerializer):
    # Lồng thông tin User vào để hiển thị luôn
    username = serializers.CharField(source='user.username', read_only=True)
    email    = serializers.EmailField(source='user.email',   read_only=True)
    phone    = serializers.CharField(source='user.phone',    read_only=True)
    avatar   = serializers.ImageField(source='user.avatar',  read_only=True)

    class Meta:
        model  = Patient
        fields = [
            # Thông tin tài khoản (từ User)
            'username', 'email', 'phone', 'avatar',
            # Thông tin y tế (từ Patient)
            'id', 'full_name', 'dob', 'gender', 'address',
            'created_date', 'updated_date'
        ]


class PatientUpdateSerializer(serializers.ModelSerializer):
    # Các field của User (optional, không bắt buộc gửi)
    phone  = serializers.CharField(source='user.phone', required=False, allow_null=True)
    avatar = serializers.ImageField(source='user.avatar', required=False, allow_null=True)
    email  = serializers.EmailField(source='user.email', required=False)

    class Meta:
        model  = Patient
        fields = ['full_name', 'dob', 'gender', 'address', 'phone', 'avatar', 'email']

    def validate_email(self, value):
        # Kiểm tra email không trùng với user khác
        user = self.instance.user
        if User.objects.filter(email=value).exclude(pk=user.pk).exists():
            raise serializers.ValidationError('Email đã được sử dụng!')
        return value

    def validate_phone(self, value):
        if value and not value.isdigit():
            raise serializers.ValidationError('Số điện thoại chỉ được chứa số!')
        if value and len(value) != 10:
            raise serializers.ValidationError('Số điện thoại phải có 10 chữ số!')
        return value

    def update(self, instance, validated_data):
        # Tách user data ra update riêng
        user_data = validated_data.pop('user', {})
        user = instance.user

        for attr, value in user_data.items():
            setattr(user, attr, value)
        user.save()

        # Update Patient fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        return instance
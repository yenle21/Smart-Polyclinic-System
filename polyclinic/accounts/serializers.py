from rest_framework import serializers
from .models import Patient, User, Doctor, Specialty


# =========================
# USER SERIALIZER
# =========================
class UserSerializer(serializers.ModelSerializer):
    avatar = serializers.SerializerMethodField()

    def get_avatar(self, obj):
        return obj.avatar.url if obj.avatar else None

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'phone', 'role', 'avatar', 'first_name', 'last_name']


# =========================
# PATIENT SERIALIZER
# =========================
class PatientSerializer(serializers.ModelSerializer):
    class Meta:
        model = Patient
        fields = '__all__'


# =========================
# DOCTOR SERIALIZER
# =========================
class DoctorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Doctor
        fields = '__all__'


# =========================
# REGISTER SERIALIZER
# =========================
class RegisterSerializer(serializers.ModelSerializer):
    password         = serializers.CharField(write_only=True)
    password_confirm = serializers.CharField(write_only=True)
    email            = serializers.EmailField(required=True)
    avatar           = serializers.ImageField(required=False, allow_null=True)
    first_name       = serializers.CharField(required=True)
    last_name        = serializers.CharField(required=True)
    gender           = serializers.ChoiceField(choices=Patient.GENDER_CHOICES, required=True)

    class Meta:
        model = User
        fields = [
            'username', 'password', 'password_confirm',
            'email', 'phone', 'avatar',
            'first_name', 'last_name', 'gender',
        ]

    # =========================
    # VALIDATIONS
    # =========================
    def validate_username(self, value):
        if not value.isalnum():
            raise serializers.ValidationError("Username chỉ chứa chữ và số!")
        return value

    def validate_password(self, value):
        if len(value) < 8:
            raise serializers.ValidationError("Mật khẩu phải >= 8 ký tự!")
        if not any(c.isdigit() for c in value):
            raise serializers.ValidationError("Mật khẩu phải có số!")
        if not any(c.isupper() for c in value):
            raise serializers.ValidationError("Mật khẩu phải có chữ hoa!")
        return value

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("Email đã tồn tại!")
        return value

    def validate_phone(self, value):
        if value and (not value.isdigit() or len(value) != 10):
            raise serializers.ValidationError("SĐT phải 10 chữ số!")
        return value

    def validate(self, data):
        if data['password'] != data['password_confirm']:
            raise serializers.ValidationError({'password': 'Mật khẩu không khớp!'})
        return data

    # =========================
    # CREATE USER + PATIENT
    # =========================
    def create(self, validated_data):
        validated_data.pop('password_confirm')
        avatar     = validated_data.pop('avatar', None)
        gender     = validated_data.pop('gender')
        first_name = validated_data.pop('first_name')
        last_name  = validated_data.pop('last_name')

        user = User.objects.create_user(
            **validated_data,
            first_name=first_name,   # ✅ truyền vào user
            last_name=last_name,     # ✅ truyền vào user
            role='patient'
        )

        if avatar:
            user.avatar = avatar
            user.save()

        Patient.objects.create(
            user=user,
            full_name=f"{first_name} {last_name}".strip(),
            gender=gender
        )

        return user

    # ✅ to_representation nằm đúng trong RegisterSerializer
    def to_representation(self, instance):
        return {
            'id':       instance.id,
            'username': instance.username,
            'email':    instance.email,
            'phone':    instance.phone,
        }


# =========================
# CREATE DOCTOR
# =========================
class CreateDoctorSerializer(serializers.ModelSerializer):
    password         = serializers.CharField(write_only=True)
    password_confirm = serializers.CharField(write_only=True)
    specialty        = serializers.PrimaryKeyRelatedField(queryset=Specialty.objects.all())
    degree           = serializers.CharField(required=False, allow_blank=True)
    bio              = serializers.CharField(required=False, allow_blank=True)
    consultation_fee = serializers.DecimalField(max_digits=10, decimal_places=2, default=0)

    class Meta:
        model = User
        fields = [
            'username', 'password', 'password_confirm',
            'first_name', 'last_name', 'email', 'phone',
            'specialty', 'degree', 'bio', 'consultation_fee',
        ]

    def validate(self, data):
        if data['password'] != data['password_confirm']:
            raise serializers.ValidationError({'password': 'Mật khẩu không khớp!'})
        return data

    def create(self, validated_data):
        specialty        = validated_data.pop('specialty')
        degree           = validated_data.pop('degree', '')
        bio              = validated_data.pop('bio', '')
        consultation_fee = validated_data.pop('consultation_fee', 0)
        validated_data.pop('password_confirm')

        user = User.objects.create_user(**validated_data, role='doctor')
        Doctor.objects.create(
            user=user,
            specialty=specialty,
            degree=degree,
            bio=bio,
            consultation_fee=consultation_fee,
        )
        return user


# =========================
# CREATE STAFF
# =========================
class CreateStaffSerializer(serializers.ModelSerializer):
    password         = serializers.CharField(write_only=True)
    password_confirm = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = [
            'username', 'password', 'password_confirm',
            'first_name', 'last_name', 'email', 'phone',
        ]

    def validate(self, data):
        if data['password'] != data['password_confirm']:
            raise serializers.ValidationError({'password': 'Mật khẩu không khớp!'})
        return data

    def create(self, validated_data):
        validated_data.pop('password_confirm')
        return User.objects.create_user(**validated_data, role='staff')


# =========================
# PATIENT PROFILE
# =========================
class PatientProfileSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    email    = serializers.EmailField(source='user.email', read_only=True)
    phone    = serializers.CharField(source='user.phone', read_only=True)
    avatar   = serializers.ImageField(source='user.avatar', read_only=True)

    class Meta:
        model = Patient
        fields = [
            'username', 'email', 'phone', 'avatar',
            'id', 'full_name', 'dob', 'gender', 'address',
            'created_date', 'updated_date',
        ]


# =========================
# PATIENT UPDATE
# =========================
class PatientUpdateSerializer(serializers.ModelSerializer):
    phone  = serializers.CharField(source='user.phone', required=False)
    avatar = serializers.ImageField(source='user.avatar', required=False)
    email  = serializers.EmailField(source='user.email', required=False)

    class Meta:
        model = Patient
        fields = ['full_name', 'dob', 'gender', 'address', 'phone', 'avatar', 'email']

    def update(self, instance, validated_data):
        user_data = validated_data.pop('user', {})
        user = instance.user

        for attr, value in user_data.items():
            setattr(user, attr, value)
        user.save()

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        return instance


# =========================
# SPECIALTY
# =========================
class SpecialtySerializer(serializers.ModelSerializer):
    class Meta:
        model = Specialty
        fields = ['id', 'name', 'description']
from rest_framework import serializers
from .models import Patient, User, Doctor, Specialty


class UserSerializer(serializers.ModelSerializer):
    avatar        = serializers.SerializerMethodField()
    avatar_upload = serializers.FileField(write_only=True, required=False)

    def get_avatar(self, obj):
        return obj.avatar.url if obj.avatar else None

    class Meta:
        model  = User
        fields = ['username', 'password', 'email', 'phone',
                  'avatar', 'avatar_upload', 'first_name', 'last_name', 'role']
        extra_kwargs = {'password': {'write_only': True}}

    def create(self, validated_data):
        avatar_file = validated_data.pop('avatar_upload', None)
        data = validated_data.copy()
        user = User(**data)
        user.set_password(data['password'])
        if avatar_file:
            user.avatar = avatar_file
        user.save()
        Patient.objects.create(user=user, full_name=user.get_full_name())
        return user


class PatientSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Patient
        fields = '__all__'


class DoctorSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Doctor
        fields = '__all__'


class CreateDoctorSerializer(serializers.ModelSerializer):
    password         = serializers.CharField(write_only=True)
    password_confirm = serializers.CharField(write_only=True)
    avatar           = serializers.FileField(required=False)
    specialties      = serializers.PrimaryKeyRelatedField(many=True, queryset=Specialty.objects.all(), required=False)
    degree           = serializers.CharField(required=False, allow_blank=True)
    bio              = serializers.CharField(required=False, allow_blank=True)
    consultation_fee = serializers.DecimalField(max_digits=10, decimal_places=2, default=0)

    class Meta:
        model  = User
        fields = ['username', 'password', 'password_confirm',
                  'first_name', 'last_name', 'email', 'phone', 'avatar',
                  'specialties', 'degree', 'bio', 'consultation_fee']

    def validate(self, data):
        if data['password'] != data['password_confirm']:
            raise serializers.ValidationError({'password': 'Mật khẩu không khớp!'})
        return data

    def create(self, validated_data):
        specialties      = validated_data.pop('specialties', [])
        degree           = validated_data.pop('degree', '')
        bio              = validated_data.pop('bio', '')
        consultation_fee = validated_data.pop('consultation_fee', 0)
        avatar           = validated_data.pop('avatar', None)
        validated_data.pop('password_confirm')

        user = User.objects.create_user(**validated_data, role='doctor')
        if avatar:
            user.avatar = avatar
            user.save()

        doctor = Doctor.objects.create(
            user=user, degree=degree,
            bio=bio, consultation_fee=consultation_fee,
        )
        doctor.specialties.set(specialties)
        return user


class CreateStaffSerializer(serializers.ModelSerializer):
    password         = serializers.CharField(write_only=True)
    password_confirm = serializers.CharField(write_only=True)
    avatar           = serializers.FileField(required=False)

    class Meta:
        model  = User
        fields = ['username', 'password', 'password_confirm',
                  'first_name', 'last_name', 'email', 'phone', 'avatar']

    def validate(self, data):
        if data['password'] != data['password_confirm']:
            raise serializers.ValidationError({'password': 'Mật khẩu không khớp!'})
        return data

    def create(self, validated_data):
        validated_data.pop('password_confirm')
        avatar = validated_data.pop('avatar', None)
        user   = User.objects.create_user(**validated_data, role='staff')
        if avatar:
            user.avatar = avatar
            user.save()
        return user


class CreatePharmacySerializer(serializers.ModelSerializer):
    password         = serializers.CharField(write_only=True)
    password_confirm = serializers.CharField(write_only=True)
    avatar           = serializers.FileField(required=False)

    class Meta:
        model  = User
        fields = ['username', 'password', 'password_confirm',
                  'first_name', 'last_name', 'email', 'phone', 'avatar']

    def validate(self, data):
        if data['password'] != data['password_confirm']:
            raise serializers.ValidationError({'password_confirm': 'Mật khẩu không khớp'})
        return data

    def create(self, validated_data):
        validated_data.pop('password_confirm')
        avatar = validated_data.pop('avatar', None)
        user   = User.objects.create_user(**validated_data, role='pharmacy')
        if avatar:
            user.avatar = avatar
            user.save()
        return user


class PatientProfileSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    email    = serializers.EmailField(source='user.email', read_only=True)
    phone    = serializers.CharField(source='user.phone', read_only=True)
    avatar   = serializers.SerializerMethodField()

    def get_avatar(self, obj):
        return obj.user.avatar.url if obj.user.avatar else None

    class Meta:
        model  = Patient
        fields = ['id', 'username', 'email', 'phone', 'avatar',
                  'full_name', 'dob', 'gender', 'address',
                  'created_date', 'updated_date']


class PatientUpdateSerializer(serializers.ModelSerializer):
    phone  = serializers.CharField(source='user.phone', required=False)
    avatar = serializers.FileField(source='user.avatar', required=False)
    email  = serializers.EmailField(source='user.email', required=False)

    class Meta:
        model  = Patient
        fields = ['full_name', 'dob', 'gender', 'address', 'phone', 'avatar', 'email']

    def update(self, instance, validated_data):
        user_data = validated_data.pop('user', {})
        user      = instance.user
        for attr, value in user_data.items():
            setattr(user, attr, value)
        user.save()
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        return instance


class SpecialtySerializer(serializers.ModelSerializer):
    class Meta:
        model  = Specialty
        fields = '__all__'
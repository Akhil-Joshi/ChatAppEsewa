from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from django.utils import timezone
from .models import User, OTP
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8, style={'input_type': 'password'})
    confirm_password = serializers.CharField(write_only=True, style={'input_type': 'password'})
    full_name = serializers.CharField(write_only=True, max_length=200)

    class Meta:
        model = User
        fields = ['email', 'full_name', 'password', 'confirm_password']

    def validate_email(self, value):
        if User.objects.filter(email=value.lower()).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value.lower()

    def validate(self, attrs):
        if attrs['password'] != attrs['confirm_password']:
            raise serializers.ValidationError({'confirm_password': "Passwords do not match."})
        try:
            validate_password(attrs['password'])
        except ValidationError as e:
            raise serializers.ValidationError({'password': list(e.messages)})
        return attrs

    def create(self, validated_data):
        full_name = validated_data.pop('full_name')
        validated_data.pop('confirm_password', None)
        first_name, *last = full_name.strip().split(' ', 1)
        user = User.objects.create_user(
            email=validated_data['email'],
            first_name=first_name,
            last_name=last[0] if last else '',
            password=validated_data['password']
        )
        otp = OTP.objects.create(user=user, purpose='registration')
        otp.send_otp_email()
        return user

class EmailVerificationSerializer(serializers.Serializer):
    email = serializers.EmailField()
    otp_code = serializers.CharField(min_length=6, max_length=6)
    purpose = serializers.ChoiceField(choices=['registration', 'password_reset'])

    def validate(self, attrs):
        email = attrs['email'].lower()
        otp_code = attrs['otp_code']
        purpose = attrs['purpose']

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            raise serializers.ValidationError("User with this email does not exist.")

        try:
            otp = OTP.objects.filter(
                user=user,
                otp_code=otp_code,
                purpose=purpose,
                is_used=False
            ).latest('created_at')
        except OTP.DoesNotExist:
            raise serializers.ValidationError("Invalid OTP code.")

        if not otp.is_valid():
            otp.increment_attempts()
            raise serializers.ValidationError("OTP has expired or exceeded max attempts.")

        otp.mark_as_used()
        if purpose == 'registration':
            user.email_verified = True
            user.is_active = True
            user.save()
        elif purpose == 'password_reset':
            user.otp_verified_for_reset = True
            user.otp_verified_at = timezone.now()
            user.save()

        return {"message": "OTP verified successfully"}

class PasswordResetRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()

    def validate_email(self, value):
        try:
            user = User.objects.get(email=value.lower())
            if not user.is_active or not user.email_verified:
                raise serializers.ValidationError("User is not active or email not verified.")
        except User.DoesNotExist:
            raise serializers.ValidationError("No account associated with this email.")
        return value.lower()

    def create(self, validated_data):
        user = User.objects.get(email=validated_data['email'])
        otp = OTP.objects.create(user=user, purpose='password_reset')
        otp.send_otp_email()
        return {"message": "OTP sent for password reset"}

class PasswordResetConfirmSerializer(serializers.Serializer):
    email = serializers.EmailField()
    new_password = serializers.CharField(write_only=True, min_length=8, style={'input_type': 'password'})
    confirm_new_password = serializers.CharField(write_only=True, style={'input_type': 'password'})

    def validate(self, attrs):
        if attrs['new_password'] != attrs['confirm_new_password']:
            raise serializers.ValidationError({'confirm_new_password': "Passwords do not match."})
        try:
            validate_password(attrs['new_password'])
        except ValidationError as e:
            raise serializers.ValidationError({'new_password': list(e.messages)})
        return attrs

    def validate_email(self, value):
        try:
            user = User.objects.get(email=value.lower())
        except User.DoesNotExist:
            raise serializers.ValidationError("User does not exist.")
        return value.lower()

    def save(self, **kwargs):
        email = self.validated_data['email']
        new_password = self.validated_data['new_password']
        user = User.objects.get(email=email)

        if not getattr(user, 'otp_verified_for_reset', False) or not getattr(user, 'otp_verified_at', None):
            raise serializers.ValidationError("OTP verification required before resetting password.")

        if timezone.now() > user.otp_verified_at + timezone.timedelta(minutes=10):
            raise serializers.ValidationError("OTP verification expired. Please re-verify.")

        user.set_password(new_password)
        user.otp_verified_for_reset = False
        user.otp_verified_at = None
        user.save()
        return {"message": "Password reset successful."}

class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(style={'input_type': 'password'})

    def validate(self, attrs):
        email = attrs['email'].lower()
        password = attrs['password']

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            raise serializers.ValidationError("Invalid credentials.")

        if not user.check_password(password):
            raise serializers.ValidationError("Invalid credentials.")
        if not user.email_verified:
            raise serializers.ValidationError("Email not verified.")
        if not user.is_active:
            raise serializers.ValidationError("Account is inactive.")

        attrs['user'] = user
        return attrs

class UserProfileSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()
    profile_photo = serializers.ImageField(max_length=None, use_url=True, allow_null=True)

    class Meta:
        model = User
        fields = ['id', 'email', 'first_name', 'last_name', 'full_name', 'is_active', 'email_verified', 'created_at', 'profile_photo']
        read_only_fields = ['id', 'email', 'is_active', 'email_verified', 'created_at']

    def get_full_name(self, obj):
        return obj.full_name

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['email'] = user.email
        token['first_name'] = user.first_name
        token['last_name'] = user.last_name
        return token
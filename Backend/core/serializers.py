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

    def validate(self, attrs):
        email = attrs['email'].lower()
        otp_code = attrs['otp_code']

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            raise serializers.ValidationError("User with this email does not exist.")

        try:
            otp = OTP.objects.filter(
                user=user,
                otp_code=otp_code,
                purpose='registration',
                is_used=False
            ).latest('created_at')
        except OTP.DoesNotExist:
            raise serializers.ValidationError("Invalid OTP code.")

        if not otp.is_valid():
            otp.increment_attempts()
            raise serializers.ValidationError("OTP has expired or exceeded max attempts.")

        # Do not mark OTP as used or update user here, just pass objects forward
        attrs['user'] = user
        attrs['otp'] = otp
        return attrs
  
class PasswordResetRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()

    def validate_email(self, value):
        value = value.lower()
        if not User.objects.filter(email=value).exists():
            raise serializers.ValidationError("User with this email does not exist.")
        return value


class PasswordResetOTPVerifySerializer(serializers.Serializer):
    email = serializers.EmailField()
    otp_code = serializers.CharField(min_length=6, max_length=6)

    def validate(self, attrs):
        email = attrs.get('email').lower()
        otp_code = attrs.get('otp_code')

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            raise serializers.ValidationError({"email": "User with this email does not exist."})

        try:
            otp = OTP.objects.get(user=user, otp_code=otp_code, purpose='password_reset', is_used=False)
        except OTP.DoesNotExist:
            raise serializers.ValidationError({"otp_code": "Invalid or expired OTP."})

        if timezone.now() > otp.created_at + timezone.timedelta(minutes=10):
            raise serializers.ValidationError({"otp_code": "OTP has expired."})

        # Set user flags to allow password reset
        user.otp_verified_for_reset = True
        user.otp_verified_at = timezone.now()
        user.save()

        otp.mark_as_used()
        # Fixed: Use otp_code instead of code
        OTP.objects.filter(user=user, purpose='password_reset', is_used=False).exclude(otp_code=otp_code).update(is_used=True)

        return {"email": email}


class PasswordResetSetNewPasswordSerializer(serializers.Serializer):
    email = serializers.EmailField()
    new_password = serializers.CharField(write_only=True, min_length=8)
    confirm_new_password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        if attrs['new_password'] != attrs['confirm_new_password']:
            raise serializers.ValidationError({'confirm_new_password': "Passwords do not match."})
        try:
            validate_password(attrs['new_password'])
        except ValidationError as e:
            raise serializers.ValidationError({'new_password': list(e.messages)})
        return attrs

    def save(self, **kwargs):
        email = self.validated_data['email']
        new_password = self.validated_data['new_password']

        try:
            user = User.objects.get(email=email.lower())
        except User.DoesNotExist:
            raise serializers.ValidationError({"email": "User does not exist."})

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
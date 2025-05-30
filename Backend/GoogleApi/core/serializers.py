# serializers.py

from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from .models import User, OTP
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer


class UserRegistrationSerializer(serializers.ModelSerializer):
    """Serializer for user registration"""
    password = serializers.CharField(
        write_only=True,
        min_length=8,
        style={'input_type': 'password'}
    )
    password2 = serializers.CharField(
        write_only=True,
        style={'input_type': 'password'},
        label='Confirm Password'
    )
    full_name = serializers.CharField(write_only=True, max_length=200)

    class Meta:
        model = User
        fields = ['email', 'full_name', 'password', 'password2']
        extra_kwargs = {
            'email': {'required': True},
        }

    def validate_email(self, value):
        """Validate email is unique"""
        if User.objects.filter(email=value.lower()).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value.lower()

    def validate_full_name(self, value):
        """Validate full name"""
        if len(value.strip()) < 2:
            raise serializers.ValidationError("Full name must be at least 2 characters long.")
        return value.strip()

    def validate_password(self, value):
        """Validate password using Django's password validators"""
        try:
            validate_password(value)
        except ValidationError as e:
            raise serializers.ValidationError(list(e.messages))
        return value

    def validate(self, attrs):
        """Validate password confirmation"""
        password = attrs.get('password')
        password2 = attrs.get('password2')
        
        if password != password2:
            raise serializers.ValidationError({
                'password2': "Password and Confirm Password don't match"
            })
        return attrs

    def create(self, validated_data):
        """Create user and send verification OTP"""
        full_name = validated_data.pop('full_name')
        validated_data.pop('password2', None)
        
        # Split full name into first and last name
        name_parts = full_name.strip().split(' ', 1)
        validated_data['first_name'] = name_parts[0]
        validated_data['last_name'] = name_parts[1] if len(name_parts) > 1 else ''
        
        # Create user (inactive by default)
        user = User.objects.create_user(**validated_data)
        
        # Create and send OTP for email verification
        otp = OTP.objects.create(user=user, purpose='registration')
        otp.send_otp_email()
        
        return user


class EmailVerificationSerializer(serializers.Serializer):
    """Serializer for email verification using OTP"""
    email = serializers.EmailField()
    otp_code = serializers.CharField(max_length=6, min_length=6)

    def validate_email(self, value):
        """Validate email exists"""
        try:
            user = User.objects.get(email=value.lower())
            if user.email_verified and user.is_active:
                raise serializers.ValidationError("Email is already verified.")
        except User.DoesNotExist:
            raise serializers.ValidationError("User with this email does not exist.")
        return value.lower()

    def validate(self, attrs):
        """Validate OTP"""
        email = attrs.get('email')
        otp_code = attrs.get('otp_code')

        try:
            user = User.objects.get(email=email)
            otp = OTP.objects.filter(
                user=user, 
                otp_code=otp_code, 
                purpose='registration'
            ).latest('created_at')
            
            if not otp.is_valid():
                otp.increment_attempts()
                if otp.attempts >= otp.max_attempts:
                    raise serializers.ValidationError("Maximum OTP attempts exceeded. Please request a new OTP.")
                else:
                    raise serializers.ValidationError("OTP has expired or is invalid.")
                
        except User.DoesNotExist:
            raise serializers.ValidationError("User with this email does not exist.")
        except OTP.DoesNotExist:
            raise serializers.ValidationError("Invalid OTP code.")

        attrs['user'] = user
        attrs['otp'] = otp
        return attrs


class LoginSerializer(serializers.Serializer):
    """Serializer for user login (first step - password verification)"""
    email = serializers.EmailField()
    password = serializers.CharField(style={'input_type': 'password'})

    def validate(self, attrs):
        """Validate login credentials"""
        email = attrs.get('email')
        password = attrs.get('password')

        if email and password:
            try:
                user = User.objects.get(email=email.lower())
            except User.DoesNotExist:
                raise serializers.ValidationError("Invalid email or password.")

            if not user.check_password(password):
                raise serializers.ValidationError("Invalid email or password.")

            if not user.is_active:
                raise serializers.ValidationError("Account is not activated. Please verify your email first.")

            if not user.email_verified:
                raise serializers.ValidationError("Email is not verified. Please verify your email first.")

            attrs['user'] = user
            return attrs
        else:
            raise serializers.ValidationError("Must include email and password.")


class LoginOTPVerificationSerializer(serializers.Serializer):
    """Serializer for login OTP verification (second step)"""
    email = serializers.EmailField()
    otp_code = serializers.CharField(max_length=6, min_length=6)

    def validate(self, attrs):
        """Validate login OTP"""
        email = attrs.get('email')
        otp_code = attrs.get('otp_code')

        try:
            user = User.objects.get(email=email.lower(), is_active=True, email_verified=True)
            otp = OTP.objects.filter(
                user=user, 
                otp_code=otp_code, 
                purpose='login'
            ).latest('created_at')
            
            if not otp.is_valid():
                otp.increment_attempts()
                if otp.attempts >= otp.max_attempts:
                    raise serializers.ValidationError("Maximum OTP attempts exceeded. Please login again.")
                else:
                    raise serializers.ValidationError("OTP has expired or is invalid.")
                
        except User.DoesNotExist:
            raise serializers.ValidationError("User with this email does not exist or is not verified.")
        except OTP.DoesNotExist:
            raise serializers.ValidationError("Invalid OTP code.")

        attrs['user'] = user
        attrs['otp'] = otp
        return attrs


class ResendOTPSerializer(serializers.Serializer):
    """Serializer for resending OTP"""
    email = serializers.EmailField()
    purpose = serializers.ChoiceField(choices=['registration', 'login', 'password_reset'])

    def validate(self, attrs):
        """Validate email and purpose"""
        email = attrs.get('email')
        purpose = attrs.get('purpose')

        try:
            user = User.objects.get(email=email.lower())
            
            # Additional validation based on purpose
            if purpose == 'registration' and user.email_verified:
                raise serializers.ValidationError("Email is already verified.")
            elif purpose == 'login' and (not user.is_active or not user.email_verified):
                raise serializers.ValidationError("User account is not active or email not verified.")
                
        except User.DoesNotExist:
            raise serializers.ValidationError("User with this email does not exist.")

        attrs['user'] = user
        return attrs


class PasswordResetRequestSerializer(serializers.Serializer):
    """Serializer for password reset request"""
    email = serializers.EmailField()

    def validate_email(self, value):
        """Validate email exists and is verified"""
        try:
            user = User.objects.get(email=value.lower())
            if not user.is_active or not user.email_verified:
                raise serializers.ValidationError("User account is not active or email not verified.")
        except User.DoesNotExist:
            raise serializers.ValidationError("User with this email does not exist.")
        return value.lower()


class PasswordResetConfirmSerializer(serializers.Serializer):
    """Serializer for password reset confirmation"""
    email = serializers.EmailField()
    otp_code = serializers.CharField(max_length=6, min_length=6)
    new_password = serializers.CharField(
        write_only=True,
        min_length=8,
        style={'input_type': 'password'}
    )
    new_password2 = serializers.CharField(
        write_only=True,
        style={'input_type': 'password'},
        label='Confirm New Password'
    )

    def validate_new_password(self, value):
        """Validate new password"""
        try:
            validate_password(value)
        except ValidationError as e:
            raise serializers.ValidationError(list(e.messages))
        return value

    def validate(self, attrs):
        """Validate OTP and password confirmation"""
        email = attrs.get('email')
        otp_code = attrs.get('otp_code')
        new_password = attrs.get('new_password')
        new_password2 = attrs.get('new_password2')

        # Check password confirmation
        if new_password != new_password2:
            raise serializers.ValidationError({
                'new_password2': "New password and confirmation don't match"
            })

        # Validate OTP
        try:
            user = User.objects.get(email=email.lower())
            otp = OTP.objects.filter(
                user=user, 
                otp_code=otp_code, 
                purpose='password_reset'
            ).latest('created_at')
            
            if not otp.is_valid():
                otp.increment_attempts()
                if otp.attempts >= otp.max_attempts:
                    raise serializers.ValidationError("Maximum OTP attempts exceeded. Please request a new password reset.")
                else:
                    raise serializers.ValidationError("OTP has expired or is invalid.")
                
        except User.DoesNotExist:
            raise serializers.ValidationError("User with this email does not exist.")
        except OTP.DoesNotExist:
            raise serializers.ValidationError("Invalid OTP code.")

        attrs['user'] = user
        attrs['otp'] = otp
        return attrs


class UserProfileSerializer(serializers.ModelSerializer):
    """Serializer for user profile"""
    full_name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'email', 'first_name', 'last_name', 'full_name', 
                 'is_active', 'email_verified', 'created_at']
        read_only_fields = ['id', 'email', 'is_active', 'email_verified', 'created_at']

    def get_full_name(self, obj):
        return obj.full_name

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)

        # Add custom claims
        token['email'] = user.email
        token['first_name'] = user.first_name
        token['last_name'] = user.last_name
        return token
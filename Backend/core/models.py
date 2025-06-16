import random
from datetime import timedelta
from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager
from django.utils import timezone
from django.core.mail import send_mail
from django.conf import settings


def generate_friend_code():
    return "{:06d}".format(random.randint(0, 999999))

class UserManager(BaseUserManager):
    def create_user(self, email, first_name, last_name, password=None, **extra_fields):
        if not email:
            raise ValueError('Users must have an email address')

        user = self.model(
            email=self.normalize_email(email),
            first_name=first_name,
            last_name=last_name,
            **extra_fields
        )
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, first_name, last_name, password=None):
        user = self.create_user(
            email=email,
            first_name=first_name,
            last_name=last_name,
            password=password
        )
        user.is_admin = True
        user.is_staff = True
        user.is_active = True
        user.save(using=self._db)
        return user


class User(AbstractBaseUser):
    email = models.EmailField(max_length=255, unique=True)
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    is_active = models.BooleanField(default=False)
    is_admin = models.BooleanField(default=False)
    is_staff = models.BooleanField(default=False)
    email_verified = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    friend_code = models.CharField(max_length=6, unique=True, editable=False, default=generate_friend_code)
    profile_photo = models.ImageField(upload_to='profile_photos/', null=True, blank=True)

    # OTP verification state for password reset
    otp_verified_for_reset = models.BooleanField(default=False)
    otp_verified_at = models.DateTimeField(null=True, blank=True)

    objects = UserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['first_name', 'last_name']
    
    def save(self, *args, **kwargs):
        if not self.friend_code:
            code = generate_friend_code()
            while User.objects.filter(friend_code=code).exists():
                code = generate_friend_code()
            self.friend_code = code
        super().save(*args, **kwargs)

    def __str__(self):
        return self.email

    def has_perm(self, perm, obj=None):
        return self.is_admin

    def has_module_perms(self, app_label):
        return True
    
    def get_total_friends(self):
        from chat.models import FriendRequest
        from django.db.models import Q
        return FriendRequest.objects.filter(
            Q(from_user=self) | Q(to_user=self),
            status='accepted'
        ).count()


    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}".strip()

    def can_reset_password(self):
        """Allow password reset only within 10 minutes after OTP verification."""
        if self.otp_verified_for_reset and self.otp_verified_at:
            return timezone.now() <= self.otp_verified_at + timedelta(minutes=10)
        return False

    class Meta:
        verbose_name = 'User'
        verbose_name_plural = 'Users'



class OTP(models.Model):
    PURPOSE_CHOICES = [
        ('registration', 'Registration'),
        ('password_reset', 'Password Reset'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='otps')
    otp_code = models.CharField(max_length=6)
    purpose = models.CharField(max_length=15, choices=PURPOSE_CHOICES)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    is_used = models.BooleanField(default=False)
    attempts = models.IntegerField(default=0)
    max_attempts = models.IntegerField(default=3)

    class Meta:
        verbose_name = 'OTP'
        verbose_name_plural = 'OTPs'
        ordering = ['-created_at']

    def save(self, *args, **kwargs):
        if not self.otp_code:
            self.otp_code = str(random.randint(100000, 999999))
        if not self.expires_at:
            self.expires_at = timezone.now() + timedelta(minutes=10)
        super().save(*args, **kwargs)

    def is_valid(self):
        return (
            not self.is_used and 
            timezone.now() < self.expires_at and 
            self.attempts < self.max_attempts
        )

    def increment_attempts(self):
        self.attempts += 1
        self.save()

    def mark_as_used(self):
        self.is_used = True
        self.save()

    def send_otp_email(self):
        subject_map = {
            'registration': 'Email Verification - Your OTP Code',
            'password_reset': 'Password Reset - Your OTP Code',
        }

        message_map = {
            'registration': f'''
Hello {self.user.first_name},

Welcome! Please verify your email address to complete your registration.

Your verification code is: {self.otp_code}

This code will expire in 10 minutes.

If you didn't create an account, please ignore this email.

Best regards,
Your App Team
''',
            'password_reset': f'''
Hello {self.user.first_name},

Your password reset code is: {self.otp_code}

This code will expire in 10 minutes.

If you didn't request a password reset, please ignore this email.

Best regards,
Your App Team
'''
        }

        subject = subject_map.get(self.purpose, 'Your OTP Code')
        message = message_map.get(self.purpose, f'Your OTP code is: {self.otp_code}')

        try:
            send_mail(
                subject,
                message,
                settings.DEFAULT_FROM_EMAIL,
                [self.user.email],
                fail_silently=False,
            )
            return True
        except Exception as e:
            print(f"Failed to send email: {e}")
            return False

    def __str__(self):
        return f"OTP for {self.user.email} - {self.get_purpose_display()}"

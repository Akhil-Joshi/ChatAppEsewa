# from django.shortcuts import render
# from django.http import HttpResponse, HttpResponseRedirect
# from django.contrib.auth import logout


# def home(request):
#     if request.user.is_authenticated:

#         context = {'name': request.user.username}
#         return render(request, "google_login/home.html", context)

#     return HttpResponseRedirect('/login')


# def login(request):
#     if request.user.is_authenticated:
#         return HttpResponseRedirect('/')

#     return render(request, "google_login/login.html")


# def user_logout(request):
#     logout(request)
#     return HttpResponseRedirect('/login')

#maual login registration
# models.py

import random
from datetime import timedelta
from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager
from django.utils import timezone
from django.core.mail import send_mail
from django.conf import settings


class UserManager(BaseUserManager):
    def create_user(self, email, first_name, last_name, password=None, **extra_fields):
        """
        Creates and saves a User with the given email, name and password.
        """
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
        """
        Creates and saves a superuser with the given email, name and password.
        """
        user = self.create_user(
            email,
            password=password,
            first_name=first_name,
            last_name=last_name,
        )
        user.is_admin = True
        user.is_staff = True
        user.is_active = True
        user.save(using=self._db)
        return user


class User(AbstractBaseUser):
    email = models.EmailField(
        verbose_name='Email Address',
        max_length=255,
        unique=True,
    )
    first_name = models.CharField(max_length=100, verbose_name='First Name')
    last_name = models.CharField(max_length=100, verbose_name='Last Name')
    is_active = models.BooleanField(default=False)  # Default False for email verification
    is_admin = models.BooleanField(default=False)
    is_staff = models.BooleanField(default=False)
    email_verified = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = UserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['first_name', 'last_name']

    def __str__(self):
        return self.email

    def has_perm(self, perm, obj=None):
        "Does the user have a specific permission?"
        return self.is_admin

    def has_module_perms(self, app_label):
        "Does the user have permissions to view the app `app_label`?"
        return True

    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}".strip()

    class Meta:
        verbose_name = 'User'
        verbose_name_plural = 'Users'


class OTP(models.Model):
    PURPOSE_CHOICES = [
        ('registration', 'Registration'),
        ('login', 'Login'),
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
            self.expires_at = timezone.now() + timedelta(minutes=10)  # 10 minutes expiry
        super().save(*args, **kwargs)

    def is_valid(self):
        """Check if OTP is valid (not used, not expired, attempts not exceeded)"""
        return (
            not self.is_used and 
            timezone.now() < self.expires_at and 
            self.attempts < self.max_attempts
        )

    def increment_attempts(self):
        """Increment attempt count"""
        self.attempts += 1
        self.save()

    def mark_as_used(self):
        """Mark OTP as used"""
        self.is_used = True
        self.save()

    def send_otp_email(self):
        """Send OTP via email"""
        subject_map = {
            'registration': 'Email Verification - Your OTP Code',
            'login': 'Login Verification - Your OTP Code',
            'password_reset': 'Password Reset - Your OTP Code'
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
            'login': f'''
Hello {self.user.first_name},

Your login verification code is: {self.otp_code}

This code will expire in 10 minutes.

If you didn't attempt to log in, please secure your account immediately.

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
# from django.shortcuts import render, redirect
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

# # def user_logout(request):
# #     logout(request)
# #     # Redirect to Google logout (optional, see next step)
# #     return redirect('https://accounts.google.com/Logout?continue=https://appengine.google.com/_ah/logout?continue=http://localhost:8000/')

# def home(request):
#     if request.user.is_authenticated:
#         try:
#             social = request.user.social_auth.get(provider='google-oauth2')
#             access_token = social.extra_data.get('access_token')
#             refresh_token = social.extra_data.get('refresh_token')

#             print("Access Token:", access_token)
#             print("Refresh Token:", refresh_token)

#         except Exception as e:
#             print("Error fetching tokens:", str(e))

#     return render(request, 'home.html')


#manual login registration
# views.py

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView
from django.contrib.auth import login
from django.utils import timezone
from .serializers import (
    UserRegistrationSerializer,
    EmailVerificationSerializer,
    LoginSerializer,
    PasswordResetRequestSerializer,
    PasswordResetRequestSerializer,
    PasswordResetConfirmSerializer,
    UserProfileSerializer,
    CustomTokenObtainPairSerializer,
)
from .models import User, OTP


def get_tokens_for_user(user):
    """Generate JWT tokens for user"""
    refresh = RefreshToken.for_user(user)
    return {
        'refresh': str(refresh),
        'access': str(refresh.access_token),
    }


class UserRegistrationView(APIView):
    """
    User Registration API
    POST: Register new user and send email verification OTP
    """

    permission_classes = [AllowAny]  # <- Add this
    
    def post(self, request, format=None):
        serializer = UserRegistrationSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            return Response(
                {
                    'success': True,
                    'message': 'Registration successful. Please check your email for OTP verification.',
                    'data': {
                        'email': user.email,
                        'full_name': user.full_name
                    }
                }, 
                status=status.HTTP_201_CREATED
            )
        else:
            return Response(
                {
                    'success': False,
                    'message': 'Registration failed',
                    'errors': serializer.errors
                }, 
                status=status.HTTP_400_BAD_REQUEST
            )


class EmailVerificationView(APIView):
    """
    Email Verification API
    POST: Verify email using OTP and activate account
    """
    permission_classes = [AllowAny]
    
    def post(self, request, format=None):
        serializer = EmailVerificationSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.validated_data['user']
            otp = serializer.validated_data['otp']
            
            # Activate user account and verify email
            user.is_active = True
            user.email_verified = True
            user.save()
            
            # Mark OTP as used
            otp.mark_as_used()
            
            # Generate JWT tokens
            tokens = get_tokens_for_user(user)
            
            return Response(
                {
                    'success': True,
                    'message': 'Email verified successfully. Account activated.',
                    'data': {
                        'user': {
                            'id': user.id,
                            'email': user.email,
                            'full_name': user.full_name
                        },
                        'tokens': tokens
                    }
                }, 
                status=status.HTTP_200_OK
            )
        else:
            return Response(
                {
                    'success': False,
                    'message': 'Email verification failed',
                    'errors': serializer.errors
                }, 
                status=status.HTTP_400_BAD_REQUEST
            )


class LoginView(APIView):
    """
    User Login API (Step 1)
    POST: Verify credentials and return JWT tokens
    """
    permission_classes = [AllowAny]
    
    def post(self, request, format=None):
        serializer = LoginSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            user = serializer.validated_data['user']
            
            # Generate JWT tokens directly (no OTP)
            tokens = get_tokens_for_user(user)
            
            return Response(
                {
                    'success': True,
                    'message': 'Login successful.',
                    'data': {
                        'user': {
                            'id': user.id,
                            'email': user.email,
                            'full_name': user.full_name,
                            'first_name': user.first_name,
                            'last_name': user.last_name
                        },
                        'tokens': tokens
                    }
                }, 
                status=status.HTTP_200_OK
            )
        else:
            return Response(
                {
                    'success': False,
                    'message': 'Login failed',
                    'errors': serializer.errors
                }, 
                status=status.HTTP_400_BAD_REQUEST
            )




class ResendOTPView(APIView):
    """
    Resend OTP API
    POST: Resend OTP for registration or password reset
    """
    permission_classes = [AllowAny]
    
    def post(self, request, format=None):
        serializer = PasswordResetRequestSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.validated_data['user']
            purpose = serializer.validated_data['purpose']

            # Only allow 'registration' or 'password_reset' as valid purposes
            if purpose not in ['registration', 'password_reset']:
                return Response(
                    {
                        'success': False,
                        'message': 'Invalid purpose. Only registration and password reset are allowed.',
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Invalidate previous OTPs of same purpose
            OTP.objects.filter(user=user, purpose=purpose, is_used=False).update(is_used=True)
            
            # Create and send new OTP
            otp = OTP.objects.create(user=user, purpose=purpose)
            email_sent = otp.send_otp_email()
            
            if email_sent:
                return Response(
                    {
                        'success': True,
                        'message': f'New OTP sent to your email for {purpose}.',
                        'data': {
                            'email': user.email,
                            'purpose': purpose
                        }
                    }, 
                    status=status.HTTP_200_OK
                )
            else:
                return Response(
                    {
                        'success': False,
                        'message': 'Failed to send OTP. Please try again.',
                    }, 
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
        else:
            return Response(
                {
                    'success': False,
                    'message': 'Invalid request',
                    'errors': serializer.errors
                }, 
                status=status.HTTP_400_BAD_REQUEST
            )


class PasswordResetRequestView(APIView):
    """
    Password Reset Request API
    POST: Send password reset OTP to user's email
    """
    permission_classes = [AllowAny]
    
    def post(self, request, format=None):
        serializer = PasswordResetRequestSerializer(data=request.data)
        if serializer.is_valid():
            email = serializer.validated_data['email']
            user = User.objects.get(email=email)
            
            # Invalidate previous password reset OTPs
            OTP.objects.filter(user=user, purpose='password_reset', is_used=False).update(is_used=True)
            
            # Create and send password reset OTP
            otp = OTP.objects.create(user=user, purpose='password_reset')
            email_sent = otp.send_otp_email()
            
            if email_sent:
                return Response(
                    {
                        'success': True,
                        'message': 'Password reset OTP sent to your email.',
                        'data': {
                            'email': user.email,
                            'next_step': 'confirm_password_reset'
                        }
                    }, 
                    status=status.HTTP_200_OK
                )
            else:
                return Response(
                    {
                        'success': False,
                        'message': 'Failed to send OTP. Please try again.',
                    }, 
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
        else:
            return Response(
                {
                    'success': False,
                    'message': 'Invalid email address',
                    'errors': serializer.errors
                }, 
                status=status.HTTP_400_BAD_REQUEST
            )


class PasswordResetConfirmView(APIView):
    """
    Password Reset Confirmation API
    POST: Verify OTP and set new password
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request, format=None):
        serializer = PasswordResetConfirmSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.validated_data['user']
            otp = serializer.validated_data['otp']
            new_password = serializer.validated_data['new_password']
            
            # Set new password
            user.set_password(new_password)
            user.save()
            
            # Mark OTP as used
            otp.mark_as_used()
            
            # Invalidate all other OTPs for this user
            OTP.objects.filter(user=user, is_used=False).update(is_used=True)
            
            return Response(
                {
                    'success': True,
                    'message': 'Password reset successful. You can now login with your new password.',
                    'data': {
                        'email': user.email
                    }
                }, 
                status=status.HTTP_200_OK
            )
        else:
            return Response(
                {
                    'success': False,
                    'message': 'Password reset failed',
                    'errors': serializer.errors
                }, 
                status=status.HTTP_400_BAD_REQUEST
            )


class UserProfileView(APIView):
    """
    User Profile API
    GET: Get user profile information
    PUT: Update user profile information
    """
    permission_classes = [AllowAny]
    
    def get(self, request, format=None):
        serializer = UserProfileSerializer(request.user)
        return Response(
            {
                'success': True,
                'message': 'Profile retrieved successfully',
                'data': serializer.data
            }, 
            status=status.HTTP_200_OK
        )
    
    def put(self, request, format=None):
        serializer = UserProfileSerializer(request.user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(
                {
                    'success': True,
                    'message': 'Profile updated successfully',
                    'data': serializer.data
                }, 
                status=status.HTTP_200_OK
            )
        else:
            return Response(
                {
                    'success': False,
                    'message': 'Profile update failed',
                    'errors': serializer.errors
                }, 
                status=status.HTTP_400_BAD_REQUEST
            )


class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer
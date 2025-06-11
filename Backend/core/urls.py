# urls.py

from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    UserRegistrationView,
    EmailVerificationView,
    LoginView,
    ResendOTPView,
    PasswordResetRequestView,
    PasswordResetOTPVerifyView,
    PasswordResetSetNewPasswordView, 
    UserProfileView,
    CustomTokenObtainPairView
)

# App name for namespacing
app_name = 'core'

urlpatterns = [
    # Authentication URLs
    path('register/', UserRegistrationView.as_view(), name='user-register'),
    path('verify-email/', EmailVerificationView.as_view(), name='verify-email'),
    path('login/', LoginView.as_view(), name='login'),
    
    # OTP Management URLs
    path('resend-otp/', ResendOTPView.as_view(), name='resend-otp'),
    
    # Password Reset URLs
    path('password-reset/request/', PasswordResetRequestView.as_view(), name='password_reset_request'),
    path('password-reset/verify-otp/', PasswordResetOTPVerifyView.as_view(), name='password_reset_verify_otp'),
    path('password-reset/set-password/', PasswordResetSetNewPasswordView.as_view(), name='password_reset_set_new_password'),
    
    # User Profile URLs
    path('profile/', UserProfileView.as_view(), name='user-profile'),
    
    # JWT Token URLs
    path('token/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]

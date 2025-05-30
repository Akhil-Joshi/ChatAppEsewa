# urls.py

from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    UserRegistrationView,
    EmailVerificationView,
    LoginView,
    LoginOTPVerificationView,
    ResendOTPView,
    PasswordResetRequestView,
    PasswordResetConfirmView,
    UserProfileView,
    LogoutView,
    CleanupExpiredOTPsView,
    CustomTokenObtainPairView
)

# App name for namespacing
app_name = 'core'

urlpatterns = [
    # Authentication URLs
    path('register/', UserRegistrationView.as_view(), name='user-register'),
    path('verify-email/', EmailVerificationView.as_view(), name='verify-email'),
    path('login/', LoginView.as_view(), name='login'),
    path('login/verify-otp/', LoginOTPVerificationView.as_view(), name='login-verify-otp'),
    path('logout/', LogoutView.as_view(), name='logout'),
    
    # OTP Management URLs
    path('resend-otp/', ResendOTPView.as_view(), name='resend-otp'),
    
    # Password Reset URLs
    path('password-reset/', PasswordResetRequestView.as_view(), name='password-reset-request'),
    path('password-reset/confirm/', PasswordResetConfirmView.as_view(), name='password-reset-confirm'),
    
    # User Profile URLs
    path('profile/', UserProfileView.as_view(), name='user-profile'),
    
    # JWT Token URLs
    path('token/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    # Admin/Utility URLs
    path('cleanup-otps/', CleanupExpiredOTPsView.as_view(), name='cleanup-otps'),
]

"""
URL Patterns Summary:

Authentication Endpoints:
- POST /auth/register/ - User registration
- POST /auth/verify-email/ - Email verification with OTP
- POST /auth/login/ - Login (step 1 - send OTP)
- POST /auth/login/verify-otp/ - Login (step 2 - verify OTP)
- POST /auth/logout/ - User logout

OTP Management:
- POST /auth/resend-otp/ - Resend OTP for any purpose

Password Reset:
- POST /auth/password-reset/ - Request password reset OTP
- POST /auth/password-reset/confirm/ - Confirm password reset with OTP

User Profile:
- GET /auth/profile/ - Get user profile
- PUT /auth/profile/ - Update user profile

JWT Token Management:
- POST /auth/token/refresh/ - Refresh JWT access token

Admin/Utility:
- POST /auth/cleanup-otps/ - Clean expired OTPs (admin use)

Usage Examples:

1. User Registration:✅
POST /auth/register/
{
    "email": "user@example.com",
    "full_name": "John Doe",
    "password": "securepassword123",
    "password2": "securepassword123"
}

2. Email Verification:✅
POST /auth/verify-email/
{
    "email": "user@example.com",
    "otp_code": "123456"
}

3. Login Step 1:✅
POST /auth/login/
{
    "email": "user@example.com",
    "password": "securepassword123"
}

4. Login Step 2:✅
POST /auth/login/verify-otp/
{
    "email": "user@example.com",
    "otp_code": "654321"
}

5. Resend OTP:✅
POST /auth/resend-otp/
{
    "email": "user@example.com",
    "purpose": "registration"  // or "login" or "password_reset"
}

6. Password Reset Request:✅
POST /auth/password-reset/
{
    "email": "user@example.com"
}

7. Password Reset Confirm:✅
POST /auth/password-reset/confirm/
{
    "email": "user@example.com",
    "otp_code": "789012",
    "new_password": "newsecurepassword123",
    "new_password2": "newsecurepassword123"
}

8. Get Profile (requires authentication):✅
GET /auth/profile/
Headers: Authorization: Bearer <access_token>

9. Update Profile (requires authentication):✅
PUT /auth/profile/
Headers: Authorization: Bearer <access_token>
{
    "first_name": "Jane",
    "last_name": "Smith"
}

10. Logout (requires authentication):✅
POST /auth/logout/
Headers: Authorization: Bearer <access_token>
{
    "refresh_token": "<refresh_token>"
}

11. Refresh Token:✅
POST /auth/token/refresh/
{
    "refresh": "<refresh_token>"
}
"""
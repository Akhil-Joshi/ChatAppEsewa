# admin.py

from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.auth.forms import ReadOnlyPasswordHashField
from django.core.exceptions import ValidationError
from django import forms
from django.utils.html import format_html
from django.utils import timezone
from .models import User, OTP


class UserCreationForm(forms.ModelForm):
    """A form for creating new users. Includes all the required
    fields, plus a repeated password."""
    password1 = forms.CharField(label='Password', widget=forms.PasswordInput)
    password2 = forms.CharField(label='Password confirmation', widget=forms.PasswordInput)

    class Meta:
        model = User
        fields = ('email', 'first_name', 'last_name')

    def clean_password2(self):
        # Check that the two password entries match
        password1 = self.cleaned_data.get("password1")
        password2 = self.cleaned_data.get("password2")
        if password1 and password2 and password1 != password2:
            raise ValidationError("Passwords don't match")
        return password2

    def save(self, commit=True):
        # Save the provided password in hashed format
        user = super().save(commit=False)
        user.set_password(self.cleaned_data["password1"])
        if commit:
            user.save()
        return user


class UserChangeForm(forms.ModelForm):
    """A form for updating users. Includes all the fields on
    the user, but replaces the password field with admin's
    disabled password hash display field.
    """
    password = ReadOnlyPasswordHashField()

    class Meta:
        model = User
        fields = ('email', 'password', 'first_name', 'last_name', 
                 'is_active', 'is_admin', 'is_staff', 'email_verified')


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    # The forms to add and change user instances
    form = UserChangeForm
    add_form = UserCreationForm

    # The fields to be used in displaying the User model.
    list_display = ('email', 'first_name', 'last_name', 'full_name_display', 
                   'is_active', 'is_staff', 'is_admin', 'email_verified_display', 
                   'created_at_display')
    list_filter = ('is_staff', 'is_admin', 'is_active', 'email_verified', 'created_at')
    
    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Personal info', {'fields': ('first_name', 'last_name')}),
        ('Permissions', {'fields': ('is_admin', 'is_staff', 'is_active', 'email_verified')}),
        ('Important dates', {'fields': ('last_login', 'created_at', 'updated_at')}),
    )
    
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'first_name', 'last_name', 'password1', 'password2'),
        }),
    )
    
    search_fields = ('email', 'first_name', 'last_name')
    ordering = ('email',)
    filter_horizontal = ()
    readonly_fields = ('last_login', 'created_at', 'updated_at')

    def full_name_display(self, obj):
        return obj.full_name
    full_name_display.short_description = 'Full Name'

    def email_verified_display(self, obj):
        if obj.email_verified:
            return format_html(
                '<span style="color: green; font-weight: bold;">✓ Verified</span>'
            )
        else:
            return format_html(
                '<span style="color: red; font-weight: bold;">✗ Not Verified</span>'
            )
    email_verified_display.short_description = 'Email Status'

    def created_at_display(self, obj):
        return obj.created_at.strftime('%Y-%m-%d %H:%M')
    created_at_display.short_description = 'Joined'

    actions = ['make_active', 'make_inactive', 'verify_email', 'unverify_email']

    def make_active(self, request, queryset):
        updated = queryset.update(is_active=True)
        self.message_user(request, f'{updated} users were marked as active.')
    make_active.short_description = "Mark selected users as active"

    def make_inactive(self, request, queryset):
        updated = queryset.update(is_active=False)
        self.message_user(request, f'{updated} users were marked as inactive.')
    make_inactive.short_description = "Mark selected users as inactive"

    def verify_email(self, request, queryset):
        updated = queryset.update(email_verified=True)
        self.message_user(request, f'{updated} users email were marked as verified.')
    verify_email.short_description = "Mark selected users email as verified"

    def unverify_email(self, request, queryset):
        updated = queryset.update(email_verified=False)
        self.message_user(request, f'{updated} users email were marked as unverified.')
    unverify_email.short_description = "Mark selected users email as unverified"


@admin.register(OTP)
class OTPAdmin(admin.ModelAdmin):
    list_display = ('user_email', 'otp_code_display', 'purpose', 'status_display', 
                   'attempts_display', 'created_at_display', 'expires_at_display')
    list_filter = ('purpose', 'is_used', 'created_at')
    search_fields = ('user__email', 'user__first_name', 'user__last_name', 'otp_code')
    readonly_fields = ('otp_code', 'created_at', 'expires_at', 'user', 'purpose')
    ordering = ('-created_at',)
    
    fieldsets = (
        ('OTP Information', {
            'fields': ('user', 'otp_code', 'purpose')
        }),
        ('Status', {
            'fields': ('is_used', 'attempts', 'max_attempts')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'expires_at')
        }),
    )

    def user_email(self, obj):
        return obj.user.email
    user_email.short_description = 'User Email'

    def otp_code_display(self, obj):
        return f"***{obj.otp_code[-3:]}"  # Show only last 3 digits for security
    otp_code_display.short_description = 'OTP Code'

    def status_display(self, obj):
        if obj.is_used:
            return format_html('<span style="color: green;">✓ Used</span>')
        elif timezone.now() > obj.expires_at:
            return format_html('<span style="color: red;">⚠ Expired</span>')
        elif obj.attempts >= obj.max_attempts:
            return format_html('<span style="color: orange;">⚠ Max Attempts</span>')
        else:
            return format_html('<span style="color: blue;">⏳ Active</span>')
    status_display.short_description = 'Status'

    def attempts_display(self, obj):
        return f"{obj.attempts}/{obj.max_attempts}"
    attempts_display.short_description = 'Attempts'

    def created_at_display(self, obj):
        return obj.created_at.strftime('%Y-%m-%d %H:%M:%S')
    created_at_display.short_description = 'Created'

    def expires_at_display(self, obj):
        return obj.expires_at.strftime('%Y-%m-%d %H:%M:%S')
    expires_at_display.short_description = 'Expires'

    def has_add_permission(self, request):
        return False  # Prevent manual OTP creation through admin

    def has_change_permission(self, request, obj=None):
        return False  # Prevent editing OTPs

    actions = ['mark_as_used', 'delete_expired_otps']

    def mark_as_used(self, request, queryset):
        updated = queryset.update(is_used=True)
        self.message_user(request, f'{updated} OTPs were marked as used.')
    mark_as_used.short_description = "Mark selected OTPs as used"

    def delete_expired_otps(self, request, queryset):
        expired_otps = queryset.filter(expires_at__lt=timezone.now())
        count = expired_otps.count()
        expired_otps.delete()
        self.message_user(request, f'{count} expired OTPs were deleted.')
    delete_expired_otps.short_description = "Delete expired OTPs"


# Customize admin site header and title
admin.site.site_header = "User Authentication Admin"
admin.site.site_title = "Auth Admin Portal"
admin.site.index_title = "Welcome to User Authentication Administration"
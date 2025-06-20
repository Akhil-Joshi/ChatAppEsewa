# websocket/urls.py
from django.urls import path
from .views import test_login_view

urlpatterns = [
    path("test-login/", test_login_view),
]

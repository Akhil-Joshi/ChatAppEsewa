from django.urls import include, path
from core import views

urlpatterns = [
    path('', views.home, name='home'),
    path('login/', views.login, name='login'),
    path('logout/', views.user_logout, name='logout')
]
from django.db import models
from django.contrib.auth import get_user_model
from django.contrib.auth.models import AbstractUser

User = get_user_model()


# accounts/models.py
from django.contrib.auth.models import AbstractUser
from django.db import models

# class CustomUser(AbstractUser):
#     friend_code = models.CharField(max_length=100, unique=True, blank=True, null=True)

#     def save(self, *args, **kwargs):
#         if not self.friend_code:
#             import uuid
#             self.friend_code = uuid.uuid4().hex[:8]
#         super().save(*args, **kwargs)



class ChatMessage(models.Model):
    """Group chat messages"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="group_messages")
    message = models.TextField(blank=True)
    file = models.FileField(upload_to="group_chat_files/", blank=True, null=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"[{self.timestamp}] {self.user.username}: {self.message[:30]}"


class Message(models.Model):
    """Private chat messages between two users"""
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name="sent_messages")
    receiver = models.ForeignKey(User, on_delete=models.CASCADE, related_name="received_messages")
    message = models.TextField(blank=True)
    file = models.FileField(upload_to="private_chat_files/", blank=True, null=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"From {self.sender.username} to {self.receiver.username}: {self.message[:30]}"

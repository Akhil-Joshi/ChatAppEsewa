from rest_framework import serializers
from core.models import User
from .models import Friendship, ChatGroup, Message
from core.serializers import UserProfileSerializer

class FriendshipSerializer(serializers.ModelSerializer):
    friend = UserProfileSerializer(read_only=True)
    user = UserProfileSerializer(read_only=True)

    class Meta:
        model = Friendship
        fields = ['id', 'user', 'friend', 'status', 'created_at']

class ChatGroupSerializer(serializers.ModelSerializer):
    members = UserProfileSerializer(many=True, read_only=True)
    creator = UserProfileSerializer(read_only=True)

    class Meta:
        model = ChatGroup
        fields = ['id', 'name', 'creator', 'members', 'created_at', 'is_private']

class MessageSerializer(serializers.ModelSerializer):
    sender = UserProfileSerializer(read_only=True)
    recipient = UserProfileSerializer(read_only=True, allow_null=True)
    group = ChatGroupSerializer(read_only=True, allow_null=True)

    class Meta:
        model = Message
        fields = ['id', 'sender', 'recipient', 'group', 'content', 'timestamp', 'is_read', 'emotion', 'show_emotion']
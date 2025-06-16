from rest_framework import serializers
from core.models import User
from .models import Friendship, ChatGroup, Message, FriendRequest
from core.serializers import UserProfileSerializer

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'email', 'full_name', 'friend_code']
        read_only_fields = ['id', 'email', 'friend_code']


class FriendRequestSerializer(serializers.ModelSerializer):
    from_user = UserSerializer(read_only=True)
    to_user = UserSerializer(read_only=True)

    class Meta:
        model = FriendRequest
        fields = ['id', 'from_user', 'to_user', 'accepted', 'created_at']
        read_only_fields = ['from_user', 'to_user', 'created_at']

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
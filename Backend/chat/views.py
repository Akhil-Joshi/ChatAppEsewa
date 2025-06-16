from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from django.db import models
from core.serializers import UserProfileSerializer
from .models import Friendship, ChatGroup, Message, FriendRequest
from .serializers import FriendshipSerializer, ChatGroupSerializer, MessageSerializer, FriendRequestSerializer
from core.models import User
from core.serializers import UserProfileSerializer
from django.db.models import Q
import nltk
from nltk.sentiment.vader import SentimentIntensityAnalyzer
nltk.download('vader_lexicon')

class FriendListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        friendships = Friendship.objects.filter(
            Q(user=request.user) | Q(friend=request.user)
        )
        
        friends = []
        for f in friendships:
            # Decide who the "other" friend is
            if f.user == request.user:
                other_user = f.friend
            else:
                other_user = f.user

            friends.append({
                'username': other_user.username,
                'friend_code': other_user.friend_code
            })

        return Response(friends, status=200)

class SendFriendRequestView(generics.CreateAPIView):
    serializer_class = FriendRequestSerializer
    permission_classes = [IsAuthenticated]

    def create(self, request, *args, **kwargs):
        code = request.data.get('friend_code')
        try:
            to_user = User.objects.get(friend_code=code)
        except User.DoesNotExist:
            return Response({'error': 'Invalid friend code'}, status=status.HTTP_400_BAD_REQUEST)

        if to_user == request.user:
            return Response({'error': 'You cannot add yourself'}, status=status.HTTP_400_BAD_REQUEST)

        if FriendRequest.objects.filter(from_user=request.user, to_user=to_user).exists():
            return Response({'error': 'Friend request already sent'}, status=status.HTTP_400_BAD_REQUEST)

        friend_request = FriendRequest.objects.create(from_user=request.user, to_user=to_user)
        serializer = self.get_serializer(friend_request)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

class UnreadMessagesView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        messages = Message.objects.filter(recipient=request.user, is_read=False) | Message.objects.filter(
            group__members=request.user, is_read=False
        ).exclude(sender=request.user)
        serializer = MessageSerializer(messages, many=True)
        return Response({
            'success': True,
            'data': serializer.data
        }, status=status.HTTP_200_OK)

class ChatHistoryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, recipient_id=None, group_id=None):
        if recipient_id:
            messages = Message.objects.filter(
                (models.Q(sender=request.user, recipient_id=recipient_id) |
                 models.Q(sender_id=recipient_id, recipient=request.user))
            ).order_by('timestamp')
        elif group_id:
            messages = Message.objects.filter(group_id=group_id).order_by('timestamp')
        else:
            return Response({
                'success': False,
                'message': 'Provide either recipient_id or group_id'
            }, status=status.HTTP_400_BAD_REQUEST)
        serializer = MessageSerializer(messages, many=True)
        return Response({
            'success': True,
            'data': serializer.data
        }, status=status.HTTP_200_OK)

class MarkMessageReadView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, message_id):
        try:
            message = Message.objects.get(id=message_id, recipient=request.user)
            message.is_read = True
            message.save()
            return Response({
                'success': True,
                'message': 'Message marked as read'
            }, status=status.HTTP_200_OK)
        except Message.DoesNotExist:
            return Response({
                'success': False,
                'message': 'Message not found or not authorized'
            }, status=status.HTTP_404_NOT_FOUND)

class CreateGroupView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = ChatGroupSerializer(data=request.data)
        if serializer.is_valid():
            group = serializer.save(creator=request.user)
            group.members.add(request.user)
            for member_id in request.data.get('member_ids', []):
                try:
                    user = User.objects.get(id=member_id)
                    group.members.add(user)
                except User.DoesNotExist:
                    pass
            group.save()
            return Response({
                'success': True,
                'message': 'Group created successfully',
                'data': ChatGroupSerializer(group).data
            }, status=status.HTTP_201_CREATED)
        return Response({
            'success': False,
            'message': 'Invalid data',
            'errors': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)

class ProfileUpdateView(APIView):
    permission_classes = [IsAuthenticated]

    def put(self, request):
        user = request.user
        data = request.data
        user.first_name = data.get('first_name', user.first_name)
        user.last_name = data.get('last_name', user.last_name)
        if 'profile_photo' in request.FILES:
            user.profile_photo = request.FILES['profile_photo']
        elif data.get('remove_photo', False):
            user.profile_photo.delete()
            user.profile_photo = None
        user.save()
        return Response({
            'success': True,
            'message': 'Profile updated successfully',
            'data': UserProfileSerializer(user).data
        }, status=status.HTTP_200_OK)

class ToggleEmotionView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, message_id):
        try:
            message = Message.objects.get(id=message_id, sender=request.user)
            message.show_emotion = not message.show_emotion
            message.save()
            return Response({
                'success': True,
                'message': f"Emotion display {'enabled' if message.show_emotion else 'disabled'}"
            }, status=status.HTTP_200_OK)
        except Message.DoesNotExist:
            return Response({
                'success': False,
                'message': 'Message not found or not authorized'
            }, status=status.HTTP_404_NOT_FOUND)
        

class RespondToFriendRequestView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        friend_code = request.data.get('friend_code')
        action = request.data.get('action')  # 'accept' or 'reject'

        if not friend_code or action not in ['accept', 'reject']:
            return Response({'error': 'Invalid data.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            from_user = User.objects.get(friend_code=friend_code)
        except User.DoesNotExist:
            return Response({'error': 'Invalid friend code.'}, status=status.HTTP_404_NOT_FOUND)

        try:
            friend_request = FriendRequest.objects.get(from_user=from_user, to_user=request.user)
        except FriendRequest.DoesNotExist:
            return Response({'error': 'Friend request not found.'}, status=status.HTTP_404_NOT_FOUND)

        if friend_request.status != 'pending':
            return Response({'error': 'Friend request already handled.'}, status=status.HTTP_400_BAD_REQUEST)

        if action == 'accept':
            friend_request.status = 'accepted'
            friend_request.save()

            # ✅ Create friendships (bidirectional)
            Friendship.objects.get_or_create(user=request.user, friend=from_user)
            Friendship.objects.get_or_create(user=from_user, friend=request.user)

            return Response({'message': 'Friend request accepted and friendship created.'})

        else:
            friend_request.status = 'rejected'
            friend_request.save()
            return Response({'message': 'Friend request rejected.'})

class RemoveFriendView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        friend_code = request.data.get('friend_code')
        try:
            friend = User.objects.get(friend_code=friend_code)
        except User.DoesNotExist:
            return Response({'error': 'Friend not found'}, status=404)

        # Delete both directions
        Friendship.objects.filter(user=request.user, friend=friend).delete()
        Friendship.objects.filter(user=friend, friend=request.user).delete()

        return Response({'message': 'Friend removed successfully'}, status=200)
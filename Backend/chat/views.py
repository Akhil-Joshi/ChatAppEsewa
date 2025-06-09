from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from .models import Friendship, ChatGroup, Message
from .serializers import FriendshipSerializer, ChatGroupSerializer, MessageSerializer
from core.models import User
import nltk
from nltk.sentiment.vader import SentimentIntensityAnalyzer
nltk.download('vader_lexicon')

class FriendListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        friendships = Friendship.objects.filter(
            user=request.user, status='accepted'
        ) | Friendship.objects.filter(friend=request.user, status='accepted')
        serializer = FriendshipSerializer(friendships, many=True)
        return Response({
            'success': True,
            'data': serializer.data
        }, status=status.HTTP_200_OK)

class FriendRequestView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        friend_id = request.data.get('friend_id')
        try:
            friend = User.objects.get(id=friend_id)
            if friend == request.user:
                return Response({
                    'success': False,
                    'message': 'Cannot add yourself as a friend'
                }, status=status.HTTP_400_BAD_REQUEST)
            friendship, created = Friendship.objects.get_or_create(
                user=request.user, friend=friend, defaults={'status': 'pending'}
            )
            if not created and friendship.status != 'pending':
                return Response({
                    'success': False,
                    'message': f'Friendship already {friendship.status}'
                }, status=status.HTTP_400_BAD_REQUEST)
            return Response({
                'success': True,
                'message': 'Friend request sent'
            }, status=status.HTTP_201_CREATED)
        except User.DoesNotExist:
            return Response({
                'success': False,
                'message': 'User not found'
            }, status=status.HTTP_404_NOT_FOUND)

    def put(self, request):
        friend_id = request.data.get('friend_id')
        action = request.data.get('action')  # 'accept' or 'reject'
        try:
            friendship = Friendship.objects.get(friend=request.user, user_id=friend_id, status='pending')
            if action == 'accept':
                friendship.status = 'accepted'
                friendship.save()
                return Response({
                    'success': True,
                    'message': 'Friend request accepted'
                }, status=status.HTTP_200_OK)
            elif action == 'reject':
                friendship.status = 'rejected'
                friendship.save()
                return Response({
                    'success': True,
                    'message': 'Friend request rejected'
                }, status=status.HTTP_200_OK)
            else:
                return Response({
                    'success': False,
                    'message': 'Invalid action'
                }, status=status.HTTP_400_BAD_REQUEST)
        except Friendship.DoesNotExist:
            return Response({
                'success': False,
                'message': 'Friend request not found'
            }, status=status.HTTP_404_NOT_FOUND)

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
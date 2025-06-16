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
        user.full_name = data.get('full_name', user.full_name)
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


class PendingFriendRequestsView(generics.ListAPIView):
    """List all pending friend requests received by the authenticated user"""
    serializer_class = FriendRequestSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return FriendRequest.objects.filter(
            to_user=self.request.user,
            status='pending'
        ).select_related('from_user')

class SendFriendRequestView(APIView):
    """Send a new friend request using friend_code"""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        friend_code = request.data.get('friend_code')

        if not friend_code:
            return Response({'error': 'friend_code is required.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            to_user = User.objects.get(friend_code=friend_code)
        except User.DoesNotExist:
            return Response({'error': 'User with provided friend_code not found.'}, status=status.HTTP_404_NOT_FOUND)

        if to_user == request.user:
            return Response({'error': 'You cannot send a friend request to yourself.'}, status=status.HTTP_400_BAD_REQUEST)

        if FriendRequest.objects.filter(from_user=request.user, to_user=to_user, status='pending').exists():
            return Response({'error': 'Friend request already sent and pending.'}, status=status.HTTP_400_BAD_REQUEST)

        # Create friend request
        friend_request = FriendRequest.objects.create(
            from_user=request.user,
            to_user=to_user,
            status='pending'
        )

        return Response({
            'message': 'Friend request sent successfully.',
            'friend_request': FriendRequestSerializer(friend_request).data
        }, status=status.HTTP_201_CREATED)


class FriendRequestHistoryView(generics.ListAPIView):
    """List all friend requests (sent and received) for the authenticated user"""
    serializer_class = FriendRequestSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return FriendRequest.objects.filter(
            Q(from_user=self.request.user) | Q(to_user=self.request.user)
        ).select_related('from_user', 'to_user')

class RespondToFriendRequestView(APIView):
    def post(self, request):
        friend_code = request.data.get('friend_code')
        action = request.data.get('action')  # 'accept' or 'reject'

        if not friend_code:
            return Response({'error': 'Missing friend_code'}, status=400)

        if action not in ['accept', 'reject']:
            return Response({'error': 'Invalid action. Must be accept or reject.'}, status=400)

        try:
            friend_request = FriendRequest.objects.get(
                from_user__friend_code=friend_code,
                to_user=request.user
            )
        except FriendRequest.DoesNotExist:
            return Response({'error': 'Friend request not found.'}, status=404)

        friend_request.status = 'accepted' if action == 'accept' else 'rejected'
        friend_request.save()

        return Response({'message': f'Friend request {action}ed successfully.'})
    
class FriendListView(generics.ListAPIView):
    """List all friends of the authenticated user"""
    serializer_class = FriendshipSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Get all friends for the authenticated user
        friendships = Friendship.objects.filter(user=self.request.user)
        friend_ids = friendships.values_list('friend_id', flat=True)
        return User.objects.filter(id__in=friend_ids)

class MutualFriendsView(generics.ListAPIView):
    """List mutual friends between authenticated user and another user"""
    serializer_class = FriendshipSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        other_user_id = self.kwargs.get('user_id')
        
        # Get friends of the authenticated user
        user_friends = Friendship.objects.filter(
            user=self.request.user
        ).values_list('friend_id', flat=True)
        
        # Get friends of the other user
        other_user_friends = Friendship.objects.filter(
            user_id=other_user_id
        ).values_list('friend_id', flat=True)
        
        # Find mutual friends
        mutual_friend_ids = set(user_friends).intersection(set(other_user_friends))
        
        return User.objects.filter(id__in=mutual_friend_ids)

class RemoveFriendView(APIView):
    """Remove a friend (delete bidirectional friendship)"""
    permission_classes = [IsAuthenticated]

    def delete(self, request, friend_id):
        try:
            friend = User.objects.get(id=friend_id)
        except User.DoesNotExist:
            return Response({'error': 'User not found.'}, 
                          status=status.HTTP_404_NOT_FOUND)

        # Check if friendship exists
        friendship_exists = Friendship.objects.filter(
            user=request.user, 
            friend=friend
        ).exists()

        if not friendship_exists:
            return Response({'error': 'You are not friends with this user.'}, 
                          status=status.HTTP_400_BAD_REQUEST)

        # Remove bidirectional friendship
        Friendship.objects.filter(
            Q(user=request.user, friend=friend) |
            Q(user=friend, friend=request.user)
        ).delete()

        return Response({'message': f'Successfully removed {friend.username} from friends.'})

class FriendshipStatsView(APIView):
    """Get friendship statistics for the authenticated user"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        
        stats = {
            'total_friends': Friendship.objects.filter(user=user).count(),
            'pending_requests_received': FriendRequest.objects.filter(
                to_user=user, 
                status='pending'
            ).count(),
            'pending_requests_sent': FriendRequest.objects.filter(
                from_user=user, 
                status='pending'
            ).count(),
            'total_requests_sent': FriendRequest.objects.filter(
                from_user=user
            ).count(),
            'total_requests_received': FriendRequest.objects.filter(
                to_user=user
            ).count(),
            'accepted_requests': FriendRequest.objects.filter(
                Q(from_user=user) | Q(to_user=user),
                status='accepted'
            ).count(),
            'rejected_requests': FriendRequest.objects.filter(
                Q(from_user=user) | Q(to_user=user),
                status='rejected'
            ).count(),
        }
        
        return Response(stats)

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
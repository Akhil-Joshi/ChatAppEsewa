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

        if Friendship.objects.filter(user=request.user, friend=to_user).exists():
            return Response({'error': 'You are already friends with this user.'}, status=status.HTTP_400_BAD_REQUEST)

        if FriendRequest.objects.filter(from_user=request.user, to_user=to_user, status='pending').exists():
            return Response({'error': 'Friend request already sent and pending.'}, status=status.HTTP_400_BAD_REQUEST)

        friend_request = FriendRequest.objects.create(
            from_user=request.user,
            to_user=to_user,
            status='pending'
        )

        return Response({
            'success': True,
            'message': 'Friend request sent successfully.',
            'data': FriendRequestSerializer(friend_request).data
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
    """Accept or reject a friend request and create friendship if accepted"""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        friend_code = request.data.get('friend_code')
        action = request.data.get('action')  # 'accept' or 'reject'

        if not friend_code or not action:
            return Response({
                'success': False,
                'error': 'Both friend_code and action are required.'
            }, status=status.HTTP_400_BAD_REQUEST)

        if action not in ['accept', 'reject']:
            return Response({
                'success': False,
                'error': 'Invalid action. Must be "accept" or "reject".'
            }, status=status.HTTP_400_BAD_REQUEST)

        try:
            friend_request = FriendRequest.objects.get(
                from_user__friend_code=friend_code,
                to_user=request.user,
                status='pending'
            )
        except FriendRequest.DoesNotExist:
            return Response({
                'success': False,
                'error': 'Friend request not found or already processed.'
            }, status=status.HTTP_404_NOT_FOUND)

        friend_request.status = 'accepted' if action == 'accept' else 'rejected'
        friend_request.save()

        if action == 'accept':
            from_user = friend_request.from_user
            to_user = friend_request.to_user

            from django.db import transaction

            with transaction.atomic():
                friendship1, created1 = Friendship.objects.get_or_create(user=from_user, friend=to_user)
                friendship2, created2 = Friendship.objects.get_or_create(user=to_user, friend=from_user)


            return Response({
                'success': True,
                'message': f'Friend request accepted! You are now friends with {from_user.full_name or from_user.email}.',
                'data': {
                    'friend_request': FriendRequestSerializer(friend_request).data,
                    'new_friend': UserProfileSerializer(from_user).data,
                    'friendship_created': created1 and created2
                }
            }, status=status.HTTP_200_OK)
        else:
            return Response({
                'success': True,
                'message': 'Friend request rejected.',
                'data': {
                    'friend_request': FriendRequestSerializer(friend_request).data
                }
            }, status=status.HTTP_200_OK)

class FriendListView(APIView):
    """List all friends of the authenticated user with their details"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user

        accepted_requests = FriendRequest.objects.filter(
            Q(from_user=user) | Q(to_user=user),
            status='accepted'
        ).select_related('from_user', 'to_user')

        friend_users = set()
        for fr in accepted_requests:
            if fr.from_user == user:
                friend_users.add(fr.to_user)
            else:
                friend_users.add(fr.from_user)

        friends_data = [{
            'id': friend.id,
            'email': friend.email,
            'full_name': friend.full_name,
            'friend_code': friend.friend_code,
            'profile_photo': friend.profile_photo.url if friend.profile_photo else None,
        } for friend in friend_users]

        return Response({
            'success': True,
            'message': f'Found {len(friends_data)} friends.',
            'data': friends_data
        }, status=status.HTTP_200_OK)

class MutualFriendsView(generics.ListAPIView):
    """List mutual friends between authenticated user and another user"""
    serializer_class = FriendshipSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        other_user_id = self.kwargs.get('user_id')

        user_friends = Friendship.objects.filter(user=self.request.user).values_list('friend_id', flat=True)
        other_user_friends = Friendship.objects.filter(user_id=other_user_id).values_list('friend_id', flat=True)

        mutual_friend_ids = set(user_friends).intersection(set(other_user_friends))

        return User.objects.filter(id__in=mutual_friend_ids)

class RemoveFriendView(APIView):
    """Remove a friend using their friend_code"""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        friend_code = request.data.get('friend_code')

        if not friend_code:
            return Response({'success': False, 'error': 'friend_code is required.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            friend = User.objects.get(friend_code=friend_code)
        except User.DoesNotExist:
            return Response({'success': False, 'error': 'User with provided friend_code not found.'}, status=status.HTTP_404_NOT_FOUND)

        friendship_exists = Friendship.objects.filter(user=request.user, friend=friend).exists()
        if not friendship_exists:
            return Response({'success': False, 'error': 'You are not friends with this user.'}, status=status.HTTP_400_BAD_REQUEST)

        deleted_count = Friendship.objects.filter(
            Q(user=request.user, friend=friend) | Q(user=friend, friend=request.user)
        ).delete()[0]

        return Response({
            'success': True,
            'message': f'Successfully removed {friend.full_name or friend.email} from friends.',
            'data': {
                'removed_friend': UserProfileSerializer(friend).data,
                'friendships_deleted': deleted_count
            }
        }, status=status.HTTP_200_OK)

class FriendshipStatsView(APIView):
    """Get friendship statistics for the authenticated user"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user

        stats = {
            'total_friends': user.get_total_friends(),
            'pending_requests_received': FriendRequest.objects.filter(to_user=user, status='pending').count(),
            'pending_requests_sent': FriendRequest.objects.filter(from_user=user, status='pending').count(),
            'total_requests_sent': FriendRequest.objects.filter(from_user=user).count(),
            'total_requests_received': FriendRequest.objects.filter(to_user=user).count(),
            'accepted_requests': FriendRequest.objects.filter(
                Q(from_user=user) | Q(to_user=user), status='accepted'
            ).count(),
            'rejected_requests': FriendRequest.objects.filter(
                Q(from_user=user) | Q(to_user=user), status='rejected'
            ).count(),
        }

        return Response({'success': True, 'data': stats}, status=status.HTTP_200_OK)


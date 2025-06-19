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
from django.db import transaction
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
import json



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

# Add these views to your existing views.py file


class ChatDetailView(APIView):
    """Get detailed chat messages between two users using friend_code"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        friend_code = request.query_params.get('friend_code')
        page = int(request.query_params.get('page', 1))
        page_size = int(request.query_params.get('page_size', 50))
        
        if not friend_code:
            return Response({
                'success': False,
                'error': 'friend_code is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            friend = User.objects.get(friend_code=friend_code)
        except User.DoesNotExist:
            return Response({
                'success': False,
                'error': 'User with provided friend_code not found'
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Check if they are friends
        friendship_exists = Friendship.objects.filter(
            Q(user=request.user, friend=friend) | Q(user=friend, friend=request.user)
        ).exists()
        
        if not friendship_exists:
            return Response({
                'success': False,
                'error': 'You can only view messages with your friends'
            }, status=status.HTTP_403_FORBIDDEN)
        
        # Get messages between the two users
        messages = Message.objects.filter(
            Q(sender=request.user, recipient=friend) | 
            Q(sender=friend, recipient=request.user)
        ).select_related('sender', 'recipient').order_by('-timestamp')
        
        # Pagination
        start = (page - 1) * page_size
        end = start + page_size
        paginated_messages = messages[start:end]
        
        # Serialize messages with detailed info
        messages_data = []
        for message in paginated_messages:
            messages_data.append({
                'id': message.id,
                'content': message.content,
                'timestamp': message.timestamp,
                'is_read': message.is_read,
                'emotion': message.emotion,
                'show_emotion': message.show_emotion,
                'sender': {
                    'id': message.sender.id,
                    'email': message.sender.email,
                    'full_name': message.sender.full_name,
                    'friend_code': message.sender.friend_code,
                    'profile_photo': message.sender.profile_photo.url if message.sender.profile_photo else None
                },
                'recipient': {
                    'id': message.recipient.id,
                    'email': message.recipient.email,
                    'full_name': message.recipient.full_name,
                    'friend_code': message.recipient.friend_code,
                    'profile_photo': message.recipient.profile_photo.url if message.recipient.profile_photo else None
                } if message.recipient else None
            })
        
        return Response({
            'success': True,
            'data': {
                'messages': messages_data,
                'pagination': {
                    'current_page': page,
                    'page_size': page_size,
                    'total_messages': messages.count(),
                    'has_next': messages.count() > end,
                    'has_previous': page > 1
                },
                'chat_partner': {
                    'id': friend.id,
                    'email': friend.email,
                    'full_name': friend.full_name,
                    'friend_code': friend.friend_code,
                    'profile_photo': friend.profile_photo.url if friend.profile_photo else None
                }
            }
        }, status=status.HTTP_200_OK)



class SendMessageView(APIView):
    """Send a message to a friend or group with WebSocket real-time delivery"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        friend_code = request.data.get('friend_code')
        group_id = request.data.get('group_id')
        content = request.data.get('content')
        emotion = request.data.get('emotion')
        show_emotion = request.data.get('show_emotion', True)
        
        if not content:
            return Response({
                'success': False,
                'error': 'Message content is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if not friend_code and not group_id:
            return Response({
                'success': False,
                'error': 'Either friend_code or group_id is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if friend_code and group_id:
            return Response({
                'success': False,
                'error': 'Cannot send to both friend and group simultaneously'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        channel_layer = get_channel_layer()
        
        try:
            with transaction.atomic():
                if friend_code:
                    # Send to friend
                    try:
                        recipient = User.objects.get(friend_code=friend_code)
                    except User.DoesNotExist:
                        return Response({
                            'success': False,
                            'error': 'User with provided friend_code not found'
                        }, status=status.HTTP_404_NOT_FOUND)
                    
                    # Check if they are friends
                    friendship_exists = Friendship.objects.filter(
                        Q(user=request.user, friend=recipient) | 
                        Q(user=recipient, friend=request.user)
                    ).exists()
                    
                    if not friendship_exists:
                        return Response({
                            'success': False,
                            'error': 'You can only send messages to your friends'
                        }, status=status.HTTP_403_FORBIDDEN)
                    
                    # Create message in database
                    message = Message.objects.create(
                        sender=request.user,
                        recipient=recipient,
                        content=content,
                        emotion=emotion,
                        show_emotion=show_emotion
                    )
                    
                    # Prepare message data for WebSocket
                    message_data = {
                        'type': 'direct_message',
                        'message': {
                            'id': message.id,
                            'content': message.content,
                            'timestamp': message.timestamp.isoformat(),
                            'emotion': message.emotion,
                            'show_emotion': message.show_emotion,
                            'sender': {
                                'id': request.user.id,
                                'email': request.user.email,
                                'full_name': request.user.full_name,
                                'friend_code': request.user.friend_code,
                                'profile_photo': request.user.profile_photo.url if request.user.profile_photo else None
                            },
                            'recipient': {
                                'id': recipient.id,
                                'email': recipient.email,
                                'full_name': recipient.full_name,
                                'friend_code': recipient.friend_code,
                                'profile_photo': recipient.profile_photo.url if recipient.profile_photo else None
                            }
                        }
                    }
                    
                    # Send via WebSocket to recipient
                    async_to_sync(channel_layer.group_send)(
                        f"user_{recipient.id}",
                        {
                            'type': 'send_message',
                            'message': json.dumps(message_data)
                        }
                    )
                    
                    # Send confirmation back to sender via WebSocket
                    async_to_sync(channel_layer.group_send)(
                        f"user_{request.user.id}",
                        {
                            'type': 'message_sent_confirmation',
                            'message': json.dumps({
                                'type': 'message_sent',
                                'message_id': message.id,
                                'status': 'delivered',
                                'timestamp': message.timestamp.isoformat()
                            })
                        }
                    )
                    
                    response_data = message_data['message']
                    
                elif group_id:
                    # Send to group
                    try:
                        group = ChatGroup.objects.get(id=group_id)
                    except ChatGroup.DoesNotExist:
                        return Response({
                            'success': False,
                            'error': 'Group not found'
                        }, status=status.HTTP_404_NOT_FOUND)
                    
                    # Check if user is a member of the group
                    if not group.members.filter(id=request.user.id).exists():
                        return Response({
                            'success': False,
                            'error': 'You are not a member of this group'
                        }, status=status.HTTP_403_FORBIDDEN)
                    
                    # Create message in database
                    message = Message.objects.create(
                        sender=request.user,
                        group=group,
                        content=content,
                        emotion=emotion,
                        show_emotion=show_emotion
                    )
                    
                    # Prepare message data for WebSocket
                    message_data = {
                        'type': 'group_message',
                        'message': {
                            'id': message.id,
                            'content': message.content,
                            'timestamp': message.timestamp.isoformat(),
                            'emotion': message.emotion,
                            'show_emotion': message.show_emotion,
                            'sender': {
                                'id': request.user.id,
                                'email': request.user.email,
                                'full_name': request.user.full_name,
                                'friend_code': request.user.friend_code,
                                'profile_photo': request.user.profile_photo.url if request.user.profile_photo else None
                            },
                            'group': {
                                'id': group.id,
                                'name': group.name,
                                'is_private': group.is_private
                            }
                        }
                    }
                    
                    # Send via WebSocket to all group members
                    async_to_sync(channel_layer.group_send)(
                        f"group_{group.id}",
                        {
                            'type': 'send_message',
                            'message': json.dumps(message_data)
                        }
                    )
                    
                    response_data = message_data['message']
                
                return Response({
                    'success': True,
                    'message': 'Message sent successfully',
                    'data': response_data
                }, status=status.HTTP_201_CREATED)
                
        except Exception as e:
            return Response({
                'success': False,
                'error': f'Failed to send message: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class AddGroupMembersView(APIView):
    """Add new members to a group using their friend codes"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        group_id = request.data.get('group_id')
        friend_codes = request.data.get('friend_codes', [])
        
        if not group_id:
            return Response({
                'success': False,
                'error': 'group_id is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if not friend_codes or not isinstance(friend_codes, list):
            return Response({
                'success': False,
                'error': 'friend_codes must be a non-empty list'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            group = ChatGroup.objects.get(id=group_id)
        except ChatGroup.DoesNotExist:
            return Response({
                'success': False,
                'error': 'Group not found'
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Check if user is the creator or a member of the group
        if group.creator != request.user and not group.members.filter(id=request.user.id).exists():
            return Response({
                'success': False,
                'error': 'You must be a member or creator of the group to add members'
            }, status=status.HTTP_403_FORBIDDEN)
        
        added_members = []
        failed_additions = []
        already_members = []
        
        try:
            with transaction.atomic():
                for friend_code in friend_codes:
                    try:
                        user_to_add = User.objects.get(friend_code=friend_code)
                        
                        # Check if user is already a member
                        if group.members.filter(id=user_to_add.id).exists():
                            already_members.append({
                                'friend_code': friend_code,
                                'user': {
                                    'id': user_to_add.id,
                                    'full_name': user_to_add.full_name,
                                    'email': user_to_add.email
                                },
                                'reason': 'Already a member'
                            })
                            continue
                        
                        # Check if the user requesting is friends with the user to be added
                        friendship_exists = Friendship.objects.filter(
                            Q(user=request.user, friend=user_to_add) | 
                            Q(user=user_to_add, friend=request.user)
                        ).exists()
                        
                        if not friendship_exists and group.creator != request.user:
                            failed_additions.append({
                                'friend_code': friend_code,
                                'user': {
                                    'id': user_to_add.id,
                                    'full_name': user_to_add.full_name,
                                    'email': user_to_add.email
                                },
                                'reason': 'Not friends with this user'
                            })
                            continue
                        
                        # Add user to group
                        group.members.add(user_to_add)
                        added_members.append({
                            'friend_code': friend_code,
                            'user': {
                                'id': user_to_add.id,
                                'full_name': user_to_add.full_name,
                                'email': user_to_add.email,
                                'profile_photo': user_to_add.profile_photo.url if user_to_add.profile_photo else None
                            }
                        })
                        
                    except User.DoesNotExist:
                        failed_additions.append({
                            'friend_code': friend_code,
                            'user': None,
                            'reason': 'User not found'
                        })
                
                # Create a system message about new members if any were added
                if added_members:
                    member_names = [member['user']['full_name'] or member['user']['email'] 
                                  for member in added_members]
                    system_message_content = f"{request.user.full_name or request.user.email} added {', '.join(member_names)} to the group"
                    
                    Message.objects.create(
                        sender=request.user,
                        group=group,
                        content=system_message_content,
                        emotion='neutral'
                    )
                
                return Response({
                    'success': True,
                    'message': f'Successfully processed {len(friend_codes)} member addition requests',
                    'data': {
                        'group': {
                            'id': group.id,
                            'name': group.name,
                            'total_members': group.members.count()
                        },
                        'added_members': added_members,
                        'already_members': already_members,
                        'failed_additions': failed_additions,
                        'summary': {
                            'total_requested': len(friend_codes),
                            'successfully_added': len(added_members),
                            'already_members': len(already_members),
                            'failed': len(failed_additions)
                        }
                    }
                }, status=status.HTTP_200_OK)
                
        except Exception as e:
            return Response({
                'success': False,
                'error': f'Failed to add members: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
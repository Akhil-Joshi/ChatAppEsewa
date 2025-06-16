from django.urls import path
from .views import (
    FriendListView, SendFriendRequestView, UnreadMessagesView, ChatHistoryView,
    MarkMessageReadView, CreateGroupView, ProfileUpdateView, ToggleEmotionView, 
    RespondToFriendRequestView, RemoveFriendView, PendingFriendRequestsView,
    FriendRequestHistoryView, FriendshipStatsView, MutualFriendsView
)

app_name = 'chat'

urlpatterns = [
    # Friend management
    path('friends/', FriendListView.as_view(), name='friend-list'),
    path('friends/send-request/', SendFriendRequestView.as_view(), name='send_friend_request'),
    path('friends/pending/', PendingFriendRequestsView.as_view(), name='pending_friend_requests'),
    path('friends/respond/', RespondToFriendRequestView.as_view(), name='respond_friend_request'),
    path('friends/remove/', RemoveFriendView.as_view(), name='remove-friend'),
    path('friends/history/', FriendRequestHistoryView.as_view(), name='friend_request_history'),
    path('friends/stats/', FriendshipStatsView.as_view(), name='friendship_stats'),
    path('friends/mutual/<int:user_id>/', MutualFriendsView.as_view(), name='mutual_friends'),
    
    # Chat and messaging
    path('unread-messages/', UnreadMessagesView.as_view(), name='unread-messages'),
    path('chat-history/<int:recipient_id>/', ChatHistoryView.as_view(), name='chat-history-user'),
    path('chat-history/group/<int:group_id>/', ChatHistoryView.as_view(), name='chat-history-group'),
    path('mark-read/<int:message_id>/', MarkMessageReadView.as_view(), name='mark-read'),
    
    # Group management
    path('group/create/', CreateGroupView.as_view(), name='create-group'),
    
    # Profile and message features
    path('profile/update/', ProfileUpdateView.as_view(), name='profile-update'),
    path('toggle-emotion/<int:message_id>/', ToggleEmotionView.as_view(), name='toggle-emotion'),
]
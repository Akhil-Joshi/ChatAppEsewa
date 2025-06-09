from django.urls import path
from .views import (
    FriendListView, FriendRequestView, UnreadMessagesView, ChatHistoryView,
    MarkMessageReadView, CreateGroupView, ProfileUpdateView, ToggleEmotionView
)

app_name = 'chat'

urlpatterns = [
    path('friends/', FriendListView.as_view(), name='friend-list'),
    path('friend-request/', FriendRequestView.as_view(), name='friend-request'),
    path('unread-messages/', UnreadMessagesView.as_view(), name='unread-messages'),
    path('chat-history/<int:recipient_id>/', ChatHistoryView.as_view(), name='chat-history-user'),
    path('chat-history/group/<int:group_id>/', ChatHistoryView.as_view(), name='chat-history-group'),
    path('mark-read/<int:message_id>/', MarkMessageReadView.as_view(), name='mark-read'),
    path('group/create/', CreateGroupView.as_view(), name='create-group'),
    path('profile/update/', ProfileUpdateView.as_view(), name='profile-update'),
    path('toggle-emotion/<int:message_id>/', ToggleEmotionView.as_view(), name='toggle-emotion'),
]
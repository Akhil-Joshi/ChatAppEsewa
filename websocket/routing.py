from django.urls import re_path
from . import consumers

websocket_urlpatterns = [
    # Group chat
    re_path(r'ws/chat/group/$', consumers.ChatConsumer.as_asgi()),

    # Private chat with friend_code
    re_path(r'ws/chat/private/(?P<friend_code>[\w-]+)/$', consumers.PrivateChatConsumer.as_asgi()),
]

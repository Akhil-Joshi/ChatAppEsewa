from django.urls import re_path
from .consumer import ChatConsumer

websocket_urlpatterns = [
    # This makes each user have their own private WebSocket channel
    re_path(r'ws/chat/(?P<friend_code>\w+)/$', ChatConsumer.as_asgi()),
]

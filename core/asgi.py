# import os
# import django

# os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
# django.setup()

# from channels.auth import AuthMiddlewareStack
# from django.core.asgi import get_asgi_application
# from channels.routing import ProtocolTypeRouter, URLRouter
# from channels.security.websocket import AllowedHostsOriginValidator
# import websocket.routing 
# application = ProtocolTypeRouter(
#     {
#         "http": get_asgi_application(),
#         "websocket": AllowedHostsOriginValidator(
#             AuthMiddlewareStack(
#                 URLRouter(
#                     websocket.routing.websocket_urlpatterns
#                 )
#             )
#         ),
#     }
# )


# asgi.py

from channels.auth import AuthMiddlewareStack
from channels.sessions import SessionMiddlewareStack
from channels.routing import ProtocolTypeRouter, URLRouter
from django.core.asgi import get_asgi_application
from django.urls import path
from websocket.consumers import ChatConsumer, PrivateChatConsumer

application = ProtocolTypeRouter({
    "http": get_asgi_application(),
    "websocket": SessionMiddlewareStack(
        AuthMiddlewareStack(
            URLRouter([
                path("ws/chat/group/", ChatConsumer.as_asgi()),
                path("ws/chat/private/<str:friend_code>/", PrivateChatConsumer.as_asgi()),
            ])
        )
    ),
})

import os
import django
from channels.routing import ProtocolTypeRouter, URLRouter

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'AuthApi.settings')  
django.setup()  

from chat.middleware import JWTAuthMiddlewareStack
import chat.routing

application = ProtocolTypeRouter({
  "http":django.asgi.application,
    "websocket": JWTAuthMiddlewareStack(
        URLRouter(
            chat.routing.websocket_urlpatterns
        )
    ),
})

import os
from channels.routing import ProtocolTypeRouter, URLRouter
from django.core.asgi import get_asgi_application
from channels.auth import AuthMiddlewareStack
import chat.routing  # ← updated to app 'chat'

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'AuthApi.settings')  # ← updated to project

application = ProtocolTypeRouter({
    "http": get_asgi_application(),
    "websocket": AuthMiddlewareStack(
      URLRouter(
        chat.routing.websocket_urlpatterns 
    ) # ← updated
    ),
})

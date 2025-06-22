import os
import django
from channels.routing import ProtocolTypeRouter, URLRouter
from django.core.asgi import get_asgi_application 

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'AuthApi.settings')
django.setup()

from chat.middleware import JWTAuthMiddlewareStack
import chat.routing

application = ProtocolTypeRouter({
  "http": get_asgi_application(),
  "websocket": JWTAuthMiddlewareStack(
    URLRouter(
      chat.routing.websocket_urlpatterns
    )
  ),
})

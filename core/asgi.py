import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from channels.auth import AuthMiddlewareStack
from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.security.websocket import AllowedHostsOriginValidator
import websocket.routing 
application = ProtocolTypeRouter(
    {
        "http": get_asgi_application(),
        "websocket": AllowedHostsOriginValidator(
            AuthMiddlewareStack(
                URLRouter(
                    websocket.routing.websocket_urlpatterns
                )
            )
        ),
    }
)


# from channels.routing import ProtocolTypeRouter, URLRouter
# from websocket.middleware import JWTAuthMiddleware  # <- Your 
# from django.core.asgi import get_asgi_application
# import websocket.routing

# application = ProtocolTypeRouter({
#   "http": get_asgi_application(),
#     "websocket": JWTAuthMiddleware(
#         URLRouter(
#             websocket.routing.websocket_urlpatterns
#         )
#     ),
# })

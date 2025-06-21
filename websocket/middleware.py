# from urllib.parse import parse_qs
# from channels.db import database_sync_to_async
# from django.contrib.auth.models import AnonymousUser
# from rest_framework_simplejwt.tokens import AccessToken
# from django.contrib.auth import get_user_model

# User = get_user_model()

# @database_sync_to_async
# def get_user_from_token(token_str):
#     try:
#         access_token = AccessToken(token_str)
#         user_id = access_token['user_id']
#         return User.objects.get(id=user_id)
#     except Exception:
#         return AnonymousUser()

# class JWTAuthMiddleware:
#     """
#     WebSocket middleware for JWT access token auth
#     URL format: ws://localhost:8000/ws/chat/private/<friend_code>/?token=<ACCESS_TOKEN>
#     """
#     def __init__(self, inner):
#         self.inner = inner

#     def __call__(self, scope):
#         return JWTAuthMiddlewareInstance(scope, self)

# class JWTAuthMiddlewareInstance:
#     def __init__(self, scope, middleware):
#         self.scope = scope
#         self.middleware = middleware

#     async def __call__(self, receive, send,):
#         query_string = self.scope.get('query_string', b'').decode()
#         token = parse_qs(query_string).get('token', [None])[0]

#         self.scope['user'] = await get_user_from_token(token)
#         return await self.middleware.inner(self.scope)(receive, send)

from urllib.parse import parse_qs
from channels.db import database_sync_to_async
from django.contrib.auth.models import AnonymousUser
from rest_framework_simplejwt.tokens import UntypedToken
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
import jwt
from channels.middleware import BaseMiddleware
from django.conf import settings

User = get_user_model()

@database_sync_to_async
def get_user(validated_token):
    try:
        user_id = validated_token["user_id"]
        return User.objects.get(id=user_id)
    except User.DoesNotExist:
        return AnonymousUser()

class JWTAuthMiddleware(BaseMiddleware):
    async def __call__(self, scope, receive, send):
        query_string = parse_qs(scope["query_string"].decode())
        token = query_string.get("token", [None])[0]

        if token is None:
            scope["user"] = AnonymousUser()
            return await self.inner(scope, receive, send)  # ✅ FIXED

        try:
            validated_token = UntypedToken(token)
            decoded_data = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
            user = await get_user(decoded_data)
            scope["user"] = user
        except (InvalidToken, TokenError, jwt.DecodeError):
            scope["user"] = AnonymousUser()

        return await self.inner(scope, receive, send)  # ✅ FIXED

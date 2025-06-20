import json
import base64
from time import localtime
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from asgiref.sync import sync_to_async
from django.utils import timezone
from django.core.files.base import ContentFile
from django.utils.crypto import get_random_string
from django.core.exceptions import PermissionDenied as DenyConnection
from django.contrib.auth import get_user_model
from .models import ChatMessage, Message
# from .utils import format_timestamp  # Uncomment if needed

User = get_user_model()


class ChatConsumer(AsyncWebsocketConsumer):
    """Group Chat Consumer"""
    async def connect(self):
        self.roomGroupName = "group_chat_gfg"
        await self.channel_layer.group_add(self.roomGroupName, self.channel_name)
        await self.accept()

        messages = await self.get_last_message()
        for msg in messages:
            await self.send(text_data=json.dumps({
                'message': msg['message'],
                'username': msg['username'],
                'timestamp': msg['timestamp'],
                'file': msg.get('file'),
                'filename': msg.get('filename')
            }))

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.roomGroupName, self.channel_name)

    async def receive(self, text_data):
        data = json.loads(text_data)
        message = data.get("message", "")
        username = data.get("username", "")
        file_data = data.get('file')
        file_name = data.get('filename')

        file_obj = None
        file_url = None

        if file_data:
            format, imgstr = file_data.split(';base64,')
            ext = format.split('/')[-1]
            file_name = f"upload_{get_random_string(8)}.{ext}"
            file_obj = ContentFile(base64.b64decode(imgstr), name=file_name)

        if not message and not file_obj:
            return

        saved_message = await self.save_message(username, message, file_obj)
        file_url = saved_message.file.url if saved_message and saved_message.file else None

        await self.channel_layer.group_send(
            self.roomGroupName, {
                "type": "sendMessage",
                "message": message,
                "username": self.scope['user'].username,
                "timestamp": timezone.now().isoformat(),
                "file": file_url,
                "filename": file_name if file_url else None
            }
        )

    async def sendMessage(self, event):
        await self.send(text_data=json.dumps({
            "message": event["message"],
            "username": event["username"],
            "timestamp": event["timestamp"],
            "file": event.get("file"),
            "filename": event.get("filename")
        }))

    @database_sync_to_async
    def save_message(self, username, message, file_obj=None):
        try:
            user = self.scope['user']
            msg = ChatMessage.objects.create(
                user=user,
                message=message,
                file=file_obj
            )
            return msg
        except User.DoesNotExist:
            print(f"User {username} does not exist.")
            return None

    @database_sync_to_async
    def get_last_message(self):
        user = self.scope["user"]
        if user.is_authenticated:
            joined_at = user.date_joined
            messages = ChatMessage.objects.select_related('user').filter(
                timestamp__gte=joined_at
            ).order_by('timestamp')
            return [
                {
                    "username": msg.user.username,
                    "message": msg.message,
                    "timestamp": msg.timestamp.isoformat(),
                    "file": msg.file.url if msg.file else None,
                    "filename": msg.file.name.split("/")[-1] if msg.file else None
                }
                for msg in messages
            ]
        return []


class PrivateChatConsumer(AsyncWebsocketConsumer):
    """Private Chat Consumer using friend_code"""
    async def connect(self):
        self.sender = self.scope['user']

        if not self.sender.is_authenticated:
            raise DenyConnection("User is not authenticated.")

        self.friend_code = self.scope['url_route']['kwargs']['friend_code']
        self.receiver = await self.get_user_by_friend_code(self.friend_code)

        if not self.receiver:
            await self.close()
            return

        self.room_name = f"private_chat_{self.friend_code}"

        await self.channel_layer.group_add(
            self.room_name,
            self.channel_name
        )
        await self.accept()

        messages = await self.get_last_messages()
        await self.send(text_data=json.dumps({
            "type": "last_messages",
            "messages": messages
        }))

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            self.room_name,
            self.channel_name
        )

    async def receive(self, text_data):
        data = json.loads(text_data)
        message = data.get('message')
        file_data = data.get('file')
        file_name = data.get('filename')

        file_obj = None
        file_url = None

        if file_data:
            format, imgstr = file_data.split(';base64,')
            ext = format.split('/')[-1]
            file_name = f"upload_{get_random_string(8)}.{ext}"
            file_obj = ContentFile(base64.b64decode(imgstr), name=file_name)

        if not message and not file_obj:
            return

        saved_message = await self.save_message(self.sender, self.receiver, message, file_obj)
        file_url = saved_message.file.url if saved_message.file else None

        await self.channel_layer.group_send(
            self.room_name,
            {
                "type": "send_message",
                "message": message,
                "sender": self.sender.username,
                "sender_id": self.sender.id,
                "timestamp": saved_message.timestamp.isoformat(),
                "file": file_url,
                "filename": file_name if file_url else None
            }
        )

    async def send_message(self, event):
        await self.send(text_data=json.dumps({
            "type": "chat_message",
            "message": event["message"],
            "sender": event["sender"],
            "sender_id": event["sender_id"],
            "timestamp": event["timestamp"],
            "file": event.get("file"),
            "filename": event.get("filename")
        }))

    @database_sync_to_async
    def get_user_by_friend_code(self, friend_code):
        try:
            return User.objects.get(friend_code=friend_code)
        except User.DoesNotExist:
            return None

    @database_sync_to_async
    def get_last_messages(self):
        try:
            messages = list(
                Message.objects.filter(
                    sender__in=[self.sender, self.receiver],
                    receiver__in=[self.sender, self.receiver]
                ).order_by('-timestamp')[:50]
            )[::-1]

            return [
                {
                    "sender": msg.sender.username,
                    "sender_id": msg.sender.id,
                    "message": msg.message,
                    "timestamp": msg.timestamp.isoformat(),
                    "file": msg.file.url if msg.file else None,
                    "filename": msg.file.name.split("/")[-1] if msg.file else None
                }
                for msg in messages
            ]
        except Exception as e:
            print(f"Error fetching messages: {e}")
            return []

    @database_sync_to_async
    def save_message(self, sender, receiver, message, file_obj=None):
        return Message.objects.create(
            sender=sender,
            receiver=receiver,
            message=message,
            file=file_obj
        )

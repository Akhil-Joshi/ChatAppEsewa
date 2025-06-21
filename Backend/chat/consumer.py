# import json
# import base64
# from channels.generic.websocket import AsyncWebsocketConsumer
# from channels.db import database_sync_to_async
# from django.utils import timezone
# from django.core.files.base import ContentFile
# from django.utils.crypto import get_random_string
# from django.contrib.auth import get_user_model
# from .models import ChatGroup, Message

# User = get_user_model()

# class ChatConsumer(AsyncWebsocketConsumer):
#     """WebSocket consumer for group chat (uses group_id)."""

#     async def connect(self):
#         self.user = self.scope["user"]
#         if not self.user.is_authenticated:
#             await self.close()
#             return

#         # Get group_id from URL kwargs
#         self.group_id = self.scope['url_route']['kwargs']['group_id']
#         self.room_group_name = f"chat_{self.group_id}"

#         await self.channel_layer.group_add(self.room_group_name, self.channel_name)
#         await self.accept()

#         # Load last 50 messages
#         messages = await self.get_last_messages()
#         for msg in messages:
#             await self.send(text_data=json.dumps(msg))

#     async def disconnect(self, close_code):
#         if hasattr(self, 'room_group_name'):
#             await self.channel_layer.group_discard(self.room_group_name, self.channel_name)

#     async def receive(self, text_data):
#         if not text_data.strip():
#             return

#         try:
#             data = json.loads(text_data)
#         except json.JSONDecodeError:
#             await self.send(text_data=json.dumps({
#                 "type": "error",
#                 "message": "Invalid JSON format."
#             }))
#             return

#         message = data.get("message", "")
#         file_data = data.get("file")
#         file_name = data.get("filename")
#         file_obj = None

#         if file_data:
#             try:
#                 format, imgstr = file_data.split(";base64,")
#                 ext = format.split("/")[-1]
#                 file_name = f"upload_{get_random_string(8)}.{ext}"
#                 file_obj = ContentFile(base64.b64decode(imgstr), name=file_name)
#             except Exception as e:
#                 await self.send(text_data=json.dumps({
#                     "type": "error",
#                     "message": f"Failed to decode file: {str(e)}"
#                 }))
#                 return

#         group = await self.get_chat_group()
#         if not group:
#             await self.send(text_data=json.dumps({
#                 "type": "error",
#                 "message": "Chat group does not exist."
#             }))
#             return

#         saved_msg = await self.save_message(message, file_obj, group)
#         file_url = saved_msg.file.url if saved_msg and saved_msg.file else None

#         await self.channel_layer.group_send(
#             self.room_group_name,
#             {
#                 "type": "chat_message",
#                 "message": message,
#                 "username": f"{self.user.first_name} {self.user.last_name}".strip() or self.user.username,
#                 "timestamp": timezone.now().isoformat(),
#                 "file": file_url,
#                 "filename": file_name if file_url else None
#             }
#         )

#     async def chat_message(self, event):
#         await self.send(text_data=json.dumps({
#             "message": event["message"],
#             "username": event["username"],
#             "timestamp": event["timestamp"],
#             "file": event.get("file"),
#             "filename": event.get("filename")
#         }))

#     @database_sync_to_async
#     def save_message(self, content, file=None, group=None):
#         try:
#             return Message.objects.create(
#                 sender=self.user,
#                 group=group,
#                 content=content,
#                 file=file,
#                 timestamp=timezone.now(),
#                 is_read=False,
#             )
#         except Exception as e:
#             print(f"Save error: {e}")
#             return None

#     @database_sync_to_async
#     def get_last_messages(self):
#         try:
#             group = ChatGroup.objects.get(id=self.group_id)
#             messages = Message.objects.filter(group=group).select_related("sender").order_by("-timestamp")[:50][::-1]
#             return [self.format_message(msg) for msg in messages]
#         except ChatGroup.DoesNotExist:
#             return []

#     @database_sync_to_async
#     def get_chat_group(self):
#         try:
#             return ChatGroup.objects.get(id=self.group_id)
#         except ChatGroup.DoesNotExist:
#             return None

#     def format_message(self, msg):
#         return {
#             "username": f"{msg.sender.first_name} {msg.sender.last_name}".strip() or msg.sender.username,
#             "message": msg.content,
#             "timestamp": msg.timestamp.isoformat(),
#             "file": msg.file.url if msg.file else None,
#             "filename": msg.file.name.split("/")[-1] if msg.file else None
#         }

import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.utils import timezone
from django.contrib.auth import get_user_model
from .models import ChatGroup, Message

User = get_user_model()

class ChatConsumer(AsyncWebsocketConsumer):
    """WebSocket consumer for group chat (uses group_id)."""

    async def connect(self):
        self.user = self.scope["user"]
        if not self.user.is_authenticated:
            await self.close()
            return

        self.group_id = self.scope['url_route']['kwargs']['group_id']
        self.room_group_name = f"chat_{self.group_id}"

        await self.channel_layer.group_add(self.room_group_name, self.channel_name)
        await self.accept()

        messages = await self.get_last_messages()
        for msg in messages:
            await self.send(text_data=json.dumps(msg))

    async def disconnect(self, close_code):
        if hasattr(self, 'room_group_name'):
            await self.channel_layer.group_discard(self.room_group_name, self.channel_name)

    async def receive(self, text_data):
        if not text_data.strip():
            return

        try:
            data = json.loads(text_data)
        except json.JSONDecodeError:
            await self.send(text_data=json.dumps({
                "type": "error",
                "message": "Invalid JSON format."
            }))
            return

        message = data.get("message", "")
        if not message:
            return

        group = await self.get_chat_group()
        if not group:
            await self.send(text_data=json.dumps({
                "type": "error",
                "message": "Chat group does not exist."
            }))
            return

        saved_msg = await self.save_message(message, group)
        
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                "type": "chat_message",
                "message": message,
                "username": f"{self.user.first_name} {self.user.last_name}".strip() or self.user.username,
                "timestamp": timezone.now().isoformat()
            }
        )

    async def chat_message(self, event):
        await self.send(text_data=json.dumps({
            "message": event["message"],
            "username": event["username"],
            "timestamp": event["timestamp"]
        }))

    @database_sync_to_async
    def save_message(self, content, group=None):
        try:
            return Message.objects.create(
                sender=self.user,
                group=group,
                content=content,
                timestamp=timezone.now(),
                is_read=False,
            )
        except Exception as e:
            print(f"Save error: {e}")
            return None

    @database_sync_to_async
    def get_last_messages(self):
        try:
            group = ChatGroup.objects.get(id=self.group_id)
            messages = Message.objects.filter(group=group).select_related("sender").order_by("-timestamp")[:50][::-1]
            return [self.format_message(msg) for msg in messages]
        except ChatGroup.DoesNotExist:
            return []

    @database_sync_to_async
    def get_chat_group(self):
        try:
            return ChatGroup.objects.get(id=self.group_id)
        except ChatGroup.DoesNotExist:
            return None

    def format_message(self, msg):
        return {
            "username": f"{msg.sender.first_name} {msg.sender.last_name}".strip() or msg.sender.username,
            "message": msg.content,
            "timestamp": msg.timestamp.isoformat()
        }

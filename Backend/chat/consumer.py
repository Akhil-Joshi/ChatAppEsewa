# import json
# from channels.generic.websocket import AsyncWebsocketConsumer
# from channels.db import database_sync_to_async
# from .models import Message, ChatGroup
# from .serializers import MessageSerializer

# class ChatConsumer(AsyncWebsocketConsumer):
#     async def connect(self):
#         self.friend_code = self.scope['url_route']['kwargs']['friend_code']
#         self.room_group_name = f'chat_{self.friend_code}'  # use friend_code directly as room name

#         await self.channel_layer.group_add(
#             self.room_group_name,
#             self.channel_name
#         )
#         await self.accept()

#     async def disconnect(self, close_code):
#         await self.channel_layer.group_discard(
#             self.room_group_name,
#             self.channel_name
#         )

#     async def receive(self, text_data):
#         try:
#             data = json.loads(text_data)
#             content = data.get('content', '').strip()
#             group_id = data.get('group_id')

#             if not content:
#                 return  # skip empty messages silently

#             message = await self.create_message(content, group_id)
#             serializer = MessageSerializer(message)

#             await self.channel_layer.group_send(
#                 self.room_group_name,
#                 {
#                     'type': 'chat_message',
#                     'message': serializer.data
#                 }
#             )
#         except Exception as e:
#             print(f"WebSocket receive error: {e}")

#     async def chat_message(self, event):
#         await self.send(text_data=json.dumps({
#             'message': event['message']
#         }))

#     @database_sync_to_async
#     def create_message(self, content, group_id):
#         message = Message.objects.create(
#             content=content
#         )
#         if group_id:
#             try:
#                 message.group = ChatGroup.objects.get(id=group_id)
#             except ChatGroup.DoesNotExist:
#                 pass
#         message.save()
#         return message


# Backend/chat/consumers.py

import json
from channels.generic.websocket import AsyncWebsocketConsumer

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.friend_code = self.scope['url_route']['kwargs']['friend_code']
        self.room_group_name = f"chat_{self.friend_code}"

        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )

        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    async def receive(self, text_data):
        text_data_json = json.loads(text_data)
        message = text_data_json['message']

        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'chat_message',
                'message': message
            }
        )

    async def chat_message(self, event):
        message = event['message']

        await self.send(text_data=json.dumps({
            'message': message
        }))

import json
import base64
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model
from django.core.files.base import ContentFile
from django.utils.crypto import get_random_string
from .models import Message, ChatGroup, Friendship
from .serializers import MessageSerializer

User = get_user_model()

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user = self.scope["user"]
        self.user_group_name = f"user_{self.user.id}"

        if self.user.is_anonymous:
            await self.close()
            return

        # Join user's personal room for direct messages
        await self.channel_layer.group_add(
            self.user_group_name,
            self.channel_name
        )

        # Join all groups user is a member of
        user_groups = await self.get_user_groups()
        for group in user_groups:
            group_name = f"group_{group.id}"
            await self.channel_layer.group_add(
                group_name,
                self.channel_name
            )

        await self.accept()

        # Send online status
        await self.send_online_status(True)

    async def disconnect(self, close_code):
        # Leave user's personal room
        await self.channel_layer.group_discard(
            self.user_group_name,
            self.channel_name
        )

        # Leave all group rooms
        user_groups = await self.get_user_groups()
        for group in user_groups:
            group_name = f"group_{group.id}"
            await self.channel_layer.group_discard(
                group_name,
                self.channel_name
            )

        # Send offline status
        await self.send_online_status(False)

    async def receive(self, text_data):
        try:
            data = json.loads(text_data)
            message_type = data.get('type')

            if message_type == 'typing_indicator':
                await self.handle_typing_indicator(data)
            elif message_type == 'mark_as_read':
                await self.handle_mark_as_read(data)
            elif message_type == 'join_group':
                await self.handle_join_group(data)
            elif message_type == 'leave_group':
                await self.handle_leave_group(data)
            elif message_type == 'send_message':
                await self.handle_send_message(data)
        except json.JSONDecodeError:
            await self.send(text_data=json.dumps({
                'error': 'Invalid JSON format'
            }))

    async def send_message(self, event):
        message = event['message']
        await self.send(text_data=message)

    async def message_sent_confirmation(self, event):
        message = event['message']
        await self.send(text_data=message)

    async def typing_indicator(self, event):
        await self.send(text_data=json.dumps(event['data']))

    async def user_online_status(self, event):
        await self.send(text_data=json.dumps(event['data']))

    async def handle_typing_indicator(self, data):
        recipient_id = data.get('recipient_id')
        group_id = data.get('group_id')
        is_typing = data.get('is_typing', False)

        typing_data = {
            'type': 'typing_indicator',
            'user_id': self.user.id,
            'user_name': self.user.full_name or self.user.email,
            'is_typing': is_typing
        }

        if recipient_id:
            await self.channel_layer.group_send(
                f"user_{recipient_id}",
                {
                    'type': 'typing_indicator',
                    'data': typing_data
                }
            )
        elif group_id:
            await self.channel_layer.group_send(
                f"group_{group_id}",
                {
                    'type': 'typing_indicator',
                    'data': typing_data
                }
            )

    async def handle_mark_as_read(self, data):
        message_id = data.get('message_id')
        if message_id:
            await self.mark_message_as_read(message_id)

    async def handle_join_group(self, data):
        group_id = data.get('group_id')
        if group_id:
            await self.channel_layer.group_add(
                f"group_{group_id}",
                self.channel_name
            )

    async def handle_leave_group(self, data):
        group_id = data.get('group_id')
        if group_id:
            await self.channel_layer.group_discard(
                f"group_{group_id}",
                self.channel_name
            )

    async def handle_send_message(self, data):
        content = data.get('content')
        group_id = data.get('group_id')
        recipient_id = data.get('recipient_id')
        file_data = data.get('file')

        file_obj = None
        if file_data:
            format, imgstr = file_data.split(';base64,')
            ext = format.split('/')[-1]
            file_name = f"upload_{get_random_string(8)}.{ext}"
            file_obj = ContentFile(base64.b64decode(imgstr), name=file_name)

        if not content and not file_obj:
            return

        message = await self.create_message(self.user, content, group_id, recipient_id, file_obj)
        serialized = MessageSerializer(message).data

        if group_id:
            room = f"group_{group_id}"
        elif recipient_id:
            room = f"user_{recipient_id}"
        else:
            return

        await self.channel_layer.group_send(
            room,
            {
                'type': 'send_message',
                'message': json.dumps({
                    'type': 'chat_message',
                    'message': serialized
                })
            }
        )

    async def send_online_status(self, is_online):
        friends = await self.get_user_friends()
        for friend in friends:
            await self.channel_layer.group_send(
                f"user_{friend.id}",
                {
                    'type': 'user_online_status',
                    'data': {
                        'type': 'user_status',
                        'user_id': self.user.id,
                        'user_name': self.user.full_name or self.user.email,
                        'is_online': is_online
                    }
                }
            )

    @database_sync_to_async
    def get_user_groups(self):
        return list(ChatGroup.objects.filter(members=self.user))

    @database_sync_to_async
    def get_user_friends(self):
        return [f.friend for f in Friendship.objects.filter(user=self.user)]

    @database_sync_to_async
    def mark_message_as_read(self, message_id):
        try:
            message = Message.objects.get(id=message_id, recipient=self.user)
            message.is_read = True
            message.save()
            return True
        except Message.DoesNotExist:
            return False

    @database_sync_to_async
    def create_message(self, sender, content, group_id=None, recipient_id=None, file=None):
        kwargs = {'sender': sender, 'content': content, 'file': file}
        if group_id:
            kwargs['group_id'] = group_id
        if recipient_id:
            kwargs['recipient_id'] = recipient_id
        return Message.objects.create(**kwargs)
    
    
import json
import base64
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model
from django.core.files.base import ContentFile
from django.utils.crypto import get_random_string
from .models import Message, Friendship
from .serializers import MessageSerializer

User = get_user_model()

class PrivateChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user = self.scope["user"]
        self.friend_code = self.scope['url_route']['kwargs']['friend_code']

        if self.user.is_anonymous:
            await self.close()
            return

        self.friend = await self.get_friend_by_code(self.friend_code)
        if not self.friend:
            await self.close()
            return

        self.room_name = self.get_room_name(self.user.friend_code, self.friend.friend_code)

        is_friend = await self.check_friendship(self.user, self.friend)
        if not is_friend:
            await self.close()
            return

        await self.channel_layer.group_add(
            self.room_name,
            self.channel_name
        )
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            self.room_name,
            self.channel_name
        )

    async def receive(self, text_data):
        try:
            data = json.loads(text_data)
            content = data.get('content')
            file_data = data.get('file')

            file_obj = None
            if file_data:
                format, imgstr = file_data.split(';base64,')
                ext = format.split('/')[-1]
                file_name = f"upload_{get_random_string(8)}.{ext}"
                file_obj = ContentFile(base64.b64decode(imgstr), name=file_name)

            if not content and not file_obj:
                return

            message = await self.create_message(self.user, self.friend, content, file_obj)
            serialized = MessageSerializer(message).data

            await self.channel_layer.group_send(
                self.room_name,
                {
                    'type': 'send_message',
                    'message': json.dumps({
                        'type': 'private_chat_message',
                        'message': serialized
                    })
                }
            )
        except json.JSONDecodeError:
            await self.send(text_data=json.dumps({'error': 'Invalid JSON format'}))

    async def send_message(self, event):
        await self.send(text_data=event['message'])

    def get_room_name(self, code1, code2):
        return f"private_{'_'.join(sorted([code1, code2]))}"

    @database_sync_to_async
    def get_friend_by_code(self, code):
        try:
            return User.objects.get(friend_code=code)
        except User.DoesNotExist:
            return None

    @database_sync_to_async
    def check_friendship(self, user, friend):
        return Friendship.objects.filter(user=user, friend=friend).exists()

    @database_sync_to_async
    def create_message(self, sender, recipient, content, file_obj):
        return Message.objects.create(
            sender=sender,
            recipient=recipient,
            content=content,
            file=file_obj
        )

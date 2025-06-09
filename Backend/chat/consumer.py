import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from .models import Message, ChatGroup, User
from .serializers import MessageSerializer
import nltk
from nltk.sentiment.vader import SentimentIntensityAnalyzer

nltk.download('vader_lexicon')
sid = SentimentIntensityAnalyzer()

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.room_name = self.scope['url_route']['kwargs']['room_name']
        self.room_group_name = f'chat_{self.room_name}'
        self.user = self.scope['user']

        if not self.user.is_authenticated:
            await self.close()
            return

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
        data = json.loads(text_data)
        content = data['content']
        recipient_id = data.get('recipient_id')
        group_id = data.get('group_id')

        # Perform emotion detection
        sentiment_scores = sid.polarity_scores(content)
        emotion = 'positive' if sentiment_scores['compound'] > 0.05 else 'negative' if sentiment_scores['compound'] < -0.05 else 'neutral'

        message = await self.create_message(content, recipient_id, group_id, emotion)
        serializer = MessageSerializer(message)

        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'chat_message',
                'message': serializer.data
            }
        )

    async def chat_message(self, event):
        await self.send(text_data=json.dumps({
            'message': event['message']
        }))

    @database_sync_to_async
    def create_message(self, content, recipient_id, group_id, emotion):
        message = Message.objects.create(
            sender=self.user,
            content=content,
            emotion=emotion
        )
        if recipient_id:
            message.recipient = User.objects.get(id=recipient_id)
        if group_id:
            message.group = ChatGroup.objects.get(id=group_id)
        message.save()
        return message
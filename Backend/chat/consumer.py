import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from .models import Message, ChatGroup, User
from .serializers import MessageSerializer
import nltk
from nltk.sentiment.vader import SentimentIntensityAnalyzer

try:
    nltk.download('vader_lexicon', quiet=True)
    sid = SentimentIntensityAnalyzer()
except Exception as e:
    print(f"NLTK download failed: {e}")
    sid = None

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.username = self.scope['url_route']['kwargs']['username']
        self.room_group_name = f'chat_{self.username}'
        self.user = self.scope.get('user')

        if not self.user or not self.user.is_authenticated:
            await self.close(code=4001)
            return

        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        await self.accept()

    async def disconnect(self, close_code):
        if hasattr(self, 'room_group_name'):
            await self.channel_layer.group_discard(
                self.room_group_name,
                self.channel_name
            )

    async def receive(self, text_data):
        try:
            data = json.loads(text_data)
            content = data.get('content', '').strip()
            recipient_username = data.get('to')  # updated to use username
            group_id = data.get('group_id')

            if not content:
                await self.send(text_data=json.dumps({
                    'error': 'Message content cannot be empty'
                }))
                return

            # Emotion detection
            emotion = 'neutral'
            if sid:
                try:
                    sentiment_scores = sid.polarity_scores(content)
                    emotion = 'positive' if sentiment_scores['compound'] > 0.05 else 'negative' if sentiment_scores['compound'] < -0.05 else 'neutral'
                except Exception as e:
                    print(f"Sentiment analysis failed: {e}")

            message = await self.create_message(content, recipient_username, group_id, emotion)
            serializer = MessageSerializer(message)

            # Send message to recipient's channel
            recipient_group = f'chat_{recipient_username}' if recipient_username else self.room_group_name
            await self.channel_layer.group_send(
                recipient_group,
                {
                    'type': 'chat_message',
                    'message': serializer.data
                }
            )
        except json.JSONDecodeError:
            await self.send(text_data=json.dumps({
                'error': 'Invalid JSON format'
            }))
        except Exception as e:
            await self.send(text_data=json.dumps({
                'error': f'Server error: {str(e)}'
            }))

    async def chat_message(self, event):
        await self.send(text_data=json.dumps({
            'message': event['message']
        }))

    @database_sync_to_async
    def create_message(self, content, recipient_username, group_id, emotion):
        try:
            message = Message.objects.create(
                sender=self.user,
                content=content,
                emotion=emotion
            )
            if recipient_username:
                try:
                    message.recipient = User.objects.get(username=recipient_username)
                except User.DoesNotExist:
                    pass
            if group_id:
                try:
                    message.group = ChatGroup.objects.get(id=group_id)
                except ChatGroup.DoesNotExist:
                    pass
            message.save()
            return message
        except Exception as e:
            print(f"Error creating message: {e}")
            raise

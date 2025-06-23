// useChatSocket.js
import { useEffect, useRef, useState } from 'react';

export default function useChatSocket({ roomId, token, initialMessages = [] }) {
  const [messages, setMessages] = useState(initialMessages);
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef(null);
  const reconnectTimeout = useRef(null);
  const isManuallyClosed = useRef(false);

  const socketUrl = `wss://chatappesewa-production.up.railway.app/ws/chat/${roomId}/?token=${token}`;

  // Update messages when initialMessages prop changes
  useEffect(() => {
    if (initialMessages.length > 0) {
      // console.log('📚 Setting initial messages from API:', initialMessages.length);
      setMessages(initialMessages);
    }
  }, [initialMessages]);

  const connect = () => {
    if (!roomId || !token) {
      console.warn('⚠️ Cannot connect: missing roomId or token');
      return;
    }

    socketRef.current = new WebSocket(socketUrl);

    socketRef.current.onopen = () => {
      // console.log('✅ WebSocket connected to room:', roomId); 
      setIsConnected(true);
    };

    socketRef.current.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        // console.log('📨 Received message:', data);
        // console.log('📨 Message type:', typeof data);
        // console.log('📨 Message keys:', Object.keys(data));
        
        // Handle different message types
        if (data.type === 'chat_message') {
          // console.log('📨 Adding chat_message type');
          setMessages((prev) => [...prev, data.message]);
        } else if (data.type === 'message_history') {
          // Handle initial message history
          // console.log('📨 Adding message_history type');
          setMessages(data.messages || []);
        } else if (data.message) {
          // Handle server response format: { message: {...}, timestamp: "...", username: "..." }
          // console.log('📨 Adding message with nested message property');
          setMessages((prev) => [...prev, data]);
        } else {
          // Handle other message types
          // console.log('📨 Adding other message type');
          setMessages((prev) => [...prev, data]);
        }
      } catch (error) {
        console.error('❌ Error parsing message:', error);
      }
    };

    socketRef.current.onerror = (e) => {
      console.error('❌ WebSocket error:', e.message);
      setIsConnected(false);
    };

    socketRef.current.onclose = (e) => {
      console.warn('⚠️ WebSocket closed', e.code);
      setIsConnected(false);
      if (!isManuallyClosed.current) {
        reconnectTimeout.current = setTimeout(connect, 3000);
      }
    };
  };

  useEffect(() => {
    isManuallyClosed.current = false;
    connect();

    return () => {
      isManuallyClosed.current = true;
      clearTimeout(reconnectTimeout.current);
      socketRef.current?.close();
    };
  }, [roomId, token]);

  const sendMessage = (msgObj) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      const messageData = {
        type: 'chat_message',
        message: msgObj
      };
      socketRef.current.send(JSON.stringify(messageData));
      // console.log('📤 Sent message:', messageData);
    } else {
      console.warn('⛔ Cannot send message — socket not open.');
    }
  };

  return { messages, sendMessage, isConnected };
}

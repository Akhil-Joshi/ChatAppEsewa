import React, { useState, useContext, useRef, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Image,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  FlatList,
  Dimensions,
  Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../contexts/ThemeContext';
import { useNavigation, useRoute } from '@react-navigation/native';

const { width, height } = Dimensions.get('window');

const ChatScreen = () => {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const route = useRoute();
  
  // Get contact information from navigation params
  const { id, name, avatar, isGroup = false } = route.params || {};
  
  const [message, setMessage] = useState('');
  const [showQuickMessages, setShowQuickMessages] = useState(false);
  const [messages, setMessages] = useState([
    // { id: 'm1', text: 'Hello! Admin', sent: true, timestamp: new Date(), status: 'read' }
  ]);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const flatListRef = useRef(null);

  // Use contact data from navigation params or fallback to default
  const contactData = {
    name: name || 'Contact',
    avatar: avatar || 'https://randomuser.me/api/portraits/men/32.jpg',
    status: isGroup ? `${getGroupMemberCount()} members` : 'Active now',
    isGroup: isGroup,
  };

  // Function to get group member count (you can customize this based on your data)
  function getGroupMemberCount() {
    // This would typically come from your group data
    // For now, returning a random number between 3-15
    const memberCounts = {
      '6': 8,  // Design Team
      '7': 12, // College Friends
      '8': 6,  // Family Group
      '9': 5,  // Work Project
    };
    return memberCounts[id] || Math.floor(Math.random() * 12) + 3;
  }

  const quickMessages = [
    `Hello! ${contactData.name}`,
    "Can we contact?",
    isGroup ? "Thanks everyone!" : "Where is the exact location"
  ];

  const handleQuickMessage = (msg) => {
    setMessage(msg);
    setShowQuickMessages(false);
  };

  // Handle keyboard events
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      () => {
        setKeyboardVisible(true);
        if (flatListRef.current && messages.length > 0) {
          flatListRef.current.scrollToEnd({ animated: true });
        }
      }
    );
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => {
        setKeyboardVisible(false);
      }
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, [messages]);

  const sendMessage = () => {
    if (message.trim() === '') return;
    
    const newMessage = {
      id: `m${Date.now()}`,
      text: message,
      sent: true,
      timestamp: new Date(),
      status: 'sending'
    };
    
    setMessages([...messages, newMessage]);
    setMessage('');
    
    // Simulate message delivery and read status
    setTimeout(() => {
      setMessages(prevMessages => 
        prevMessages.map(msg => 
          msg.id === newMessage.id 
            ? { ...msg, status: 'sent' }
            : msg
        )
      );
    }, 1000);

    setTimeout(() => {
      setMessages(prevMessages => 
        prevMessages.map(msg => 
          msg.id === newMessage.id 
            ? { ...msg, status: 'delivered' }
            : msg
        )
      );
    }, 2000);

    setTimeout(() => {
      setMessages(prevMessages => 
        prevMessages.map(msg => 
          msg.id === newMessage.id 
            ? { ...msg, status: 'read' }
            : msg
        )
      );
    }, 3000);
    
    setTimeout(() => {
      if (flatListRef.current) {
        flatListRef.current.scrollToEnd({ animated: true });
      }
    }, 100);
  };

  const renderMessageStatus = (status) => {
    switch (status) {
      case 'sending':
        return <Ionicons name="time-outline" size={14} color={colors.text + '80'} />;
      case 'sent':
        return <Ionicons name="checkmark" size={14} color={colors.text + '80'} />;
      case 'delivered':
        return <Ionicons name="checkmark-done" size={14} color={colors.text + '80'} />;
      case 'read':
        return <Ionicons name="checkmark-done" size={14} color={colors.primary} />;
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.primary }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={[styles.mainContainer, { backgroundColor: colors.background }]}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.primary }]}>
          <View style={styles.headerLeft}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <View style={styles.profileContainer}>
              <View style={styles.profilePic}>
                <Image
                  source={{ uri: contactData.avatar }}
                  style={styles.profileImage}
                />
                {contactData.isGroup && (
                  <View style={styles.groupBadge}>
                    <Ionicons name="people" size={12} color="#fff" />
                  </View>
                )}
              </View>
              <View style={styles.userInfo}>
                <Text style={[styles.username, { color: '#fff' }]}>{contactData.name}</Text>
                <Text style={[styles.status, { color: '#fff', opacity: 0.8 }]}>{contactData.status}</Text>
              </View>
            </View>
          </View>
          <View style={styles.headerRight}>
            {contactData.isGroup ? (
              <TouchableOpacity style={styles.callButton}>
                <Ionicons name="videocam-outline" size={24} color="#fff" />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.callButton}>
                <Ionicons name="call-outline" size={24} color="#fff" />
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.moreButton}>
              <Ionicons name="ellipsis-vertical" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Chat Area */}
        <View style={styles.chatArea}>
          <View style={[styles.messagesContainer, keyboardVisible && styles.expandedMessagesContainer]}>
            {messages.length === 0 ? (
              <View style={styles.emptyChatContainer}>
                <View style={styles.emptyChatAvatar}>
                  <Image
                    source={{ uri: contactData.avatar }}
                    style={styles.emptyChatImage}
                  />
                  {contactData.isGroup && (
                    <View style={styles.emptyGroupBadge}>
                      <Ionicons name="people" size={16} color="#fff" />
                    </View>
                  )}
                </View>
                <Text style={[styles.emptyChatTitle, { color: colors.text }]}>
                  {contactData.name}
                </Text>
                <Text style={[styles.emptyChatSubtitle, { color: colors.text, opacity: 0.6 }]}>
                  {contactData.isGroup 
                    ? `Start chatting with ${contactData.name}` 
                    : `Say hello to ${contactData.name}`
                  }
                </Text>
              </View>
            ) : (
              <FlatList
                ref={flatListRef}
                data={messages}
                keyExtractor={item => item.id}
                renderItem={({ item }) => (
                  <View style={[
                    styles.messageItem,
                    item.sent ? styles.sentMessage : styles.receivedMessage,
                    item.sent ? { backgroundColor: colors.messageOutgoing } : { backgroundColor: colors.messageIncoming }
                  ]}>
                    <Text style={[
                      styles.messageText,
                      item.sent ? { color: colors.messageOutgoingText } : { color: colors.messageIncomingText }
                    ]}>
                      {item.text}
                    </Text>
                    {item.sent && (
                      <View style={styles.messageStatus}>
                        {renderMessageStatus(item.status)}
                      </View>
                    )}
                  </View>
                )}
                onContentSizeChange={() => {
                  if (flatListRef.current && messages.length > 0) {
                    flatListRef.current.scrollToEnd({ animated: false });
                  }
                }}
              />
            )}
          </View>
        </View>

        {/* Message Input */}
        <View style={[styles.inputContainer, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
          <TouchableOpacity
            style={styles.menuButton}
            onPress={() => setShowQuickMessages(!showQuickMessages)}
            activeOpacity={0.6}
          >
            <Ionicons name="menu" size={28} color={colors.primary} />
          </TouchableOpacity>
          <TextInput
            style={[styles.input, { backgroundColor: colors.background, color: colors.text }]}
            placeholder={`Message ${contactData.name}...`}
            placeholderTextColor={colors.text + '80'}
            value={message}
            onChangeText={setMessage}
          />
          <TouchableOpacity
            style={[styles.sendButton, { backgroundColor: colors.primary }]}
            activeOpacity={0.6}
            onPress={sendMessage}
          >
            <Ionicons name="send" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Quick Messages */}
        {showQuickMessages && (
          <View style={[
            styles.quickMessagesContainer,
            { backgroundColor: colors.card },
            keyboardVisible && styles.quickMessagesWithKeyboard
          ]}>
            {quickMessages.map((msg, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.quickMessageItem, { borderBottomColor: colors.border }]}
                onPress={() => handleQuickMessage(msg)}
              >
                <Text style={[styles.quickMessageText, { color: colors.text }]}>{msg}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  mainContainer: {
    flex: 1,
  },
  header: {
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 10,
    padding: 5,
  },
  profileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  profilePic: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
    marginRight: 12,
    position: 'relative',
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
  groupBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#6c5ce7',
    borderRadius: 8,
    width: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  userInfo: {
    justifyContent: 'center',
    flex: 1,
  },
  username: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  status: {
    fontSize: 12,
  },
  callButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  moreButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatArea: {
    flex: 1,
    padding: 16,
    backgroundColor: 'transparent',
  },
  messagesContainer: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  emptyChatContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyChatAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 16,
    position: 'relative',
  },
  emptyChatImage: {
    width: '100%',
    height: '100%',
    borderRadius: 40,
  },
  emptyGroupBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    backgroundColor: '#6c5ce7',
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },
  emptyChatTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyChatSubtitle: {
    fontSize: 14,
    textAlign: 'center',
  },
  messageItem: {
    maxWidth: '70%',
    borderRadius: 18,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginVertical: 4,
  },
  sentMessage: {
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
  },
  receivedMessage: {
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 14,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderTopWidth: 1,
  },
  menuButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    flex: 1,
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 10,
    marginHorizontal: 8,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickMessagesContainer: {
    position: 'absolute',
    bottom: 70,
    left: 10,
    borderRadius: 12,
    padding: 8,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    width: '70%',
  },
  quickMessageItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  quickMessageText: {
    fontSize: 14,
  },
  expandedMessagesContainer: {
    flex: 3,
  },
  quickMessagesWithKeyboard: {
    bottom: 120,
  },
  messageStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    alignSelf: 'flex-end',
  },
});

export default ChatScreen;
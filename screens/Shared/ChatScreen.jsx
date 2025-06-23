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
import { directChatApi } from '../../helpers/postAPIs';
import { getAllMessages } from '../../helpers/getAPIs';
import AsyncStorage from '@react-native-async-storage/async-storage';


const { width, height } = Dimensions.get('window');

const ChatScreen = () => {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const route = useRoute();
  
  // Get contact information from navigation params
  const { id, name, avatar, isGroup = false, friend_code } = route.params || {};
  console.log(friend_code, 'friend_code');
  console.log(id, 'id');
  console.log(name, 'name');
  console.log(avatar, 'avatar');
  console.log(isGroup, 'isGroup');
  const [token, setToken] = useState(null);

  const [message, setMessage] = useState('');
  const [showQuickMessages, setShowQuickMessages] = useState(false);
  const [messages, setMessages] = useState([
    // { id: 'm1', text: 'Hello! Admin', sent: true, timestamp: new Date(), status: 'read' }
  ]);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const flatListRef = useRef(null);

  // Use contact data from navigation params or fallback to default
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const storedToken = await AsyncStorage.getItem('@access_token');
        setToken(storedToken);
        console.log(storedToken, 'storedToken');
        // const name = await AsyncStorage.getItem('@full_name');
        // const profilePic = await AsyncStorage.getItem('@profile_image');
        // if (name) setFullName(name);
        // if (profilePic) setProfileImage(profilePic);
      } catch (e) {
        console.error('Failed to load user data:', e);
      }
    };
    fetchUserData();
  }, []);

// Get all messages
useEffect(() => {
  const fetchMessages = async () => {
    const userData = {
      friend_code: friend_code
    }
    const messages = await getAllMessages(token, userData);
    console.log(messages, 'messages');
    setMessages(messages);
  };
  fetchMessages();
}, [token, friend_code]);



  const contactData = {
    name: name || 'Contact',
    avatar: avatar || null,
    status: isGroup ? `${getGroupMemberCount()} members` : 'Active now',
    isGroup: isGroup,
  };

  const styles = StyleSheet.create({
  
    container: {
      flex: 1,
      backgroundColor: colors.primary,
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
      gap: 8,
    },
    backButton: {
      marginRight: 12,
      padding: 8,
      borderRadius: 20,
    },
    profileContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    profilePic: {
      marginRight: 12,
      position: 'relative',
    },
    profileImageContainer: {

      borderWidth: 1,
      borderColor: colors.border,

    },
    groupBadge: {
      position: 'absolute',
      bottom: -2,
      right: -2,
      backgroundColor: colors.primary,
      borderRadius: 10,
      width: 20,
      height: 20,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderColor: colors.text,

    },
    userInfo: {
      justifyContent: 'center',
      flex: 1,
    },
    username: {
      fontWeight: '700',
      fontSize: 18,
      marginBottom: 2,
    },
    status: {
      fontSize: 13,
      fontWeight: '500',
    },
    callButton: {
      width: 38,
      height: 38,
      borderRadius: 19,
      alignItems: 'center',
      justifyContent: 'center',
    },
    moreButton: {
      width: 34,
      height: 34,
      borderRadius: 17,
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
    messagesList: {
      paddingVertical: 8,
    },
    emptyChatContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 40,
    },
    emptyChatAvatar: {
      marginBottom: 20,
      position: 'relative',
    },
    emptyChatImageContainer: {
      elevation: 3,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
    },
    emptyGroupBadge: {
      position: 'absolute',
      bottom: -4,
      right: -4,
      backgroundColor: colors.primary,
      borderRadius: 12,
      width: 24,
      height: 24,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 3,
      borderColor: colors.text,
      elevation: 2,
    },
    emptyChatTitle: {
      fontSize: 22,
      fontWeight: '700',
      marginBottom: 8,
      textAlign: 'center',
    },
    emptyChatSubtitle: {
      fontSize: 16,
      textAlign: 'center',
      lineHeight: 22,
      fontWeight: '400',
    },
    messageItem: {
      maxWidth: '75%',
      borderRadius: 20,
      paddingVertical: 12,
      paddingHorizontal: 16,
      marginVertical: 3,

    },
    sentMessage: {
      alignSelf: 'flex-end',
      borderBottomRightRadius: 6,
    },
    receivedMessage: {
      alignSelf: 'flex-start',
      borderBottomLeftRadius: 6,
    },
    messageText: {
      fontSize: 15,
      lineHeight: 20,
      fontWeight: '400',
    },
    messageStatus: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 4,
      alignSelf: 'flex-end',
    },
    inputContainer: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      padding: 12,
      borderTopWidth: 1,
      gap: 8,
    },
    menuButton: {
      width: 42,
      height: 42,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 21,
    },
    input: {
      flex: 1,
      borderRadius: 22,
      paddingHorizontal: 18,
      paddingVertical: 12,
      fontSize: 16,
      maxHeight: 100,
      borderWidth: 1,
    },
    sendButton: {
      width: 42,
      height: 42,
      borderRadius: 21,
      alignItems: 'center',
      justifyContent: 'center',

    },
    quickMessagesContainer: {
      position: 'absolute',
      bottom: 75,
      left: 12,
      borderRadius: 16,

      width: '72%',
      borderWidth: 1,
      overflow: 'hidden',
    },
    quickMessageItem: {
      paddingVertical: 14,
      paddingHorizontal: 16,
      borderBottomWidth: 1,
    },
    lastQuickMessageItem: {
      borderBottomWidth: 0,
    },
    quickMessageText: {
      fontSize: 15,
      fontWeight: '500',
    },
    expandedMessagesContainer: {
      flex: 3,
    },
    quickMessagesWithKeyboard: {
      bottom: 130,
    },
  });

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

  // Render avatar with fallback icon
  const renderAvatar = (size = 40, customStyle = {}) => {
    if (contactData.avatar) {
      return (
        <View style={[
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            overflow: 'hidden',
          },
          customStyle
        ]}>
          <Image
            source={{ uri: contactData.avatar }}
            style={{
              width: '100%',
              height: '100%',
            }}
          />
        </View>
      );
    } else {
      // Fallback to icon
      return (
        <View style={[
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: colors.primary + '20',
            justifyContent: 'center',
            alignItems: 'center',
          },
          customStyle
        ]}>
          <Ionicons 
            name={contactData.isGroup ? "people" : "person"} 
            size={size * 0.5} 
            color={colors.text} 
          />
        </View>
      );
    }
  };

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

  const sendMessage = async () => {
    const userData = {
      friend_code: friend_code,
      content: message
    }
    const response = await directChatApi(token, userData);
    console.log(response, 'response');
    setMessage('');

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
    
    // // Simulate message delivery and read status
    // setTimeout(() => {
    //   setMessages(prevMessages => 
    //     prevMessages.map(msg => 
    //       msg.id === newMessage.id 
    //         ? { ...msg, status: 'sent' }
    //         : msg
    //     )
    //   );
    // }, 1000);

    // setTimeout(() => {
    //   setMessages(prevMessages => 
    //     prevMessages.map(msg => 
    //       msg.id === newMessage.id 
    //         ? { ...msg, status: 'delivered' }
    //         : msg
    //     )
    //   );
    // }, 2000);

    // setTimeout(() => {
    //   setMessages(prevMessages => 
    //     prevMessages.map(msg => 
    //       msg.id === newMessage.id 
    //         ? { ...msg, status: 'read' }
    //         : msg
    //     )
    //   );
    // }, 3000);
    
    // setTimeout(() => {
    //   if (flatListRef.current) {
    //     flatListRef.current.scrollToEnd({ animated: true });
    //   }
    // }, 100);
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
      <SafeAreaView style={[styles.container]}>
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
              <Ionicons name="arrow-back" size={24} color={colors.text} />
            </TouchableOpacity>
            <View style={styles.profileContainer}>
              <View style={styles.profilePic}>
                {renderAvatar(40, styles.profileImageContainer)}
                {contactData.isGroup && (
                  <View style={styles.groupBadge}>
                    <Ionicons name="people" size={12} color={colors.text} />
                  </View>
                )}
              </View>
              <View style={styles.userInfo}>
                <Text style={[styles.username, { color: colors.text }]}>{contactData.name}</Text>
                <Text style={[styles.status, { color: colors.text, opacity: 0.8 }]}>{contactData.status}</Text>
              </View>
            </View>
          </View>
          <View style={styles.headerRight}>
            {/* {contactData.isGroup ? (
              <TouchableOpacity style={[styles.callButton, { backgroundColor: 'rgba(255,255,255,0.15)' }]}>
                <Ionicons name="videocam-outline" size={22} color={colors.text} />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={[styles.callButton, { backgroundColor: 'rgba(255,255,255,0.15)' }]}>
                <Ionicons name="call-outline" size={22} color={colors.text} />
              </TouchableOpacity>
            )} */}
            <TouchableOpacity style={[styles.moreButton, { backgroundColor: 'rgba(255,255,255,0.15)' }]}>
              <Ionicons name="ellipsis-vertical" size={18} color={colors.text} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Chat Area */}
        <View style={styles.chatArea}>
          <View style={[styles.messagesContainer, keyboardVisible && styles.expandedMessagesContainer]}>
            {messages.length === 0 ? (
              <View style={styles.emptyChatContainer}>
                <View style={styles.emptyChatAvatar}>
                  {renderAvatar(80, styles.emptyChatImageContainer)}
                  {contactData.isGroup && (
                    <View style={styles.emptyGroupBadge}>
                      <Ionicons name="people" size={16} color={colors.text} />
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
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.messagesList}
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
            style={[styles.menuButton, { backgroundColor: colors.primary + '15' }]}
            onPress={() => setShowQuickMessages(!showQuickMessages)}
            activeOpacity={0.7}
          >
            <Ionicons name="menu" size={24} color={colors.primary} />
          </TouchableOpacity>
          <TextInput
            style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
            placeholder={`Message ${contactData.name}...`}
            placeholderTextColor={colors.text + '60'}
            value={message}
            onChangeText={setMessage}
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[styles.sendButton, { backgroundColor: colors.primary }]}
            activeOpacity={0.8}
            onPress={sendMessage}
          >
            <Ionicons name="send" size={20} color={colors.text} />
          </TouchableOpacity>
        </View>

        {/* Quick Messages */}
        {showQuickMessages && (
          <View style={[
            styles.quickMessagesContainer,
            { backgroundColor: colors.card, borderColor: colors.border },
            keyboardVisible && styles.quickMessagesWithKeyboard
          ]}>
            {quickMessages.map((msg, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.quickMessageItem, 
                  { borderBottomColor: colors.border },
                  index === quickMessages.length - 1 && styles.lastQuickMessageItem
                ]}
                onPress={() => handleQuickMessage(msg)}
                activeOpacity={0.7}
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


export default ChatScreen;
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
  Modal,
  Alert,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../contexts/ThemeContext';
import { useNavigation, useRoute } from '@react-navigation/native';
import { getFriends, getAllGroupMembers, getAllMessages } from '../../helpers/getAPIs';
import { addGroupMembers } from '../../helpers/postAPIs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import useChatSocket from '../../helpers/hooks/useChatSocket';


const { width, height } = Dimensions.get('window');

const GroupChatScreen = ({ navigation }) => {
  const { colors } = useTheme();
  //   const navigation = useNavigation();
  const route = useRoute();
  const [token, setToken] = useState(null);
  const [fullName, setFullName] = useState('');
  const [profileImage, setProfileImage] = useState(null);
  const [friends, setFriends] = useState([]);

  // Get group information from navigation params
  const { id, name, avatar } = route.params || {};
  const roomId = id;

  const [selectedContacts, setSelectedContacts] = useState([]);
  const flatListRef = useRef(null);
  const [initialMessages, setInitialMessages] = useState([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(true);

  const { messages, sendMessage, isConnected } = useChatSocket({ 
    roomId, 
    token, 
    initialMessages 
  });

  const [message, setMessage] = useState('');
  const [showQuickMessages, setShowQuickMessages] = useState(false);
  const [showGroupOptions, setShowGroupOptions] = useState(false);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [showGroupInfoModal, setShowGroupInfoModal] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [memberCount, setMemberCount] = useState(0);
  const [groupMembers, setGroupMembers] = useState([]);
  const [userId, setUserId] = useState(null);

  // Group data - moved after memberCount state declaration
  const groupData = {
    id: id || null,
    name: name || 'Group Chat',
    avatar: avatar || null,
    description: 'Group description here',
    memberCount: memberCount,
  };

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const storedToken = await AsyncStorage.getItem('@access_token');
        setToken(storedToken);
        const name = await AsyncStorage.getItem('@full_name');
        const profilePic = await AsyncStorage.getItem('@profile_image');
        if (name) setFullName(name);
        const id = await AsyncStorage.getItem('@user_id');
        // console.log(id, "id");
        if (id) setUserId(parseInt(id));
        // console.log(userId, "userId");
        if (profilePic) setProfileImage(profilePic);
      } catch (e) {
        console.error('Failed to load user data:', e);
      }
    };
    fetchUserData();
  }, []);

  useEffect(() => {
    const fetchFriends = async () => {
      if (!token) return;

      try {
        const response = await getFriends(token);
        // console.log(response, " friends hehehehehhehehe");

        const mappedFriends = response?.data?.map((friend) => ({
          id: friend.id,
          name: friend.full_name,
          code: friend.friend_code,
          email: friend.email,
          profile_photo: friend.profile_photo,
        }));

        setFriends(mappedFriends);
      } catch (error) {
        console.error('Failed to fetch friends:', error);
      }
    };

    fetchFriends();
  }, [token]);


  useEffect(() => {
    const fetchGroupMembers = async () => {
      if (!token) return;
      const response = await getAllGroupMembers(token, id);
      // console.log(response, " group members");
      setMemberCount(response.members.length);
      setGroupMembers(response.members);
    };
    fetchGroupMembers();
  }, [token]);

  // Load message history when entering the chat room
  useEffect(() => {
    const fetchMessages = async () => {
      if (!token) return;
      try {
        const response = await getAllMessages(token, { group_id: id });
        // console.log(response, "response");
        
        if (response?.data && Array.isArray(response.data)) {
          console.log(response.data, "response.data");
          setInitialMessages(response.data);
        }
      } catch (error) {
        console.error('❌ Failed to load message history:', error);
      } finally {
        setIsLoadingMessages(false);
      }
    };
    fetchMessages();
  }, [token, id]);

  // Log socket connection status
  useEffect(() => {
    // console.log('🔌 Socket connection status:', isConnected);
  }, [isConnected]);

  // Log when messages are updated
  // useEffect(() => {
  //   console.log('📨 Messages updated, count:', messages.length);
  // }, [messages]);

  // Add Group Members
  const handleAddGroupMembers = async () => {
    if (!token) return;

    // Get the selected contacts with their full data
    const selectedContactObjects = friends.filter(contact =>
      selectedContacts.includes(contact.id)
    );

    // console.log('Selected contacts:', selectedContacts);
    // console.log('Selected contact objects:', selectedContactObjects);

    const userData = {
      group_id: id,
      friend_codes: selectedContactObjects.map(contact => contact.code),
    };

    // console.log('Sending userData to API:', userData);

    try {
      const response = await addGroupMembers(token, userData);
      // console.log(response, "added group members");

      // Update the UI by refreshing group members
      const updatedGroupMembers = await getAllGroupMembers(token, id);
      setMemberCount(updatedGroupMembers.members.length);
      setGroupMembers(updatedGroupMembers.members);

      // Remove selected contacts from friends list
      setFriends(prev =>
        prev.filter(contact => !selectedContacts.includes(contact.id))
      );

      setShowAddMemberModal(false);
      setSelectedContacts([]);

      // Show success message
      Alert.alert("Success", `${selectedContactObjects.length} member(s) added to the group`);
    } catch (error) {
      console.error('Failed to add group members:', error);
      Alert.alert("Error", "Failed to add members to the group");
    }
  };

  const sendGroupMessage = () => {
    if (message.trim() === '' || !isConnected) return;
  
    const messageData = {
      id: `temp-${Date.now()}-${Math.random()}`,
      content: message,
      group_id: id,
      sender_id: userId,
      sender_name: fullName,
      sender_avatar: profileImage,
      timestamp: new Date().toISOString(),
    };
  
    // Send message through socket
    sendMessage(messageData);
    
    // Clear input
    setMessage('');
    //  console.log('📤 Sending group message:', messageData);
  };

  const styles = StyleSheet.create({
    systemMessage: {
      alignSelf: 'center',
      backgroundColor: '#f0f0f0',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 12,
      marginVertical: 4,
      maxWidth: '80%',
    },
    systemMessageText: {
      fontSize: 12,
      fontStyle: 'italic',
      textAlign: 'center',
      color: '#666',
    },
    systemMessageTime: {
      fontSize: 10,
      textAlign: 'center',
      color: '#999',
      marginTop: 2,
    },
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
    senderName: {
      fontSize: 12,
      fontWeight: '600',
      marginBottom: 4,
      opacity: 0.8,
    },
    messageStatus: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 4,
      alignSelf: 'flex-end',
    },
    messageTimestamp: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-end',
      marginTop: 4,
      gap: 4,
    },
    timestampText: {
      fontSize: 11,
      fontWeight: '400',
      opacity: 0.7,
    },
    sendingText: {
      fontSize: 11,
      fontWeight: '400',
      fontStyle: 'italic',
      opacity: 0.8,
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
    // Group Options Modal
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'flex-end',
    },
    groupOptionsContainer: {
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      paddingTop: 20,
      paddingBottom: 30,
      paddingHorizontal: 20,
    },
    groupOptionItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 16,
      paddingHorizontal: 8,
      borderRadius: 12,
      marginVertical: 4,
    },
    groupOptionIcon: {
      width: 24,
      marginRight: 16,
      alignItems: 'center',
    },
    groupOptionText: {
      fontSize: 16,
      fontWeight: '500',
      flex: 1,
    },
    dangerOption: {
      color: '#FF4444',
    },
    // Add Member Modal
    addMemberModal: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      paddingHorizontal: 20,
    },
    addMemberContainer: {
      borderRadius: 20,
      padding: 20,
      maxHeight: '80%',
    },
    addMemberHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 20,
    },
    addMemberTitle: {
      fontSize: 20,
      fontWeight: '700',
    },
    closeButton: {
      padding: 8,
    },
    searchInput: {
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 12,
      fontSize: 16,
      marginBottom: 20,
      borderWidth: 1,
    },
    contactItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      paddingHorizontal: 8,
      borderRadius: 12,
      marginVertical: 2,
    },
    contactInfo: {
      flex: 1,
      marginLeft: 12,
    },
    contactName: {
      fontSize: 16,
      fontWeight: '500',
    },
    checkbox: {
      width: 24,
      height: 24,
      borderRadius: 12,
      borderWidth: 2,
      alignItems: 'center',
      justifyContent: 'center',
    },
    addMemberButtons: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 20,
      gap: 12,
    },
    addMemberButton: {
      flex: 1,
      paddingVertical: 14,
      borderRadius: 12,
      alignItems: 'center',
    },
    addMemberButtonText: {
      fontSize: 16,
      fontWeight: '600',
    },
    // Group Info Modal
    groupInfoModal: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      paddingHorizontal: 20,
    },
    groupInfoContainer: {
      borderRadius: 20,
      padding: 20,
      maxHeight: '80%',
    },
    groupInfoHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 20,
    },
    groupInfoTitle: {
      fontSize: 20,
      fontWeight: '700',
    },
    groupInfoAvatar: {
      alignItems: 'center',
      marginBottom: 20,
    },
    groupInfoAvatarContainer: {
      marginBottom: 12,
    },
    groupInfoName: {
      fontSize: 24,
      fontWeight: '700',
      textAlign: 'center',
      marginBottom: 8,
    },
    groupInfoStats: {
      flexDirection: 'row',
      justifyContent: 'center',
      marginBottom: 20,
    },
    groupInfoStat: {
      alignItems: 'center',
      marginHorizontal: 15,
    },
    groupInfoStatNumber: {
      fontSize: 18,
      fontWeight: '700',
    },
    groupInfoStatLabel: {
      fontSize: 12,
      opacity: 0.7,
      marginTop: 2,
    },
    groupInfoSection: {
      marginBottom: 20,
    },
    groupInfoSectionTitle: {
      fontSize: 16,
      fontWeight: '600',
      marginBottom: 12,
    },
    memberItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      paddingHorizontal: 8,
      borderRadius: 12,
      marginVertical: 2,
    },
    memberInfo: {
      flex: 1,
      marginLeft: 12,
    },
    memberName: {
      fontSize: 16,
      fontWeight: '500',
    },
    memberEmail: {
      fontSize: 12,
      opacity: 0.7,
      marginTop: 2,
    },
    creatorBadge: {
      backgroundColor: colors.primary + '20',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 8,
      marginLeft: 8,
    },
    creatorBadgeText: {
      fontSize: 10,
      fontWeight: '600',
      color: colors.primary,
    },
  });

  // Render avatar with fallback icon
  const renderAvatar = (size = 40, customStyle = {}) => {
    if (groupData.avatar) {
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
            source={{ uri: groupData.avatar }}
            style={{
              width: '100%',
              height: '100%',
            }}
          />
        </View>
      );
    } else {
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
            name="people"
            size={size * 0.5}
            color={colors.text}
          />
        </View>
      );
    }
  };

  const renderContactAvatar = (contact, size = 40) => {
    if (contact.profile_photo) {
      return (
        <View style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          overflow: 'hidden',
        }}>
          <Image
            source={{ uri: contact.profile_photo }}
            style={{
              width: '100%',
              height: '100%',
            }}
          />
        </View>
      );
    } else {
      return (
        <View style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: colors.primary + '20',
          justifyContent: 'center',
          alignItems: 'center',
        }}>
          <Ionicons
            name="person"
            size={size * 0.5}
            color={colors.text}
          />
        </View>
      );
    }
  };

  const renderMemberAvatar = (member, size = 40) => {
    if (member.profile_photo) {
      return (
        <View style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          overflow: 'hidden',
        }}>
          <Image
            source={{ uri: member.profile_photo }}
            style={{
              width: '100%',
              height: '100%',
            }}
          />
        </View>
      );
    } else {
      return (
        <View style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: colors.primary + '20',
          justifyContent: 'center',
          alignItems: 'center',
        }}>
          <Ionicons
            name="person"
            size={size * 0.5}
            color={colors.text}
          />
        </View>
      );
    }
  };

  const quickMessages = [
    `Hello everyone!`,
    "Thanks for the update",
    "Can we schedule a meeting?"
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

  const handleAddMembers = () => {
    setShowGroupOptions(false);
    setShowAddMemberModal(true);
  };

  const handleGroupInfo = () => {
    setShowGroupOptions(false);
    setShowGroupInfoModal(true);
  };

  const handleLeaveGroup = () => {
    setShowGroupOptions(false);
    Alert.alert(
      "Leave Group",
      `Are you sure you want to leave "${groupData.name}"?`,
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Leave",
          style: "destructive",
          onPress: () => {
            // Handle leave group logic here
            navigation.goBack();
          }
        }
      ]
    );
  };

  const toggleContactSelection = (contactId) => {
    // console.log('Toggling contact selection:', contactId);
    setSelectedContacts(prev => {
      const newSelection = prev.includes(contactId)
        ? prev.filter(id => id !== contactId)
        : [...prev, contactId];
      // console.log('Updated selected contacts:', newSelection);
      return newSelection;
    });
  };

  // Format timestamp for display
  const formatTimestamp = (timestamp, status) => {
    if (status === 'sending') {
      return 'Sending...';
    }

    if (!timestamp) return '';

    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);
    const diffInDays = diffInHours / 24;

    // Get time in 12-hour format
    const timeString = date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });

    // If same day, show only time
    if (diffInDays < 1) {
      return timeString;
    }
    
    // If yesterday, show "Yesterday" + time
    if (diffInDays < 2) {
      return `Yesterday ${timeString}`;
    }
    
    // If within a week, show day name + time
    if (diffInDays < 7) {
      return date.toLocaleDateString('en-US', {
        weekday: 'short'
      }) + ` ${timeString}`;
    }
    
    // If older, show date + time
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    }) + ` ${timeString}`;
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
                <View style={styles.groupBadge}>
                  <Ionicons name="people" size={12} color={colors.text} />
                </View>
              </View>
              <View style={styles.userInfo}>
                <Text style={[styles.username, { color: colors.text }]}>{groupData.name}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={[styles.status, { color: colors.text, opacity: 0.8 }]}>
                    {groupData.memberCount} members
                  </Text>
                  <View style={{
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: isConnected ? '#4CAF50' : '#FF5722',
                    marginLeft: 8,
                  }} />
                  <Text style={[styles.status, { 
                    color: colors.text, 
                    opacity: 0.6,
                    marginLeft: 4,
                    fontSize: 11 
                  }]}>
                    {isConnected ? 'Connected' : 'Disconnected'}
                  </Text>
                </View>
              </View>
            </View>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity
              style={[styles.moreButton, { backgroundColor: 'rgba(255,255,255,0.15)' }]}
              onPress={() => setShowGroupOptions(true)}
            >
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
                  <View style={styles.emptyGroupBadge}>
                    <Ionicons name="people" size={16} color={colors.text} />
                  </View>
                </View>
                <Text style={[styles.emptyChatTitle, { color: colors.text }]}>
                  {groupData.name}
                </Text>
                <Text style={[styles.emptyChatSubtitle, { color: colors.text, opacity: 0.6 }]}>
                  {isLoadingMessages 
                    ? 'Loading messages...' 
                    : !isConnected 
                      ? 'Connecting to chat...' 
                      : 'Start chatting with the group members'
                  }
                </Text>
                {(isLoadingMessages || !isConnected) && (
                  <View style={{ marginTop: 20, alignItems: 'center' }}>
                    <Ionicons 
                      name={isLoadingMessages ? "hourglass-outline" : "wifi-outline"} 
                      size={24} 
                      color={colors.text + '60'} 
                    />
                    <Text style={[styles.emptyChatSubtitle, { color: colors.text, opacity: 0.4, marginTop: 8 }]}>
                      {isLoadingMessages ? 'Loading message history...' : 'Waiting for connection...'}
                    </Text>
                  </View>
                )}
              </View>
            ) : (
              <FlatList
                ref={flatListRef}
                data={messages}
                keyExtractor={(item, index) => {
                  // Handle different message formats and ensure unique keys
                  if (item.id) return item.id.toString();
                  if (item.message && item.message.id) return item.message.id.toString();
                  return `msg-${index}-${Date.now()}`;
                }}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.messagesList}
                renderItem={({ item }) => {
                  let messageContent, sender, timestamp, messageStatus;
                  
                  try {
                    // Handle the specific response format from your API
                    if (item.content && typeof item.content === 'string') {
                      try {
                        // Convert single quotes to double quotes for proper JSON parsing
                        const jsonString = item.content.replace(/'/g, '"').replace(/None/g, 'null');
                        const parsedContent = JSON.parse(jsonString);
                        
                        // Extract message data from parsed content
                        messageContent = parsedContent.content;
                        sender = {
                          id: parsedContent.sender_id,
                          full_name: parsedContent.sender_name,
                          profile_photo: parsedContent.sender_avatar
                        };
                        timestamp = parsedContent.timestamp;
                        messageStatus = 'sent'; // Default status
                        
                      } catch (parseError) {
                        // Check if it's a system message (like "Gamer added Akhil Joshi to the group")
                        if (!item.content.includes('{') && !item.content.includes('}')) {
                          messageContent = item.content;
                          sender = {
                            id: item.sender_id,
                            full_name: item.sender_name,
                            profile_photo: item.sender_avatar
                          };
                          timestamp = item.timestamp;
                          messageStatus = 'sent';
                        } else {
                          // If it's malformed JSON, show error
                          console.error('Failed to parse message content:', item.content);
                          return null;
                        }
                      }
                    } else if (item.content && typeof item.content === 'object') {
                      // If content is already an object
                      messageContent = item.content.content || item.content;
                      sender = {
                        id: item.content.sender_id || item.sender_id,
                        full_name: item.content.sender_name || item.sender_name,
                        profile_photo: item.content.sender_avatar || item.sender_avatar
                      };
                      timestamp = item.content.timestamp || item.timestamp;
                      messageStatus = item.content.status || 'sent';
                    } else {
                      // Fallback for other formats
                      messageContent = item.message?.content || item.content;
                      sender = {
                        id: item.sender_id || item.message?.sender_id,
                        full_name: item.sender_name || item.message?.sender_name,
                        profile_photo: item.sender_avatar || item.message?.sender_avatar
                      };
                      timestamp = item.timestamp || item.message?.timestamp;
                      messageStatus = item.status || item.message?.status || 'sent';
                    }
                
                    // Validate that we have the essential data
                    if (!messageContent || messageContent.trim() === '') {
                      return null; // Don't render empty messages
                    }
                
                    // Handle system messages (like "Gamer added Akhil Joshi to the group")
                    const isSystemMessage = messageContent && !messageContent.includes('{') && 
                                           (messageContent.includes('added') || 
                                            messageContent.includes('removed') || 
                                            messageContent.includes('joined') || 
                                            messageContent.includes('left'));
                
                    if (isSystemMessage) {
                      return (
                        <View style={[styles.systemMessage, { backgroundColor: colors.systemMessage || '#f0f0f0' }]}>
                          <Text style={[styles.systemMessageText, { color: colors.systemMessageText || '#666' }]}>
                            {messageContent}
                          </Text>
                          <Text style={[styles.systemMessageTime, { color: colors.systemMessageText || '#999' }]}>
                            {formatTimestamp(timestamp, messageStatus)}
                          </Text>
                        </View>
                      );
                    }
                
                    // Ensure sender ID is a number for comparison
                    const senderId = sender?.id ? parseInt(sender.id) : null;
                    const currentUserId = userId ? parseInt(userId) : null;
                    const isOwnMessage = senderId === currentUserId && senderId !== null;
                
                    return (
                      <View
                        style={[
                          styles.messageItem,
                          isOwnMessage ? styles.sentMessage : styles.receivedMessage,
                          {
                            backgroundColor: isOwnMessage
                              ? colors.messageOutgoing
                              : colors.messageIncoming,
                          },
                        ]}
                      >
                        {/* Show sender name for received messages only */}
                        {!isOwnMessage && (
                          <Text
                            style={[
                              styles.senderName,
                              { color: colors.messageIncomingText },
                            ]}
                          >
                            {sender?.full_name || 'Unknown User'}
                          </Text>
                        )}
                
                        <Text
                          style={[
                            styles.messageText,
                            {
                              color: isOwnMessage
                                ? colors.messageOutgoingText
                                : colors.messageIncomingText,
                            },
                          ]}
                        >
                          {messageContent}
                        </Text>
                
                        {/* Timestamp */}
                        <View style={styles.messageTimestamp}>
                          <Text
                            style={[
                              messageStatus === 'sending' ? styles.sendingText : styles.timestampText,
                              {
                                color: isOwnMessage
                                  ? colors.messageOutgoingText
                                  : colors.messageIncomingText,
                              },
                            ]}
                          >
                            {formatTimestamp(timestamp, messageStatus)}
                          </Text>
                        </View>
                      </View>
                    );
                
                  } catch (error) {
                    console.error('❌ Error rendering message:', error, item);
                    return (
                      <View style={[
                        styles.messageItem, 
                        styles.receivedMessage,
                        { backgroundColor: '#ffebee', padding: 12 }
                      ]}>
                        <Text style={{ color: '#d32f2f', fontSize: 12 }}>
                          Error rendering message: {error.message}
                        </Text>
                        <Text style={{ color: '#666', fontSize: 10, marginTop: 4 }}>
                          {JSON.stringify(item, null, 2)}
                        </Text>
                      </View>
                    );
                  }
                }}
                
                onContentSizeChange={() => {
                  if (flatListRef.current && messages.length > 0) {
                    // Use setTimeout to ensure layout is complete
                    setTimeout(() => {
                      flatListRef.current?.scrollToEnd({ animated: false });
                    }, 100);
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
            placeholder={`Message ${groupData.name}...`}
            placeholderTextColor={colors.text + '60'}
            value={message}
            onChangeText={setMessage}
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[
              styles.sendButton, 
              { 
                backgroundColor: isConnected ? colors.primary : colors.border,
                opacity: isConnected ? 1 : 0.5
              }
            ]}
            activeOpacity={0.8}
            onPress={sendGroupMessage}
            disabled={!isConnected}
          >
            <Ionicons 
              name={isConnected ? "send" : "wifi-outline"} 
              size={20} 
              color={colors.text} 
            />
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

        {/* Group Options Modal */}
        <Modal
          visible={showGroupOptions}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowGroupOptions(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setShowGroupOptions(false)}
          >
            <TouchableOpacity
              style={[styles.groupOptionsContainer, { backgroundColor: colors.card }]}
              activeOpacity={1}
            >
              <TouchableOpacity
                style={styles.groupOptionItem}
                onPress={handleAddMembers}
                activeOpacity={0.7}
              >
                <View style={styles.groupOptionIcon}>
                  <Ionicons name="person-add" size={24} color={colors.primary} />
                </View>
                <Text style={[styles.groupOptionText, { color: colors.text }]}>
                  Add Members
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.groupOptionItem}
                onPress={handleGroupInfo}
                activeOpacity={0.7}
              >
                <View style={styles.groupOptionIcon}>
                  <Ionicons name="information-circle" size={24} color={colors.text} />
                </View>
                <Text style={[styles.groupOptionText, { color: colors.text }]}>
                  Group Info
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.groupOptionItem}
                onPress={handleLeaveGroup}
                activeOpacity={0.7}
              >
                <View style={styles.groupOptionIcon}>
                  <Ionicons name="exit" size={24} color="#FF4444" />
                </View>
                <Text style={[styles.groupOptionText, styles.dangerOption]}>
                  Leave Group
                </Text>
              </TouchableOpacity>
            </TouchableOpacity>
          </TouchableOpacity>
        </Modal>

        {/* Add Member Modal */}
        <Modal
          visible={showAddMemberModal}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowAddMemberModal(false)}
        >
          <View style={styles.addMemberModal}>
            <View style={[styles.addMemberContainer, { backgroundColor: colors.card }]}>
              <View style={styles.addMemberHeader}>
                <Text style={[styles.addMemberTitle, { color: colors.text }]}>
                  Add Members
                </Text>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => {
                    setShowAddMemberModal(false);
                    setSelectedContacts([]);
                  }}
                >
                  <Ionicons name="close" size={24} color={colors.text} />
                </TouchableOpacity>
              </View>

              <TextInput
                style={[styles.searchInput, {
                  backgroundColor: colors.background,
                  color: colors.text,
                  borderColor: colors.border
                }]}
                placeholder="Search friends..."
                placeholderTextColor={colors.text + '60'}
              />

              <ScrollView style={{ maxHeight: 300 }}>
                {friends.map((contact) => (
                  <TouchableOpacity
                    key={contact.id}
                    style={[styles.contactItem, {
                      backgroundColor: selectedContacts.includes(contact.id)
                        ? colors.primary + '10'
                        : 'transparent'
                    }]}
                    onPress={() => {
                      toggleContactSelection(contact.id);
                    }}
                    activeOpacity={0.7}
                  >
                    {renderContactAvatar(contact, 40)}
                    <View style={styles.contactInfo}>
                      <Text style={[styles.contactName, { color: colors.text }]}>
                        {contact.name}
                      </Text>
                    </View>
                    <View style={[
                      styles.checkbox,
                      {
                        borderColor: selectedContacts.includes(contact.id)
                          ? colors.primary
                          : colors.border,
                        backgroundColor: selectedContacts.includes(contact.id)
                          ? colors.primary
                          : 'transparent'
                      }
                    ]}>
                      {selectedContacts.includes(contact.id) && (
                        <Ionicons name="checkmark" size={16} color={colors.text} />
                      )}
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <View style={styles.addMemberButtons}>
                <TouchableOpacity
                  style={[styles.addMemberButton, { backgroundColor: colors.border }]}
                  onPress={() => {
                    setShowAddMemberModal(false);
                    setSelectedContacts([]);
                  }}
                >
                  <Text style={[styles.addMemberButtonText, { color: colors.text }]}>
                    Cancel
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.addMemberButton, {
                    backgroundColor: selectedContacts.length > 0 ? colors.primary : colors.border
                  }]}
                  onPress={handleAddGroupMembers}
                  disabled={selectedContacts.length === 0}
                >
                  <Text style={[styles.addMemberButtonText, { color: colors.text }]}>
                    Add ({selectedContacts.length})
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Group Info Modal */}
        <Modal
          visible={showGroupInfoModal}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowGroupInfoModal(false)}
        >
          <View style={styles.groupInfoModal}>
            <View style={[styles.groupInfoContainer, { backgroundColor: colors.card }]}>
              <View style={styles.groupInfoHeader}>
                <Text style={[styles.groupInfoTitle, { color: colors.text }]}>
                  Group Information
                </Text>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setShowGroupInfoModal(false)}
                >
                  <Ionicons name="close" size={24} color={colors.text} />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
                {/* Group Avatar and Name */}
                <View style={styles.groupInfoAvatar}>
                  <View style={styles.groupInfoAvatarContainer}>
                    {renderAvatar(80, styles.profileImageContainer)}
                  </View>
                  <Text style={[styles.groupInfoName, { color: colors.text }]}>
                    {groupData.name}
                  </Text>
                </View>

                {/* Group Stats */}
                <View style={styles.groupInfoStats}>
                  <View style={styles.groupInfoStat}>
                    <Text style={[styles.groupInfoStatNumber, { color: colors.text }]}>
                      {groupData.memberCount}
                    </Text>
                    <Text style={[styles.groupInfoStatLabel, { color: colors.text }]}>
                      Members
                    </Text>
                  </View>
                  <View style={styles.groupInfoStat}>
                    <Text style={[styles.groupInfoStatNumber, { color: colors.text }]}>
                      {groupMembers.filter(member => member.is_creator).length}
                    </Text>
                    <Text style={[styles.groupInfoStatLabel, { color: colors.text }]}>
                      Admin
                    </Text>
                  </View>
                </View>

                {/* Members Section */}
                <View style={styles.groupInfoSection}>
                  <Text style={[styles.groupInfoSectionTitle, { color: colors.text }]}>
                    Members ({groupData.memberCount})
                  </Text>
                  {groupMembers.map((member) => (
                    <View key={member.id} style={styles.memberItem}>
                      {renderMemberAvatar(member, 40)}
                      <View style={styles.memberInfo}>
                        <Text style={[styles.memberName, { color: colors.text }]}>
                          {member.full_name}
                        </Text>
                        <Text style={[styles.memberEmail, { color: colors.text }]}>
                          {member.email}
                        </Text>
                      </View>
                      {member.is_creator && (
                        <View style={styles.creatorBadge}>
                          <Text style={styles.creatorBadgeText}>Admin</Text>
                        </View>
                      )}
                    </View>
                  ))}
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default GroupChatScreen;
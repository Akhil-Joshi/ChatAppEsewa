// screens/HomeScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ScrollView, Image, Alert, Modal, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../../contexts/ThemeContext';
import { TextInput } from 'react-native-gesture-handler';
import { useAuth } from '../../contexts/AuthContext';
import { sendFriendRequest, handleFriendRequest } from '../../helpers/postAPIs';
import { getFriendRequests, getFriends, getAllGroups } from '../../helpers/getAPIs';

const HomeScreen = ({ navigation }) => {
  const { colors, theme, toggleTheme } = useTheme();
  const isDarkMode = theme === 'dark';
  const { logout } = useAuth();
  const [fullName, setFullName] = useState('');
  const [profileImage, setProfileImage] = useState(null);
  const [isAddFriendModalVisible, setIsAddFriendModalVisible] = useState(false);
  const [friendCode, setFriendCode] = useState('');
  const [friendRequests, setFriendRequests] = useState([]);
  const [token, setToken] = useState(null);
  const [activeTab, setActiveTab] = useState('group');
  const [modalActiveTab, setModalActiveTab] = useState('add');
  const [friends, setFriends] = useState([]);
  const [groups, setGroups] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const storedToken = await AsyncStorage.getItem('@access_token');
        setToken(storedToken);
        const name = await AsyncStorage.getItem('@full_name');
        const profilePic = await AsyncStorage.getItem('@profile_image');
        if (name) setFullName(name);
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
        console.log(response, " friends hehehehehhehehe");

        const mappedFriends = response?.data?.map((friend) => ({
          id: friend.id,
          name: friend.full_name,
          code: friend.friend_code,
          email: friend.email,
          profile_photo: friend.profile_photo,
          friend_code: friend.friend_code
        }));

        setFriends(mappedFriends);
      } catch (error) {
        console.error('Failed to fetch friends:', error);
      }
    };

    fetchFriends();
  }, [token]);

  useEffect(() => {
    if (token) {
      fetchAllGroups();
    }
  }, [token]);

  // Get all groups
  const fetchAllGroups = async () => {
    const response = await getAllGroups(token);
    console.log(response, " all groups");
    // Extract joined_groups from response and map to expected format
    const groupsData = response.joined_groups || [];
    setGroups(groupsData);
  }

  useEffect(() => {
    if (modalActiveTab === 'requests') {
      fetchFriendRequests();
    }
  }, [modalActiveTab]);

  const fetchFriendRequests = async () => {
    try {
      const response = await getFriendRequests(token);
      const mappedRequests = response.results.map((request) => ({
        id: request.id,
        name: request.from_user.full_name,
        code: request.from_user.friend_code,
      }));
      setFriendRequests(mappedRequests);
      // console.log(mappedRequests, " mapped requests hehehehehhehehe")

    } catch (error) {
      console.error('Failed to fetch friend requests:', error);
      // Alert.alert('Error', 'Failed to fetch friend requests. Please try again.');
    }
  }

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      // Refresh friends list
      if (token) {
        fetchAllGroups();
        fetchFriendRequests();
      }
    } catch (error) {
      console.error('Failed to refresh data:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleAcceptFriendRequest = async (friend_code) => {
    try {
      const response = await handleFriendRequest(token, friend_code, { action: 'accept' });
      console.log('Friend request accepted:', response);
      Alert.alert('Success', 'Friend request accepted.');

      fetchFriendRequests(); // Refresh the list
    } catch (error) {
      console.error('Accept failed:', error);
      Alert.alert('Error', 'Failed to accept friend request.');
    }
  };

  const handleRejectFriendRequest = async (friend_code) => {
    try {
      const response = await handleFriendRequest(token, friend_code, { action: 'reject' });
      console.log('Friend request rejected:', response);
      Alert.alert('Rejected', 'Friend request rejected.');

      fetchFriendRequests(); // Refresh the list
    } catch (error) {
      console.error('Reject failed:', error);
      Alert.alert('Error', 'Failed to reject friend request.');
    }
  };

  const handleAddFriend = () => {
    setIsAddFriendModalVisible(true);
  };

  const handleSubmitFriendCode = async () => {
    try {
      if (!friendCode.trim()) {
        Alert.alert('Error', 'Please enter a friend code');
        return;
      }

      const userData = {
        friend_code: friendCode.trim(),
      };

      console.log('Sending friend code:', userData);

      const response = await sendFriendRequest(token, userData);
      console.log('Friend request sent:', response);

      Alert.alert(
        'Success',
        'Friend request sent successfully!',
        [
          {
            text: 'OK',
            onPress: () => {
              setFriendCode('');
              setIsAddFriendModalVisible(false);
            }
          }
        ]
      );
    } catch (error) {
      console.error('Friend request error:', error);
      Alert.alert('Error', error.error);
    }
  };

  const handleProfilePress = () => {
    // Navigate to profile screen or show profile options
    navigation.navigate('Profile');
  };

  const handlelogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
            } catch (error) {
              console.error('Logout error:', error);
              Alert.alert('Error', 'An error occurred while logging out. Please try again.');
            }
          },
        },
      ],
      { cancelable: false }
    );
  };

  const directContacts = friends || [];
  const groupChats = groups || [];

  const getCurrentData = () => {
    return activeTab === 'direct' ? directContacts : groupChats;
  };

  const getCurrentTitle = () => {
    const data = getCurrentData();
    return activeTab === 'direct'
      ? `Direct Messages(${data.length})`
      : `Group Chats(${data.length})`;
  };

  const formatTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      return 'Today';
    } else if (diffDays === 2) {
      return 'Yesterday';
    } else if (diffDays <= 7) {
      return `${diffDays - 1} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const renderGroupItem = ({ item }) => {
    const formatTime = (dateString) => {
      if (!dateString) return '';
      const date = new Date(dateString);
      const now = new Date();
      const diffTime = Math.abs(now - date);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
      if (diffDays === 1) {
        return 'Today';
      } else if (diffDays === 2) {
        return 'Yesterday';
      } else if (diffDays <= 7) {
        return `${diffDays - 1} days ago`;
      } else {
        return date.toLocaleDateString();
      }
    };
  
    // Parse and extract message content using the same logic as your chat messages
    const parseMessageContent = (recentMessage) => {
      if (!recentMessage) {
        return {
          content: 'No messages yet',
          senderName: '',
          timestamp: null
        };
      }
  
      let messageContent, senderName, timestamp;
  
      try {
        // Handle the specific response format from your API
        if (recentMessage.content && typeof recentMessage.content === 'string') {
          try {
            // Convert single quotes to double quotes for proper JSON parsing
            const jsonString = recentMessage.content.replace(/'/g, '"').replace(/None/g, 'null');
            const parsedContent = JSON.parse(jsonString);
            
            // Extract message data from parsed content
            messageContent = parsedContent.content;
            senderName = parsedContent.sender_name;
            timestamp = parsedContent.timestamp;
            
          } catch (parseError) {
            // Check if it's a system message or plain text
            if (!recentMessage.content.includes('{') && !recentMessage.content.includes('}')) {
              messageContent = recentMessage.content;
              senderName = recentMessage.sender_name;
              timestamp = recentMessage.timestamp;
            } else {
              // If it's malformed JSON, use fallback
              console.warn('Failed to parse recent message content:', recentMessage.content);
              messageContent = recentMessage.content;
              senderName = recentMessage.sender_name;
              timestamp = recentMessage.timestamp;
            }
          }
        } else if (recentMessage.content && typeof recentMessage.content === 'object') {
          // If content is already an object
          messageContent = recentMessage.content.content || recentMessage.content;
          senderName = recentMessage.content.sender_name || recentMessage.sender_name;
          timestamp = recentMessage.content.timestamp || recentMessage.timestamp;
        } else {
          // Fallback for other formats
          messageContent = recentMessage.message?.content || recentMessage.content || recentMessage.message;
          senderName = recentMessage.sender_name || recentMessage.message?.sender_name || 'Someone';
          timestamp = recentMessage.timestamp || recentMessage.created_at || recentMessage.message?.timestamp;
        }
  
        // Handle system messages (like "Gamer added Akhil Joshi to the group")
        const isSystemMessage = messageContent && !messageContent.includes('{') && 
                               (messageContent.includes('added') || 
                                messageContent.includes('removed') || 
                                messageContent.includes('joined') || 
                                messageContent.includes('left'));
  
        if (isSystemMessage) {
          return {
            content: messageContent,
            senderName: '',
            timestamp: timestamp,
            isSystemMessage: true
          };
        }
  
        // Validate that we have the essential data
        if (!messageContent || messageContent.trim() === '') {
          return {
            content: 'Message content unavailable',
            senderName: senderName || 'Unknown',
            timestamp: timestamp
          };
        }
  
        return {
          content: messageContent,
          senderName: senderName || 'Someone',
          timestamp: timestamp
        };
  
      } catch (error) {
        console.error('Error parsing recent message:', error, recentMessage);
        return {
          content: 'Error loading message',
          senderName: 'Unknown',
          timestamp: recentMessage.timestamp || recentMessage.created_at
        };
      }
    };
  
    // Get the display timestamp
    const getDisplayTime = () => {
      if (item.recent_message) {
        const parsed = parseMessageContent(item.recent_message);
        return parsed.timestamp || item.recent_message.created_at || item.recent_message.timestamp || item.created_at;
      }
      return item.created_at;
    };
  
    // Get the message display text
    const getMessageDisplay = () => {
      if (!item.recent_message) {
        return 'No messages yet';
      }
  
      const parsed = parseMessageContent(item.recent_message);
      
      if (parsed.isSystemMessage) {
        return parsed.content;
      }
  
      if (parsed.senderName && parsed.content) {
        return `${parsed.senderName}: ${parsed.content}`;
      }
  
      return parsed.content || 'No messages yet';
    };
  
    return (
      <TouchableOpacity
        style={styles.messageItem}
        onPress={() => navigation.navigate('GroupChatScreen', {
          id: item.id,
          name: item.name,
          avatar: item.avatar,
          isGroup: true,
        })}
      >
        <View style={styles.messageAvatar}>
          {item.avatar ? (
            <Image
              source={{ uri: item.avatar }}
              style={styles.avatar}
            />
          ) : (
            <View style={[styles.avatar, styles.avatarFallback]}>
              <Icon name="people" size={24} color="#fff" />
            </View>
          )}
          <View style={styles.groupIndicator}>
            <Icon name="people" size={12} color="#fff" />
          </View>
        </View>
        
        <View style={styles.messageContent}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={styles.messageName}>
              {item.name}
              {/* <Text style={styles.memberCount}> ({item.memberCount || 0})</Text> */}
            </Text>
            <Text style={styles.messageTime}>
              {formatTime(getDisplayTime())}
            </Text>
          </View>
          
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={styles.messageText} numberOfLines={1}>
              {getMessageDisplay()}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.primary,
    },
    mainContainer: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      backgroundColor: colors.primary,
      paddingHorizontal: 20,
      paddingTop: 20,
      paddingBottom: 25,
      borderBottomLeftRadius: 25,
      borderBottomRightRadius: 25,
    },
    headerTop: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 15,
    },
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    profilePicture: {
      width: 45,
      height: 45,
      borderRadius: 22.5,
      marginRight: 15,
      borderWidth: 3,
      borderColor: 'rgba(255,255,255,0.4)',
    },
    profileFallback: {
      width: 45,
      height: 45,
      borderRadius: 22.5,
      marginRight: 15,
      backgroundColor: 'rgba(255,255,255,0.25)',
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 3,
      borderColor: 'rgba(255,255,255,0.4)',
    },
    headerTitle: {
      fontSize: 17,
      color: '#fff',
      opacity: 0.9,
      flex: 1,
      fontWeight: '500',
    },
    headerRight: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    themeToggleButton: {
      padding: 10,
      borderRadius: 22,
      backgroundColor: isDarkMode ? 'rgba(255,255,255,0.2)' : 'rgba(255, 255, 255, 0.15)',
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    menuButton: {
      padding: 8,
    },
    messageCount: {
      fontSize: 28,
      fontWeight: '700',
      color: '#fff',
      marginBottom: 12,
      letterSpacing: 0.5,
    },
    contactListTitle: {
      fontSize: 16,
      color: '#fff',
      opacity: 0.85,
      marginBottom: 12,
      fontWeight: '500',
    },
    avatarScrollView: {
      flexDirection: 'row',
      marginBottom: 15,
      paddingHorizontal: 5,
    },
    avatarContainer: {
      marginRight: 18,
      alignItems: 'center',
    },
    avatar: {
      width: 55,
      height: 55,
      borderRadius: 27.5,
      borderWidth: 2,
      borderColor: 'rgba(255,255,255,0.3)',
    },
    avatarName: {
      color: '#fff',
      fontSize: 12,
      marginTop: 6,
      fontWeight: '500',
    },
    searchContainer: {
      flexDirection: 'row',
      marginHorizontal: 20,
      marginTop: -25,
      marginBottom: 25,
      gap: 12,
    },
    searchButton: {
      flex: 1,
      backgroundColor: colors.card,
      height: 50,
      paddingVertical: 12,
      borderRadius: 25,
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 18,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.08,
      shadowRadius: 6,
      elevation: 4,
    },
    searchText: {
      color: colors.text,
      flex: 1,
      marginLeft: 12,
      fontSize: 16,
      opacity: 0.7,
    },
    groupButton: {
      backgroundColor: colors.card,
      padding: 14,
      borderRadius: 25,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.08,
      shadowRadius: 6,
      elevation: 4,
    },
    tabContainer: {
      flexDirection: 'row',
      marginHorizontal: 20,
      marginBottom: 25,
      backgroundColor: colors.card,
      borderRadius: 30,
      padding: 6,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.08,
      shadowRadius: 6,
      elevation: 4,
    },
    tab: {
      flex: 1,
      paddingVertical: 14,
      paddingHorizontal: 20,
      borderRadius: 24,
      alignItems: 'center',
      justifyContent: 'center',
    },
    activeTab: {
      backgroundColor: colors.primary,
      shadowColor: colors.primary,
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.3,
      shadowRadius: 4,
      elevation: 3,
    },
    inactiveTab: {
      backgroundColor: 'transparent',
    },
    tabText: {
      fontSize: 15,
      fontWeight: '600',
    },
    activeTabText: {
      color: '#fff',
    },
    inactiveTabText: {
      color: colors.text,
      opacity: 0.7,
    },
    pinnedSection: {
      marginHorizontal: 20,
      marginBottom: 25,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 18,
      letterSpacing: 0.3,
    },
    messageItem: {
      backgroundColor: colors.card,
      borderRadius: 20,
      marginBottom: 12,
      padding: 18,
      flexDirection: 'row',
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.06,
      shadowRadius: 8,
      elevation: 3,
    },
    messageAvatar: {
      width: 55,
      height: 55,
      borderRadius: 27.5,
      marginRight: 18,
      position: 'relative',
    },
    groupIndicator: {
      position: 'absolute',
      bottom: -3,
      right: -3,
      backgroundColor: colors.primary,
      borderRadius: 12,
      width: 24,
      height: 24,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 3,
      borderColor: colors.card,
    },
    messageContent: {
      flex: 1,
      justifyContent: 'center',
    },
    messageName: {
      fontWeight: '700',
      fontSize: 17,
      color: colors.text,
      marginBottom: 6,
      letterSpacing: 0.2,
    },
    messageText: {
      color: colors.text,
      opacity: 0.75,
      fontSize: 15,
      lineHeight: 20,
    },
    messageTime: {
      fontSize: 13,
      color: colors.text,
      opacity: 0.6,
      marginLeft: 12,
      fontWeight: '500',
    },
    unreadIndicator: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: colors.notification,
      alignItems: 'center',
      justifyContent: 'center',
      marginLeft: 12,
      shadowColor: colors.notification,
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.3,
      shadowRadius: 4,
      elevation: 3,
    },
    unreadCount: {
      color: '#fff',
      fontSize: 12,
      fontWeight: '700',
    },
    readIndicator: {
      marginLeft: 12,
    },
    fab: {
      position: 'absolute',
      right: 25,
      bottom: 30,
      backgroundColor: colors.primary,
      width: 65,
      height: 65,
      borderRadius: 32.5,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: colors.primary,
      shadowOffset: {
        width: 0,
        height: 6,
      },
      shadowOpacity: 0.3,
      shadowRadius: 12,
      elevation: 8,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 20,
    },
    modalContent: {
      width: '100%',
      maxWidth: 400,
      padding: 25,
      borderRadius: 25,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 10,
      },
      shadowOpacity: 0.25,
      shadowRadius: 20,
      elevation: 15,
    },

    modalTabContainer: {
      flexDirection: 'row',
      backgroundColor: colors.background,
      borderRadius: 20,
      padding: 4,
      marginBottom: 25,
    },
    modalTab: {
      flex: 1,
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
    },
    modalActiveTab: {
      backgroundColor: colors.primary,
      shadowColor: colors.primary,
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.3,
      shadowRadius: 4,
      elevation: 3,
    },
    modalInactiveTab: {
      backgroundColor: 'transparent',
    },
    modalTabText: {
      fontSize: 15,
      fontWeight: '600',
    },
    modalActiveTabText: {
      color: '#fff',
    },
    modalInactiveTabText: {
      color: colors.text,
      opacity: 0.7,
    },
    tabContent: {
      minHeight: 200,
    },
    modalInput: {
      borderWidth: 2,
      borderRadius: 15,
      padding: 16,
      marginBottom: 25,
      fontSize: 16,
      fontWeight: '500',
    },
    modalButtons: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: 12,
    },
    modalButton: {
      flex: 1,
      padding: 16,
      borderRadius: 15,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 3,
      },
      shadowOpacity: 0.2,
      shadowRadius: 6,
      elevation: 4,
    },
    cancelButton: {
      backgroundColor: '#ff6b6b',
    },
    submitButton: {
      backgroundColor: '#4CAF50',
    },
    buttonText: {
      color: '#fff',
      textAlign: 'center',
      fontWeight: '700',
      fontSize: 16,
      letterSpacing: 0.3,
    },
    requestsList: {
      maxHeight: 300,
      marginBottom: 20,
    },
    requestItem: {
      borderRadius: 15,
      padding: 16,
      marginBottom: 12,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    requestInfo: {
      flex: 1,
    },
    requestName: {
      fontSize: 16,
      fontWeight: '600',
      marginBottom: 4,
    },
    requestCode: {
      fontSize: 14,
      opacity: 0.7,
    },
    requestActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 15,
    },
    actionButton: {
      paddingVertical: 8,
      paddingHorizontal: 8,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      width: 40,
      height: 40,
    },
    acceptButton: {
      backgroundColor: '#4CAF50',
    },
    declineButton: {
      backgroundColor: '#ff6b6b',
    },
    actionButtonText: {
      color: '#fff',
      fontSize: 14,
      fontWeight: '600',
    },
    emptyText: {
      textAlign: 'center',
      fontSize: 16,
      fontStyle: 'italic',
      marginTop: 40,
    },
    avatarFallback: {
      backgroundColor: colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
    },
  });

  const renderAvatarItem = ({ item }) => (
    <TouchableOpacity
      style={styles.avatarContainer}
      onPress={() => navigation.navigate('Chat', { id: item.id, name: item.name, avatar: item.profile_photo, friend_code: item.friend_code })}
    >
      {item.profile_photo ? (
        <Image
          source={{ uri: item.profile_photo }}
          style={styles.avatar}
          onError={() => {
            // If image fails to load, show fallback
            item.profile_photo = null;
          }}
        />
      ) : (
        <View style={[styles.avatar, styles.avatarFallback]}>
          <Icon name="person" size={24} color="#fff" />
        </View>
      )}
      <Text style={styles.avatarName}>{item.name}</Text>
    </TouchableOpacity>
  );

  const renderMessageItem = ({ item }) => {
    if (activeTab === 'group') {
      return renderGroupItem({ item });
    } else {
    <TouchableOpacity
      style={styles.messageItem}
      onPress={() => navigation.navigate('Chat', {
        id: item.id,
        name: item.name,
        avatar: item.profile_photo,
        isGroup: item.isGroup || false,
        friend_code: item.friend_code
      })}
    >
      <View style={styles.messageAvatar}>
        {item.profile_photo ? (
          <Image
            source={{ uri: item.profile_photo }}
            style={styles.avatar}
            onError={() => {
              // If image fails to load, show fallback
              item.profile_photo = null;
            }}
          />
        ) : (
          // if group change the fallback image to people
          <View style={[styles.avatar, styles.avatarFallback]}>
            <Icon name={item.isGroup ? "people" : "person"} size={24} color={colors.text} />
          </View>
        )}
        {item.isGroup && (
          <View style={styles.groupIndicator}>
            <Icon name="people" size={12} color={colors.text} />
          </View>
        )}
      </View>
      <View style={styles.messageContent}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text style={styles.messageName}>
            {item.name}
            {item.isGroup && item.memberCount && (
              <Text style={{ fontSize: 12, opacity: 0.6 }}> ({item.memberCount})</Text>
            )}
          </Text>
          <Text style={styles.messageTime}>{item.time}</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={styles.messageText} numberOfLines={1}>{item.lastMessage}</Text>
          {!item.read ? (
            <View style={styles.unreadIndicator}>
              <Text style={styles.unreadCount}>1</Text>
            </View>
          ) : (
            <View style={styles.readIndicator}>
              <Icon name="checkmark-done" size={16} color="#6c5ce7" />
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.mainContainer} refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={[colors.primary]}
          tintColor={colors.primary}
          progressBackgroundColor={colors.background}
          style={{
            zIndex: 1000,
            backgroundColor: colors.primary,
          }}
          scrollEnabled={false}
        />
      }>
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View style={styles.headerLeft}>
              <TouchableOpacity onPress={handleProfilePress}>
                {profileImage ? (
                  <Image
                    source={{ uri: profileImage }}
                    style={styles.profilePicture}
                    onError={() => setProfileImage(null)}
                  />
                ) : (
                  <View style={styles.profileFallback}>
                    <Icon name="person" size={20} color={colors.text} />
                  </View>
                )}
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Hi, {fullName || 'User'}!</Text>
            </View>
            <View style={styles.headerRight}>
              <TouchableOpacity
                onPress={() => {
                  console.log('Theme toggle pressed, current theme:', theme);
                  toggleTheme();
                }}
                style={styles.themeToggleButton}
              >
                <Icon
                  name={isDarkMode ? "sunny" : "moon"}
                  size={20}
                  color={colors.text}
                />
              </TouchableOpacity>
              <TouchableOpacity style={styles.menuButton} onPress={handlelogout}>
                <Icon name='exit-outline' size={28} color={colors.text} />
              </TouchableOpacity>
            </View>
          </View>
          <Text style={styles.contactListTitle}>Friends List</Text>

          <FlatList
            data={friends}
            renderItem={renderAvatarItem}
            keyExtractor={item => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.avatarScrollView}
          />
        </View>

        <View style={styles.searchContainer}>
          <View style={styles.searchButton}>
            <Icon name="search" size={20} color={colors.text} />
            <TextInput
              style={styles.searchText}
              placeholder="Search Chat"
              placeholderTextColor={isDarkMode ? "#aaa" : "#888"}
            />
          </View>
        </View>

        {/* Tab Navigator */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === 'direct' ? styles.activeTab : styles.inactiveTab
            ]}
            onPress={() => setActiveTab('direct')}
          >
            <Text style={[
              styles.tabText,
              activeTab === 'direct' ? styles.activeTabText : styles.inactiveTabText
            ]}>
              Direct Messages
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === 'group' ? styles.activeTab : styles.inactiveTab
            ]}
            onPress={() => setActiveTab('group')}
          >
            <Text style={[
              styles.tabText,
              activeTab === 'group' ? styles.activeTabText : styles.inactiveTabText
            ]}>
              Group Chat
            </Text>
          </TouchableOpacity>
        </View>

        <View style={{ flex: 1, marginHorizontal: 20 }}>
          <Text style={styles.sectionTitle}>{getCurrentTitle()}</Text>
          <FlatList
            data={getCurrentData()}
            renderItem={renderMessageItem}
            keyExtractor={item => item.id}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[colors.primary]}
                tintColor={colors.primary}
                progressBackgroundColor={colors.background}
                style={{
                  zIndex: 1000,
                  backgroundColor: colors.primary,
                }}
                scrollEnabled={false}
              />
            }
          />
        </View>
      </View>
      {/* add friend icon */}
      <TouchableOpacity style={styles.fab} onPress={handleAddFriend}>
        <Icon name="person-add" size={25} color={colors.text} style={{ justifyContent: 'center', alignItems: 'center', }} />
      </TouchableOpacity>

      {/* Add Friend Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isAddFriendModalVisible}
        onRequestClose={() => setIsAddFriendModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>

            {/* Tab Navigation */}
            <View style={styles.modalTabContainer}>
              <TouchableOpacity
                style={[
                  styles.modalTab,
                  modalActiveTab === 'add' ? styles.modalActiveTab : styles.modalInactiveTab
                ]}
                onPress={() => setModalActiveTab('add')}
              >
                <Text style={[
                  styles.modalTabText,
                  modalActiveTab === 'add' ? styles.modalActiveTabText : styles.modalInactiveTabText
                ]}>
                  Add Friend
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.modalTab,
                  modalActiveTab === 'requests' ? styles.modalActiveTab : styles.modalInactiveTab
                ]}
                onPress={() => setModalActiveTab('requests')}
              >
                <Text style={[
                  styles.modalTabText,
                  modalActiveTab === 'requests' ? styles.modalActiveTabText : styles.modalInactiveTabText
                ]}>
                  Requests
                </Text>
              </TouchableOpacity>
            </View>

            {/* Tab Content */}
            <View style={styles.tabContent}>
              {modalActiveTab === 'add' ? (
                // Add Friend Tab
                <View>
                  <TextInput
                    style={[styles.modalInput, {
                      backgroundColor: colors.background,
                      color: colors.text,
                      borderColor: colors.border
                    }]}
                    placeholder="Enter friend code"
                    placeholderTextColor={colors.text + '80'}
                    value={friendCode}
                    onChangeText={setFriendCode}
                    autoCapitalize="none"
                  />
                  <View style={styles.modalButtons}>
                    <TouchableOpacity
                      style={[styles.modalButton, styles.cancelButton]}
                      onPress={() => {
                        setFriendCode('');
                        setIsAddFriendModalVisible(false);
                      }}
                    >
                      <Text style={styles.buttonText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.modalButton, styles.submitButton]}
                      onPress={handleSubmitFriendCode}
                    >
                      <Text style={styles.buttonText}>Add Friend</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                // Friend Requests Tab
                <View style={{ flex: 1 }}>
                  <ScrollView style={styles.requestsList}>
                    {friendRequests.length === 0 ? (
                      <Text style={[styles.emptyText, { color: colors.text + '80', textAlign: 'center', marginTop: 20 }]}>
                        No friend requests
                      </Text>
                    ) : (
                      friendRequests.map((request) => (
                        <View
                          key={request.id}
                          style={[styles.requestItem, { backgroundColor: colors.card || colors.background }]}
                        >
                          {/* Request Info */}
                          <View style={styles.requestInfo}>
                            <Text style={[styles.requestName, { color: colors.text }]}>
                              {request.name}
                            </Text>
                            <Text style={[styles.requestCode, { color: colors.text + '80' }]}>
                              Code: {request.code}
                            </Text>
                          </View>

                          {/* Action Buttons */}
                          <View style={styles.requestActions}>
                            <TouchableOpacity
                              style={[styles.actionButton, styles.acceptButton]}
                              onPress={() => handleAcceptFriendRequest(request.code)}
                            >
                              <Icon name="checkmark" size={20} color={colors.text} />
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={[styles.actionButton, styles.declineButton]}
                              onPress={() => handleRejectFriendRequest(request.code)}
                            >
                              <Icon name="close" size={20} color={colors.text} />
                            </TouchableOpacity>
                          </View>
                        </View>
                      ))
                    )}
                  </ScrollView>

                  {/* Close Button */}
                  <View style={styles.modalButtons}>
                    <TouchableOpacity
                      style={[styles.modalButton, styles.cancelButton]}
                      onPress={() => setIsAddFriendModalVisible(false)}
                    >
                      <Text style={styles.buttonText}>Close</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default HomeScreen;
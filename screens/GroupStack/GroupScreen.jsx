// screens/GroupsScreen.js
import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, TextInput, Modal, ScrollView, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../contexts/ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createGroup } from '../../helpers/postAPIs';
import { getAllGroups } from '../../helpers/getAPIs';

const GroupsScreen = ({ navigation }) => {
  const { colors, theme } = useTheme();
  const isDarkMode = theme === 'dark';
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateGroupModalVisible, setIsCreateGroupModalVisible] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [token, setToken] = useState(null);
  const [groups, setGroups] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const storedToken = await AsyncStorage.getItem('@access_token');
        setToken(storedToken);
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

  useEffect(() => {
    if (token) {
      getGroups();
    }
  }, [token]);

  // Get all groups
  const getGroups = async () => {
    const response = await getAllGroups(token);
    console.log(response, " all groups");
    // Extract joined_groups from response and map to expected format
    const groupsData = response.joined_groups || [];
    setGroups(groupsData);
  }

  const onRefresh = async () => {
    setRefreshing(true);
    await getGroups();
    setRefreshing(false);
  };

  const handleCreateNewGroup = async () => {
    // console.log('handleCreateNewGroup called', groupName);
    if (groupName.length > 0) {
      const groupData = {
        name: groupName,
      };
      const response = await createGroup(token, groupData);
      console.log(response, " group created");
      setGroupName('');
      setIsCreateGroupModalVisible(false);
      getGroups();
    }
  };

  // Function to show the modal
  const showCreateGroupModal = () => {
    setIsCreateGroupModalVisible(true);
  };

  const filteredGroups = useMemo(() => {
    if (!searchQuery.trim()) {
      return groups; // Return all groups when no search query
    }
    const query = searchQuery.toLowerCase().trim();
    return groups.filter(group =>
      group.name.toLowerCase().includes(query)
    );
  }, [searchQuery, groups]);

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
      padding: 20,
      borderBottomLeftRadius: 20,
      borderBottomRightRadius: 20,
    },
    headerTop: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 15,
    },
    title: {
      fontSize: 28,
      fontWeight: 'bold',
      color: '#fff',
    },
    backButton: {
      padding: 4,
    },
    searchContainer: {
      flexDirection: 'row',
      marginHorizontal: 20,
      marginTop: -20,
      marginBottom: 20,
    },
    searchButton: {
      flex: 1,
      backgroundColor: colors.card,
      height: 45,
      paddingVertical: 10,
      paddingHorizontal: 15,
      borderRadius: 25,
      flexDirection: 'row',
      alignItems: 'center',
      // marginRight: 10,
    },
    searchInput: {
      color: colors.text,
      flex: 1,
      marginLeft: 10,
      fontSize: 16,
    },
    clearButton: {
      marginLeft: 10,
    },
    listContainer: {
      flex: 1,
      marginHorizontal: 20,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 15,
    },
    messageItem: {
      backgroundColor: colors.card,
      borderRadius: 15,
      marginBottom: 10,
      padding: 15,
      flexDirection: 'row',
    },
    messageAvatar: {
      width: 50,
      height: 50,
      borderRadius: 25,
      marginRight: 15,
      position: 'relative',
    },
    avatar: {
      width: 50,
      height: 50,
      borderRadius: 25,
    },
    groupIndicator: {
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
      borderColor: colors.card,
    },
    messageContent: {
      flex: 1,
    },
    messageName: {
      fontWeight: 'bold',
      fontSize: 16,
      color: colors.text,
      marginBottom: 5,
    },
    // memberCount: {
    //   fontSize: 12,
    //   opacity: 0.6,
    // },
    messageText: {
      color: colors.text,
      opacity: 0.8,
    },
    messageTime: {
      fontSize: 12,
      color: colors.text,
      opacity: 0.6,
      marginLeft: 10,
    },
    unreadIndicator: {
      width: 20,
      height: 20,
      borderRadius: 10,
      backgroundColor: colors.notification,
      alignItems: 'center',
      justifyContent: 'center',
      marginLeft: 10,
    },
    unreadCount: {
      color: '#fff',
      fontSize: 12,
      fontWeight: 'bold',
    },
    readIndicator: {
      marginLeft: 10,
    },
    newGroupButton: {
      position: 'absolute',
      right: 20,
      bottom: 20,
      backgroundColor: colors.primary,
      width: 60,
      height: 60,
      borderRadius: 30,
      justifyContent: 'center',
      alignItems: 'center',
      elevation: 5,
    },

    // Add Group Modal
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
    modalHeader: {
      alignItems: 'center',
      marginBottom: 25,
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: '700',
      marginBottom: 6,
    },
    modalSubtitle: {
      fontSize: 14,
      textAlign: 'center',
    },
    inputsContainer: {
      marginBottom: 20,
    },
    inputRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 10,
    },
    modalInput: {
      borderWidth: 2,
      borderRadius: 15,
      padding: 16,
      fontSize: 16,
      fontWeight: '500',
    },
    characterCounter: {
      fontSize: 12,
      textAlign: 'right',
      marginTop: 5,
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
    disabledButton: {
      backgroundColor: '#cccccc',
      shadowOpacity: 0,
      elevation: 0,
    },
    buttonText: {
      color: '#fff',
      textAlign: 'center',
      fontWeight: '700',
      fontSize: 16,
      letterSpacing: 0.3,
    },
    disabledButtonText: {
      color: '#999999',
    },
    avatar: {
      width: 55,
      height: 55,
      borderRadius: 27.5,
      borderWidth: 2,
      borderColor: 'rgba(255,255,255,0.3)',
    },
    avatarFallback: {
      backgroundColor: colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
    },
  });

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

  return (
<SafeAreaView style={styles.container}>
      <View style={styles.mainContainer}>
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <Text style={styles.title}>Groups</Text>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              {/* <Icon name="ellipsis-vertical" size={24} color="#fff" /> */}
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.searchContainer}>
          <View style={styles.searchButton}>
            <Icon name="search" size={20} color={colors.text} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search groups..."
              placeholderTextColor={isDarkMode ? "#aaa" : "#888"}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                style={styles.clearButton}
                onPress={() => setSearchQuery('')}
              >
                <Icon name="close-circle" size={20} color={colors.text} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View style={[styles.listContainer, { flex: 1 }]}>
          <Text style={styles.sectionTitle}>Group Chats({filteredGroups.length})</Text>
          <FlatList
            data={filteredGroups}
            renderItem={renderGroupItem}
            keyExtractor={item => item.id}
            showsVerticalScrollIndicator={false}
            style={{ flex: 1 }}
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

      <TouchableOpacity style={styles.newGroupButton} onPress={showCreateGroupModal}>
        <Icon name="add" size={30} color="#fff" />
      </TouchableOpacity>

      {/* Add Group Modal */}

      <Modal
        animationType="slide"
        transparent={true}
        visible={isCreateGroupModalVisible}
        onRequestClose={() => setIsCreateGroupModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>

            {/* Header */}
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                Create New Group
              </Text>
              <Text style={[styles.modalSubtitle, { color: colors.text + '80' }]}>
                Enter a name for your new group
              </Text>
            </View>

            {/* Group Name Input Section */}
            <View style={styles.inputsContainer}>
              <View style={styles.inputRow}>
                <TextInput
                  style={[styles.modalInput, {
                    backgroundColor: colors.background,
                    color: colors.text,
                    borderColor: colors.border,
                    flex: 1
                  }]}
                  placeholder="Group name"
                  placeholderTextColor={colors.text + '80'}
                  value={groupName}
                  onChangeText={setGroupName}
                  autoCapitalize="words"
                  maxLength={50}
                />
              </View>

              {/* Character counter */}
              <Text style={[styles.characterCounter, { color: colors.text + '60' }]}>
                {groupName.length}/50 characters
              </Text>
            </View>

            {/* Action Buttons */}
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setGroupName('');
                  setIsCreateGroupModalVisible(false);
                }}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalButton,
                  styles.submitButton,
                  !groupName.trim() && styles.disabledButton
                ]}
                onPress={handleCreateNewGroup}
                disabled={!groupName.trim()}
              >
                <Text style={[
                  styles.buttonText,
                  !groupName.trim() && styles.disabledButtonText
                ]}>
                  Create Group
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default GroupsScreen;

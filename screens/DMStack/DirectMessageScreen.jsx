// screens/DirectMessageScreen.js
import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, TextInput, Dimensions, Modal, RefreshControl, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../contexts/ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getFriends } from '../../helpers/getAPIs';

const { width, height } = Dimensions.get('window');

const DirectMessageScreen = ({ navigation }) => {
  const { colors, theme } = useTheme();
  const isDarkMode = theme === 'dark';
  const [searchQuery, setSearchQuery] = useState('');
  const [modalSearchQuery, setModalSearchQuery] = useState('');
  const [showFriendModal, setShowFriendModal] = useState(false);
  const [friends, setFriends] = useState([]);
  const [token, setToken] = useState(null);
  const [isLoadingFriends, setIsLoadingFriends] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const contacts = []; // Your existing contacts array

  // Fetch user data
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const storedToken = await AsyncStorage.getItem('@access_token');
        console.log('Retrieved token:', storedToken ? 'Token found' : 'No token');
        setToken(storedToken);
      } catch (e) {
        console.error('Failed to load user data:', e);
      }
    };
    fetchUserData();
  }, []);

  // Fetch friends when token is available
  useEffect(() => {
    if (token) {
      fetchFriends();
    }
  }, [token]);

  // Fetch friends function
  const fetchFriends = async () => {
    if (!token) {
      console.log('No token available for fetching friends');
      return;
    }
   
    setIsLoadingFriends(true);
    try {
      console.log('Fetching friends with token...');
      const response = await getFriends(token);
      console.log('Friends API response:', response);

      if (response?.data && Array.isArray(response.data)) {
        console.log('Friends data:', response);
        const mappedFriends = response.data.map((friend) => ({
          id: friend.id,
          name: friend.full_name,
          code: friend.friend_code,
          email: friend.email,
          profile_photo: friend.profile_photo,
        }));
        console.log('Mapped friends:', mappedFriends);
        setFriends(mappedFriends);
      } else {
        console.log('No friends data in response or invalid format');
        setFriends([]);
      }
    } catch (error) {
      console.error('Failed to fetch friends:', error);
      setFriends([]);
    } finally {
      setIsLoadingFriends(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchFriends();
    setRefreshing(false);
  };


  const filteredContacts = useMemo(() => {
    if (!searchQuery.trim()) {
      return contacts;
    }
    const query = searchQuery.toLowerCase().trim();
    return contacts.filter(contact =>
      contact.name.toLowerCase().includes(query)
    );
  }, [searchQuery, contacts]);

  const filteredFriends = useMemo(() => {
    console.log('Filtering friends. Total friends:', friends.length, 'Search query:', modalSearchQuery);
    if (!modalSearchQuery.trim()) {
      return friends; // Show all friends when no search query
    }
    const query = modalSearchQuery.toLowerCase().trim();
    const filtered = friends.filter(friend =>
      friend.name.toLowerCase().includes(query)
    );
    console.log('Filtered friends:', filtered.length);
    return filtered;
  }, [modalSearchQuery, friends]);

  const handleStartChat = (friend) => {
    console.log('Starting chat with:', friend.name);
    setShowFriendModal(false);
    setModalSearchQuery(''); // Clear modal search when closing
    navigation.navigate('Chat', {
      id: friend.id,
      name: friend.name,
      avatar: friend.profile_photo,
      online: friend.online || false
    });
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
    onlineIndicator: {
      width: 14,
      height: 14,
      borderRadius: 7,
      backgroundColor: '#4cd137',
      position: 'absolute',
      bottom: -2,
      right: -2,
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
    memberCount: {
      fontSize: 12,
      opacity: 0.6,
    },
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
    newMessageButton: {
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
    // Modal styles
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContainer: {
      backgroundColor: colors.background,
      borderRadius: 20,
      width: width * 0.9,
      maxHeight: height * 0.8, // Increased from 0.7 to 0.8
      overflow: 'hidden',
    },
    modalHeader: {
      backgroundColor: colors.primary,
      padding: 20,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
    },
    modalHeaderContent: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: '#fff',
    },
    closeButton: {
      padding: 5,
    },
    modalSearchContainer: {
      padding: 15,
      backgroundColor: colors.background,
    },
    modalSearchInput: {
      backgroundColor: colors.card,
      borderRadius: 25,
      paddingHorizontal: 15,
      paddingVertical: 12,
      fontSize: 16,
      color: colors.text,
    },
    modalListContainer: {
      paddingHorizontal: 15,
      paddingBottom: 20, // Add bottom padding
    },
    friendItem: {
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 15,
      marginVertical: 5,
      flexDirection: 'row',
      alignItems: 'center',
    },
    friendAvatar: {
      width: 45,
      height: 45,
      borderRadius: 22.5,
      marginRight: 15,
      backgroundColor: colors.primary,
    },
    friendInfo: {
      flex: 1,
    },
    friendName: {
      fontSize: 16,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 3,
    },
    friendCode: {
      fontSize: 12,
      color: colors.text,
      opacity: 0.6,
    },
    emptyState: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 40,
    },
    emptyStateText: {
      fontSize: 16,
      color: colors.text,
      opacity: 0.6,
      textAlign: 'center',
    },
  });

  const renderContactItem = ({ item }) => (
    <TouchableOpacity
      style={styles.messageItem}
      onPress={() => {
        console.log('Navigating to chat with:', item.name);
        navigation.navigate('Chat', {
          id: item.id,
          name: item.name,

        });
      }}
    >
      <View style={styles.messageAvatar}>
        {item.profile_photo ? (
          <Image source={{ uri: item.profile_photo }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, { backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center' }]}>
            <Icon name="person-outline" size={24} color="#fff" />
          </View>
        )}

        {item.online && (
          <View style={styles.onlineIndicator} />
        )}
      </View>
      <View style={styles.messageContent}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text style={styles.messageName}>
            {item.name}
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
  );

  const renderFriendItem = ({ item }) => {
    console.log('Rendering friend item:', item.name);
    return (
      <TouchableOpacity
        style={styles.friendItem}
        onPress={() => handleStartChat(item)}
      >
        {item.profile_photo ? (
          <Image 
            source={{ uri: item.profile_photo }} 
            style={styles.friendAvatar} 
          />
        ) : (
          <View style={[styles.friendAvatar, { backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center' }]}>
            <Icon name="person-outline" size={20} color="#fff" />
          </View>
        )}
        <View style={styles.friendInfo}>
          <Text style={styles.friendName}>{item.name}</Text>
          <Text style={styles.friendCode}>#{item.code}</Text>
        </View>
        <Icon name="chatbubble-outline" size={20} color={colors.primary} />
      </TouchableOpacity>
    );
  };

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
          scrollEnabled = {false}
        />
      }>
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <Text style={styles.title}>Direct Messages</Text>
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
              placeholder="Search contacts..."
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

        <View style={styles.listContainer}>
          <Text style={styles.sectionTitle}>Direct Messages({filteredContacts.length})</Text>
          <FlatList
            data={filteredContacts}
            renderItem={renderContactItem}
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

      <TouchableOpacity
        style={styles.newMessageButton}
        onPress={() => {
          // Only fetch friends if we don't have them already or if we want to refresh
          if (friends.length === 0 && token) {
            fetchFriends();
          }
          setModalSearchQuery(''); // Clear search when opening modal
          setShowFriendModal(true);
        }}
      >
        <Icon name="create" size={24} color="#fff" />
      </TouchableOpacity>

      {/* Friend Selection Modal */}
      <Modal
        visible={showFriendModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          setShowFriendModal(false);
          setModalSearchQuery(''); // Clear search when closing via back button
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderContent}>
                <Text style={styles.modalTitle}>Start New Chat</Text>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => {
                    setShowFriendModal(false);
                    setModalSearchQuery(''); // Clear search when closing
                  }}
                >
                  <Icon name="close" size={24} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.modalSearchContainer}>
              <TextInput
                style={styles.modalSearchInput}
                placeholder="Search friends..."
                placeholderTextColor={isDarkMode ? "#aaa" : "#888"}
                value={modalSearchQuery}
                onChangeText={setModalSearchQuery}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.modalListContainer}>
              {isLoadingFriends ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyStateText}>Loading friends...</Text>
                </View>
              ) : filteredFriends.length > 0 ? (
                <FlatList
                  
                  data={filteredFriends}
                  renderItem={renderFriendItem}
                  keyExtractor={item => item.id}
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={{ paddingBottom: 10 }} // Add content padding
                />
              ) : (
                <View style={styles.emptyState}>
                  <Icon name="people-outline" size={48} color={colors.text} style={{ opacity: 0.3 }} />
                  <Text style={styles.emptyStateText}>
                    {friends.length === 0 
                      ? "No friends found.\nAdd some friends to start chatting!" 
                      : "No friends match your search."}
                  </Text>
                </View>
              )}
            </View>
            {/* <Text>Hello</Text> */}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default DirectMessageScreen;
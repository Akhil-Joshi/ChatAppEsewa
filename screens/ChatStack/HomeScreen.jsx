// screens/HomeScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../../contexts/ThemeContext';
import { TextInput } from 'react-native-gesture-handler';
import { useAuth } from '../../contexts/AuthContext';

const HomeScreen = ({ navigation }) => {
  const { colors, theme, toggleTheme } = useTheme();
  const isDarkMode = theme === 'dark';
  const { logout } = useAuth();
  const [fullName, setFullName] = useState('');
  const [profileImage, setProfileImage] = useState(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
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
              // Clear all stored user data from AsyncStorage
              await AsyncStorage.multiRemove([
                '@user_id',
                '@email',
                '@full_name',
                '@access_token',
                '@refresh_token'
              ]);

              // Update auth context - this will set isLoggedIn to false
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

  // Tab state
  const [activeTab, setActiveTab] = useState('direct');

  // Debug log to check if theme is changing
  console.log('Current theme:', theme, 'isDarkMode:', isDarkMode);

  const directContacts = [
    { id: '1', name: 'Phillip Franci', avatar: 'https://i.pravatar.cc/150?img=1', lastMessage: 'Hey, it\'s been a while since we\'ve...', time: '10:00 am', read: false },
    { id: '2', name: 'Alfredo Saris', avatar: 'https://i.pravatar.cc/150?img=2', lastMessage: 'Hello, Good Morning Bro!', time: '09:00 am', read: false },
    { id: '3', name: 'Jaylon Franci', avatar: 'https://i.pravatar.cc/150?img=3', lastMessage: 'Everything\'s good.', time: '08:30 am', read: true },
    { id: '4', name: 'Tatiana Dorwart', avatar: 'https://i.pravatar.cc/150?img=4', lastMessage: 'Okay! Thanks!', time: '08:10 am', read: true },
    { id: '5', name: 'Terry Bergson', avatar: 'https://i.pravatar.cc/150?img=5', lastMessage: 'Sure thing!', time: '07:45 am', read: true },
  ];

  const groupChats = [
    { id: '6', name: 'Design Team', avatar: 'https://i.pravatar.cc/150?img=6', lastMessage: 'Let\'s finalize the mockups today', time: '11:30 am', read: false, isGroup: true, memberCount: 8 },
    { id: '7', name: 'College Friends', avatar: 'https://i.pravatar.cc/150?img=7', lastMessage: 'Anyone up for the reunion?', time: '09:45 am', read: false, isGroup: true, memberCount: 12 },
    { id: '8', name: 'Family Group', avatar: 'https://i.pravatar.cc/150?img=8', lastMessage: 'Mom: Dinner at 7 PM', time: '08:15 am', read: true, isGroup: true, memberCount: 6 },
    { id: '9', name: 'Work Project', avatar: 'https://i.pravatar.cc/150?img=9', lastMessage: 'Meeting postponed to tomorrow', time: '07:30 am', read: true, isGroup: true, memberCount: 5 },
  ];

  const contactAvatars = [
    { id: '1', name: 'Phillip', avatar: 'https://i.pravatar.cc/150?img=1' },
    { id: '2', name: 'Alfredo', avatar: 'https://i.pravatar.cc/150?img=2' },
    { id: '3', name: 'Jaylon', avatar: 'https://i.pravatar.cc/150?img=3' },
    { id: '4', name: 'Tatiana', avatar: 'https://i.pravatar.cc/150?img=4' },
    { id: '5', name: 'Terry', avatar: 'https://i.pravatar.cc/150?img=5' },
  ];

  const getCurrentData = () => {
    return activeTab === 'direct' ? directContacts : groupChats;
  };

  const getCurrentTitle = () => {
    const data = getCurrentData();
    return activeTab === 'direct'
      ? `Direct Messages(${data.length})`
      : `Group Chats(${data.length})`;
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
      marginBottom: 10,
    },
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    profilePicture: {
      width: 40,
      height: 40,
      borderRadius: 20,
      marginRight: 12,
      borderWidth: 2,
      borderColor: 'rgba(255,255,255,0.3)',
    },
    profileFallback: {
      width: 40,
      height: 40,
      borderRadius: 20,
      marginRight: 12,
      backgroundColor: 'rgba(255,255,255,0.2)',
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderColor: 'rgba(255,255,255,0.3)',
    },
    headerTitle: {
      fontSize: 16,
      color: '#fff',
      opacity: 0.8,
      flex: 1,
    },
    headerRight: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    themeToggleButton: {
      padding: 8,
      borderRadius: 20,
      backgroundColor: isDarkMode ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)',
      marginRight: 15,
    },
    menuButton: {
      padding: 4,
    },
    messageCount: {
      fontSize: 24,
      fontWeight: 'bold',
      color: '#fff',
      marginBottom: 10,
    },
    contactListTitle: {
      fontSize: 16,
      color: '#fff',
      opacity: 0.8,
      marginBottom: 10,
    },
    avatarScrollView: {
      flexDirection: 'row',
      marginBottom: 10,
    },
    avatarContainer: {
      marginRight: 15,
      alignItems: 'center',
    },
    avatar: {
      width: 50,
      height: 50,
      borderRadius: 25,
    },
    avatarName: {
      color: '#fff',
      fontSize: 12,
      marginTop: 5,
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
      paddingVertical: 5,
      paddingHorizontal: 20,
      borderRadius: 25,
      flexDirection: 'row',
      alignItems: 'center',
      marginRight: 10,
    },
    searchText: {
      color: isDarkMode ? '#fff' : '#000',
      flex: 1,
      marginLeft: 10,
    },
    groupButton: {
      backgroundColor: colors.card,
      padding: 12,
      borderRadius: 25,
      alignItems: 'center',
      justifyContent: 'center',
    },
    tabContainer: {
      flexDirection: 'row',
      marginHorizontal: 20,
      marginBottom: 20,
      backgroundColor: colors.card,
      borderRadius: 25,
      padding: 4,
    },
    tab: {
      flex: 1,
      paddingVertical: 12,
      paddingHorizontal: 20,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
    },
    activeTab: {
      backgroundColor: colors.primary,
    },
    inactiveTab: {
      backgroundColor: 'transparent',
    },
    tabText: {
      fontSize: 14,
      fontWeight: '600',
    },
    activeTabText: {
      color: '#fff',
    },
    inactiveTabText: {
      color: colors.text,
      opacity: 0.6,
    },
    pinnedSection: {
      marginHorizontal: 20,
      marginBottom: 20,
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
    fab: {
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
  });

  const renderAvatarItem = ({ item }) => (
    <TouchableOpacity
      style={styles.avatarContainer}
      onPress={() => navigation.navigate('Chat', { id: item.id, name: item.name, avatar: item.avatar })}
    >
      <Image source={{ uri: item.avatar }} style={styles.avatar} />
      <Text style={styles.avatarName}>{item.name}</Text>
    </TouchableOpacity>
  );

  const renderMessageItem = ({ item }) => (
    <TouchableOpacity
      style={styles.messageItem}
      onPress={() => navigation.navigate('Chat', {
        id: item.id,
        name: item.name,
        avatar: item.avatar,
        isGroup: item.isGroup || false
      })}
    >
      <View style={styles.messageAvatar}>
        <Image source={{ uri: item.avatar }} style={styles.avatar} />
        {item.isGroup && (
          <View style={styles.groupIndicator}>
            <Icon name="people" size={12} color="#fff" />
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
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.mainContainer}>
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
                    <Icon name="person" size={20} color="#fff" />
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
                  color="#fff"
                />
              </TouchableOpacity>
              <TouchableOpacity style={styles.menuButton} onPress={handlelogout}>
                <Icon name='exit-outline' size={28} color='#fff' />
              </TouchableOpacity>
            </View>
          </View>
          <Text style={styles.contactListTitle}>Friends List</Text>

          <FlatList
            data={contactAvatars}
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
          />
        </View>
        {/* add friend icon */}
        <TouchableOpacity style={styles.fab}>
          <Icon name="person-add" size={25} color="#fff" style={{ justifyContent: 'center', alignItems: 'center', }} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default HomeScreen;
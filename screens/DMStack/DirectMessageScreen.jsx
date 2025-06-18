// screens/DirectMessageScreen.js
import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, TextInput, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../contexts/ThemeContext';

const { width, height } = Dimensions.get('window');

const DirectMessageScreen = ({ navigation }) => {
  const { colors, theme } = useTheme();
  const isDarkMode = theme === 'dark';
  const [searchQuery, setSearchQuery] = useState('');

  const contacts = [
    {
      id: '1',
      name: 'Phillip Franci',
      avatar: 'https://i.pravatar.cc/150?img=1',
      lastMessage: 'Hey, it\'s been a while since we\'ve...',
      time: '10:00 am',
      read: false,
      online: true
    },
    {
      id: '2',
      name: 'Alfredo Saris',
      avatar: 'https://i.pravatar.cc/150?img=2',
      lastMessage: 'Hello, Good Morning Bro!',
      time: '09:00 am',
      read: false,
      online: false
    },
    {
      id: '3',
      name: 'Jaylon Franci',
      avatar: 'https://i.pravatar.cc/150?img=3',
      lastMessage: 'Everything\'s good.',
      time: '08:30 am',
      read: true,
      online: true
    },
    {
      id: '4',
      name: 'Tatiana Dorwart',
      avatar: 'https://i.pravatar.cc/150?img=4',
      lastMessage: 'Okay! Thanks!',
      time: '08:10 am',
      read: true,
      online: false
    },
    {
      id: '5',
      name: 'Terry Bergson',
      avatar: 'https://i.pravatar.cc/150?img=5',
      lastMessage: 'Sure thing!',
      time: '07:45 am',
      read: true,
      online: false
    },
    {
      id: '6',
      name: 'Michael Chen',
      avatar: 'https://i.pravatar.cc/150?img=8',
      lastMessage: 'See you tomorrow!',
      time: '06:30 am',
      read: false,
      online: true
    },
    {
      id: '7',
      name: 'Sarah Johnson',
      avatar: 'https://i.pravatar.cc/150?img=9',
      lastMessage: 'That sounds great!',
      time: '05:15 am',
      read: true,
      online: false
    },
    {
      id: '8',
      name: 'David Wong',
      avatar: 'https://i.pravatar.cc/150?img=11',
      lastMessage: 'Let me know when you\'re free',
      time: 'Yesterday',
      read: true,
      online: true
    },
  ];

  const filteredContacts = useMemo(() => {
    if (!searchQuery.trim()) {
      return contacts;
    }
    const query = searchQuery.toLowerCase().trim();
    return contacts.filter(contact =>
      contact.name.toLowerCase().includes(query)
    );
  }, [searchQuery, contacts]);

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
  });

  const renderContactItem = ({ item }) => (
    <TouchableOpacity
      style={styles.messageItem}
      onPress={() => {
        console.log('Navigating to chat with:', item.name);
        navigation.navigate('Chat', {
          id: item.id,
          name: item.name,
          avatar: item.avatar,
          online: item.online
        });
      }}
    >
      <View style={styles.messageAvatar}>
        <Image source={{ uri: item.avatar }} style={styles.avatar} />
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

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.mainContainer}>
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <Text style={styles.title}>Direct Messages</Text>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Icon name="ellipsis-vertical" size={24} color="#fff" />
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
          />
        </View>

        <TouchableOpacity 
          style={styles.newMessageButton}
          onPress={() => {
            console.log('New message button pressed');
            // Add your new message logic here
          }}
        >
          <Icon name="create" size={24} color="#fff" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default DirectMessageScreen;
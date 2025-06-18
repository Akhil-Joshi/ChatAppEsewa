// screens/GroupsScreen.js
import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../contexts/ThemeContext';

const GroupsScreen = ({ navigation }) => {
  const { colors, theme } = useTheme();
  const isDarkMode = theme === 'dark';
  const [searchQuery, setSearchQuery] = useState('');

  const groups = [
    {
      id: '1',
      name: 'Design Team',
      avatar: 'https://i.pravatar.cc/150?img=20',
      memberCount: 8,
      lastMessage: 'Let\'s finalize the mockups today',
      time: '11:30 am',
      read: false,
      isGroup: true
    },
    {
      id: '2',
      name: 'College Friends',
      avatar: 'https://i.pravatar.cc/150?img=21',
      memberCount: 12,
      lastMessage: 'Anyone up for the reunion?',
      time: '09:45 am',
      read: false,
      isGroup: true
    },
    {
      id: '3',
      name: 'Family Group',
      avatar: 'https://i.pravatar.cc/150?img=22',
      memberCount: 6,
      lastMessage: 'Mom: Dinner at 7 PM',
      time: '08:15 am',
      read: true,
      isGroup: true
    },
    {
      id: '4',
      name: 'Work Project',
      avatar: 'https://i.pravatar.cc/150?img=23',
      memberCount: 5,
      lastMessage: 'Meeting postponed to tomorrow',
      time: '07:30 am',
      read: true,
      isGroup: true
    },
    {
      id: '5',
      name: 'Coffee Lovers',
      avatar: 'https://i.pravatar.cc/150?img=24',
      memberCount: 24,
      lastMessage: 'Emma: New café downtown is amazing!',
      time: '06:45 am',
      read: false,
      isGroup: true
    },
    {
      id: '6',
      name: 'Weekend Warriors',
      avatar: 'https://i.pravatar.cc/150?img=25',
      memberCount: 15,
      lastMessage: 'Alex: Who\'s up for hiking this Saturday?',
      time: '05:30 am',
      read: true,
      isGroup: true
    },
    {
      id: '7',
      name: 'Study Group',
      avatar: 'https://i.pravatar.cc/150?img=26',
      memberCount: 9,
      lastMessage: 'Lisa: Exam prep session at 7 PM',
      time: 'Yesterday',
      read: true,
      isGroup: true
    },
    {
      id: '8',
      name: 'Gaming Squad',
      avatar: 'https://i.pravatar.cc/150?img=27',
      memberCount: 18,
      lastMessage: 'Tom: New game tonight?',
      time: 'Yesterday',
      read: false,
      isGroup: true
    },
  ];

  const filteredGroups = useMemo(() => {
    if (!searchQuery.trim()) {
      return groups;
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
  });

  const renderGroupItem = ({ item }) => (
    <TouchableOpacity
      style={styles.messageItem}
      onPress={() => navigation.navigate('Chat', {
        id: item.id,
        name: item.name,
        avatar: item.avatar,
        isGroup: true,
        memberCount: item.memberCount
      })}
    >
      <View style={styles.messageAvatar}>
        <Image source={{ uri: item.avatar }} style={styles.avatar} />
        <View style={styles.groupIndicator}>
          <Icon name="people" size={12} color="#fff" />
        </View>
      </View>
      <View style={styles.messageContent}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text style={styles.messageName}>
            {item.name}
            <Text style={styles.memberCount}> ({item.memberCount})</Text>
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
            <Text style={styles.title}>Groups</Text>
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

        <View style={styles.listContainer}>
          <Text style={styles.sectionTitle}>Group Chats({filteredGroups.length})</Text>
          <FlatList
            data={filteredGroups}
            renderItem={renderGroupItem}
            keyExtractor={item => item.id}
            showsVerticalScrollIndicator={false}
          />
        </View>

        <TouchableOpacity style={styles.newGroupButton}>
          <Icon name="add" size={30} color="#fff" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default GroupsScreen;
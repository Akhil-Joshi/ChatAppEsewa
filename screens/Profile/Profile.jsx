// screens/ProfileScreen.js
import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Image,
    ScrollView,
    Alert,
    Switch,
    TextInput,
    Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';

const ProfileScreen = ({ navigation }) => {
    const { colors, theme, toggleTheme } = useTheme();
    const isDarkMode = theme === 'dark';
    const { logout } = useAuth();

    // User data states
    const [userData, setUserData] = useState({
        fullName: '',
        email: '',
        phone: '',
        bio: '',
        profileImage: null,
    });

    // Settings states
    const [notifications, setNotifications] = useState(true);
    const [soundEnabled, setSoundEnabled] = useState(true);
    const [onlineStatus, setOnlineStatus] = useState(true);

    // Modal states
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [editingField, setEditingField] = useState('');
    const [editValue, setEditValue] = useState('');

    useEffect(() => {
        loadUserData();
    }, []);

    const loadUserData = async () => {
        try {
            const [fullName, email, phone, bio, profileImage] = await Promise.all([
                AsyncStorage.getItem('@full_name'),
                AsyncStorage.getItem('@email'),
                AsyncStorage.getItem('@phone'),
                AsyncStorage.getItem('@bio'),
                AsyncStorage.getItem('@profile_image'),
            ]);

            setUserData({
                fullName: fullName || '',
                email: email || '',
                phone: phone || '',
                bio: bio || 'Hey there! I am using this chat app.',
                profileImage: profileImage,
            });
        } catch (error) {
            console.error('Failed to load user data:', error);
        }
    };

    const saveUserData = async (field, value) => {
        try {
            await AsyncStorage.setItem(`@${field}`, value);
            setUserData(prev => ({ ...prev, [field]: value }));
        } catch (error) {
            console.error('Failed to save user data:', error);
            Alert.alert('Error', 'Failed to save changes. Please try again.');
        }
    };

    const handleEditField = (field, currentValue) => {
        setEditingField(field);
        setEditValue(currentValue);
        setEditModalVisible(true);
    };

    const handleSaveEdit = () => {
        if (editValue.trim()) {
            saveUserData(editingField, editValue.trim());
            setEditModalVisible(false);
        }
    };

    const handleChangeProfilePicture = () => {
        Alert.alert(
            'Change Profile Picture',
            'Choose an option',
            [
                {
                    text: 'Take Photo',
                    onPress: () => {
                        // Handle camera
                        console.log('Open camera');
                        Alert.alert('Info', 'Camera functionality would be implemented here');
                    }
                },
                {
                    text: 'Choose from Gallery',
                    onPress: () => {
                        // Handle gallery
                        console.log('Open gallery');
                        Alert.alert('Info', 'Gallery functionality would be implemented here');
                    }
                },
                {
                    text: 'Remove Photo',
                    style: 'destructive',
                    onPress: () => {
                        setUserData(prev => ({ ...prev, profileImage: null }));
                        AsyncStorage.removeItem('@profile_image');
                    }
                },
                {
                    text: 'Cancel',
                    style: 'cancel'
                }
            ]
        );
    };

    const handleLogout = async () => {
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
                            Alert.alert('Error', 'An error occurred while logging out.');
                        }
                    },
                },
            ]
        );
    };

    const ProfileSection = ({ title, children }) => (
        <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>{title}</Text>
            <View style={[styles.sectionContent, { backgroundColor: colors.card }]}>
                {children}
            </View>
        </View>
    );

    const ProfileItem = ({ icon, label, value, onPress, showChevron = true }) => (
        <TouchableOpacity style={styles.profileItem} onPress={onPress}>
            <View style={styles.profileItemLeft}>
                <Icon name={icon} size={22} color={colors.primary} style={styles.profileItemIcon} />
                <View style={styles.profileItemContent}>
                    <Text style={[styles.profileItemLabel, { color: colors.text }]}>{label}</Text>
                    {value && (
                        <Text style={[styles.profileItemValue, { color: colors.text }]} numberOfLines={1}>
                            {value}
                        </Text>
                    )}
                </View>
            </View>
            {showChevron && (
                <Icon name="chevron-forward" size={20} color={colors.text} opacity={0.5} />
            )}
        </TouchableOpacity>
    );

    const SettingItem = ({ icon, label, value, onToggle, type = 'switch' }) => (
        <View style={styles.profileItem}>
            <View style={styles.profileItemLeft}>
                <Icon name={icon} size={22} color={colors.primary} style={styles.profileItemIcon} />
                <Text style={[styles.profileItemLabel, { color: colors.text }]}>{label}</Text>
            </View>
            {type === 'switch' ? (
                <Switch
                    value={value}
                    onValueChange={onToggle}
                    trackColor={{ false: colors.border, true: colors.primary }}
                    thumbColor={value ? '#fff' : '#f4f3f4'}
                />
            ) : (
                <TouchableOpacity onPress={onToggle}>
                    <Text style={[styles.settingValue, { color: colors.primary }]}>{value}</Text>
                </TouchableOpacity>
            )}
        </View>
    );

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
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 20,
            paddingVertical: 15,
            backgroundColor: colors.primary,
        },
        headerLeft: {
            flexDirection: 'row',
            alignItems: 'center',
        },
        backButton: {
            marginRight: 15,
        },
        headerTitle: {
            fontSize: 18,
            fontWeight: 'bold',
            color: '#fff',
        },
        editButton: {
            paddingHorizontal: 15,
            paddingVertical: 8,
            backgroundColor: 'rgba(255,255,255,0.2)',
            borderRadius: 20,
        },
        editButtonText: {
            color: '#fff',
            fontSize: 14,
            fontWeight: '600',
        },
        profileHeader: {
            alignItems: 'center',
            paddingVertical: 30,
            backgroundColor: colors.primary,
            borderBottomLeftRadius: 30,
            borderBottomRightRadius: 30,
        },
        profileImageContainer: {
            position: 'relative',
            marginBottom: 15,
        },
        profileImage: {
            width: 120,
            height: 120,
            borderRadius: 60,
            borderWidth: 4,
            borderColor: 'rgba(255,255,255,0.3)',
        },
        profileImageFallback: {
            width: 120,
            height: 120,
            borderRadius: 60,
            backgroundColor: 'rgba(255,255,255,0.2)',
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 4,
            borderColor: 'rgba(255,255,255,0.3)',
        },
        cameraButton: {
            position: 'absolute',
            bottom: 0,
            right: 0,
            backgroundColor: colors.background,
            width: 40,
            height: 40,
            borderRadius: 20,
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 3,
            borderColor: colors.primary,
        },
        profileName: {
            fontSize: 24,
            fontWeight: 'bold',
            color: '#fff',
            marginBottom: 5,
        },
        profileEmail: {
            fontSize: 16,
            color: 'rgba(255,255,255,0.8)',
            marginBottom: 10,
        },
        onlineStatus: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 5,
            color: '#fff',
        },
        onlineText: {
            color: 'rgba(255,255,255,0.8)',
            marginLeft: 5,
            fontSize: 14,
        },
        scrollContent: {
            flex: 1,
            paddingTop: 20,
        },
        section: {
            marginBottom: 25,
            marginHorizontal: 20,
        },
        sectionTitle: {
            fontSize: 16,
            fontWeight: 'bold',
            marginBottom: 10,
            opacity: 0.8,
        },
        sectionContent: {
            borderRadius: 15,
            overflow: 'hidden',
        },
        profileItem: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 20,
            paddingVertical: 15,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
        },
        profileItemLeft: {
            flexDirection: 'row',
            alignItems: 'center',
            flex: 1,
        },
        profileItemIcon: {
            marginRight: 15,
        },
        profileItemContent: {
            flex: 1,
        },
        profileItemLabel: {
            fontSize: 16,
            fontWeight: '500',
            marginBottom: 2,
        },
        profileItemValue: {
            fontSize: 14,
            opacity: 0.7,
        },
        settingValue: {
            fontSize: 16,
            fontWeight: '600',
        },
        logoutButton: {
            marginBottom: 20,
            backgroundColor: '#ff4757',
            borderRadius: 15,
            overflow: 'hidden',
        },
        logoutItem: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            paddingVertical: 15,
        },
        logoutText: {
            color: '#fff',
            fontSize: 16,
            fontWeight: 'bold',
            marginLeft: 10,
        },
        // Modal styles
        modalOverlay: {
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.5)',
            justifyContent: 'center',
            alignItems: 'center',
        },
        modalContent: {
            backgroundColor: colors.card,
            borderRadius: 20,
            padding: 25,
            width: '85%',
            maxWidth: 400,
        },
        modalTitle: {
            fontSize: 18,
            fontWeight: 'bold',
            color: colors.text,
            marginBottom: 20,
            textAlign: 'center',
        },
        modalInput: {
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: 10,
            paddingHorizontal: 15,
            paddingVertical: 12,
            fontSize: 16,
            color: colors.text,
            marginBottom: 20,
        },
        modalButtons: {
            flexDirection: 'row',
            justifyContent: 'space-between',
        },
        modalButton: {
            flex: 1,
            paddingVertical: 12,
            borderRadius: 10,
            alignItems: 'center',
            marginHorizontal: 5,
        },
        cancelButton: {
            backgroundColor: colors.border,
        },
        saveButton: {
            backgroundColor: colors.primary,
        },
        modalButtonText: {
            fontSize: 16,
            fontWeight: '600',
        },
        cancelButtonText: {
            color: colors.text,
        },
        saveButtonText: {
            color: '#fff',
        },
    });

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.mainContainer}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => navigation.goBack()}
                    >
                        <Icon name="arrow-back" size={24} color="#fff" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Profile</Text>
                </View>
            </View>

            {/* Profile Header */}
            <View style={styles.profileHeader}>
                <View style={styles.profileImageContainer}>
                    <TouchableOpacity onPress={handleChangeProfilePicture}>
                        {userData.profileImage ? (
                            <Image
                                source={{ uri: userData.profileImage }}
                                style={styles.profileImage}
                            />
                        ) : (
                            <View style={styles.profileImageFallback}>
                                <Icon name="person" size={50} color="#fff" />
                            </View>
                        )}
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.cameraButton}
                        onPress={handleChangeProfilePicture}
                    >
                        <Icon name="camera" size={20} color={colors.primary} />
                    </TouchableOpacity>
                </View>

                <Text style={styles.profileName}>
                    {userData.fullName}
                </Text>
                <Text style={styles.profileEmail}>{userData.email}</Text>

                <View style={styles.onlineStatus}>
                    <View style={{
                        width: 8,
                        height: 8,
                        borderRadius: 4,
                        backgroundColor: onlineStatus ? '#00d2d3' : '#ff4757',
                    }} />
                    <Text style={styles.onlineStatus}>
                        {onlineStatus ? 'Online' : 'Offline'}
                    </Text>
                </View>
            </View>
            <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>

                {/* Personal Information */}
                <ProfileSection title="Personal Information">
                    <ProfileItem
                        icon="person-outline"
                        label="Full Name"
                        value={userData.fullName || 'Not set'}
                        // onPress={() => handleEditField('firstName', userData.firstName)}
                    />
                    {/* <ProfileItem
                        icon="person-outline"
                        label="Last Name"
                        value={userData.lastName || 'Not set'}
                        // onPress={() => handleEditField('lastName', userData.lastName)}
                    /> */}
                    <ProfileItem
                        icon="mail-outline"
                        label="Email"
                        value={userData.email || 'Not set'}
                        // onPress={() => handleEditField('email', userData.email)}
                    />
                    <ProfileItem
                        icon="call-outline"
                        label="Phone"
                        value={userData.phone || 'Not set'}
                        onPress={() => handleEditField('phone', userData.phone)}
                    />
                    <ProfileItem
                        icon="chatbubble-outline"
                        label="Bio"
                        value={userData.bio}
                        onPress={() => handleEditField('bio', userData.bio)}
                        showChevron={true}
                    />
                </ProfileSection>

                {/* Settings */}
                <ProfileSection title="Settings">
                    <SettingItem
                        icon="notifications-outline"
                        label="Notifications"
                        value={notifications}
                        onToggle={setNotifications}
                    />
                    <SettingItem
                        icon="volume-high-outline"
                        label="Sound"
                        value={soundEnabled}
                        onToggle={setSoundEnabled}
                    />
                    <SettingItem
                        icon="eye-outline"
                        label="Online Status"
                        value={onlineStatus}
                        onToggle={setOnlineStatus}
                    />
                    <SettingItem
                        icon={isDarkMode ? "sunny-outline" : "moon-outline"}
                        label="Theme"
                        value={isDarkMode ? "Dark" : "Light"}
                        onToggle={toggleTheme}
                        type="button"
                    />
                </ProfileSection>

                {/* Other Options */}
                <ProfileSection title="Other">
                    <ProfileItem
                        icon="help-circle-outline"
                        label="Help & Support"
                        onPress={() => Alert.alert('Help', 'Help & Support functionality would be implemented here')}
                    />
                    <ProfileItem
                        icon="information-circle-outline"
                        label="About"
                        onPress={() => Alert.alert('About', 'Chat App v1.0.0\nBuilt with React Native')}
                    />
                    <ProfileItem
                        icon="document-text-outline"
                        label="Privacy Policy"
                        onPress={() => Alert.alert('Privacy Policy', 'Privacy Policy would be shown here')}
                    />
                </ProfileSection>

                {/* Logout Button */}
                <View style={{ marginHorizontal: 20, marginBottom: 20 }}>
                <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                    <View style={styles.logoutItem}>
                        <Icon name="log-out-outline" size={22} color="#fff" />
                        <Text style={styles.logoutText}>Logout</Text>
                    </View>
                </TouchableOpacity>
                </View>
            </ScrollView>

            {/* Edit Modal */}
            <Modal
                visible={editModalVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setEditModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>
                            Edit {editingField.charAt(0).toUpperCase() + editingField.slice(1)}
                        </Text>
                        <TextInput
                            style={styles.modalInput}
                            value={editValue}
                            onChangeText={setEditValue}
                            placeholder={`Enter ${editingField}`}
                            placeholderTextColor={colors.text + '80'}
                            multiline={editingField === 'bio'}
                            numberOfLines={editingField === 'bio' ? 3 : 1}
                        />
                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.cancelButton]}
                                onPress={() => setEditModalVisible(false)}
                            >
                                <Text style={[styles.modalButtonText, styles.cancelButtonText]}>
                                    Cancel
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.saveButton]}
                                onPress={handleSaveEdit}
                            >
                                <Text style={[styles.modalButtonText, styles.saveButtonText]}>
                                    Save
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
            </View>
        </SafeAreaView>
    );
};

export default ProfileScreen;
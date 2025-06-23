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
    ActivityIndicator,
    Keyboard,
    Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { getProfileData } from '../../helpers/getAPIs';
import { updateProfileData } from '../../helpers/putAPIs';

const ProfileScreen = ({ navigation }) => {
    const { colors, theme, toggleTheme } = useTheme();
    const isDarkMode = theme === 'dark';
    const { logout } = useAuth();

    // Core states
    const [token, setToken] = useState(null);
    const [loading, setLoading] = useState(false);
    const [profileData, setProfileData] = useState({
        fullName: '',
        email: '',
        phone: '',
        friendCode: '',
        bio: 'Hey there! I am using this chat app.',
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
    const [saving, setSaving] = useState(false);

    // Validation states
    const [errors, setErrors] = useState({});

    useEffect(() => {
        const getToken = async () => {
            try {
                const accessToken = await AsyncStorage.getItem('@access_token');
                if (accessToken) {
                    setToken(accessToken);
                } else {
                    // Handle case where token doesn't exist
                    Alert.alert('Error', 'Authentication token not found. Please login again.');
                    logout();
                }
            } catch (error) {
                console.error('Error getting token:', error);
                Alert.alert('Error', 'Failed to retrieve authentication token.');
            }
        };
        getToken();
    }, []);

    useEffect(() => {
        if (token) {
            loadProfileData();
            loadSettings();
        }
    }, [token]);

    const loadProfileData = async () => {
        setLoading(true);
        try {
            const response = await getProfileData(token);
            console.log('Profile data response:', response);

            if (response?.data) {
                setProfileData({
                    fullName: response.data.full_name || '',
                    email: response.data.email || '',
                    phone: response.data.phone || '',
                    friendCode: response.data.friend_code || '',
                    bio: response.data.bio || 'Hey there! I am using this chat app.',
                    profileImage: response.data.profile_photo || null,
                });
            }
        } catch (error) {
            console.error('Failed to load profile data:', error);
            Alert.alert('Error', 'Failed to load profile data. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const loadSettings = async () => {
        try {
            const [notif, sound, online] = await Promise.all([
                AsyncStorage.getItem('@notifications'),
                AsyncStorage.getItem('@sound_enabled'),
                AsyncStorage.getItem('@online_status'),
            ]);

            setNotifications(notif ? JSON.parse(notif) : true);
            setSoundEnabled(sound ? JSON.parse(sound) : true);
            setOnlineStatus(online ? JSON.parse(online) : true);
        } catch (error) {
            console.error('Failed to load settings:', error);
        }
    };

    const saveSettings = async (key, value) => {
        try {
            await AsyncStorage.setItem(key, JSON.stringify(value));
        } catch (error) {
            console.error('Failed to save setting:', error);
        }
    };

    // Validation functions
    const validateField = (field, value) => {
        const newErrors = { ...errors };

        switch (field) {
            case 'fullName':
                if (!value.trim()) {
                    newErrors.fullName = 'Full name is required';
                } else if (value.trim().length < 2) {
                    newErrors.fullName = 'Full name must be at least 2 characters';
                } else if (value.trim().length > 50) {
                    newErrors.fullName = 'Full name must not exceed 50 characters';
                } else {
                    delete newErrors.fullName;
                }
                break;

            case 'phone':
                const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
                if (value.trim() && !phoneRegex.test(value.trim())) {
                    newErrors.phone = 'Please enter a valid phone number';
                } else {
                    delete newErrors.phone;
                }
                break;

            case 'bio':
                if (value.length > 150) {
                    newErrors.bio = 'Bio must not exceed 150 characters';
                } else {
                    delete newErrors.bio;
                }
                break;

            default:
                break;
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleEditField = (field, currentValue) => {
        setEditingField(field);
        setEditValue(currentValue || '');
        setErrors({});
        setEditModalVisible(true);
    };

    const handleSaveEdit = async () => {
        if (!editValue.trim() && editingField !== 'bio') {
            Alert.alert('Error', 'This field cannot be empty');
            return;
        }

        const isValid = validateField(editingField, editValue);
        if (!isValid) {
            return;
        }

        setSaving(true);
        try {
            // Map field names to API field names
            const apiFieldMap = {
                fullName: 'full_name',
                email: 'email',
                phone: 'phone',
                bio: 'bio'
            };

            const updateData = {
                [apiFieldMap[editingField]]: editValue.trim(),
            };

            const response = await updateProfileData(token, updateData);
            console.log('Update response:', response);

            if (response?.success || response?.data) {
                // Update local state
                setProfileData(prev => ({
                    ...prev,
                    [editingField]: editValue.trim()
                }));

                setEditModalVisible(false);
                Alert.alert('Success', 'Profile updated successfully');
            } else {
                throw new Error('Update failed');
            }
        } catch (error) {
            console.error('Failed to update profile data:', error);
            Alert.alert('Error', 'Failed to update profile. Please try again.');
        } finally {
            setSaving(false);
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
                        // TODO: Implement camera functionality
                        console.log('Open camera');
                        Alert.alert('Info', 'Camera functionality will be implemented soon');
                    }
                },
                {
                    text: 'Choose from Gallery',
                    onPress: () => {
                        // TODO: Implement gallery functionality
                        console.log('Open gallery');
                        Alert.alert('Info', 'Gallery functionality will be implemented soon');
                    }
                },
                {
                    text: 'Remove Photo',
                    style: 'destructive',
                    onPress: () => {
                        setProfileData(prev => ({ ...prev, profileImage: null }));
                        // TODO: Call API to remove profile photo
                    }
                },
                {
                    text: 'Cancel',
                    style: 'cancel'
                }
            ]
        );
    };

    const handleSettingToggle = async (setting, value) => {
        switch (setting) {
            case 'notifications':
                setNotifications(value);
                await saveSettings('@notifications', value);
                break;
            case 'sound':
                setSoundEnabled(value);
                await saveSettings('@sound_enabled', value);
                break;
            case 'online':
                setOnlineStatus(value);
                await saveSettings('@online_status', value);
                break;
        }
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

    const getFieldLabel = (field) => {
        const labels = {
            fullName: 'Full Name',
            email: 'Email',
            phone: 'Phone',
            bio: 'Bio'
        };
        return labels[field] || field;
    };

    const getFieldPlaceholder = (field) => {
        const placeholders = {
            fullName: 'Enter your full name',
            email: 'Enter your email address',
            phone: 'Enter your phone number',
            bio: 'Tell us about yourself...'
        };
        return placeholders[field] || `Enter ${field}`;
    };

    const ProfileSection = ({ title, children }) => (
        <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>{title}</Text>
            <View style={[styles.sectionContent, { backgroundColor: colors.card }]}>
                {children}
            </View>
        </View>
    );

    const ProfileItem = ({ icon, label, value, onPress, showChevron = true, editable = true }) => (
        <TouchableOpacity
            style={[styles.profileItem, !editable && styles.profileItemDisabled]}
            onPress={editable ? onPress : null}
            disabled={!editable}
        >
            <View style={styles.profileItemLeft}>
                <Icon name={icon} size={22} color={colors.primary} style={styles.profileItemIcon} />
                <View style={styles.profileItemContent}>
                    <Text style={[styles.profileItemLabel, { color: colors.text }]}>{label}</Text>
                    {value && (
                        <Text
                            style={[
                                styles.profileItemValue,
                                {
                                    color: colors.text,
                                    opacity: !editable ? 0.5 : 0.7
                                }
                            ]}
                            numberOfLines={label === 'Bio' ? 2 : 1}
                        >
                            {value}
                        </Text>
                    )}
                </View>
            </View>
            {showChevron && editable && (
                <Icon name="chevron-forward" size={20} color={colors.text} opacity={0.5} />
            )}
        </TouchableOpacity>
    );

    // const SettingItem = ({ icon, label, value, onToggle, type = 'switch' }) => (
    //     <View style={styles.profileItem}>
    //         <View style={styles.profileItemLeft}>
    //             <Icon name={icon} size={22} color={colors.primary} style={styles.profileItemIcon} />
    //             <Text style={[styles.profileItemLabel, { color: colors.text }]}>{label}</Text>
    //         </View>
    //         {type === 'switch' ? (
    //             <Switch
    //                 value={value}
    //                 onValueChange={onToggle}
    //                 trackColor={{ false: colors.border, true: colors.primary }}
    //                 thumbColor={value ? '#fff' : '#f4f3f4'}
    //             />
    //         ) : (
    //             <TouchableOpacity onPress={onToggle}>
    //                 <Text style={[styles.settingValue, { color: colors.primary }]}>{value}</Text>
    //             </TouchableOpacity>
    //         )}
    //     </View>
    // );

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
        onlineStatusContainer: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 5,
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
        loadingContainer: {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
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
        profileItemDisabled: {
            opacity: 0.6,
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
            width: '90%',
            maxWidth: 400,
            maxHeight: '80%',
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
            borderColor: errors[editingField] ? '#ff4757' : colors.border,
            borderRadius: 10,
            paddingHorizontal: 15,
            paddingVertical: 12,
            fontSize: 16,
            color: colors.text,
            marginBottom: 10,
            textAlignVertical: 'top',
        },
        errorText: {
            color: '#ff4757',
            fontSize: 12,
            marginBottom: 10,
            marginLeft: 5,
        },
        characterCount: {
            fontSize: 12,
            color: colors.text,
            opacity: 0.6,
            textAlign: 'right',
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
        saveButtonDisabled: {
            backgroundColor: colors.border,
            opacity: 0.5,
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

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                    <Text style={[styles.profileName, { color: colors.text, marginTop: 10 }]}>
                        Loading profile...
                    </Text>
                </View>
            </SafeAreaView>
        );
    }

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
                            {profileData.profileImage ? (
                                <Image
                                    source={{ uri: profileData.profileImage }}
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
                        {profileData.fullName || 'Your Name'}
                    </Text>
                    <Text style={styles.profileEmail}>
                        {profileData.email || 'your.email@example.com'}
                    </Text>

                    {/* <View style={styles.onlineStatusContainer}>
                        <View style={{
                            width: 8,
                            height: 8,
                            borderRadius: 4,
                            backgroundColor: onlineStatus ? '#00d2d3' : '#ff4757',
                        }} />
                        <Text style={styles.onlineText}>
                            {onlineStatus ? 'Online' : 'Offline'}
                        </Text>
                    </View> */}
                </View>

                <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
                    {/* Personal Information */}
                    <ProfileSection title="Personal Information">
                        <ProfileItem
                            icon="person-outline"
                            label="Full Name"
                            value={profileData.fullName || 'Not set'}
                            // onPress={() => handleEditField('fullName', profileData.fullName)}
                            onPress={() => { }}
                            editable={false}
                            showChevron={false}
                        />
                        <ProfileItem
                            icon="code-slash-outline"
                            label="Friend Code"
                            value={profileData.friendCode || 'Not set'}
                            onPress={() => { }}
                            editable={false}
                            showChevron={false}
                        />
                        <ProfileItem
                            icon="mail-outline"
                            label="Email"
                            value={profileData.email || 'Not set'}
                            onPress={() => { }}
                            editable={false}
                            showChevron={false}
                        />
                        {/* <ProfileItem
                            icon="call-outline"
                            label="Phone"
                            value={profileData.phone || 'Not set'}
                            onPress={() => handleEditField('phone', profileData.phone)}
                        />
                        <ProfileItem
                            icon="chatbubble-outline"
                            label="Bio"
                            value={profileData.bio}
                            onPress={() => handleEditField('bio', profileData.bio)}
                        /> */}
                    </ProfileSection>

                    {/* Settings */}
                    {/* <ProfileSection title="Settings">
                        <SettingItem
                            icon="notifications-outline"
                            label="Notifications"
                            value={notifications}
                            onToggle={(value) => handleSettingToggle('notifications', value)}
                        />
                        <SettingItem
                            icon="volume-high-outline"
                            label="Sound"
                            value={soundEnabled}
                            onToggle={(value) => handleSettingToggle('sound', value)}
                        />
                        <SettingItem
                            icon="eye-outline"
                            label="Online Status"
                            value={onlineStatus}
                            onToggle={(value) => handleSettingToggle('online', value)}
                        />
                        <SettingItem
                            icon={isDarkMode ? "sunny-outline" : "moon-outline"}
                            label="Theme"
                            value={isDarkMode ? "Dark" : "Light"}
                            onToggle={toggleTheme}
                            type="button"
                        />
                    </ProfileSection> */}

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

                {/* Enhanced Edit Modal */}
                <Modal
                    visible={editModalVisible}
                    transparent={true}
                    animationType="fade"
                    onRequestClose={() => setEditModalVisible(false)}
                >
                    <TouchableOpacity
                        style={styles.modalOverlay}
                        activeOpacity={1}
                        onPress={() => {
                            Keyboard.dismiss();
                            setEditModalVisible(false);
                        }}
                    >
                        <TouchableOpacity
                            style={styles.modalContent}
                            activeOpacity={1}
                            onPress={() => { }}
                        >
                            <Text style={styles.modalTitle}>
                                Edit {getFieldLabel(editingField)}
                            </Text>
                            <TextInput
                                style={styles.modalInput}
                                value={editValue}
                                onChangeText={(text) => {
                                    setEditValue(text);
                                    validateField(editingField, text);
                                }}
                                placeholder={getFieldPlaceholder(editingField)}
                                placeholderTextColor={colors.text + '80'}
                                multiline={editingField === 'bio'}
                                numberOfLines={editingField === 'bio' ? 4 : 1}
                                maxLength={editingField === 'bio' ? 150 : editingField === 'fullName' ? 50 : undefined}
                                keyboardType={editingField === 'email' ? 'email-address' : editingField === 'phone' ? 'phone-pad' : 'default'}
                                autoCapitalize={editingField === 'email' ? 'none' : 'sentences'}
                                autoFocus={true}
                            />
                            {errors[editingField] && (
                                <Text style={styles.errorText}>{errors[editingField]}</Text>
                            )}
                            {editingField === 'bio' && (
                                <Text style={styles.characterCount}>
                                    {editValue.length}/150
                                </Text>
                            )}
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
                                    style={[
                                        styles.modalButton,
                                        styles.saveButton,
                                        (saving || errors[editingField]) && styles.saveButtonDisabled
                                    ]}
                                    onPress={handleSaveEdit}
                                    disabled={saving || !!errors[editingField]}
                                >
                                    {saving ? (
                                        <ActivityIndicator size="small" color="#fff" />
                                    ) : (
                                        <Text style={[styles.modalButtonText, styles.saveButtonText]}>
                                            Save
                                        </Text>
                                    )}
                                </TouchableOpacity>
                            </View>
                        </TouchableOpacity>
                    </TouchableOpacity>
                </Modal>
            </View>
        </SafeAreaView>
    );
};

export default ProfileScreen;
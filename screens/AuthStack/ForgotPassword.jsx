import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  Animated,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
// import { sendForgotPasswordOTP } from '../../helpers/postAPIs';

const { width, height } = Dimensions.get('window');

export default function ForgotPassword({ navigation }) {
  // Form state
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [focusedField, setFocusedField] = useState('');

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const formSlideAnim = useRef(new Animated.Value(100)).current;
  const buttonScaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Start animations when component mounts
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(formSlideAnim, {
        toValue: 0,
        duration: 800,
        delay: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const validateEmail = () => {
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email address');
      return false;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return false;
    }

    return true;
  };

  const handleSendOTP = async () => {
    if (!validateEmail()) return;

    // Button press animation
    Animated.sequence([
      Animated.timing(buttonScaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(buttonScaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    setIsLoading(true);

    try {
      const payload = {
        email: email.trim(),
      };
      
      // Uncomment when API is ready
      await sendForgotPasswordOTP(payload);
      
    } catch (error) {
      console.error("Send OTP error:", error);
      
      const errorData = error;
      const emailError = errorData?.errors?.email?.[0];
      const message = errorData?.message || 'Failed to send verification code';
      
      Alert.alert("Error", emailError || message);
      setIsLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={['#667eea', '#764ba2', '#5D50FE']}
      style={styles.gradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#5D50FE" />

        {/* Floating Decorative Elements */}
        <View style={styles.decorativeContainer}>
          <Animated.View style={[styles.floatingCircle, styles.circle1, { opacity: fadeAnim }]} />
          <Animated.View style={[styles.floatingCircle, styles.circle2, { opacity: fadeAnim }]} />
          <Animated.View style={[styles.floatingCircle, styles.circle3, { opacity: fadeAnim }]} />
        </View>

        <KeyboardAvoidingView
          style={styles.keyboardContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContainer}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Header */}
            <Animated.View
              style={[
                styles.header,
                {
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnim }]
                }
              ]}
            >
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => navigation.goBack()}
              >
                <Ionicons name="arrow-back" size={24} color="#fff" />
              </TouchableOpacity>

              <View style={styles.headerContent}>
                <View style={styles.iconContainer}>
                  <Ionicons name="lock-closed-outline" size={60} color="#fff" />
                </View>
                <Text style={styles.title}>Forgot Password?</Text>
                <Text style={styles.subtitle}>
                  Don't worry! Enter your email address and we'll send you a verification code to reset your password.
                </Text>
              </View>
            </Animated.View>

            {/* Form */}
            <Animated.View
              style={[
                styles.formContainer,
                {
                  opacity: fadeAnim,
                  transform: [{ translateY: formSlideAnim }]
                }
              ]}
            >
              <View style={styles.formCard}>
                {/* Email Input */}
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Email Address</Text>
                  <View style={[
                    styles.inputWrapper,
                    focusedField === 'email' && styles.inputWrapperFocused
                  ]}>
                    <Ionicons name="mail-outline" size={20} color={focusedField === 'email' ? "#5D50FE" : "#999"} style={styles.inputIcon} />
                    <TextInput
                      style={styles.textInput}
                      placeholder="Enter your email address"
                      placeholderTextColor="#999"
                      value={email}
                      onChangeText={setEmail}
                      onFocus={() => setFocusedField('email')}
                      onBlur={() => setFocusedField('')}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                  </View>
                </View>

                {/* Send OTP Button */}
                <Animated.View style={[{ transform: [{ scale: buttonScaleAnim }] }]}>
                  <TouchableOpacity
                    style={[styles.sendButton, (isLoading || !email.trim()) && styles.sendButtonDisabled]}
                    onPress={handleSendOTP}
                    disabled={isLoading || !email.trim()}
                    activeOpacity={0.8}
                  >
                    <LinearGradient
                      colors={
                        isLoading || !email.trim()
                          ? ['#ccc', '#999'] 
                          : ['#ffffff', '#f8f9ff']
                      }
                      style={styles.sendGradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    >
                      {isLoading ? (
                        <View style={styles.loadingContainer}>
                          <View style={styles.loadingSpinner} />
                          <Text style={styles.loadingText}>Sending Code...</Text>
                        </View>
                      ) : (
                        <>
                          <Text style={styles.sendText}>Send Verification Code</Text>
                          <Ionicons name="send" size={20} color="#5D50FE" style={styles.buttonIcon} />
                        </>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                </Animated.View>

                {/* Help Section */}
                <View style={styles.helpContainer}>
                  <Ionicons name="information-circle-outline" size={16} color="#666" />
                  <Text style={styles.helpText}>
                    We'll send a 6-digit verification code to your email address. Please check your inbox and spam folder.
                  </Text>
                </View>
              </View>

              {/* Back to Login Link */}
              <View style={styles.loginContainer}>
                <Text style={styles.loginPrompt}>Remember your password? </Text>
                <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                  <Text style={styles.loginLink}>Sign In</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  decorativeContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  floatingCircle: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  circle1: {
    width: 100,
    height: 100,
    top: height * 0.12,
    right: -20,
  },
  circle2: {
    width: 60,
    height: 60,
    top: height * 0.35,
    left: -10,
  },
  circle3: {
    width: 80,
    height: 80,
    bottom: height * 0.25,
    right: 20,
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 30,
  },
  header: {
    paddingTop: 20,
    marginBottom: 40,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
  },
  headerContent: {
    alignItems: 'center',
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    color: '#fff',
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 10,
  },
  formContainer: {
    flex: 1,
  },
  formCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 24,
    padding: 30,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 12,
  },
  inputContainer: {
    marginBottom: 25,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e9ecef',
    paddingHorizontal: 16,
    height: 56,
  },
  inputWrapperFocused: {
    borderColor: '#5D50FE',
    backgroundColor: '#fff',
  },
  inputIcon: {
    marginRight: 12,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    height: '100%',
  },
  sendButton: {
    marginBottom: 25,
    borderRadius: 16,
    elevation: 8,
    shadowColor: '#5D50FE',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  sendButtonDisabled: {
    opacity: 0.5,
    elevation: 0,
    shadowOpacity: 0,
  },
  sendGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    borderRadius: 16,
  },
  sendText: {
    color: '#5D50FE',
    fontSize: 18,
    fontWeight: '700',
    marginRight: 8,
  },
  buttonIcon: {
    marginLeft: 5,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loadingSpinner: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#5D50FE',
    borderTopColor: 'transparent',
    marginRight: 10,
  },
  loadingText: {
    color: '#5D50FE',
    fontSize: 16,
    fontWeight: '600',
  },
  helpContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#5D50FE',
  },
  helpText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 8,
    flex: 1,
    lineHeight: 16,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 30,
  },
  loginPrompt: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 16,
  },
  loginLink: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
});
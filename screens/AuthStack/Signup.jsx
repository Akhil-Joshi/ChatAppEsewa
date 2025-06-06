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
import { registerUser } from '../../helpers/postAPIs';

const { width, height } = Dimensions.get('window');

export default function Signup({ navigation }) {

  // Form state
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [focusedField, setFocusedField] = useState('');
  // const [agreeToTerms, setAgreeToTerms] = useState(false);


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

  const updateFormData = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateForm = () => {
    const { fullName, email, password, confirmPassword } = formData;

    if (!fullName.trim()) {
      Alert.alert('Error', 'Please enter your full name');
      return false;
    }

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

    if (!password) {
      Alert.alert('Error', 'Please enter a password');
      return false;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long');
      return false;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return false;
    }

    // if (!agreeToTerms) {
    //   Alert.alert('Error', 'Please agree to the Terms of Service and Privacy Policy');
    //   return false;
    // }

    return true;
  };

  const handleSignup = async () => {
    if (!validateForm()) return;

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
        email: formData.email,
        full_name: formData.fullName,
        password: formData.password,
        confirm_password: formData.confirmPassword,
      };
      await registerUser(payload);
      setIsLoading(false);
      navigation.navigate('OTPVerification', { email: formData.email });
    } catch (error) {
      // console.error("Registration error:", error);

      // If it's an API response error (e.g., from axios)
      const errorData = error;
      const emailError = errorData?.errors?.email?.[0];
      Alert.alert("Registration Failed", emailError || message);
      setIsLoading(false);
    }


  };

  // const handleSocialSignup = (provider) => {
  //   Alert.alert('Social Signup', `${provider} signup will be implemented`);
  // };

  const getPasswordStrength = (password) => {
    if (password.length === 0) return { text: '', color: '#ccc', width: '0%' };
    if (password.length < 4) return { text: 'Weak', color: '#ff4757', width: '25%' };
    if (password.length < 6) return { text: 'Fair', color: '#ffa502', width: '50%' };
    if (password.length < 8) return { text: 'Good', color: '#3742fa', width: '75%' };
    return { text: 'Strong', color: '#2ed573', width: '100%' };
  };

  const passwordStrength = getPasswordStrength(formData.password);

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
                onPress={() => navigation.navigate('Login')}
              >
                <Ionicons name="arrow-back" size={24} color="#fff" />
              </TouchableOpacity>

              <View style={styles.headerContent}>
                <Text style={styles.title}>Create Account</Text>
                <Text style={styles.subtitle}>Join ChatBox and start connecting with friends</Text>
              </View>
            </Animated.View>

            {/* Signup Form */}
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
                {/* Full Name Input */}
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Full Name</Text>
                  <View style={[
                    styles.inputWrapper,
                    focusedField === 'fullName' && styles.inputWrapperFocused
                  ]}>
                    <Ionicons name="person-outline" size={20} color={focusedField === 'fullName' ? "#5D50FE" : "#999"} style={styles.inputIcon} />
                    <TextInput
                      style={styles.textInput}
                      placeholder="Enter your full name"
                      placeholderTextColor="#999"
                      value={formData.fullName}
                      onChangeText={(text) => updateFormData('fullName', text)}
                      onFocus={() => setFocusedField('fullName')}
                      onBlur={() => setFocusedField('')}
                      autoCapitalize="words"
                      autoCorrect={false}
                    />
                  </View>
                </View>

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
                      placeholder="Enter your email"
                      placeholderTextColor="#999"
                      value={formData.email}
                      onChangeText={(text) => updateFormData('email', text)}
                      onFocus={() => setFocusedField('email')}
                      onBlur={() => setFocusedField('')}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                  </View>
                </View>

                {/* Password Input */}
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Password</Text>
                  <View style={[
                    styles.inputWrapper,
                    focusedField === 'password' && styles.inputWrapperFocused
                  ]}>
                    <Ionicons name="lock-closed-outline" size={20} color={focusedField === 'password' ? "#5D50FE" : "#999"} style={styles.inputIcon} />
                    <TextInput
                      style={styles.textInput}
                      placeholder="Create a password"
                      placeholderTextColor="#999"
                      value={formData.password}
                      onChangeText={(text) => updateFormData('password', text)}
                      onFocus={() => setFocusedField('password')}
                      onBlur={() => setFocusedField('')}
                      secureTextEntry={!showPassword}
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                    <TouchableOpacity
                      onPress={() => setShowPassword(!showPassword)}
                      style={styles.eyeButton}
                    >
                      <Ionicons
                        name={showPassword ? "eye-off-outline" : "eye-outline"}
                        size={20}
                        color="#999"
                      />
                    </TouchableOpacity>
                  </View>

                  {/* Password Strength Indicator */}
                  {formData.password.length > 0 && (
                    <View style={styles.passwordStrengthContainer}>
                      <View style={styles.passwordStrengthBar}>
                        <View
                          style={[
                            styles.passwordStrengthFill,
                            {
                              width: passwordStrength.width,
                              backgroundColor: passwordStrength.color
                            }
                          ]}
                        />
                      </View>
                      <Text style={[styles.passwordStrengthText, { color: passwordStrength.color }]}>
                        {passwordStrength.text}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Confirm Password Input */}
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Confirm Password</Text>
                  <View style={[
                    styles.inputWrapper,
                    focusedField === 'confirmPassword' && styles.inputWrapperFocused
                  ]}>
                    <Ionicons name="lock-closed-outline" size={20} color={focusedField === 'confirmPassword' ? "#5D50FE" : "#999"} style={styles.inputIcon} />
                    <TextInput
                      style={styles.textInput}
                      placeholder="Confirm your password"
                      placeholderTextColor="#999"
                      value={formData.confirmPassword}
                      onChangeText={(text) => updateFormData('confirmPassword', text)}
                      onFocus={() => setFocusedField('confirmPassword')}
                      onBlur={() => setFocusedField('')}
                      secureTextEntry={!showConfirmPassword}
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                    <TouchableOpacity
                      onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                      style={styles.eyeButton}
                    >
                      <Ionicons
                        name={showConfirmPassword ? "eye-off-outline" : "eye-outline"}
                        size={20}
                        color="#999"
                      />
                    </TouchableOpacity>
                  </View>

                  {/* Password Match Indicator */}
                  {formData.confirmPassword.length > 0 && (
                    <View style={styles.passwordMatchContainer}>
                      <Ionicons
                        name={formData.password === formData.confirmPassword ? "checkmark-circle" : "close-circle"}
                        size={16}
                        color={formData.password === formData.confirmPassword ? "#2ed573" : "#ff4757"}
                      />
                      <Text style={[
                        styles.passwordMatchText,
                        { color: formData.password === formData.confirmPassword ? "#2ed573" : "#ff4757" }
                      ]}>
                        {formData.password === formData.confirmPassword ? "Passwords match" : "Passwords don't match"}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Terms and Conditions */}
                {/* <TouchableOpacity 
                  style={styles.termsContainer}
                  onPress={() => setAgreeToTerms(!agreeToTerms)}
                >
                  <View style={[styles.checkbox, agreeToTerms && styles.checkboxChecked]}>
                    {agreeToTerms && <Ionicons name="checkmark" size={16} color="#fff" />}
                  </View>
                  <Text style={styles.termsText}>
                    I agree to the{' '}
                    <Text style={styles.termsLink}>Terms of Service</Text>
                    {' '}and{' '}
                    <Text style={styles.termsLink}>Privacy Policy</Text>
                  </Text>
                </TouchableOpacity> */}

                {/* Signup Button */}
                <Animated.View style={[{ transform: [{ scale: buttonScaleAnim }] }]}>
                  <TouchableOpacity
                    style={[styles.signupButton, isLoading && styles.signupButtonDisabled]}
                    onPress={handleSignup}
                    disabled={isLoading}
                    activeOpacity={0.8}
                  >
                    <LinearGradient
                      colors={isLoading ? ['#ccc', '#999'] : ['#ffffff', '#f8f9ff']}
                      style={styles.signupGradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    >
                      {isLoading ? (
                        <View style={styles.loadingContainer}>
                          <View style={styles.loadingSpinner} />
                          <Text style={styles.loadingText}>Creating Account...</Text>
                        </View>
                      ) : (
                        <>
                          <Text style={styles.signupText}>Create Account</Text>
                          <Ionicons name="person-add" size={20} color="#5D50FE" style={styles.buttonIcon} />
                        </>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                </Animated.View>

                {/* Social Signup */}
                {/* <View style={styles.socialContainer}>
                  <View style={styles.divider}>
                    <View style={styles.dividerLine} />
                    <Text style={styles.dividerText}>or sign up with</Text>
                    <View style={styles.dividerLine} />
                  </View>
                  
                  <View style={styles.socialButtons}>
                    <TouchableOpacity 
                      style={styles.socialButton}
                      onPress={() => handleSocialSignup('Google')}
                    >
                      <Ionicons name="logo-google" size={24} color="#5D50FE" />
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.socialButton}
                      onPress={() => handleSocialSignup('Apple')}
                    >
                      <Ionicons name="logo-apple" size={24} color="#5D50FE" />
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.socialButton}
                      onPress={() => handleSocialSignup('Facebook')}
                    >
                      <Ionicons name="logo-facebook" size={24} color="#5D50FE" />
                    </TouchableOpacity>
                  </View>
                </View> */}
              </View>

              {/* Login Link */}
              <View style={styles.loginContainer}>
                <Text style={styles.loginPrompt}>Already have an account? </Text>
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
    marginBottom: 30,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 25,
  },
  headerContent: {
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    color: '#fff',
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    lineHeight: 22,
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
    marginBottom: 20,
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
  eyeButton: {
    padding: 4,
  },
  passwordStrengthContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  passwordStrengthBar: {
    flex: 1,
    height: 4,
    backgroundColor: '#e9ecef',
    borderRadius: 2,
    marginRight: 12,
  },
  passwordStrengthFill: {
    height: '100%',
    borderRadius: 2,
  },
  passwordStrengthText: {
    fontSize: 12,
    fontWeight: '600',
  },
  passwordMatchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  passwordMatchText: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 6,
  },
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 25,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#e9ecef',
    marginRight: 12,
    marginTop: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#5D50FE',
    borderColor: '#5D50FE',
  },
  termsText: {
    flex: 1,
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  termsLink: {
    color: '#5D50FE',
    fontWeight: '600',
  },
  signupButton: {
    marginBottom: 30,
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
  signupButtonDisabled: {
    opacity: 0.7,
  },
  signupGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    borderRadius: 16,
  },
  signupText: {
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
  socialContainer: {
    alignItems: 'center',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    width: '100%',
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e9ecef',
  },
  dividerText: {
    color: '#666',
    fontSize: 14,
    marginHorizontal: 15,
  },
  socialButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 15,
  },
  socialButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e9ecef',
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